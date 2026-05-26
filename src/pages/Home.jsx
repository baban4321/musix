import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getModules, searchPodcasts } from "../services/api";
import SongCard from "../components/SongCard";
import Carousel from "../components/Carousel";
import { HiPlay, HiChevronLeft, HiChevronRight, HiChevronDown } from "react-icons/hi";
import { usePlayerStore } from "../store/playerStore";
import { useSettingsStore } from "../store/settingsStore";
import { motion as Motion, AnimatePresence } from "framer-motion";

/* Quick Pick Grid Card (Spotify-style) */
const QuickPickCard = ({ item }) => {
  const navigate = useNavigate();
  const { playSong } = usePlayerStore();

  const getHighResImage = (url) => {
    if (!url) return "https://via.placeholder.com/300x300?text=Music";
    return url.replace("150x150", "500x500").replace("50x50", "500x500");
  };

  const image =
    typeof item.image === "string"
      ? item.image
      : Array.isArray(item.image)
        ? item.image[item.image.length - 1]?.link || ""
        : item.imageFileUrl || item.squareImageUrl || "";

  const handleClick = () => {
    if (item.type === "album") return navigate(`/album/${item.id}`);
    if (item.type === "playlist") return navigate(`/playlist/${item.id}`);
    if (item.type === "artist") return navigate(`/artist/${item.id}`);
    playSong(item);
  };

  return (
    <Motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group flex items-center rounded-xl overflow-hidden glass-card h-[60px] sm:h-[72px] cursor-pointer w-full text-left relative pr-12"
    >
      <img
        src={getHighResImage(image)}
        alt=""
        className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] object-cover shrink-0 rounded-l-xl transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="px-4 py-2 flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-bold text-white truncate font-display mb-0.5">
          {item.title?.replace(/&quot;/g, '"')?.replace(/&amp;/g, "&")}
        </p>
        <p className="text-[10px] text-white/50 truncate font-semibold uppercase tracking-wider">
          {item.type || "song"}
        </p>
      </div>
      <div className="absolute right-3 w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-accent-primary/45 scale-75 group-hover:scale-100">
        <HiPlay className="text-white text-lg ml-0.5" />
      </div>
    </Motion.button>
  );
};

