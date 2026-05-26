import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "../store/playerStore";
import { useSettingsStore } from "../store/settingsStore";
import { fetchRecommendations } from "../services/autoplayEngine";

export const useAutoPlayQueue = () => {
  const { currentSong, queue, queueIndex, history, addToHistory } = usePlayerStore();
  const isFetchingRef = useRef(false);

  const getPrimaryArtistId = (song) => {
    if (song?.moreInfo?.artistMap?.primaryArtists?.length > 0) {
      return song.moreInfo.artistMap.primaryArtists[0].id;
    }
    return null;
  };

  // Function to dynamically refill the queue
  const refillQueue = useCallback(async () => {
    if (isFetchingRef.current || !currentSong) return;

    // Only refill if remaining songs < 5
    const remainingTracks = queue.length - 1 - queueIndex;
    if (remainingTracks >= 5) return;

    isFetchingRef.current = true;
    try {
      const recommendations = await fetchRecommendations(currentSong, history);

      if (recommendations && recommendations.length > 0) {
        // Bug 5 Fix: Double-check language on every song coming into the queue.
        // This is a final safety net in case a new API format slips past
        // the engine's filter (e.g. language field nested differently).
        const allowedLanguages = useSettingsStore.getState().languages;
        const existingIds = new Set(queue.map((s) => s.id));

        const newSongs = recommendations.filter((s) => {
          // Must not already be in queue
          if (existingIds.has(s.id)) return false;

          // If user has language preferences, enforce them here too
          if (allowedLanguages && allowedLanguages.length > 0) {
            const songLang = (s.language || "").toLowerCase().trim();
            // Reject songs with missing language metadata
            if (!songLang) return false;
            // Reject songs not in selected languages
            const langMatch = allowedLanguages.some(
              (l) => songLang.includes(l) || l.includes(songLang)
            );
            if (!langMatch) return false;
          }

          return true;
        });

        if (newSongs.length > 0) {
          usePlayerStore.setState({ queue: [...queue, ...newSongs] });
          console.log(
            `[autoplay] Refilled queue with ${newSongs.length} songs. ` +
            `Langs: ${[...new Set(newSongs.map((s) => s.language))].join(", ")}`
          );
        } else {
          // Bug 4 Fix: Pool returned songs but all were filtered out at this
          // second layer. Log a warning — the engine will try again on the
          // next queueIndex change with fresh discovery keywords.
          console.warn(
            "[autoplay] All recommendations filtered by language guard. " +
            "Discovery fallback will trigger on next refill cycle."
          );
        }
      } else {
        console.warn("[autoplay] fetchRecommendations returned empty — pool may be exhausted.");
      }
    } catch (err) {
      console.error("Failed to refill autoplay queue:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentSong, queue, queueIndex, history]);

  // Hook to track history on song change
  useEffect(() => {
    if (currentSong) {
      const artistId = getPrimaryArtistId(currentSong);
      addToHistory({
        songId: currentSong.id,
        artistId: artistId,
        language: currentSong.language || "unknown",
        timestamp: Date.now(),
      });
    }
  }, [currentSong?.id]); // Dep specifically on ID to avoid duplicate fires

  // Hook to trigger refill when queue gets small
  useEffect(() => {
    refillQueue();
  }, [queueIndex, queue.length, refillQueue]);

  return {
    refillQueue,
    refreshRecommendations: async () => {
      // Force dump the remainder of queue and refill based on current song
      if (!currentSong) return;
      const currentQueueState = usePlayerStore.getState();
      const trimmedQueue = currentQueueState.queue.slice(0, currentQueueState.queueIndex + 1);
      usePlayerStore.setState({ queue: trimmedQueue });
      await refillQueue();
    },
  };
};
