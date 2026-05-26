import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiSearch, HiX, HiPlay, HiMusicNote, HiUserCircle, HiLogout } from "react-icons/hi";
import { RiMusic2Fill, RiAlbumFill, RiPlayListFill } from "react-icons/ri";
import { searchAll, getSongDetails } from "../services/api";
import { usePlayerStore } from "../store/playerStore";
import { useSettingsStore } from "../store/settingsStore";
import { useAuthStore } from "../store/authStore";
import { HiChevronDown } from "react-icons/hi";
import LanguageSettings from "./LanguageSettings";

let debounceTimer = null;

const Navbar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const { playSong } = usePlayerStore();
  const globalLanguages = useSettingsStore((state) => state.languages);
  const { user, isAuthenticated, setAuthModalOpen, logout } = useAuthStore();

  const handleSearch = useCallback((value) => {
    setQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);

    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    debounceTimer = setTimeout(async () => {
      try {
        const data = await searchAll(value);
        // Merge top query + songs + albums into a quick list
        const items = [];
        const topQuery = data?.topquery?.data || [];
        const songs = data?.songs?.data || [];
        const albums = data?.albums?.data || [];
        const playlists = data?.playlists?.data || [];

        topQuery.forEach((item) => items.push(item));
        songs.forEach((item) => {
          if (!items.find((i) => i.id === item.id)) items.push(item);
        });
        albums.forEach((item) => {
          if (!items.find((i) => i.id === item.id)) items.push(item);
        });
        playlists.forEach((item) => {
          if (!items.find((i) => i.id === item.id)) items.push(item);
        });

        setResults(items.slice(0, 8));
        setShowResults(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleResultClick = async (item) => {
    setShowResults(false);
    setQuery("");

    if (item.type === "album") {
      navigate(`/album/${item.id}`);
    } else if (item.type === "playlist") {
      navigate(`/playlist/${item.id}`);
    } else if (item.type === "artist") {
      navigate(`/search?q=${encodeURIComponent(item.title)}`);
    } else if (item.type === "song") {
      try {
        const res = await getSongDetails(item.id);
        const songs = res?.songs || [];
        if (songs.length > 0) {
          await playSong(songs[0]);
        }
      } catch (err) {
        console.error("Failed to play:", err);
      }
    } else {
      navigate(`/song/${item.id}`);
    }
  };

  const getHighResImage = (url) => {
    if (!url) return "";
    return url.replace("50x50", "500x500").replace("150x150", "500x500");
  };

  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/"/g, '"').replace(/&/g, "&");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      setShowResults(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 md:left-60 right-0 z-50 bg-dark-900/80 dark:bg-dark-900/80 bg-light-900/90 backdrop-blur-xl border-b border-dark-700/50 dark:border-dark-700/50 border-light-border transition-colors duration-300">
      <div className="flex items-center justify-between px-4 md:px-8 h-16">
        {/* Logo (Visible on mobile only, since desktop has it in the sidebar) */}
        <Link to="/" className="flex md:hidden items-center shrink-0" id="nav-logo">
          <img
            src="/logo.png"
            alt="Musix"
            className="h-8 w-auto object-contain transition-transform hover:scale-105"
            style={{ aspectRatio: "300/106" }}
          />
        </Link>

        {/* Search bar - Improved visibility */}
        <div className="relative flex-1 max-w-xl mx-4 md:mx-12">
          <div className="relative group">
            <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 group-focus-within:text-purple-400 transition-colors duration-200 text-lg" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search songs, albums, artists..."
              className="w-full pl-10 pr-10 py-2.5 
                         bg-white/5 dark:bg-white/5 bg-black/5
                         border border-white/10 dark:border-white/10 border-black/10
                         rounded-full text-sm text-primary
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:border-purple-500/50 focus:bg-white/10 dark:focus:bg-white/10
                         focus:ring-2 focus:ring-purple-500/50
                         shadow-inner search-inner-shadow
                         transition-all duration-200"
              id="search-input"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
              >
                <HiX />
              </button>
            )}
          </div>

          {/* Search dropdown */}
          {showResults && (
            <div className="absolute top-full mt-2 w-full bg-dark-800/95 dark:bg-dark-800/95 bg-light-800/95 backdrop-blur-xl border border-dark-600/50 dark:border-dark-600/50 border-light-border rounded-2xl overflow-hidden shadow-2xl shadow-black/40 dark:shadow-black/40 z-50">
              {isSearching ? (
                <div className="p-4 text-center text-gray-400 dark:text-gray-400 text-sm">Searching...</div>
              ) : results.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {results.map((item, i) => (
                    <button
                      key={`${item.type}-${item.id}-${i}`}
                      onClick={() => handleResultClick(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600/50 dark:hover:bg-dark-600/50 hover:bg-light-600/50 transition-colors text-left group"
                    >
                      <img
                        src={getHighResImage(item.image)}
                        alt={cleanTitle(item.title)}
                        className={`w-10 h-10 object-cover ${item.type === "artist" ? "rounded-full" : item.type === "album" ? "rounded-md" : "rounded-lg"}`}
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate group-hover:text-purple-400 transition-colors">
                          {cleanTitle(item.title)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-500 truncate">
                          {item.type === "album"
                            ? item.music || item.description || "Album"
                            : item.moreInfo?.primaryArtists || item.description || "Song"}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-dark-600/50 dark:bg-dark-600/50 bg-light-600/50 text-gray-400 dark:text-gray-400 text-gray-500 shrink-0">
                        {item.type === "album" ? (
                          <span className="flex items-center gap-1"><RiAlbumFill className="text-xs" /> Album</span>
                        ) : item.type === "playlist" ? (
                          <span className="flex items-center gap-1"><RiPlayListFill className="text-xs" /> Playlist</span>
                        ) : item.type === "artist" ? (
                          <span className="flex items-center gap-1">Artist</span>
                        ) : (
                          <span className="flex items-center gap-1"><HiMusicNote className="text-xs" /> Song</span>
                        )}
                      </span>
                    </button>
                  ))}

                  {/* View all results */}
                  {query.trim() && (
                    <button
                      onClick={() => {
                        setShowResults(false);
                        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                      }}
                      className="w-full px-4 py-3 text-center text-sm text-purple-400 hover:bg-dark-600/30 dark:hover:bg-dark-600/30 hover:bg-light-600/30 transition-colors border-t border-dark-700/50 dark:border-dark-700/50 border-light-border"
                    >
                      View all results for "{query}"
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-400 dark:text-gray-400 text-sm">No results found</div>
              )}
            </div>
          )}
        </div>

        {/* Language & Profile */}
        <div className="hidden md:flex items-center justify-end w-auto gap-4 relative">

          <button
            onClick={() => setShowLanguageSettings(!showLanguageSettings)}
            className="flex flex-col items-start hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-1 text-sm font-medium text-primary mb-0.5">
              Music Languages <HiChevronDown className={`text-gray-400 dark:text-gray-400 text-gray-500 transition-transform ${showLanguageSettings ? "rotate-180" : ""}`} />
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-400 text-gray-500 capitalize truncate max-w-[150px]">
              {globalLanguages?.join(", ") || "Telugu"}
            </div>
          </button>

          <LanguageSettings
            isOpen={showLanguageSettings}
            onClose={() => setShowLanguageSettings(false)}
          />

          <div className="w-px h-8 bg-dark-600/50 dark:bg-dark-600/50 bg-light-600/50"></div>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm text-white">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-dark-800/95 dark:bg-dark-800/95 bg-light-800/95 backdrop-blur-xl border border-dark-600/50 dark:border-dark-600/50 border-light-border rounded-xl overflow-hidden shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-white/5 dark:border-white/5 border-black/5 mb-1">
                    <p className="text-sm font-bold text-primary truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-dark-600/50 dark:hover:bg-dark-600/50 hover:bg-light-600/50 text-sm text-red-400 transition-colors"
                  >
                    <HiLogout /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-white hover:bg-gray-100 dark:bg-white dark:hover:bg-gray-100 text-black px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
            >
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setShowResults(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
