import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../store/playerStore";
import { HiPlay } from "react-icons/hi";
import { motion } from "framer-motion";

const SongCard = ({ song, index, songs }) => {
  const navigate = useNavigate();
  const { playSong, setQueue, currentSong, isPlaying } = usePlayerStore();

  if (!song) return null;

  const isCurrentSong = currentSong?.id === song.id;

  const getHighResImage = (url) => {
    if (!url) return "https://via.placeholder.com/300x300?text=♫";
    return url.replace("150x150", "500x500").replace("50x50", "500x500");
  };

  const getArtist = () => {
    if (song.moreInfo?.artistMap?.primaryArtists?.length > 0) {
      return song.moreInfo.artistMap.primaryArtists.map((a) => a.name).join(", ");
    }
    if (song.moreInfo?.music) return song.moreInfo.music;
    if (song.subtitle) return song.subtitle.split(" - ")[0];
    return "Unknown Artist";
  };

  const handleClick = async () => {
    // Navigate to detail pages for albums and playlists
    if (song.type === "album") {
      navigate(`/album/${song.id}`);
      return;
    }
    if (song.type === "playlist") {
      navigate(`/playlist/${song.id}`);
      return;
    }

    if (song.type === "show") {
      const permaUrl = song.url || song.permaUrl;
      const token = permaUrl ? permaUrl.split("/").pop() : song.id;
      navigate(`/show/${token}`);
      return;
    }

    // Play the song or episode
    if (songs && songs.length > 0) {
      const songItems = songs.filter((s) => s.type === "song" || s.type === "episode");
      const songIndex = songItems.findIndex((s) => s.id === song.id);
      if (songIndex !== -1) {
        setQueue(songItems, songIndex);
      }
    }
    await playSong(song);
  };

  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  };

  const formatCount = (val) => {
    if (!val) return "";
    const str = String(val).replace(/,/g, "");
    const n = parseInt(str);
    if (isNaN(n)) return val;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
  };

  const getSubtitle = () => {
    if (song.type === "album") {
      const count = song.moreInfo?.songCount;
      const artist = song.moreInfo?.artistMap?.artists?.[0]?.name || "";
      return count ? `Album • ${count} songs` : artist ? `Album • ${artist}` : "Album";
    }
    if (song.type === "playlist") {
      const fans = song.moreInfo?.fanCount || song.moreInfo?.followerCount;
      return fans ? `${formatCount(fans)} Fans` : "Playlist";
    }
    if (song.type === "show") {
      return "Podcast";
    }
    if (song.type === "episode") {
      return "Episode";
    }
    return getArtist();
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative cursor-pointer rounded-2xl p-3 transition-all duration-300 w-[150px] min-w-[150px] max-w-[150px] sm:w-[170px] sm:min-w-[170px] sm:max-w-[170px] shrink-0 border text-left ${
        isCurrentSong 
          ? "border-accent-primary bg-accent-primary/10 shadow-[0_8px_30px_rgba(139,92,246,0.15)]" 
          : "border-white/5 bg-white/5 hover:bg-white/10"
      }`}
      id={`song-card-${song.id}`}
    >
      {/* Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg transition-shadow">
        <img
          src={getHighResImage(song.imageFileUrl || song.squareImageUrl || song.image)}
          alt={cleanTitle(song.title)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <button 
             className="w-12 h-12 rounded-full bg-accent-primary text-white shadow-2xl flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-accent-primary/45 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isCurrentSong && isPlaying ? (
              <div className="flex items-end gap-1 h-3">
                <div className="w-[3px] bg-white rounded-full eq-bar-1"></div>
                <div className="w-[3px] bg-white rounded-full eq-bar-2"></div>
                <div className="w-[3px] bg-white rounded-full eq-bar-3"></div>
              </div>
            ) : (
              <HiPlay className="text-2xl ml-0.5 text-white" />
            )}
          </button>
        </div>

        {/* Currently playing indicator */}
        {isCurrentSong && !isPlaying && (
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-accent-primary animate-pulse shadow-[0_0_10px_#8b5cf6]" />
        )}

        {/* Type badge */}
        {(song.type === "album" || song.type === "playlist" || song.type === "show") && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white font-display">
              {song.type === "show" ? "Podcast" : song.type}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className={`text-[13px] font-bold truncate leading-tight tracking-wide font-display ${isCurrentSong ? "text-accent-primary" : "text-white"}`}>
        {cleanTitle(song.title)}
      </h3>

      {/* Artist / subtitle */}
      <p className="text-[11px] text-white/40 truncate mt-1.5 font-medium tracking-wide">
        {getSubtitle()}
      </p>
    </motion.div>
  );
};

export default SongCard;
