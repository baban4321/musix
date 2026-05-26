import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getShowDetails } from "../services/api";
import { usePlayerStore } from "../store/playerStore";
import { HiPlay, HiPause, HiClock, HiMicrophone } from "react-icons/hi";

const ShowDetails = () => {
  const { token } = useParams();
  const [show, setShow] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong, setQueue, currentSong, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getShowDetails(token);
        
        if (data && data.showDetails) {
          setShow(data.showDetails);
          setEpisodes(data.episodes || []);
        } else if (data && data.show_details) {
          setShow(data.show_details);
          setEpisodes(data.episodes || []);
        } else {
          console.error("Failed to fetch show details:", data);
        }
      } catch (err) {
        console.error("Error fetching show data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

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

  const getShowImage = () => {
    if (show?.imageFileUrl) return getHighResImage(show.imageFileUrl);
    if (show?.squareImageUrl) return getHighResImage(show.squareImageUrl);
    if (show?.image && Array.isArray(show.image)) {
      return getHighResImage(show.image[show.image.length - 1].link || show.image[0].link);
    }
    return getHighResImage(show?.image);
  };

  const handlePlayAll = async () => {
    if (episodes.length === 0) return;
    const isFromThisShow = episodes.some((s) => s.id === currentSong?.id);
    if (isFromThisShow) {
      togglePlay();
      return;
    }
    setQueue(episodes, 0);
    await playSong(episodes[0]);
  };

  const handlePlayEpisode = async (episode, index) => {
    const isActive = currentSong?.id === episode.id;
    if (isActive) {
      togglePlay();
      return;
    }
    setQueue(episodes, index);
    await playSong(episode);
  };

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

  if (!show) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-dark-300 text-lg">Podcast Show not found</p>
      </div>
    );
  }

  const isShowPlaying = episodes.some((s) => s.id === currentSong?.id) && isPlaying;

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        {/* Blurred background */}
        <div className="absolute inset-0">
          <img
            src={getShowImage()}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-150 opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 via-dark-900/80 to-dark-900" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-10">
          {/* Cover art */}
          <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 mx-auto md:mx-0">
            <img
              src={getShowImage()}
              alt={cleanTitle(show.name || show.title)}
              className="w-full h-full rounded-2xl object-cover shadow-2xl shadow-black/50"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2 flex items-center justify-center md:justify-start gap-2">
               <HiMicrophone className="text-sm" /> Podcast Show
            </p>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-extrabold text-white mb-3 leading-tight">
              {cleanTitle(show.name || show.title)}
            </h1>
            
            <p className="text-sm text-dark-200 mb-4 line-clamp-3">
               {cleanTitle(show.description || show.subtitle)}
            </p>

            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start text-xs text-dark-300 mb-6 font-medium">
              {show.year && <span>{show.year}</span>}
              {show.language && (
                <>
                  <span className="text-dark-500">•</span>
                  <span className="capitalize">{show.language}</span>
                </>
              )}
              {episodes.length > 0 && (
                <>
                  <span className="text-dark-500">•</span>
                  <span>{episodes.length} {episodes.length === 1 ? "episode" : "episodes"}</span>
                </>
              )}
              {show.labelName || show.label && (
                <>
                  <span className="text-dark-500">•</span>
                  <span>{show.labelName || show.label || show.partnerName}</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
                id="play-all-btn"
              >
                {isShowPlaying ? (
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

      {/* Episodes list */}
      {episodes.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl md:text-2xl font-display font-bold text-primary mb-6 pl-2 border-l-4 border-indigo-500">
             All Episodes
          </h2>
          
          <div className="space-y-2">
            {episodes.map((episode, index) => {
              const isActive = currentSong?.id === episode.id;
              
              const epImage = episode.imageFileUrl || episode.squareImageUrl || (episode.image && Array.isArray(episode.image) 
                ? episode.image[episode.image.length - 1].link 
                : episode.image);

              return (
                <button
                  key={episode.id || index}
                  onClick={() => handlePlayEpisode(episode, index)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left hover:bg-dark-700/50 group border border-transparent hover:border-dark-600/50 ${
                    isActive ? "bg-dark-700/80 border-indigo-500/30" : "bg-dark-800/30"
                  }`}
                >
                  {/* Track # / Playing */}
                  <div className="w-8 text-center shrink-0">
                    {isActive && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-4 justify-center">
                        <div className="w-[3px] bg-indigo-400 rounded-full eq-bar-1"></div>
                        <div className="w-[3px] bg-indigo-400 rounded-full eq-bar-2"></div>
                        <div className="w-[3px] bg-indigo-400 rounded-full eq-bar-3"></div>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-dark-400 group-hover:hidden">{index + 1}</span>
                        <HiPlay className="text-white text-lg hidden group-hover:block mx-auto" />
                      </>
                    )}
                  </div>

                  {/* Image */}
                  <img
                    src={getHighResImage(epImage)}
                    alt={cleanTitle(episode.title || episode.name)}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 shadow-md"
                    loading="lazy"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`text-base font-semibold truncate mb-1 ${isActive ? "text-indigo-400" : "text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"}`}>
                      {cleanTitle(episode.title || episode.name)}
                    </p>
                    <p className="text-xs text-dark-300 line-clamp-2 md:line-clamp-1 leading-relaxed">
                      {cleanTitle(episode.description || episode.header_desc || "")}
                    </p>
                    {episode.releaseDate || episode.release_date && (
                         <p className="text-[10px] text-dark-400 mt-2 uppercase tracking-wide">
                            {new Date(episode.releaseDate || episode.release_date).toLocaleDateString()}
                         </p>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="w-16 text-right shrink-0">
                    <span className="text-xs font-medium text-dark-400 bg-dark-900/50 px-2 py-1 rounded-md">
                      {formatDuration(episode.duration)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowDetails;
