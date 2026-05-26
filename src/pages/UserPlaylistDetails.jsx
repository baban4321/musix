import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";
import { HiPlay, HiPause, HiClock } from "react-icons/hi";

const UserPlaylistDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playlists, isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { playSong, setQueue, currentSong, isPlaying, togglePlay } = usePlayerStore();
  
  const [playlist, setPlaylist] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      navigate("/");
    }
  }, [isAuthenticated, navigate, setAuthModalOpen]);

  useEffect(() => {
    const found = playlists.find(p => p._id === id);
    if (found) {
      setPlaylist(found);
    }
  }, [id, playlists]);

  if (!isAuthenticated) return null;

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-dark-300">Loading playlist...</p>
      </div>
    );
  }

  const songs = playlist.songs || [];
  const isMixPlaying = songs.some((s) => s.id === currentSong?.id) && isPlaying;
  
  const coverImage = songs.length > 0 && songs[0].image 
       ? (typeof songs[0].image === 'string' ? songs[0].image.replace("150x150", "500x500").replace("50x50", "500x500") : "https://via.placeholder.com/500/18181b/ffffff?text=Playlist")
       : "https://via.placeholder.com/500/18181b/ffffff?text=Playlist";

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

  return (
    <div className="fade-in max-w-screen-xl mx-auto pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 via-dark-900/80 to-dark-900 z-0" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-10">
          <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 mx-auto md:mx-0">
            <img
              src={coverImage}
              alt={playlist.name}
              className="w-full h-full rounded-2xl object-cover shadow-2xl shadow-black/50"
            />
          </div>

          <div className="flex flex-col justify-end text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-pink mb-2">
              My Playlist
            </p>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-4 leading-tight">
              {playlist.name}
            </h1>

            <div className="flex items-center gap-3 justify-center md:justify-start text-sm text-dark-200 mb-6 font-medium">
              <span>{songs.length} {songs.length === 1 ? "track" : "tracks"}</span>
              <span className="text-dark-500">•</span>
              <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start">
              <button
                onClick={handlePlayAll}
                disabled={songs.length === 0}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-accent-primary text-white font-semibold text-sm hover:bg-accent-glow transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent-primary/30 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
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

      {/* Track list */}
      {songs.length > 0 ? (
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
                        <div className="w-[3px] bg-accent-primary rounded-full eq-bar-1"></div>
                        <div className="w-[3px] bg-accent-primary rounded-full eq-bar-2"></div>
                        <div className="w-[3px] bg-accent-primary rounded-full eq-bar-3"></div>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-dark-400 group-hover:hidden">{index + 1}</span>
                        <HiPlay className="text-white text-sm hidden group-hover:block mx-auto" />
                      </>
                    )}
                  </div>

                  <img
                    src={typeof song.image === 'string' ? song.image : ""}
                    alt={cleanTitle(song.title)}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-accent-primary" : "text-primary"}`}>
                      {cleanTitle(song.title)}
                    </p>
                    <p className="text-xs text-dark-300 truncate mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
           <p className="text-dark-300 font-medium">This playlist is empty.</p>
           <p className="text-dark-400 text-sm mt-2">Add songs to it directly from the music player!</p>
        </div>
      )}
    </div>
  );
};

export default UserPlaylistDetails;
