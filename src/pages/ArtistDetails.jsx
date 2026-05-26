import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getArtistDetails, getArtistRecommendations } from "../services/api";
import { usePlayerStore } from "../store/playerStore";
import { HiPlay, HiPause, HiClock, HiSparkles } from "react-icons/hi";
import { RiAlbumFill, RiPlayListFill, RiUserStarFill } from "react-icons/ri";
import Carousel from "../components/Carousel";
import SongCard from "../components/SongCard";

const ArtistDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong, setQueue, currentSong, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        setLoading(true);
        const data = await getArtistDetails(id);
        setArtist(data);

        const topSongId = data?.topSongs?.[0]?.id;
        if (topSongId) {
          try {
            const recs = await getArtistRecommendations(id, topSongId);
            setRecommendations(recs || []);
          } catch (err) {
            console.error("Failed to fetch artist recommendations:", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch artist:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtist();
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

  const formatCount = (num) => {
    if (!num) return "";
    const n = parseInt(num);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
  };

  const topSongs = artist?.topSongs || [];
  const topAlbums = artist?.topAlbums || [];
  const dedicatedPlaylists = artist?.dedicatedArtistPlaylist || [];

  const handlePlayAll = async () => {
    if (topSongs.length === 0) return;
    const isFromThisArtist = topSongs.some((s) => s.id === currentSong?.id);
    if (isFromThisArtist) {
      togglePlay();
      return;
    }
    setQueue(topSongs, 0);
    await playSong(topSongs[0]);
  };

  const handlePlaySong = async (song, index) => {
    const isActive = currentSong?.id === song.id;
    if (isActive) {
      togglePlay();
      return;
    }
    setQueue(topSongs, index);
    await playSong(song);
  };

  const handleAlbumClick = (album) => {
    navigate(`/album/${album.id}`);
  };

  const handlePlaylistClick = (playlist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  const isArtistPlaying = topSongs.some((s) => s.id === currentSong?.id) && isPlaying;

  if (loading) {
    return (
      <div className="fade-in">
        <div className="flex flex-col md:flex-row gap-8 animate-pulse items-center md:items-end">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full skeleton shrink-0" />
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="h-4 w-24 rounded skeleton mx-auto md:mx-0" />
            <div className="h-10 w-3/4 rounded skeleton mx-auto md:mx-0" />
            <div className="h-5 w-1/2 rounded skeleton mx-auto md:mx-0" />
            <div className="h-12 w-40 rounded-full skeleton mt-6 mx-auto md:mx-0" />
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

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <RiUserStarFill className="text-6xl text-dark-500 mb-4" />
        <p className="text-dark-300 text-lg">Artist not found</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl mb-10">
        {/* Blurred background */}
        <div className="absolute inset-0">
          <img
            src={getHighResImage(artist.image)}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-150 opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 via-dark-900/80 to-dark-900" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 p-6 md:p-10">
          {/* Artist image (circular) */}
          <div className="w-48 h-48 md:w-64 md:h-64 shrink-0">
            <img
              src={getHighResImage(artist.image)}
              alt={cleanTitle(artist.name)}
              className="w-full h-full rounded-full object-cover shadow-2xl shadow-black/50 ring-4 ring-white/10"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end text-center md:text-left pb-2">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              {artist.isVerified && (
                <span className="text-blue-400 text-sm">✓ Verified</span>
              )}
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-primary">
                Artist
              </p>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-extrabold text-white mb-3 leading-tight">
              {cleanTitle(artist.name)}
            </h1>

            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start text-sm text-dark-200 mb-6">
              {artist.followerCount && (
                <span className="text-white/80">
                  <span className="font-semibold text-white">
                    {formatCount(artist.followerCount)}
                  </span>{" "}
                  followers
                </span>
              )}
              {artist.dominantLanguage && (
                <>
                  <span className="text-dark-500">•</span>
                  <span className="capitalize">{artist.dominantLanguage}</span>
                </>
              )}
              {artist.dominantType && (
                <>
                  <span className="text-dark-500">•</span>
                  <span className="capitalize">{artist.dominantType}</span>
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
                {isArtistPlaying ? (
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

      {/* Top Songs */}
      {topSongs.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-pink flex items-center justify-center">
              <HiPlay className="text-white text-sm" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary">Top Songs</h2>
          </div>

          {/* Header */}
          <div className="hidden md:flex items-center gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-dark-400 border-b border-dark-700/50 mb-2">
            <div className="w-8 text-center">#</div>
            <div className="w-12" />
            <div className="flex-1">Title</div>
            <div className="w-48">Album</div>
            <div className="w-16 text-right flex items-center justify-end gap-1">
              <HiClock className="text-sm" />
            </div>
          </div>

          {/* Songs */}
          <div className="space-y-0.5">
            {topSongs.map((song, index) => {
              const isActive = currentSong?.id === song.id;
              const artists =
                song.moreInfo?.artistMap?.primaryArtists?.map((a) => a.name).join(", ") ||
                song.moreInfo?.music ||
                "";
              const albumName = song.moreInfo?.album || "";
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

                  {/* Title + Artists */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-accent-primary" : "text-primary"}`}>
                      {cleanTitle(song.title)}
                    </p>
                    <p className="text-xs text-dark-300 truncate md:hidden">
                      {artists}
                    </p>
                  </div>

                  {/* Album (desktop) */}
                  <div className="hidden md:block w-48">
                    <p className="text-xs text-dark-300 truncate">{cleanTitle(albumName)}</p>
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
        </section>
      )}

      {/* Top Albums */}
      {topAlbums.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <RiAlbumFill className="text-white text-sm" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary">Top Albums</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {topAlbums.map((album) => (
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
                  {album.year && <span>{album.year}</span>}
                  {album.year && album.language && <span> · </span>}
                  {album.language && <span className="capitalize">{album.language}</span>}
                  {!album.year && !album.language && (album.subtitle || "Album")}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Dedicated Playlists */}
      {dedicatedPlaylists.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <RiPlayListFill className="text-white text-sm" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary">Featured Playlists</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {dedicatedPlaylists.map((pl) => (
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
                  {pl.subtitle || pl.moreInfo?.songCount ? `${pl.moreInfo?.songCount || ""} Songs` : "Playlist"}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Songs / Similars */}
      {recommendations && recommendations.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <HiSparkles className="text-white text-sm" />
            </div>
            <h2 className="text-xl font-display font-bold text-primary">Recommended Songs</h2>
          </div>
          <Carousel>
            {recommendations.map((rec) => (
              <SongCard key={rec.id} song={rec} songs={recommendations} />
            ))}
          </Carousel>
        </section>
      )}
    </div>
  );
};

export default ArtistDetails;
