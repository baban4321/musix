import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiHeart, HiPlay, HiPause, HiClock } from "react-icons/hi";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";
import { getSongDetails } from "../services/api";

const LikedSongs = () => {
  const navigate = useNavigate();
  const { likedSongs, isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { playSong, setQueue, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      navigate("/");
    }
  }, [isAuthenticated, navigate, setAuthModalOpen]);

  useEffect(() => {
    const fetchLiked = async () => {
      if (!likedSongs || likedSongs.length === 0) {
        setSongs([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // JioSaavn /song endpoint accepts comma separated IDs. 
        // We chunk them by 40 to avoid URI too long errors
        let fetchedSongs = [];
        const chunkSize = 40;
        
        // Reverse so newest likes are first
        const sortedIds = [...likedSongs].reverse();

        for (let i = 0; i < sortedIds.length; i += chunkSize) {
          const chunk = sortedIds.slice(i, i + chunkSize);
          const res = await getSongDetails(chunk.join(","));
          
          if (res?.songs) {
            fetchedSongs = [...fetchedSongs, ...res.songs];
          } else if (res?.data?.songs) {
            fetchedSongs = [...fetchedSongs, ...res.data.songs];
          } else if (Array.isArray(res?.data)) {
            fetchedSongs = [...fetchedSongs, ...res.data];
          } else if (Array.isArray(res)) {
            fetchedSongs = [...fetchedSongs, ...res];
          } else if (typeof res === 'object' && res !== null) {
            // Sometime response is an object mapping id -> song data
            Object.values(res).forEach(v => {
               if (v?.id) fetchedSongs.push(v);
            });
          }
        }
        
        // Ensure they match the order of sortedIds
        const songMap = new Map();
        fetchedSongs.forEach(s => songMap.set(s.id, s));
        
        const orderedSongs = sortedIds.map(id => songMap.get(id)).filter(Boolean);
        setSongs(orderedSongs);
      } catch (err) {
        console.error("Failed to fetch liked songs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchLiked();
    }
  }, [likedSongs, isAuthenticated]);

  if (!isAuthenticated) return null;

  const isMixPlaying = songs.some((s) => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = async () => {
    if (songs.length === 0) return;
    const isFromThis = songs.some((s) => s.id === currentSong?.id);
    if (isFromThis) {
      togglePlay();
      return;
    }
    setQueue(songs, 0);
    await playSong(songs[0]);
  };

  const handlePlaySong = async (song, index) => {
    const isActive = currentSong?.id === song.id;
    if (isActive) {
      togglePlay();
      return;
    }
    setQueue(songs, index);
    await playSong(song);
  };

  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  };

  const getArtistText = (song) => {
     if (song.subtitle) return song.subtitle.split(" - ")[0];
     if (song.moreInfo?.singers) return song.moreInfo.singers;
     if (song.moreInfo?.primaryArtists) return song.moreInfo.primaryArtists;
     return "Unknown Artist";
  };

  const getImage = (song) => {
      const imgRaw = song.image;
      if (Array.isArray(imgRaw)) return imgRaw[imgRaw.length - 1]?.link || "";
      if (typeof imgRaw === "string") return imgRaw;
      return "";
  };

  return (
    <div className="fade-in max-w-screen-xl mx-auto pb-10">
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-900/40 via-dark-900/80 to-dark-900 z-0" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-10">
          <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 mx-auto md:mx-0 flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-2xl shadow-pink-500/20">
            <HiHeart className="text-white text-6xl md:text-8xl drop-shadow-md" />
          </div>

          <div className="flex flex-col justify-end text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-pink-400 mb-2">
              Playlist
            </p>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-4 leading-tight">
              Liked Songs
            </h1>

            <div className="flex items-center gap-3 justify-center md:justify-start text-sm text-dark-200 mb-6 font-medium">
              <span>{likedSongs.length} {likedSongs.length === 1 ? "song" : "songs"}</span>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start">
              <button
                onClick={handlePlayAll}
                disabled={songs.length === 0 || loading}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-pink-600 text-white font-semibold text-sm hover:bg-pink-500 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
              >
                {isMixPlaying ? (
                  <>
                    <HiPause className="text-lg" />
                    Pause
                  </>
                ) : (
                  <>
                    <HiPlay className="text-lg" />
                    Play All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-dark-300">Loading your favorite songs...</p>
        </div>
      ) : songs.length > 0 ? (
        <div>
          <div className="hidden md:flex items-center gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-dark-400 border-b border-dark-700/50 mb-2">
            <div className="w-8 text-center">#</div>
            <div className="w-12" />
            <div className="flex-1">Title</div>
            <div className="w-48 text-right flex items-center justify-end gap-1">
              <HiClock className="text-sm" />
            </div>
          </div>

          <div className="space-y-0.5">
            {songs.map((song, index) => {
              const isActive = currentSong?.id === song.id;
              
              return (
                <button
                  key={song.id || index}
                  onClick={() => handlePlaySong(song, index)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left hover:bg-dark-600/50 group ${
                    isActive ? "bg-dark-600/40" : ""
                  }`}
                >
                  <div className="w-8 text-center shrink-0">
                    {isActive && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-4 justify-center">
                        <div className="w-[3px] bg-pink-500 rounded-full eq-bar-1"></div>
                        <div className="w-[3px] bg-pink-500 rounded-full eq-bar-2"></div>
                        <div className="w-[3px] bg-pink-500 rounded-full eq-bar-3"></div>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-dark-400 group-hover:hidden">{index + 1}</span>
                        <HiPlay className="text-white text-sm hidden group-hover:block mx-auto" />
                      </>
                    )}
                  </div>

                  <img
                    src={getImage(song)}
                    alt={cleanTitle(song.title || song.name)}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-pink-500" : "text-primary"}`}>
                      {cleanTitle(song.title || song.name)}
                    </p>
                    <p className="text-xs text-dark-300 xl:max-w-[80%] truncate mt-0.5">
                      {getArtistText(song)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
           <p className="text-dark-300 font-medium">No liked songs yet.</p>
           <p className="text-dark-400 text-sm mt-2">Tap the heart icon on any song to add it to your Liked Songs.</p>
        </div>
      )}
    </div>
  );
};

export default LikedSongs;
