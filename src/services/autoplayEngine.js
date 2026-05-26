import {
  getSongRecommendations,
  getRadioFeatured,
  getTrendingSongs,
  getArtistTopSongs,
  searchSongsByLanguage,
  getModules,
} from "./api";
import { useSettingsStore } from "../store/settingsStore";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Helper to extract primary artist ID
const getPrimaryArtistId = (song) => {
  if (song?.moreInfo?.artistMap?.primaryArtists?.length > 0) {
    return song.moreInfo.artistMap.primaryArtists[0].id;
  }
  return null;
};

// 30% random exploration, 70% highest-scored exploitation
const EXPLORATION_RATE = 0.3;

/**
 * Bug 3 Fix: STRICT language filter.
 *
 * Previously returned `true` (allow) when a song had no `language` field,
 * which let every song returned by the radio/mini API — where the language
 * field is frequently absent — slip through regardless of the user's setting.
 *
 * Now returns `false` (reject) for songs whose language cannot be verified,
 * closing the primary vector for Hindi/English songs entering the queue.
 *
 * Special case: if allowedLanguages is empty the user has chosen "all
 * languages", so we accept everything.
 */
const isAllowedLanguage = (song, allowedLanguages) => {
  // Empty selection means "play everything" — no restriction
  if (!allowedLanguages || allowedLanguages.length === 0) return true;

  const songLang = (song.language || "").toLowerCase().trim();

  // Bug 3 Fix: reject songs with missing/empty language metadata
  // instead of silently allowing them through.
  if (!songLang) return false;

  return allowedLanguages.some((l) => songLang.includes(l) || l.includes(songLang));
};

// ─── Discovery Fallback ───────────────────────────────────────────────────────

/**
 * Bug 4 Fix: When the primary recommendation pool runs dry (filtered results
 * are fewer than MIN_POOL_SIZE), fetch fresh songs using language-specific
 * keyword searches — one per selected language — so playback never stops and
 * the user always gets songs in their chosen language(s).
 */
const MIN_POOL_SIZE = 8;

const fetchDiscoveryFallback = async (allowedLanguages, historyIds) => {
  if (!allowedLanguages || allowedLanguages.length === 0) return [];

  // Fire one discovery search per selected language in parallel
  const results = await Promise.all(
    allowedLanguages.map((lang) =>
      searchSongsByLanguage(lang).catch(() => [])
    )
  );

  // Also pull fresh trending songs scoped to selected languages
  const trendingFallback = await getTrendingSongs().catch(() => []);
  const trendingList = trendingFallback?.list || trendingFallback?.songs || trendingFallback || [];

  const allDiscovered = [
    ...results.flat(),
    ...(Array.isArray(trendingList) ? trendingList : []),
  ];

  return allDiscovered.filter((song) => {
    if (!song?.id) return false;
    if (song.type && song.type !== "song") return false;
    if (historyIds.has(song.id)) return false;
    return isAllowedLanguage(song, allowedLanguages);
  });
};

// ─── Main Export ─────────────────────────────────────────────────────────────

