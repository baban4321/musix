import { useEffect, useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { useAuthStore } from "../store/authStore";
import { useAutoPlayQueue } from "../hooks/useAutoPlayQueue";
import { useDominantColor } from "../hooks/useDominantColor";
import { useMediaSession } from "../hooks/useMediaSession";
import LyricsPanel from "./LyricsPanel";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiPlay,
  HiPause,
  HiRewind,
  HiFastForward,
  HiVolumeUp,
  HiVolumeOff,
  HiChevronUp,
  HiChevronDown,
  HiHeart,
  HiOutlineHeart,
  HiMenu,
  HiCollection,
  HiPlus,
} from "react-icons/hi";
import {
  RiRepeatLine,
  RiRepeatOneLine,
  RiShuffleLine,
  RiMusic2Line,
} from "react-icons/ri";

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const Player = () => {
  const audioRef = useRef(null);
  const [showLyrics, setShowLyrics] = useState(false);

  useAutoPlayQueue();
  useMediaSession();

  const {
    currentSong,
    audioUrl,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    setAudioRef,
    togglePlay,
    nextSong,
    prevSong,
    seekTo,
    setVolume,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    queue,
    queueIndex,
    playFromQueue,
    isExpandedPlayer,
    setIsExpandedPlayer,
    repeat,
    shuffle,
    toggleRepeat,
    toggleShuffle,
  } = usePlayerStore();

  const {
    likedSongs,
    toggleLikeSong,
    playlists = [],
    addSongToPlaylist,
    createPlaylist,
    isAuthenticated,
    setAuthModalOpen,
  } = useAuthStore();
  const [showPlaylistDd, setShowPlaylistDd] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const playlistDdRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        playlistDdRef.current &&
        !playlistDdRef.current.contains(e.target)
      ) {
        setShowPlaylistDd(false);
      }
    };
    if (showPlaylistDd)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPlaylistDd]);

  // Persist currentTime periodically so we can restore after reload
  useEffect(() => {
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        usePlayerStore.setState({ currentTime: audio.currentTime });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToPlaylist = async (playlistId) => {
    if (!isAuthenticated) return setAuthModalOpen(true);
    await addSongToPlaylist(playlistId, currentSong);
    setShowPlaylistDd(false);
  };

  const handleCreatePlaylist = async () => {
    if (!isAuthenticated) return setAuthModalOpen(true);
    if (!newPlaylistName.trim()) return;
    const res = await createPlaylist(newPlaylistName);
    if (res.success) {
      await addSongToPlaylist(res.playlist._id, currentSong);
    }
    setNewPlaylistName("");
    setShowPlaylistDd(false);
  };

  const getHighResImage = (url) => {
    if (!url) return "";
    return url.replace("50x50", "500x500").replace("150x150", "500x500");
  };

  const imageUrl = getHighResImage(currentSong?.image);
  const { color: dominantColor } = useDominantColor(imageUrl, "#11111a");

  // Register audio ref once
  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current);
    }
  }, [setAudioRef]);

  // When audioUrl changes, load and play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.src = audioUrl;
    audio.volume = volume;
    audio.load();
    audio.play().catch((e) => {
      console.error("Autoplay blocked or error:", e);
    });
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, [setDuration]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    nextSong();
  }, [setIsPlaying, nextSong]);

  const handlePlay = useCallback(() => setIsPlaying(true), [setIsPlaying]);
  const handlePause = useCallback(() => setIsPlaying(false), [setIsPlaying]);

  // Handle audio errors — try to recover
  const handleError = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setTimeout(() => {
      if (audio && audio.error) {
        audio.load();
        audio.play().catch(() => {});
      }
    }, 2000);
  }, []);

  // Handle stalled audio
  const handleStalled = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setTimeout(() => {
      if (audio && audio.networkState === 2) {
        audio.load();
      }
    }, 3000);
  }, []);

  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  };

  const getArtist = () => {
    if (!currentSong) return null;
    if (currentSong.moreInfo?.artistMap?.primaryArtists?.length > 0) {
      return currentSong.moreInfo.artistMap.primaryArtists.map(
        (a, index, arr) => (
          <span key={a.id || index}>
            {a.id ? (
              <Link
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpandedPlayer(false);
                }}
                to={`/artist/${a.id}`}
                className="hover:underline hover:text-white transition-colors cursor-pointer relative z-10"
              >
                {a.name}
              </Link>
            ) : (
              <span>{a.name}</span>
            )}
            {index < arr.length - 1 ? ", " : ""}
          </span>
        )
      );
    }
    if (currentSong.subtitle)
      return <span>{currentSong.subtitle.split(" - ")[0]}</span>;
    return <span>Unknown Artist</span>;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const isLiked = currentSong && likedSongs.includes(currentSong.id);

  // Prevent pull-to-refresh / accidental refresh on mobile during playback
  useEffect(() => {
    if (!isPlaying) return;
    const handler = (e) => {
      if (e.touches && e.touches.length === 1 && window.scrollY === 0) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", handler, { passive: false });
    return () => document.removeEventListener("touchmove", handler);
  }, [isPlaying]);

  if (!currentSong && !isLoading) {
    return (
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        onError={handleError}
        onStalled={handleStalled}
        preload="auto"
      />
    );
  }

  const RepeatIcon = repeat === "one" ? RiRepeatOneLine : RiRepeatLine;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        onError={handleError}
        onStalled={handleStalled}
        preload="auto"
      />

      <AnimatePresence>
        {!isExpandedPlayer ? (
          // ================= MINI PLAYER =================
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 sm:bottom-4 sm:left-4 sm:right-4 md:left-[260px] md:right-8 z-50 rounded-none sm:rounded-2xl glass-player overflow-hidden cursor-pointer"
            id="player-bar"
            style={{
              backgroundColor: `${dominantColor}e6`,
              backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3))`,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
            onClick={() => setIsExpandedPlayer(true)}
          >
            {imageUrl && (
              <div
                className="absolute inset-0 z-0 opacity-20 blur-2xl scale-110 transform mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}

            {/* Progress bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-dark-900/50 group z-20"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                seekTo(percent * duration);
              }}
            >
              <div
                className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Mobile layout: single row with art + controls */}
            <div className="relative z-10 flex items-center px-3 h-[64px] sm:hidden">
              {/* Art + Title */}
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                <img
                  src={imageUrl || "https://via.placeholder.com/150"}
                  alt="Art"
                  className="w-10 h-10 rounded-lg object-cover shadow-md shrink-0"
                />
                <div className="min-w-0 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-white truncate drop-shadow-md font-display">
                    {isLoading ? "Loading..." : cleanTitle(currentSong?.title)}
                  </h4>
                </div>
              </div>

              {/* Mobile controls: like, prev, play, next */}
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => toggleLikeSong(currentSong.id)}
                  className={`p-1.5 ${isLiked ? "text-accent-primary" : "text-white/60"}`}
                >
                  {isLiked ? (
                    <HiHeart className="text-lg" />
                  ) : (
                    <HiOutlineHeart className="text-lg" />
                  )}
                </button>
                <button
                  onClick={prevSong}
                  className="p-1.5 text-white/70 active:text-white"
                >
                  <HiRewind className="text-xl" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg disabled:opacity-50 mx-0.5"
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <HiPause className="text-base" />
                  ) : (
                    <HiPlay className="text-base ml-0.5" />
                  )}
                </button>
                <button
                  onClick={nextSong}
                  className="p-1.5 text-white/70 active:text-white"
                >
                  <HiFastForward className="text-xl" />
                </button>
              </div>
            </div>

            {/* Desktop layout: 3 columns */}
            <div className="relative z-10 hidden sm:flex items-center justify-between px-6 h-[84px]">
              {/* Left: art + info */}
              <div className="flex items-center gap-4 flex-1 min-w-0 md:w-1/3">
                <div className="relative w-14 h-14 shrink-0 transition-transform hover:scale-105">
                  <img
                    src={imageUrl || "https://via.placeholder.com/150"}
                    alt="Art"
                    className="w-full h-full rounded-xl object-cover shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                  />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <h4 className="text-base font-bold text-white truncate drop-shadow-md font-display tracking-wide">
                    {isLoading ? "Loading..." : cleanTitle(currentSong?.title)}
                  </h4>
                  <p className="text-sm text-white/70 truncate drop-shadow-sm font-medium">
                    {getArtist()}
                  </p>
                </div>
              </div>

              {/* Center: controls */}
              <div
                className="flex items-center gap-4 justify-center flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={toggleShuffle}
                  className={`p-2 ${shuffle ? "text-accent-primary" : "text-white/50 hover:text-white"}`}
                  title={shuffle ? "Shuffle on" : "Shuffle off"}
                >
                  <RiShuffleLine className="text-lg" />
                </button>
                <button
                  onClick={() => toggleLikeSong(currentSong.id)}
                  className={`p-2 ${isLiked ? "text-accent-primary" : "text-white/50 hover:text-white"}`}
                >
                  {isLiked ? (
                    <HiHeart className="text-xl drop-shadow-[0_0_8px_#8b5cf6]" />
                  ) : (
                    <HiOutlineHeart className="text-xl" />
                  )}
                </button>
                <button
                  onClick={prevSong}
                  className="p-2 text-white/70 hover:text-white"
                >
                  <HiRewind className="text-2xl" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <HiPause className="text-lg" />
                  ) : (
                    <HiPlay className="text-lg ml-0.5" />
                  )}
                </button>
                <button
                  onClick={nextSong}
                  className="p-2 text-white/70 hover:text-white"
                >
                  <HiFastForward className="text-2xl" />
                </button>
                <button
                  onClick={toggleRepeat}
                  className={`p-2 ${repeat !== "off" ? "text-accent-primary" : "text-white/50 hover:text-white"}`}
                  title={`Repeat: ${repeat}`}
                >
                  <RepeatIcon className="text-lg" />
                </button>
              </div>

              {/* Right: time + volume (desktop only) */}
              <div
                className="hidden md:flex items-center gap-4 w-1/3 justify-end pr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs font-semibold text-white/80 tabular-nums tracking-wide">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={`p-2 transition-colors ${showLyrics ? "text-accent-primary" : "text-white/50 hover:text-white"}`}
                  title="Lyrics"
                >
                  <RiMusic2Line className="text-xl" />
                </button>
                <div className="relative group flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // ================= FULL SCREEN EXPANDED PLAYER =================
          <motion.div
            key="expanded-player"
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed inset-0 z-[100] flex flex-col bg-dark-900 overflow-y-auto"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Background */}
            {imageUrl && (
              <div
                className="fixed inset-0 z-0 opacity-40 blur-[100px] scale-150 pointer-events-none"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: dominantColor,
                }}
              />
            )}
            <div className="fixed inset-0 bg-gradient-to-b from-dark-900/40 via-dark-900/80 to-dark-900 z-0" />

            {/* Close button */}
            <button
              onClick={() => setIsExpandedPlayer(false)}
              className="relative z-50 self-start m-4 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-all"
            >
              <HiChevronDown className="text-xl" />
            </button>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-6 pb-8">
              {/* Album Art */}
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: isPlaying ? 1 : 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden mb-8 relative"
              >
                <img
                  src={imageUrl || "https://via.placeholder.com/500"}
                  alt="Art"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] pointer-events-none" />
              </motion.div>

              {/* Song Info */}
              <div className="w-full max-w-md flex items-start justify-between mb-6 gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white truncate tracking-tight">
                    {cleanTitle(currentSong?.title)}
                  </h2>
                  <p className="text-sm sm:text-base text-white/60 mt-1 font-medium truncate">
                    {getArtist()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="relative" ref={playlistDdRef}>
                    <button
                      onClick={() => setShowPlaylistDd(!showPlaylistDd)}
                      className={`p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-colors ${showPlaylistDd ? "text-accent-primary" : "text-white/70"}`}
                      title="Add to Playlist"
                    >
                      <HiCollection className="text-xl" />
                    </button>
                    {showPlaylistDd && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-dark-800 rounded-xl shadow-2xl z-[150] border border-white/10 p-3 flex flex-col gap-2 backdrop-blur-xl">
                        <h4 className="text-[10px] uppercase tracking-widest text-dark-300 font-bold mb-1 px-1">
                          Add to Playlist
                        </h4>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                          {playlists.map((pl) => (
                            <button
                              key={pl._id}
                              onClick={() => handleAddToPlaylist(pl._id)}
                              className="text-left text-sm text-white hover:bg-white/10 px-3 py-2 rounded-lg truncate transition-colors"
                            >
                              {pl.name}
                            </button>
                          ))}
                          {playlists.length === 0 && (
                            <p className="text-xs text-dark-400 italic px-1">
                              No playlists yet.
                            </p>
                          )}
                        </div>
                        <div className="pt-2 border-t border-white/10 flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={newPlaylistName}
                            onChange={(e) =>
                              setNewPlaylistName(e.target.value)
                            }
                            placeholder="New playlist..."
                            className="bg-dark-700 text-white text-xs px-3 py-2 rounded-lg flex-1 outline-none border border-transparent focus:border-accent-primary"
                          />
                          <button
                            onClick={handleCreatePlaylist}
                            className="p-2 bg-accent-primary rounded-lg text-white hover:opacity-80 disabled:opacity-50"
                            disabled={!newPlaylistName.trim()}
                          >
                            <HiPlus className="text-sm" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleLikeSong(currentSong.id)}
                    className={`p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-colors ${isLiked ? "text-accent-primary" : "text-white/70"}`}
                  >
                    {isLiked ? (
                      <HiHeart className="text-xl drop-shadow-[0_0_12px_#8b5cf6]" />
                    ) : (
                      <HiOutlineHeart className="text-xl" />
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md mb-6">
                <div
                  className="h-1.5 w-full bg-white/15 rounded-full cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    seekTo(percent * duration);
                  }}
                >
                  <div
                    className="h-full bg-white rounded-full relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg translate-x-1/2" />
                  </div>
                </div>
                <div className="flex justify-between text-[11px] font-medium text-white/40 mt-2 tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Controls Row */}
              <div className="flex items-center justify-center gap-6 w-full max-w-sm mb-6">
                <button
                  onClick={prevSong}
                  className="p-2 text-white/60 active:text-white active:scale-90 transition-all"
                >
                  <HiRewind className="text-3xl" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.25)]"
                >
                  {isPlaying ? (
                    <HiPause className="text-2xl sm:text-3xl" />
                  ) : (
                    <HiPlay className="text-2xl sm:text-3xl ml-0.5" />
                  )}
                </button>
                <button
                  onClick={nextSong}
                  className="p-2 text-white/60 active:text-white active:scale-90 transition-all"
                >
                  <HiFastForward className="text-3xl" />
                </button>
              </div>

              {/* Secondary Controls Row */}
              <div className="flex items-center justify-center gap-8 w-full max-w-xs">
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${showLyrics ? "text-accent-primary" : "text-white/40 active:text-white"}`}
                >
                  <RiMusic2Line className="text-lg" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    Lyrics
                  </span>
                </button>
                <button
                  onClick={toggleShuffle}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${shuffle ? "text-accent-primary" : "text-white/40 active:text-white"}`}
                >
                  <RiShuffleLine className="text-lg" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    Shuffle
                  </span>
                </button>
                <button
                  onClick={toggleRepeat}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${repeat !== "off" ? "text-accent-primary" : "text-white/40 active:text-white"}`}
                >
                  <RepeatIcon className="text-lg" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    {repeat === "one" ? "1" : "Repeat"}
                  </span>
                </button>
                <div className="flex flex-col items-center gap-1">
                  <button
                    className="p-2 text-white/40 active:text-white transition-colors"
                    onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                  >
                    {volume === 0 ? (
                      <HiVolumeOff className="text-lg" />
                    ) : (
                      <HiVolumeUp className="text-lg" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Queue section (mobile: below controls, desktop: hidden since sidebar exists) */}
              <div className="w-full max-w-md mt-10 md:hidden">
                <div className="flex items-center gap-2 mb-4">
                  <HiMenu className="text-white/40" />
                  <h3 className="font-display font-bold text-white text-sm">
                    Next in Queue
                  </h3>
                  <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                    {queue.length}
                  </span>
                </div>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {queue.slice(queueIndex + 1, queueIndex + 6).map((song, idx) => (
                    <div
                      key={`${song.id}-${queueIndex + 1 + idx}`}
                      onClick={() => playFromQueue(queueIndex + 1 + idx)}
                      className="flex items-center gap-3 p-2 rounded-lg active:bg-white/5 transition-colors cursor-pointer"
                    >
                      <img
                        src={getHighResImage(song.image) || "https://via.placeholder.com/50"}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">
                          {cleanTitle(song.title)}
                        </p>
                        <p className="text-[11px] text-white/40 truncate">
                          {song.subtitle?.split(" - ")[0] || song.artist}
                        </p>
                      </div>
                    </div>
                  ))}
                  {queue.length === 0 && (
                    <p className="text-white/30 text-xs text-center py-4">
                      Queue is empty
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Queue Panel */}
            <div className="hidden md:flex relative z-10 w-full bg-dark-900/40 backdrop-blur-3xl border-t border-white/5 flex-col max-h-[40vh]">
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
                  <HiMenu className="text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-white text-sm">
                    Next in Queue
                  </h3>
                  <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                    {queue.length} Songs
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {queue.length === 0 ? (
                  <p className="text-dark-300 text-sm text-center py-8">
                    Queue is empty
                  </p>
                ) : (
                  queue.map((song, idx) => {
                    const isActive = idx === queueIndex;
                    return (
                      <div
                        key={`${song.id}-${idx}`}
                        onClick={() => playFromQueue(idx)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? "bg-white/10 shadow-[inset_2px_0_0_0_#8b5cf6]"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <img
                          src={
                            getHighResImage(song.image) ||
                            "https://via.placeholder.com/50"
                          }
                          alt=""
                          className="w-10 h-10 rounded-md object-cover shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-white/70"}`}
                          >
                            {cleanTitle(song.title)}
                          </p>
                          <p className="text-[11px] text-white/40 truncate">
                            {song.subtitle?.split(" - ")[0] || song.artist}
                          </p>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-[0_0_8px_#8b5cf6]" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LyricsPanel
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
      />
    </>
  );
};

export default Player;
