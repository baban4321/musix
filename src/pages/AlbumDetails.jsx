import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getAlbumDetails, getAlbumRecommendations, getSameYearAlbums } from "../services/api";
import { usePlayerStore } from "../store/playerStore";
import { HiPlay, HiPause, HiClock, HiCollection } from "react-icons/hi";
import Carousel from "../components/Carousel";
import SongCard from "../components/SongCard";

const AlbumDetails = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [sameYearAlbums, setSameYearAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong, setQueue, currentSong, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [albumData, recData] = await Promise.allSettled([
          getAlbumDetails(id),
          getAlbumRecommendations(id)
        ]);
        
        let fetchedAlbum = null;
        if (albumData.status === "fulfilled") {
          fetchedAlbum = albumData.value;
          setAlbum(fetchedAlbum);
        } else {
          console.error("Failed to fetch album:", albumData.reason);
        }

        if (recData.status === "fulfilled") {
          setRecommendations(recData.value || []);
        }

        // Fetch same-year albums if we have the year
        if (fetchedAlbum && fetchedAlbum.year) {
          try {
            const yearData = await getSameYearAlbums(fetchedAlbum.year);
            setSameYearAlbums(yearData || []);
          } catch (err) {
            console.error("Failed to fetch same year albums:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching album data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  };

  const getHighResImage = (url) => {
    if (!url) return "";
    return url.replace("150x150", "500x500").replace("50x50", "500x500");
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const s = parseInt(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const songs = album?.list || [];

  const getArtists = () => {
    return album?.moreInfo?.artistMap?.primaryArtists || [];
  };

  const handlePlayAll = async () => {
    if (songs.length === 0) return;
    // If currently playing a song from this album, toggle
    const isFromThisAlbum = songs.some((s) => s.id === currentSong?.id);
    if (isFromThisAlbum) {
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

  const totalDuration = songs.reduce((sum, s) => sum + (parseInt(s.moreInfo?.duration) || 0), 0);

  if (loading) {
    return (
      <div className="fade-in">
        <div className="flex flex-col md:flex-row gap-8 animate-pulse">
          <div className="w-full md:w-72 aspect-square rounded-2xl skeleton shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-3/4 rounded skeleton" />
            <div className="h-5 w-1/2 rounded skeleton" />
            <div className="h-12 w-40 rounded-full skeleton mt-6" />
          </div>
        </div>
        <div className="mt-10 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <div className="w-8 h-4 rounded skeleton" />
              <div className="w-12 h-12 rounded-lg skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded skeleton" />
                <div className="h-3 w-1/3 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-dark-300 text-lg">Album not found</p>
      </div>
    );
  }

  const isAlbumPlaying = songs.some((s) => s.id === currentSong?.id) && isPlaying;

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        {/* Blurred background */}
        <div className="absolute inset-0">
          <img
            src={getHighResImage(album.image)}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-150 opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 via-dark-900/80 to-dark-900" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-10">
          {/* Album art */}
          <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 mx-auto md:mx-0">
            <img
              src={getHighResImage(album.image)}
              alt={cleanTitle(album.title)}
              className="w-full h-full rounded-2xl object-cover shadow-2xl shadow-black/50"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-primary mb-2">
              Album
            </p>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-extrabold text-white mb-3 leading-tight">
              {cleanTitle(album.title)}
            </h1>

            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start text-sm text-dark-200 mb-2">
              {getArtists().map((artist, i) => (
                <span key={artist.id || i}>
                  <span className="text-white font-medium">{artist.name?.trim()}</span>
                  {i < getArtists().length - 1 && <span className="text-dark-400 ml-2">•</span>}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start text-xs text-dark-300 mb-6">
              {album.year && <span>{album.year}</span>}
              {songs.length > 0 && (
                <>
                  <span className="text-dark-500">•</span>
                  <span>{songs.length} {songs.length === 1 ? "song" : "songs"}</span>
                </>
              )}
              {totalDuration > 0 && (
                <>
                  <span className="text-dark-500">•</span>
                  <span>{Math.floor(totalDuration / 60)} min</span>
                </>
              )}
              {album.language && (
                <>
                  <span className="text-dark-500">•</span>
                  <span className="capitalize">{album.language}</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-accent-primary text-white font-semibold text-sm hover:bg-accent-glow transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent-primary/30"
                id="play-all-btn"
              >
                {isAlbumPlaying ? (
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
      {songs.length > 0 && (
        <div>
          {/* Header */}
          <div className="hidden md:flex items-center gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-dark-400 border-b border-dark-700/50 mb-2">
            <div className="w-8 text-center">#</div>
            <div className="w-12" />
            <div className="flex-1">Title</div>
            <div className="w-48">Artists</div>
            <div className="w-16 text-right flex items-center justify-end gap-1">
              <HiClock className="text-sm" />
            </div>
          </div>

          {/* Songs */}
          <div className="space-y-0.5">
            {songs.map((song, index) => {
              const isActive = currentSong?.id === song.id;
              const artists = song.moreInfo?.artistMap?.primaryArtists?.map((a) => a.name).join(", ")
                || song.moreInfo?.music
                || "";
              return (
                <button
                  key={song.id || index}
                  onClick={() => handlePlaySong(song, index)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left hover:bg-dark-600/50 group ${
                    isActive ? "bg-dark-600/40" : ""
                  }`}
                >
                  {/* Track # / Playing */}
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

                  {/* Image */}
                  <img
                    src={getHighResImage(song.image)}
                    alt={cleanTitle(song.title)}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-accent-primary" : "text-primary"}`}>
                      {cleanTitle(song.title)}
                    </p>
                    <p className="text-xs text-dark-300 truncate md:hidden">
                      {artists}
                    </p>
                  </div>

                  {/* Artists (desktop) */}
                  <div className="hidden md:block w-48">
                    <p className="text-xs text-dark-300 truncate">{artists}</p>
                  </div>

                  {/* Duration */}
                  <div className="w-16 text-right">
                    <span className="text-xs text-dark-400">
                      {formatDuration(song.moreInfo?.duration)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Albums */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <HiCollection className="text-white text-sm" />
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-primary">
              Recommended Albums
            </h2>
          </div>
          <Carousel>
            {recommendations.map((recAlbum) => (
              <SongCard key={recAlbum.id} song={recAlbum} />
            ))}
          </Carousel>
        </div>
      )}

      {/* Top Albums of {year} */}
      {sameYearAlbums && sameYearAlbums.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">#</span>
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-primary">
              Top Albums of {album.year}
            </h2>
          </div>
          <Carousel>
            {sameYearAlbums.map((ya) => (
              <SongCard key={ya.id} song={ya} />
            ))}
          </Carousel>
        </div>
      )}

      {/* Copyright */}
      {album.moreInfo?.copyrightText && (
        <p className="text-xs text-dark-400 mt-8">
          {cleanTitle(album.moreInfo.copyrightText)}
        </p>
      )}
    </div>
  );
};

export default AlbumDetails;