/* Featured Carousel Banner (auto-sliding premium layout) */
const FeaturedCarousel = ({ items, allItems }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { playSong, setQueue } = usePlayerStore();

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  const item = items[currentIndex];

  const getHighResImage = (url) => {
    if (!url) return "";
    return url.replace("150x150", "500x500").replace("50x50", "500x500");
  };

  const image =
    typeof item.image === "string"
      ? item.image
      : Array.isArray(item.image)
        ? item.image[item.image.length - 1]?.link || ""
        : item.imageFileUrl || item.squareImageUrl || "";

  const artist =
    item.moreInfo?.artistMap?.primaryArtists
      ?.map((a) => a.name)
      .join(", ") ||
    item.subtitle?.split(" - ")[0] ||
    item.moreInfo?.primaryArtists ||
    "";

  const handlePlay = () => {
    if (item.type === "album") return navigate(`/album/${item.id}`);
    if (item.type === "playlist") return navigate(`/playlist/${item.id}`);
    const songs = (allItems || []).filter(
      (s) => s.type === "song" || s.type === "episode"
    );
    if (songs.length > 0) {
      const idx = songs.findIndex((s) => s.id === item.id);
      setQueue(songs, idx >= 0 ? idx : 0);
    }
    playSong(item);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden group cursor-pointer shadow-2xl border border-white/5 bg-dark-800/20 dark:bg-dark-800/40">
      {/* Background artwork */}
      <AnimatePresence mode="wait">
        <Motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 blur-[80px] scale-125 pointer-events-none"
          style={{
            backgroundImage: `url(${getHighResImage(image)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/60 to-transparent" />

      {/* Manual buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-primary hover:scale-105 active:scale-95 cursor-pointer"
      >
        <HiChevronLeft className="text-xl" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-primary hover:scale-105 active:scale-95 cursor-pointer"
      >
        <HiChevronRight className="text-xl" />
      </button>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-10 min-h-[220px] md:min-h-[280px]">
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
          <span className="self-start text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-white bg-accent-primary px-3 py-1 rounded-full mb-3 shadow-[0_0_12px_rgba(139,92,246,0.5)]">
            Featured Spotlight
          </span>
          <AnimatePresence mode="wait">
            <Motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-black text-white leading-tight mb-2 tracking-tight">
                {item.title?.replace(/&quot;/g, '"')?.replace(/&amp;/g, "&")}
              </h2>
              <p className="text-sm sm:text-base text-white/60 font-medium truncate mb-6 max-w-lg">
                {artist || item.moreInfo?.music || "Listen now"}
              </p>
            </Motion.div>
          </AnimatePresence>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              className="px-6 py-3 bg-accent-primary hover:bg-accent-glow text-white text-sm font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent-primary/40 flex items-center gap-2 cursor-pointer"
            >
              <HiPlay className="text-lg" /> Play Now
            </button>
            {item.type !== "song" && (
              <button
                onClick={() => {
                  if (item.type === "album") navigate(`/album/${item.id}`);
                  if (item.type === "playlist") navigate(`/playlist/${item.id}`);
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-full transition-all border border-white/10 cursor-pointer"
              >
                View Details
              </button>
            )}
          </div>
        </div>

        {/* Big album art */}
        <AnimatePresence mode="wait">
          <Motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
            transition={{ duration: 0.4 }}
            onClick={handlePlay}
            className="relative shrink-0 w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 self-center md:self-auto group-hover:scale-102 transition-transform cursor-pointer"
          >
            <img
              src={getHighResImage(image)}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                <HiPlay className="text-black text-2xl ml-0.5" />
              </div>
            </div>
          </Motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              currentIndex === i ? "w-6 bg-accent-primary" : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/* Large Card (for New Releases / Top Albums rows) */
const LargeCard = ({ song, songs }) => {
  const navigate = useNavigate();
  const { playSong, setQueue, currentSong, isPlaying } = usePlayerStore();

  const getHighResImage = (url) => {
    if (!url) return "https://via.placeholder.com/300x300?text=Music";
    return url.replace("150x150", "500x500").replace("50x50", "500x500");
  };

  const image =
    typeof song.image === "string"
      ? song.image
      : Array.isArray(song.image)
        ? song.image[song.image.length - 1]?.link || ""
        : song.imageFileUrl || song.squareImageUrl || "";

  const isCurrentSong = currentSong?.id === song.id;

  const getSubtitle = () => {
    if (song.type === "album") {
      return (
        song.moreInfo?.artistMap?.artists?.[0]?.name ||
        song.moreInfo?.music ||
        "Album"
      );
    }
    return (
      song.moreInfo?.artistMap?.primaryArtists
        ?.map((a) => a.name)
        .join(", ") ||
      song.moreInfo?.primaryArtists ||
      song.moreInfo?.music ||
      "Song"
    );
  };

  const handleClick = () => {
    if (song.type === "album") return navigate(`/album/${song.id}`);
    if (song.type === "playlist") return navigate(`/playlist/${song.id}`);
    if (songs && songs.length > 0) {
      const songItems = songs.filter(
        (s) => s.type === "song" || s.type === "episode"
      );
      const idx = songItems.findIndex((s) => s.id === song.id);
      if (idx !== -1) setQueue(songItems, idx);
    }
    playSong(song);
  };

  return (
    <Motion.div
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="group cursor-pointer shrink-0 w-[150px] sm:w-[170px] text-left"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-lg border border-white/5 bg-dark-800/10">
        <img
          src={getHighResImage(image)}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <div
            className={`w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl transition-all duration-300 ${isCurrentSong && isPlaying ? "opacity-100 scale-100" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"}`}
          >
            {isCurrentSong && isPlaying ? (
              <div className="flex items-end gap-[2px] h-3">
                <div className="w-[3px] bg-black rounded-full eq-bar-1" />
                <div className="w-[3px] bg-black rounded-full eq-bar-2" />
                <div className="w-[3px] bg-black rounded-full eq-bar-3" />
              </div>
            ) : (
              <HiPlay className="text-lg ml-0.5" />
            )}
          </div>
        </div>
        {isCurrentSong && (
          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-accent-primary animate-pulse shadow-[0_0_8px_#8b5cf6]" />
        )}
      </div>
      <h3
        className={`text-[13px] font-bold truncate font-display ${isCurrentSong ? "text-accent-primary" : "text-white"}`}
      >
        {song.title?.replace(/&quot;/g, '"')?.replace(/&amp;/g, "&")}
      </h3>
      <p className="text-[11px] text-white/40 truncate mt-0.5 font-medium">{getSubtitle()}</p>
    </Motion.div>
  );
};

/* Section Header */
const SectionHeader = ({ title, subtitle, count }) => (
  <div className="flex items-end justify-between mb-5">
    <div className="text-left">
      <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-white/40 mt-1 font-medium">{subtitle}</p>
      )}
    </div>
    {count > 0 && (
      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest hidden sm:block">
        {count} items
      </span>
    )}
  </div>
);

/* Skeletons */
const LargeSkeleton = () => (
  <div className="shrink-0 w-[150px] sm:w-[170px]">
    <div className="aspect-square rounded-2xl skeleton mb-3 opacity-20" />
    <div className="h-3 w-3/4 rounded skeleton mb-2 opacity-20" />
    <div className="h-2 w-1/2 rounded skeleton opacity-15" />
  </div>
);

const QuickPickSkeleton = () => (
  <div className="flex items-center rounded-xl bg-white/5 h-[60px] sm:h-[72px] w-full overflow-hidden">
    <div className="w-[60px] sm:w-[72px] h-full skeleton opacity-20 rounded-l-xl shrink-0" />
    <div className="h-3 w-24 rounded skeleton ml-4 opacity-20" />
  </div>
);

/* HOME PAGE */
const Home = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [podcasts, setPodcasts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const globalLanguages = useSettingsStore((state) => state.languages);

  const categories = ["All", "Trending", "New Releases", "Albums", "Podcasts"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getModules();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch modules:", err);
        setError("Failed to load content. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [globalLanguages]);

  useEffect(() => {
    const fetchPods = async () => {
      try {
        const query = globalLanguages?.[0] || "telugu";
        const pods = await searchPodcasts(query, 1, 20);
        if (pods && pods.results) setPodcasts(pods.results);
      } catch (err) {
        console.error("Failed to fetch podcasts:", err);
      }
    };
    fetchPods();
  }, [globalLanguages]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-3xl">😢</span>
        </div>
        <h2 className="text-xl font-display font-bold text-white mb-2">Oops!</h2>
        <p className="text-dark-300 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full bg-accent-primary text-white text-sm font-medium hover:bg-accent-glow transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Extract data
  const allTrending = data?.newTrending || [];
  const newSongs = data?.newAlbums?.filter((item) => item.type === "song") || [];
  const newAlbums = data?.newAlbums?.filter((item) => item.type === "album") || [];
  const topPlaylists = data?.topPlaylists || [];
  const charts = data?.charts || [];
  const trendingAlbums =
    data?.newTrending?.filter((item) => item.type === "album") || [];

  // Slide items (top 6 trending)
  const featuredSlides = allTrending.slice(0, 6);

  // Quick picks: 8 items for desktop grid
  const quickPicks = allTrending.slice(0, 8);

  const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const showSection = (cat) => {
    if (activeCategory === "All") return true;
    if (activeCategory === "Trending" && (cat === "trending" || cat === "charts")) return true;
    if (activeCategory === "New Releases" && cat === "new") return true;
    if (activeCategory === "Albums" && cat === "albums") return true;
    if (activeCategory === "Podcasts" && cat === "podcasts") return true;
    return false;
  };

  return (
    <div className="relative space-y-10 pb-4">
      {/* Ambient glowing gradient behind the banner */}
      <div className="absolute top-[-120px] left-0 right-0 h-[480px] premium-mesh-glow pointer-events-none z-0" />

      {/* ═══════ Greeting & Search Filters ═══════ */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight mb-1">
            {getTimeGreeting()}
          </h1>
          <p className="text-sm text-white/55 font-medium">Discover your personalized soundtrack</p>
        </div>

        {/* Category Pills Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border cursor-pointer ${
                activeCategory === cat
                  ? "bg-accent-primary border-accent-primary text-white shadow-lg shadow-accent-primary/25"
                  : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat}
            </Motion.button>
          ))}
        </div>
      </div>

      {/* ═══════ Quick Picks Grid ═══════ */}
      {showSection("trending") && (
        <div className="relative z-10 space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <QuickPickSkeleton key={i} />
              ))}
            </div>
          ) : quickPicks.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickPicks.map((item, i) => (
                <QuickPickCard key={item.id || i} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* ═══════ Featured Spotlight Carousel ═══════ */}
      {activeCategory === "All" && (
        <div className="relative z-10">
          {loading ? (
            <div className="rounded-3xl bg-white/5 h-[220px] md:h-[280px] skeleton opacity-10" />
          ) : featuredSlides.length > 0 ? (
            <FeaturedCarousel items={featuredSlides} allItems={allTrending} />
          ) : null}
        </div>
      )}

      {/* ═══════ Trending Now ═══════ */}
      {showSection("trending") && (loading || allTrending.length > 0) && (
        <section className="relative z-10">
          <SectionHeader title="Trending Now" subtitle="Most played tracks today" count={allTrending.length} />
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <LargeSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Carousel rows={1}>
              {allTrending.map((item) => (
                <SongCard key={item.id} song={item} songs={allTrending} />
              ))}
            </Carousel>
          )}
        </section>
      )}

      {/* ═══════ New Releases ═══════ */}
      {showSection("new") && (loading || newSongs.length > 0) && (
        <section className="relative z-10">
          <SectionHeader title="New Releases" subtitle="Fresh music, hot off the press" />
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <LargeSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Carousel rows={1}>
              {newSongs.map((song) => (
                <LargeCard key={song.id} song={song} songs={newSongs} />
              ))}
            </Carousel>
          )}
        </section>
      )}

      {/* ═══════ Top Albums ═══════ */}
      {showSection("albums") && (loading || newAlbums.length > 0) && (
        <section className="relative z-10">
          <SectionHeader title="Top Albums" subtitle="Top charting record lists" />
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <LargeSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Carousel rows={1}>
              {newAlbums.map((album) => (
                <LargeCard key={album.id} song={album} />
              ))}
            </Carousel>
          )}
        </section>
      )}

      {/* ═══════ Charts ═══════ */}
      {showSection("charts") && (loading || charts.length > 0) && (
        <section className="relative z-10">
          <SectionHeader title="Charts" subtitle="Top songs in your region" />
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <LargeSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Carousel rows={1}>
              {charts.map((chart) => (
                <SongCard key={chart.id} song={chart} />
              ))}
            </Carousel>
          )}
        </section>
      )}

      {/* ═══════ Popular Playlists ═══════ */}
      {showSection("trending") && (loading || topPlaylists.length > 0) && (
        <section className="relative z-10">
          <SectionHeader title="Popular Playlists" subtitle="Curated collections for every mood" />
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <LargeSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Carousel rows={1}>
              {topPlaylists.map((pl) => (
                <SongCard key={pl.id} song={pl} />
              ))}
            </Carousel>
          )}
        </section>
      )}

      {/* ═══════ Trending Albums ═══════ */}
      {showSection("albums") && (loading || trendingAlbums.length > 0) && (
        <section className="relative z-10">
          <SectionHeader title="Trending Albums" subtitle="Albums everyone's spinning" />
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <LargeSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Carousel rows={1}>
              {trendingAlbums.map((album) => (
                <LargeCard key={album.id} song={album} />
              ))}
            </Carousel>
          )}
        </section>
      )}

      {/* ═══════ Podcasts ═══════ */}
      {showSection("podcasts") && (loading || podcasts.length > 0) && (
        <section className="relative z-10">
          <SectionHeader title="Podcasts" subtitle="Expand your horizon with leading shows" />
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <LargeSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Carousel rows={1}>
              {podcasts.map((pod) => (
                <SongCard key={pod.id} song={pod} />
              ))}
            </Carousel>
          )}
        </section>
      )}
    </div>
  );
};

export default Home;
