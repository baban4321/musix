import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiPlay, HiClock, HiTrash, HiMusicNote } from "react-icons/hi";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";
import { getSongDetails } from "../services/api";

const ListeningHistory = () => {
  const navigate = useNavigate();
  const { history, isAuthenticated, setAuthModalOpen, fetchHistory, clearHistory } = useAuthStore();
  const { currentSong, isPlaying, playSong } = usePlayerStore();
  const [playingId, setPlayingId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      navigate("/");
    }
  }, [isAuthenticated, navigate, setAuthModalOpen]);

  // Fetch history from DB on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated, fetchHistory]);

  const getImageUrl = (url) => {
    if (!url) return "";
    return url.replace("50x50", "150x150");
  };

  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handlePlay = async (item) => {
    setPlayingId(item.songId);
    try {
      const res = await getSongDetails(item.songId);
      const songs = res?.songs || [];
      if (songs.length > 0) {
        await playSong(songs[0]);
      }
    } catch (err) {
      console.error("Failed to play from history:", err);
    } finally {
      setPlayingId(null);
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    await clearHistory();
    setIsClearing(false);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <HiClock className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-extrabold text-primary">
              Listening History
            </h1>
            <p className="text-sm text-gray-500 dark:text-dark-300 mt-0.5">
              {history.length} {history.length === 1 ? "song" : "songs"} played
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={isClearing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                       text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20
                       transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <HiTrash className="text-base" />
            {isClearing ? "Clearing..." : "Clear All"}
          </button>
        )}
      </div>

      {/* Song List */}
      {history.length > 0 ? (
        <div className="space-y-1">
          {history.map((item, index) => {
            const isActive = currentSong?.id === item.songId;
            const isLoadingThis = playingId === item.songId;

            return (
              <button
                key={`${item.songId}-${index}`}
                onClick={() => handlePlay(item)}
                disabled={isLoadingThis}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left group
                  hover:bg-gray-100 dark:hover:bg-dark-600/50
                  ${isActive ? "bg-purple-50 dark:bg-dark-600/40" : ""}
                  ${isLoadingThis ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
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
                    <>
                      <span className="text-sm text-gray-500 dark:text-dark-400 group-hover:hidden">
                        {index + 1}
                      </span>
                      <HiPlay className="text-primary text-sm hidden group-hover:block mx-auto" />
                    </>
                  )}
                </div>

                {/* Image */}
                <div className="relative shrink-0">
                  <img
                    src={getImageUrl(item.image)}
                    alt={cleanTitle(item.title)}
                    className="w-12 h-12 rounded-lg object-cover shadow-md bg-gray-200 dark:bg-dark-700"
                    loading="lazy"
                    onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect fill='%231a1a24' width='48' height='48' rx='8'/%3E%3Ctext x='24' y='28' text-anchor='middle' fill='%235c5c6d' font-size='16'%3E♫%3C/text%3E%3C/svg%3E"; }}
                  />
                  {isLoadingThis && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? "text-accent-primary" : "text-primary"}`}>
                    {cleanTitle(item.title) || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-300 truncate">
                    {item.artist || "Unknown Artist"}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="hidden md:block text-xs text-gray-400 dark:text-dark-400 shrink-0">
                  {formatTime(item.playedAt)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-700/50 flex items-center justify-center mb-6">
            <HiMusicNote className="text-3xl text-gray-400 dark:text-dark-400" />
          </div>
          <h3 className="text-xl font-display font-bold text-primary mb-2">
            No listening history yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-dark-300 max-w-sm">
            Songs you play will appear here so you can easily find and replay them.
          </p>
        </div>
      )}
    </div>
  );
};

export default ListeningHistory;