export const fetchRecommendations = async (currentSong, history = []) => {
  if (!currentSong) return [];

  const songId = currentSong.id;
  const artistId = getPrimaryArtistId(currentSong);
  const allowedLanguages = useSettingsStore.getState().languages;

  // History lookup sets for O(1) checks
  const historyIds = new Set(history.map((h) => h.songId));
  const recentArtistIds = new Set(history.slice(-3).map((h) => h.artistId).filter(Boolean));

  // ── Parallel API calls for speed ─────────────────────────────────────────
  const [songRecs = [], radioRecs = [], trendingRecs = [], artistRecs = [], moduleData] =
    await Promise.all([
      getSongRecommendations(songId).catch(() => []),        // Exact similar
      getRadioFeatured(songId, artistId).catch(() => []),    // Radio flow (Bug 5: filtered strictly below)
      getTrendingSongs().catch(() => []),                     // Lang-scoped trending
      artistId
        ? getArtistTopSongs(artistId, songId).catch(() => [])
        : Promise.resolve([]),                               // Same artist
      getModules().catch(() => null),                        // Home modules (lang-aware extra source)
    ]);

  // Extract home-module trending songs as an additional discovery source
  const moduleTrending = moduleData?.newTrending || [];
  const moduleNewSongs = (moduleData?.newAlbums || []).filter((s) => s.type === "song");

  // ── Build scored pool ─────────────────────────────────────────────────────
  const pool = new Map();

  const addItems = (items, scoreBonus, source) => {
    const list = items?.list || items?.songs || items || [];
    if (!Array.isArray(list)) return;

    list.forEach((song) => {
      if (!song?.id) return;

      // Skip non-song types (albums, playlists, shows)
      if (song.type && song.type !== "song") return;

      // Skip the currently playing song
      if (song.id === songId) return;

      // Bug 3 Fix: Strict language filter — rejects songs with missing
      // language metadata (previously they were silently accepted).
      // This is the primary fix for radio/mini API bleeding in off-language songs.
      if (!isAllowedLanguage(song, allowedLanguages)) return;

      const currentScore = pool.get(song.id)?.score || 0;
      let newScore = currentScore + scoreBonus;

      // Boost songs by the same artist and same language
      const songArtistId = getPrimaryArtistId(song);
      if (songArtistId && songArtistId === artistId) newScore += 5;
      if (song.language && currentSong.language &&
          song.language.toLowerCase() === currentSong.language.toLowerCase()) {
        newScore += 3;
      }

      // Penalise repeated artists (prevent monotony within last 3 songs)
      if (songArtistId && recentArtistIds.has(songArtistId)) {
        newScore -= 50;
      }

      // Heavy penalty for songs already played
      if (historyIds.has(song.id)) {
        newScore -= 100;
      }

      pool.set(song.id, {
        data: song,
        score: newScore,
        source: pool.get(song.id)?.source || source,
      });
    });
  };

  // Assign base weights (higher = more likely to be played)
  addItems(radioRecs,       6, "radio");          // Best relevance — Bug 5: now strictly filtered
  addItems(songRecs,        4, "recommendation");
  addItems(artistRecs,      3, "artist");
  addItems(trendingRecs,    2, "trending");
  addItems(moduleTrending,  2, "module-trending"); // Extra lang-aware source
  addItems(moduleNewSongs,  1, "module-new");      // New releases in selected lang

  // ── Discovery Fallback (Bug 4 Fix) ───────────────────────────────────────
  // If the filtered pool is too small, fetch more songs via keyword search.
  // This ensures the queue never runs dry even after many skips.
  const qualifiedPoolSize = Array.from(pool.values()).filter((i) => i.score > -10).length;

  if (qualifiedPoolSize < MIN_POOL_SIZE) {
    console.log(
      `[autoplay] Pool exhausted (${qualifiedPoolSize} songs). ` +
      `Fetching discovery fallback for: ${allowedLanguages.join(", ")}`
    );

    const fallbackSongs = await fetchDiscoveryFallback(allowedLanguages, historyIds);

    // Add fallback songs to pool with a neutral score (won't outrank
    // legitimate recommendations but will fill the queue)
    fallbackSongs.forEach((song) => {
      if (pool.has(song.id)) return; // Already scored — don't downgrade
      pool.set(song.id, {
        data: song,
        score: 1, // Low but positive — these are valid, just less personalised
        source: "discovery-fallback",
      });
    });
  }

  // ── Rank & Randomise ─────────────────────────────────────────────────────
  let rankedQueue = Array.from(pool.values())
    .filter((item) => item.score > -10)
    .sort((a, b) => b.score - a.score);

  // Apply Exploration vs Exploitation (Weighted Randomisation)
  // 70% exploit top-ranked, 30% explore randomly from top 30% of remaining
  const finalQueue = [];

  while (rankedQueue.length > 0) {
    const r = Math.random();

    if (r > EXPLORATION_RATE) {
      // Exploit: Take the highest scoring song
      finalQueue.push(rankedQueue.shift().data);
    } else {
      // Explore: Pick a random song from top 30% of remaining pool
      const poolSize = Math.max(1, Math.floor(rankedQueue.length * 0.3));
      const randomIndex = Math.floor(Math.random() * poolSize);
      const selected = rankedQueue.splice(randomIndex, 1)[0];
      finalQueue.push(selected.data);
    }
  }

  return finalQueue;
};
