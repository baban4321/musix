import axios from "axios";
import { useSettingsStore } from "../store/settingsStore";

const BASE_URL = "https://saavnapi-private-final.vercel.app";

const getGlobalLang = () => {
  const langs = useSettingsStore.getState().languages;
  return langs && langs.length > 0 ? langs.join(",") : "";
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Bug 2 Fix: Clears all cached API responses so that after a language
 * preference change, the next calls fetch fresh, correctly-filtered data.
 */
export const clearLanguageCache = () => {
  cache.clear();
};

// ─── Discovery keyword lists per language for never-ending autoplay ──────────
// Used by searchSongsByLanguage() to rotate through varied queries so the user
// always hears something fresh even when recommendation pools run dry.
const DISCOVERY_KEYWORDS = {
  tamil: [
    "tamil hits",
    "kollywood",
    "tamil melody",
    "AR Rahman tamil",
    "tamil folk",
    "ilayaraja hits",
    "harris jayaraj",
    "anirudh ravichander",
    "tamil kuthu",
    "tamil romantic",
  ],
  telugu: [
    "telugu hits",
    "tollywood",
    "telugu melody",
    "DSP songs",
    "SS Thaman",
    "telugu folk",
    "telugu romantic",
    "telugu mass",
    "pawan kalyan songs",
    "allu arjun songs",
  ],
  hindi: [
    "bollywood hits",
    "hindi melody",
    "arijit singh",
    "hindi romantic",
    "hindi folk",
    "atif aslam",
    "hindi pop",
    "bollywood 2024",
    "hindi sad songs",
    "shreya ghoshal",
  ],
  english: [
    "english pop hits",
    "ed sheeran",
    "taylor swift",
    "pop 2024",
    "english romantic",
    "western pop",
    "english indie",
    "top english songs",
    "english acoustic",
    "popular english",
  ],
  punjabi: [
    "punjabi hits",
    "diljit dosanjh",
    "punjabi folk",
    "bhangra",
    "sidhu moosewala",
    "punjabi pop",
    "ap dhillon",
    "guru randhawa",
    "punjabi romantic",
    "punjabi 2024",
  ],
  kannada: [
    "kannada hits",
    "sandalwood",
    "kannada melody",
    "kannada folk",
    "kannada romantic",
    "ajay rao songs",
    "kannada mass",
    "kannada 2024",
    "puneeth rajkumar",
    "kannada kuthu",
  ],
  malayalam: [
    "malayalam hits",
    "mollywood",
    "malayalam melody",
    "m jayachandran",
    "malayalam folk",
    "vidyasagar malayalam",
    "mammootty songs",
    "mohanlal songs",
    "kerala music",
    "malayalam romantic",
  ],
  marathi: [
    "marathi hits",
    "marathi pop",
    "marathi folk",
    "marathi lavani",
    "marathi romantic",
    "marathi 2024",
    "ajay-atul songs",
    "marathi love songs",
    "marathi devotional",
    "marathi natak",
  ],
  bengali: [
    "bengali hits",
    "rabindra sangeet",
    "bengali modern",
    "bengali folk",
    "bengali romantic",
    "arijit singh bengali",
    "bengali 2024",
    "kolkata songs",
    "bengali pop",
    "bengali adhunik",
  ],
};

// Per-language keyword rotation index (in-memory, resets on page reload)
const keywordIndex = {};

/**
 * Bug 4 Fix: Returns a fresh discovery query for the given language.
 * Rotates through the keyword list so consecutive calls return varied results.
 */
const getDiscoveryKeyword = (lang) => {
  const list =
    DISCOVERY_KEYWORDS[lang] ||
    DISCOVERY_KEYWORDS["hindi"] ||
    [];
  if (list.length === 0) return lang;
  if (keywordIndex[lang] === undefined) keywordIndex[lang] = 0;
  const kw = list[keywordIndex[lang] % list.length];
  keywordIndex[lang]++;
  return kw;
};

/**
 * Bug 4 Fix: Search for songs in a specific language using rotating discovery
 * keywords. Used as a fallback when the recommendation pool runs dry.
 */
export const searchSongsByLanguage = async (lang, page = 1) => {
  const keyword = getDiscoveryKeyword(lang);
  const cacheKey = `discovery_search_${lang}_${keyword}_${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await api.get("/search/songs", {
      params: { q: keyword, page, n: 20, raw: true, camel: true },
    });
    const result = res.data?.results || res.data?.data?.results || res.data || [];
    setCache(cacheKey, result);
    return result;
  } catch {
    return [];
  }
};

// Get trending / home modules
export const getModules = async (lang = getGlobalLang()) => {
  const cacheKey = `modules_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/modules", {
    params: { lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get song details by ID (returns { songs: [...] })
export const getSongDetails = async (id) => {
  const cacheKey = `song_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/song", {
    params: { id, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Universal search — returns { songs, albums, artists, topquery, ... }
export const searchAll = async (query) => {
  if (!query || query.trim().length === 0) return null;
  const cacheKey = `searchAll_${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/search", {
    params: { q: query, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get album details (returns { id, title, list: [songs], ... })
export const getAlbumDetails = async (id) => {
  const cacheKey = `album_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/album", {
    params: { id, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get playlist details
export const getPlaylistDetails = async (id) => {
  const cacheKey = `playlist_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/playlist", {
    params: { id, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get mix details by token (Daily Mix, Mood Mix, etc.)
export const getMixDetails = async (token, lang = getGlobalLang()) => {
  const cacheKey = `mix_${token}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/get/mix", {
    params: { token, page: 1, n: 50, lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get artist details (top songs, albums, dedicated playlists)
export const getArtistDetails = async (id, page = 1) => {
  const lang = getGlobalLang();
  const cacheKey = `artist_${id}_${page}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/artist", {
    params: { id, page, n_song: 10, n_album: 10, lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get album recommendations
export const getAlbumRecommendations = async (id, lang = getGlobalLang()) => {
  const cacheKey = `album_rec_${id}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/album/recommend", {
    params: { id, lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get playlist recommendations
export const getPlaylistRecommendations = async (id, lang = getGlobalLang()) => {
  const cacheKey = `playlist_rec_${id}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/playlist/recommend", {
    params: { id, lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get artist recommendations (similar songs/artists)
export const getArtistRecommendations = async (artistId, songId, lang = getGlobalLang()) => {
  const cacheKey = `artist_rec_${artistId}_${songId}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/artist/recommend", {
    params: { artist_id: artistId, song_id: songId, page: 1, cat: "popularity", sort: "asc", lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get albums from the same year
export const getSameYearAlbums = async (year, lang = getGlobalLang()) => {
  if (!year) return [];
  const cacheKey = `same_year_${year}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/album/same-year", {
    params: { year, lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get top searches
export const getTopSearches = async () => {
  const cacheKey = `top_searches`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/search/top", {
    params: { mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Search podcasts
export const searchPodcasts = async (query, page = 1, n = 20) => {
  if (!query || query.trim().length === 0) return null;
  const cacheKey = `search_podcasts_${query}_${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/search/podcasts", {
    params: { q: query, page, n, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get show (podcast) details
export const getShowDetails = async (linkOrToken) => {
  const cacheKey = `show_${linkOrToken}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // determine if it's a token or link
  const isLink = linkOrToken.includes("http");
  const params = isLink ? { link: linkOrToken } : { token: linkOrToken };
  
  const res = await api.get("/show", {
    params: { ...params, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get synced lyrics (Saavn API fallback)
export const getSyncedLyrics = async (id, duration) => {
  const cacheKey = `lyrics_${id}_${duration}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/get/synced-lyrics", {
    params: { id, duration, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get lyrics from LRCLIB
export const getLrclibLyrics = async (title, artist, album, duration) => {
  try {
    const params = new URLSearchParams();
    if (title) params.append("track_name", title);
    if (artist) params.append("artist_name", artist);
    if (album) params.append("album_name", album);
    if (duration) params.append("duration", duration.toString());
    
    // 1. Try exact match
    try {
      const res = await axios.get(`https://lrclib.net/api/get?${params.toString()}`);
      if (res.data && (res.data.syncedLyrics || res.data.plainLyrics)) {
        return res.data;
      }
    } catch (e) {
      if (e.response && e.response.status === 404) {
        // Not found via exact match, ignore and fall through to search
      } else {
        throw e;
      }
    }

    // 2. Try search fallback
    const searchParams = new URLSearchParams();
    // Combine title and artist for a broad search
    searchParams.append("q", `${title} ${artist}`);
    const searchRes = await axios.get(`https://lrclib.net/api/search?${searchParams.toString()}`);
    if (searchRes.data && searchRes.data.length > 0) {
      // Prioritize synced lyrics, else use the first result
      const best = searchRes.data.find(d => d.syncedLyrics) || searchRes.data[0];
      return best;
    }
    
    return null;
  } catch (err) {
    console.error("LRCLIB Error:", err);
    return null;
  }
};

// Get song recommendations
export const getSongRecommendations = async (id, lang = getGlobalLang()) => {
  const cacheKey = `song_rec_${id}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/song/recommend", {
    params: { id, lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get radio featured list
export const getRadioFeatured = async (songId, artistId, lang = getGlobalLang()) => {
  const cacheKey = `radio_feat_${songId}_${artistId}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/radio/featured", {
    params: { song_id: songId, artist_id: artistId, lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get trending explicitly for songs
export const getTrendingSongs = async (lang = getGlobalLang()) => {
  const cacheKey = `trending_songs_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/get/trending", {
    params: { type: "song", lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

// Get artist top songs explicitly
export const getArtistTopSongs = async (artistId, songId, lang = getGlobalLang()) => {
  const cacheKey = `artist_top_${artistId}_${songId}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const res = await api.get("/artist/top-songs", {
    params: { artist_id: artistId, song_id: songId, lang, mini: true, raw: true, camel: true },
  });
  setCache(cacheKey, res.data);
  return res.data;
};

export default api;
