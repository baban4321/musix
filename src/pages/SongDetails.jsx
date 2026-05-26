import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getSongDetails } from "../services/api";
import { usePlayerStore } from "../store/playerStore";
import { HiPlay, HiPause, HiHeart } from "react-icons/hi";

const SongDetails = () => {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    const fetchSong = async () => {
      try {
        setLoading(true);
        const data = await getSongDetails(id);
        if (data?.songs?.length > 0) {
          setSong(data.songs[0]);
        } else if (data) {
          setSong(data);
        }
      } catch (err) {
        console.error("Failed to fetch song:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  const getHighResImage = (url) => {
    if (!url) return "";
    return url.replace("150x150", "500x500");
  };

  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  };

  const getArtists = () => {
    if (!song) return [];
    return song.moreInfo?.artistMap?.primaryArtists || [];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(parseInt(seconds) / 60);
    const secs = parseInt(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isCurrentSong = currentSong?.id === song?.id;

  const handlePlay = async () => {
    if (isCurrentSong) {
      togglePlay();
    } else if (song) {
      await playSong(song);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row gap-8 animate-pulse">
        <div className="w-full md:w-80 aspect-square rounded-2xl skeleton shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-3/4 rounded skeleton" />
          <div className="h-5 w-1/2 rounded skeleton" />
          <div className="h-12 w-40 rounded-full skeleton mt-6" />
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-dark-300 text-lg">Song not found</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        {/* Blurred background */}
        <div className="absolute inset-0">
          <img
            src={getHighResImage(song.image)}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-150 opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 via-dark-900/80 to-dark-900" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-10">
          {/* Album art */}
          <div className="w-48 h-48 md:w-72 md:h-72 shrink-0 mx-auto md:mx-0">
            <img
              src={getHighResImage(song.image)}
              alt={cleanTitle(song.title)}
              className="w-full h-full rounded-2xl object-cover shadow-2xl shadow-black/50"
            />
          </div>

          {/* Song info */}
          <div className="flex flex-col justify-end text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-primary mb-2">
              {song.type === "album" ? "Album" : "Song"}
            </p>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-extrabold text-white mb-3 leading-tight">
              {cleanTitle(song.title)}
            </h1>
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start text-sm text-dark-200 mb-6">
              {getArtists().map((artist, i) => (
                <span key={artist.id}>
                  <span className="text-white font-medium">{artist.name}</span>
                  {i < getArtists().length - 1 && <span className="text-dark-400 ml-2">•</span>}
                </span>
              ))}
              {song.moreInfo?.album && (
                <>
                  <span className="text-dark-400">•</span>
                  <span>{cleanTitle(song.moreInfo.album)}</span>
                </>
              )}
              {song.moreInfo?.duration && (
                <>
                  <span className="text-dark-400">•</span>
                  <span>{formatDuration(song.moreInfo.duration)}</span>
                </>
              )}
              {song.year && (
                <>
                  <span className="text-dark-400">•</span>
                  <span>{song.year}</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-accent-primary text-white font-semibold text-sm hover:bg-accent-glow transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent-primary/30"
                id="play-song-btn"
              >
                {isCurrentSong && isPlaying ? (
                  <>
                    <HiPause className="text-lg" />
                    Pause
                  </>
                ) : (
                  <>
                    <HiPlay className="text-lg" />
                    Play
                  </>
                )}
              </button>

              <button
                onClick={() => setLiked(!liked)}
                className={`p-3 rounded-full border transition-all ${
                  liked
                    ? "bg-accent-pink/20 border-accent-pink text-accent-pink"
                    : "border-dark-500 text-dark-300 hover:border-accent-pink hover:text-accent-pink"
                }`}
                id="like-btn"
              >
                <HiHeart className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Song details card */}
        <div className="rounded-2xl bg-dark-700/30 border border-dark-600/30 p-6">
          <h3 className="text-lg font-display font-bold text-primary mb-4">Details</h3>
          <div className="space-y-3">
            {song.moreInfo?.album && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Album</span>
                <span className="text-primary">{cleanTitle(song.moreInfo.album)}</span>
              </div>
            )}
            {song.moreInfo?.releaseDate && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Released</span>
                <span className="text-primary">{song.moreInfo.releaseDate}</span>
              </div>
            )}
            {song.moreInfo?.label && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Label</span>
                <span className="text-primary">{song.moreInfo.label}</span>
              </div>
            )}
            {song.moreInfo?.duration && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Duration</span>
                <span className="text-primary">{formatDuration(song.moreInfo.duration)}</span>
              </div>
            )}
            {song.language && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Language</span>
                <span className="text-primary capitalize">{song.language}</span>
              </div>
            )}
            {song.playCount && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-300">Plays</span>
                <span className="text-primary">{parseInt(song.playCount).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Artists card */}
        {getArtists().length > 0 && (
          <div className="rounded-2xl bg-dark-700/30 border border-dark-600/30 p-6">
            <h3 className="text-lg font-display font-bold text-primary mb-4">Artists</h3>
            <div className="space-y-3">
              {getArtists().map((artist) => (
                <div key={artist.id} className="flex items-center gap-3">
                  {artist.image ? (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center text-dark-300 text-sm">
                      {artist.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-primary">{artist.name}</p>
                    {artist.role && (
                      <p className="text-xs text-dark-300 capitalize">{artist.role}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Copyright */}
      {song.moreInfo?.copyrightText && (
        <p className="text-xs text-dark-400 mt-6">
          {cleanTitle(song.moreInfo.copyrightText)}
        </p>
      )}
    </div>
  );
};

export default SongDetails;
