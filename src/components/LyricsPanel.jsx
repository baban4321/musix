import { useState, useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "../store/playerStore";
import { getSyncedLyrics, getLrclibLyrics } from "../services/api";
import { HiX, HiMusicNote } from "react-icons/hi";

// Parse "[mm:ss.xx] text" lines into { time, text } objects
function parseSyncedLyrics(lrc) {
  if (!lrc) return [];
  const lines = lrc.split("\n");
  const parsed = [];

  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s?(.*)/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, "0"), 10);
      const time = mins * 60 + secs + ms / 1000;
      const text = match[4].trim();
      if (text) {
        parsed.push({ time, text });
      }
    }
  }
  return parsed;
}

const LyricsPanel = ({ isOpen, onClose }) => {
  const { currentSong, currentTime, duration } = usePlayerStore();
  const [lyrics, setLyrics] = useState([]);
  const [plainLyrics, setPlainLyrics] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const lyricsContainerRef = useRef(null);
  const lineRefs = useRef([]);

  // Fetch lyrics when song changes
  useEffect(() => {
    if (!currentSong?.id || !isOpen) return;

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      setLyrics([]);
      setPlainLyrics("");

      try {
        const songDuration = Math.round(
          duration || currentSong.moreInfo?.duration || 0
        );
        
        const cleanTitle = currentSong?.title?.replace(/&quot;/g, '"').replace(/&amp;/g, "&") || "";
        const artists = currentSong?.moreInfo?.artistMap?.primaryArtists?.map(a => a.name).join(", ") 
                        || currentSong?.moreInfo?.music 
                        || currentSong?.subtitle?.split(" - ")[0] 
                        || "";
        const album = currentSong?.moreInfo?.album?.replace(/&quot;/g, '"').replace(/&amp;/g, "&") || "";

        let data = null;

        // 1. Try LRCLIB
        try {
           const lrclibData = await getLrclibLyrics(cleanTitle, artists, album, songDuration);
           if (lrclibData && (lrclibData.syncedLyrics || lrclibData.plainLyrics)) {
               data = lrclibData;
           }
        } catch(e) {
           console.error("Failed to get LRCLIB lyrics", e);
        }

        // 2. Fallback to Saavn
        if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
           try {
             const saavnData = await getSyncedLyrics(currentSong.id, songDuration);
             if (saavnData) data = saavnData;
           } catch(err) {
             console.error("Failed to get Saavn lyrics", err);
           }
        }

        if (data?.syncedLyrics) {
          const parsed = parseSyncedLyrics(data.syncedLyrics);
          setLyrics(parsed);
        } else if (data?.plainLyrics) {
          setPlainLyrics(data.plainLyrics);
        } else {
          setError("No lyrics available for this song");
        }
      } catch (err) {
        console.error("Failed to fetch lyrics:", err);
        setError("Lyrics not found");
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [currentSong?.id, isOpen, duration]);

  // Track active lyric line based on current playback time
  useEffect(() => {
    if (lyrics.length === 0) return;

    let idx = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        idx = i;
        break;
      }
    }
    setActiveIndex(idx);
  }, [currentTime, lyrics]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeIndex < 0 || !lineRefs.current[activeIndex]) return;

    lineRefs.current[activeIndex].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeIndex]);

  const handleLineClick = useCallback(
    (time) => {
      const { seekTo } = usePlayerStore.getState();
      seekTo(time);
    },
    []
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-[73px] w-full sm:w-[420px] bg-dark-900/95 backdrop-blur-xl z-[201] flex flex-col border-l border-dark-700/30 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-pink flex items-center justify-center">
              <HiMusicNote className="text-white text-sm" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Lyrics</h3>
              <p className="text-[11px] text-dark-300 truncate max-w-[250px]">
                {currentSong?.title?.replace(/&quot;/g, '"').replace(/&amp;/g, "&") || ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
          >
            <HiX className="text-lg" />
          </button>
        </div>

        {/* Lyrics body */}
        <div
          ref={lyricsContainerRef}
          className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar"
        >
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-dark-300 text-sm">Fetching lyrics...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-dark-700/50 flex items-center justify-center">
                <HiMusicNote className="text-dark-400 text-2xl" />
              </div>
              <p className="text-dark-300 text-sm">{error}</p>
            </div>
          )}

          {/* Synced lyrics */}
          {!loading && !error && lyrics.length > 0 && (
            <div className="space-y-1 pb-20">
              {lyrics.map((line, i) => (
                <button
                  key={i}
                  ref={(el) => (lineRefs.current[i] = el)}
                  onClick={() => handleLineClick(line.time)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    i === activeIndex
                      ? "text-primary text-lg font-bold scale-[1.02] bg-accent-primary/10"
                      : i < activeIndex
                      ? "text-dark-400 text-base font-medium"
                      : "text-dark-300 text-base font-medium hover:text-dark-100"
                  }`}
                >
                  {line.text}
                </button>
              ))}
            </div>
          )}

          {/* Plain lyrics fallback */}
          {!loading && !error && lyrics.length === 0 && plainLyrics && (
            <div className="whitespace-pre-wrap text-sm text-dark-200 leading-relaxed font-medium">
              {plainLyrics}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LyricsPanel;
