import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HiSearch, HiPlay, HiMusicNote } from "react-icons/hi";
import { RiAlbumFill, RiPlayListFill, RiUserStarFill } from "react-icons/ri";
import { searchAll, getSongDetails, getTopSearches } from "../services/api";
import { usePlayerStore } from "../store/playerStore";
import Carousel from "../components/Carousel";
import SongCard from "../components/SongCard";

let debounceTimer = null;

const Search = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [topSearches, setTopSearches] = useState([]);
  const { playSong, setQueue, currentSong, isPlaying } = usePlayerStore();
  const navigate = useNavigate();

  // Auto-search from URL ?q= param
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery && urlQuery.trim()) {
      setQuery(urlQuery);
      doSearch(urlQuery);
    }
  }, [searchParams]);

  // Fetch top searches on mount
  useEffect(() => {
    const fetchTop = async () => {
      try {
        const result = await getTopSearches();
        setTopSearches(result || []);
      } catch (err) {
        console.error("Failed to fetch top searches:", err);
      }
    };
    fetchTop();
  }, []);

  const doSearch = async (value) => {
    setLoading(true);
    try {
      const result = await searchAll(value);
      setData(result);
      setHasSearched(true);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((value) => {
    setQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);

    if (!value.trim()) {
      setData(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    debounceTimer = setTimeout(async () => {
      try {
        const result = await searchAll(value);
        setData(result);
        setHasSearched(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  // Song click → fetch full details (for encryptedMediaUrl) → play
  const handlePlaySong = async (song) => {
    try {
      const res = await getSongDetails(song.id);
      const songs = res?.songs || [];
      if (songs.length > 0) {
        const allSongs = data?.songs?.data || [];
        // Build queue from all song results
        if (allSongs.length > 0) {
          // We'll set queue after fetching; for now just play
        }
        await playSong(songs[0]);
      }
    } catch (err) {
      console.error("Failed to play song:", err);
    }
  };

  // Album click → navigate to album page
  const handleAlbumClick = (album) => {
    navigate(`/album/${album.id}`);
  };

  // Playlist click → navigate to playlist page
  const handlePlaylistClick = (playlist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  // Artist click → navigate to artist page
  const handleArtistClick = (artist) => {
    navigate(`/artist/${artist.id}`);
  };

  const handleTopQueryClick = (item) => {
    if (item.type === "song" || item.type === "episode") handlePlaySong(item);
    else if (item.type === "album") handleAlbumClick(item);
    else if (item.type === "playlist") handlePlaylistClick(item);
    else if (item.type === "artist") handleArtistClick(item);
    else if (item.type === "show") {
      const permaUrl = item.url || item.permaUrl;
      const token = permaUrl ? permaUrl.split("/").pop() : item.id;
      navigate(`/show/${token}`);
    }
  };

  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  };

  const getHighResImage = (url) => {
    if (!url) return "";
    return url
      .replace("50x50", "500x500")
      .replace("150x150", "500x500");
  };

  const topQuery = data?.topquery?.data || [];
  const songs = data?.songs?.data || [];
  const albums = data?.albums?.data || [];
  const playlists = data?.playlists?.data || [];
  const artists = data?.artists?.data || [];
  const shows = data?.shows?.data || [];
  const episodes = data?.episodes?.data || [];

  return (
    <div className="fade-in">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-primary mb-6">Search</h1>
        <div className="relative max-w-2xl">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-300 text-xl" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="What do you want to listen to?"
            className="w-full pl-12 pr-6 py-4 bg-dark-700/60 border border-dark-600/50 rounded-2xl text-base text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary/50 focus:bg-dark-700 shadow-inner search-inner-shadow transition-all"
            id="search-page-input"
            autoFocus
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No results */}
      {!loading && hasSearched && songs.length === 0 && albums.length === 0 && playlists.length === 0 && artists.length === 0 && shows.length === 0 && episodes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-dark-300 text-lg">No results found for "{query}"</p>
          <p className="text-dark-400 text-sm mt-2">Try different keywords</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (songs.length > 0 || albums.length > 0 || playlists.length > 0 || artists.length > 0 || shows.length > 0 || episodes.length > 0) && (
        <div className="space-y-10">

          {/* Top Result */}
          {topQuery.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-bold text-primary mb-4">Top Result</h2>
              {topQuery.map((item) => {
                const isActive = currentSong?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTopQueryClick(item)}
                    className="w-full md:w-[420px] flex items-center gap-4 p-4 rounded-2xl bg-dark-700/40 hover:bg-dark-600/60 border border-dark-600/30 transition-all text-left group"
                  >
                    <img
                      src={getHighResImage(item.image)}
                      alt={cleanTitle(item.title)}
                      className={`w-20 h-20 object-cover shadow-lg ${item.type === "artist" ? "rounded-full" : "rounded-xl"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-lg font-semibold truncate ${isActive ? "text-accent-primary" : "text-primary"}`}>
                        {cleanTitle(item.title)}
                      </p>
                      <p className="text-sm text-dark-300 truncate mt-0.5">
                        {item.description || item.moreInfo?.primaryArtists || ""}
                      </p>
                      <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-dark-500/50 text-dark-200">
                        {item.type}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-accent-primary/30">
                      <HiPlay className="text-white text-lg ml-0.5" />
                    </div>
                  </button>
                );
              })}
            </section>
          )}

          {/* Songs */}
          {songs.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-pink flex items-center justify-center">
                  <HiMusicNote className="text-white text-sm" />
                </div>
                <h2 className="text-xl font-display font-bold text-primary">Songs</h2>
              </div>
              <div className="space-y-1">
                {songs.map((song, index) => {
                  const isActive = currentSong?.id === song.id;
                  return (
                    <button
                      key={song.id || index}
                      onClick={() => handlePlaySong(song)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left hover:bg-dark-600/50 group ${
                        isActive ? "bg-dark-600/40" : ""
                      }`}
                    >
                      {/* Index / Playing indicator */}
                      <div className="w-8 text-center shrink-0">
                        {isActive && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-4 justify-center">
                            <div className="w-[3px] bg-accent-primary rounded-full eq-bar-1"></div>
                            <div className="w-[3px] bg-accent-primary rounded-full eq-bar-2"></div>
                            <div className="w-[3px] bg-accent-primary rounded-full eq-bar-3"></div>
                          </div>
                        ) : (
                          <span className="text-sm text-dark-400 group-hover:hidden">{index + 1}</span>
                        )}
                        {!(isActive && isPlaying) && (
                          <HiPlay className="text-white text-sm hidden group-hover:block mx-auto" />
                        )}
                      </div>

                      {/* Image */}
                      <img
                        src={getHighResImage(song.image)}
                        alt={cleanTitle(song.title)}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                        loading="lazy"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-accent-primary" : "text-primary"}`}>
                          {cleanTitle(song.title)}
                        </p>
                        <p className="text-xs text-dark-300 truncate">
                          {song.moreInfo?.primaryArtists || song.description || "Unknown Artist"}
                        </p>
                      </div>

                      {/* Album */}
                      <span className="hidden md:block text-xs text-dark-400 truncate max-w-[180px]">
                        {cleanTitle(song.album || "")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Albums */}
          {albums.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <RiAlbumFill className="text-white text-sm" />
                </div>
                <h2 className="text-xl font-display font-bold text-primary">Albums</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => handleAlbumClick(album)}
                    className="group text-left rounded-xl bg-dark-700/30 hover:bg-dark-600/50 p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                      <img
                        src={getHighResImage(album.image)}
                        alt={cleanTitle(album.title)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-accent-primary shadow-lg shadow-accent-primary/30 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <RiAlbumFill className="text-white text-xl" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-primary truncate">
                      {cleanTitle(album.title)}
                    </h3>
                    <p className="text-xs text-dark-300 truncate mt-1">
                      {album.music || album.description || "Album"}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {playlists.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <RiPlayListFill className="text-white text-sm" />
                </div>
                <h2 className="text-xl font-display font-bold text-primary">Playlists</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => handlePlaylistClick(pl)}
                    className="group text-left rounded-xl bg-dark-700/30 hover:bg-dark-600/50 p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                      <img
                        src={getHighResImage(pl.image)}
                        alt={cleanTitle(pl.title)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-green-500 shadow-lg shadow-green-500/30 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <RiPlayListFill className="text-white text-xl" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-primary truncate">
                      {cleanTitle(pl.title)}
                    </h3>
                    <p className="text-xs text-dark-300 truncate mt-1">
                      {pl.description || pl.extra || "Playlist"}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {artists.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                  <RiUserStarFill className="text-white text-sm" />
                </div>
                <h2 className="text-xl font-display font-bold text-primary">Artists</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => handleArtistClick(artist)}
                    className="group text-left rounded-xl bg-dark-700/30 hover:bg-dark-600/50 p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20"
                  >
                    <div className="relative aspect-square rounded-full overflow-hidden mb-3">
                      <img
                        src={getHighResImage(artist.image)}
                        alt={cleanTitle(artist.title)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-purple-500 shadow-lg shadow-purple-500/30 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <RiUserStarFill className="text-white text-xl" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-primary truncate text-center">
                      {cleanTitle(artist.title)}
                    </h3>
                    <p className="text-xs text-dark-300 truncate mt-1 text-center capitalize">
                      {artist.description || artist.extra || "Artist"}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Podcasts / Shows */}
          {shows.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <h2 className="text-xl font-display font-bold text-primary">Podcasts</h2>
              </div>
              <Carousel>
                {shows.map((show) => (
                  <SongCard key={show.id} song={show} />
                ))}
              </Carousel>
            </section>
          )}

          {/* Episodes */}
          {episodes.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                  <HiPlay className="text-white text-sm" />
                </div>
                <h2 className="text-xl font-display font-bold text-primary">Episodes</h2>
              </div>
              <Carousel>
                {episodes.map((ep) => (
                  <SongCard key={ep.id} song={ep} songs={episodes} />
                ))}
              </Carousel>
            </section>
          )}
        </div>
      )}

      {/* Browse categories when no search */}
      {!hasSearched && !loading && (
        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-display font-bold text-primary mb-4">Browse Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: "Romance", color: "from-pink-600 to-rose-500", emoji: "💕" },
              { name: "Dance", color: "from-purple-600 to-violet-500", emoji: "💃" },
              { name: "Workout", color: "from-green-600 to-emerald-500", emoji: "💪" },
              { name: "Chill", color: "from-cyan-600 to-blue-500", emoji: "🌊" },
              { name: "Party", color: "from-orange-600 to-amber-500", emoji: "🎉" },
              { name: "Devotional", color: "from-yellow-600 to-yellow-500", emoji: "🙏" },
              { name: "Retro", color: "from-red-600 to-red-500", emoji: "📻" },
              { name: "Happy", color: "from-teal-600 to-teal-500", emoji: "😊" },
            ].map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleSearch(cat.name)}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${cat.color} p-5 text-left font-display font-bold text-lg text-white hover:scale-[1.02] transition-transform`}
              >
                <span className="text-2xl mr-2">{cat.emoji}</span>
                {cat.name}
                <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-white/10" />
              </button>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* Top Searches / Trending - ALWAYS VISIBLE */}
      {!loading && topSearches && topSearches.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-display font-bold text-primary">Trending Searches</h2>
          </div>
          <Carousel>
            {topSearches.map((item) => (
              <SongCard key={item.id} song={item} />
            ))}
          </Carousel>
        </div>
      )}
    </div>
  );
};

export default Search;
