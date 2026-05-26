import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore";

function getHighResImage(url) {
  if (!url) return "";
  return url.replace("50x50", "500x500").replace("150x150", "500x500");
}

function extractArtistName(song) {
  if (!song) return "";
  const artists = song.moreInfo?.artistMap?.primaryArtists;
  if (artists?.length > 0) return artists.map((a) => a.name).join(", ");
  if (song.subtitle) return song.subtitle.split(" - ")[0];
  return "Unknown Artist";
}

function cleanTitle(title) {
  if (!title) return "";
  return title.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

export function useMediaSession() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextSong = usePlayerStore((s) => s.nextSong);
  const prevSong = usePlayerStore((s) => s.prevSong);
  const seekTo = usePlayerStore((s) => s.seekTo);

  // Update metadata when song changes
  useEffect(() => {
    if (!currentSong || !("mediaSession" in navigator)) return;

    const artworkUrl = getHighResImage(
      typeof currentSong.image === "string"
        ? currentSong.image
        : Array.isArray(currentSong.image)
        ? currentSong.image[currentSong.image.length - 1]?.link
        : ""
    );

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: cleanTitle(currentSong.title) || "Unknown Title",
        artist: extractArtistName(currentSong),
        album: currentSong.album || currentSong.moreInfo?.album || "",
        artwork: artworkUrl
          ? [
              { src: artworkUrl, sizes: "500x500", type: "image/jpeg" },
              { src: artworkUrl, sizes: "256x256", type: "image/jpeg" },
            ]
          : [],
      });
    } catch (e) {
      console.warn("MediaSession metadata error:", e);
    }
  }, [currentSong]);

  // Update playback state
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying
        ? "playing"
        : "paused";
    } catch (e) {
      // Not all browsers support playbackState
    }
  }, [isPlaying]);

  // Update position state
  useEffect(() => {
    if (!("mediaSession" in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: currentTime,
      });
    } catch (e) {
      // Not all browsers support setPositionState
    }
  }, [currentTime, duration]);

  // Register action handlers (only once)
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const actions = [
      ["play", () => togglePlay()],
      ["pause", () => togglePlay()],
      ["nexttrack", () => nextSong()],
      ["previoustrack", () => prevSong()],
      [
        "seekbackward",
        (details) => {
          const skip = details.seekOffset || 10;
          seekTo(Math.max(0, usePlayerStore.getState().currentTime - skip));
        },
      ],
      [
        "seekforward",
        (details) => {
          const skip = details.seekOffset || 10;
          seekTo(
            Math.min(
              usePlayerStore.getState().duration,
              usePlayerStore.getState().currentTime + skip
            )
          );
        },
      ],
      [
        "seekto",
        (details) => {
          if (details.seekTime != null) {
            seekTo(details.seekTime);
          }
        },
      ],
    ];

    actions.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        console.warn(`MediaSession action ${action} not supported:`, e);
      }
    });

    return () => {
      actions.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {}
      });
    };
  }, [togglePlay, nextSong, prevSong, seekTo]);
}
