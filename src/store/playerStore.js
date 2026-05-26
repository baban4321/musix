import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSongDetails } from "../services/api";
import { getBestAudioUrl } from "../utils/decrypt";
import { useAuthStore } from "./authStore";

function extractImageUrl(song) {
  if (!song) return "";
  const img = song.image;
  // Handle array of image objects (JioSaavn format)
  if (Array.isArray(img)) {
    const best = img[img.length - 1];
    return best?.link || best?.url || "";
  }
  // Handle direct string URL
  if (typeof img === "string" && img) return img;
  // Fallback fields
  return song.imageFileUrl || song.squareImageUrl || "";
}

function extractSongTitle(song) {
  if (!song) return "";
  return song.title || song.name || song.header_desc || "";
}

function extractArtist(song) {
  if (!song) return "";
  // Try primaryArtists from artistMap
  const artists = song.moreInfo?.artistMap?.primaryArtists;
  if (artists?.length > 0) return artists.map(a => a.name).join(", ");
  // Try subtitle (common in search results)
  if (song.subtitle) return song.subtitle.split(" - ")[0];
  // Try moreInfo fields
  if (song.moreInfo?.primaryArtists) return song.moreInfo.primaryArtists;
  if (song.moreInfo?.music) return song.moreInfo.music;
  if (song.moreInfo?.singers) return song.moreInfo.singers;
  return "";
}

function extractAudioUrl(song) {
  // If episode, it has direct download_url
  if (song?.type === "episode") {
    const directUrl = song.downloadUrl || song.download_url;
    if (directUrl) return directUrl;
  }
  if (!song?.moreInfo) return "";
  // Use encryptedMediaUrl (proven to work with DES key)
  const encrypted = song.moreInfo.encryptedMediaUrl || song.moreInfo.encrypted_media_url || song.more_info?.encrypted_media_url;
  if (encrypted) {
    const url = getBestAudioUrl(encrypted);
    if (url) return url;
  }
  return "";
}

// Shuffle an array (Fisher-Yates) excluding the first element (current song)
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 1; i--) {
    const j = 1 + Math.floor(Math.random() * i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      currentSong: null,
      audioUrl: null,
      isPlaying: false,
      isLoading: false,
      error: null,
      duration: 0,
      currentTime: 0,
      volume: 0.8,
      queue: [],
      queueIndex: -1,
      history: [],
      isExpandedPlayer: false,
      audioRef: null,
      preloadedAudio: null,

      // Repeat & Shuffle
      repeat: "off", // "off" | "all" | "one"
      shuffle: false,
      originalQueue: [], // store original order when shuffle is on

      setRepeat: (mode) => set({ repeat: mode }),
      toggleRepeat: () =>
        set((state) => {
          const modes = ["off", "all", "one"];
          const idx = modes.indexOf(state.repeat);
          return { repeat: modes[(idx + 1) % 3] };
        }),

      toggleShuffle: () =>
        set((state) => {
          if (state.shuffle) {
            // Turn off shuffle — restore original queue, find current song
            const currentId = state.currentSong?.id;
            const originalIndex = state.originalQueue.findIndex(
              (s) => s.id === currentId
            );
            return {
              shuffle: false,
              queue: state.originalQueue,
              queueIndex: originalIndex >= 0 ? originalIndex : state.queueIndex,
              originalQueue: [],
            };
          } else {
            // Turn on shuffle — keep current song first, shuffle rest
            const current = state.queue[state.queueIndex];
            const rest = state.queue.filter((_, i) => i !== state.queueIndex);
            const shuffled = shuffleArray([current, ...rest]);
            return {
              shuffle: true,
              originalQueue: state.queue,
              queue: shuffled,
              queueIndex: 0,
            };
          }
        }),

      setIsExpandedPlayer: (val) => set({ isExpandedPlayer: val }),
      toggleExpandedPlayer: () =>
        set((state) => ({ isExpandedPlayer: !state.isExpandedPlayer })),
      setAudioRef: (ref) => set({ audioRef: ref }),

      addToHistory: (song) =>
        set((state) => ({
          history: [song, ...state.history.filter((s) => s.id !== song.id)].slice(
            0,
            50
          ),
        })),

      playSong: async (songData) => {
        set({ isLoading: true, error: null });
        try {
          let song = songData;
          let audioUrl = "";

          // Skip non-song types (albums, playlists, shows)
          if (
            song.type &&
            song.type !== "song" &&
            song.type !== "episode"
          ) {
            set({ isLoading: false });
            return;
          }

          // Try decrypting from existing data
          audioUrl = extractAudioUrl(song);

          // If no URL, fetch fresh song details
          if (!audioUrl && song.id) {
            const res = await getSongDetails(song.id);
            const songs = res?.songs || res?.data?.songs || [];
            if (songs.length > 0) {
              song = songs[0];
              audioUrl = extractAudioUrl(song);
            }
          }

          if (!audioUrl) {
            console.error("No audio URL for:", song.title, song.id);
            set({ isLoading: false, error: "Could not get audio URL" });
            return;
          }

          // Handle preloading of next song if available
          const currentQueue = get().queue;
          const currentIndex = get().queueIndex;
          if (currentIndex >= 0 && currentIndex + 1 < currentQueue.length) {
            const nextS = currentQueue[currentIndex + 1];
            const nextAudioUrl = extractAudioUrl(nextS);
            if (nextAudioUrl) {
              const preload = new Audio(nextAudioUrl);
              preload.preload = "auto";
              set({ preloadedAudio: preload });
            }
          }

          // Save to Auth History (Backend sync)
          useAuthStore.getState().saveHistory(song);

          // If URL hasn't changed, useEffect won't run, so we must manually seek/play
          const currentState = get();
          if (currentState.audioUrl === audioUrl) {
            if (currentState.audioRef) {
              currentState.audioRef.currentTime = 0;
              currentState.audioRef
                .play()
                .catch((e) => console.error("Playback failed:", e));
            }
          }

          // Set state — Player component's useEffect will handle audio.load() + play()
          set({
            currentSong: song,
            audioUrl,
            isPlaying: true,
            isLoading: false,
            currentTime: 0,
          });
        } catch (err) {
          console.error("Playback failed:", err);
          set({ isLoading: false, error: err.message });
        }
      },

      playFromQueue: async (index) => {
        const { queue } = get();
        if (index >= 0 && index < queue.length) {
          set({ queueIndex: index });
          await get().playSong(queue[index]);
        }
      },

      setQueue: (songs, startIndex = 0) => {
        const state = get();
        if (state.shuffle) {
          const current = songs[startIndex];
          const rest = songs.filter((_, i) => i !== startIndex);
          const shuffled = shuffleArray([current, ...rest]);
          set({
            queue: shuffled,
            queueIndex: 0,
            originalQueue: songs,
          });
        } else {
          set({ queue: songs, queueIndex: startIndex });
        }
      },

      togglePlay: () => {
        const { isPlaying, audioRef } = get();
        if (audioRef) {
          if (isPlaying) {
            audioRef.pause();
          } else {
            audioRef.play().catch(() => {});
          }
        }
        set({ isPlaying: !isPlaying });
      },

      nextSong: async () => {
        const { queue, queueIndex, repeat } = get();
        if (queueIndex < queue.length - 1) {
          await get().playFromQueue(queueIndex + 1);
        } else if (repeat === "all" && queue.length > 0) {
          await get().playFromQueue(0);
        } else if (repeat === "one") {
          // Replay current
          const audio = get().audioRef;
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          }
        }
      },

      prevSong: async () => {
        const { queue, queueIndex, currentTime } = get();
        if (currentTime > 3) {
          const audio = get().audioRef;
          if (audio) {
            audio.currentTime = 0;
            set({ currentTime: 0 });
          }
          return;
        }
        if (queueIndex > 0) {
          await get().playFromQueue(queueIndex - 1);
        }
      },

      seekTo: (time) => {
        const audio = get().audioRef;
        if (audio) {
          audio.currentTime = time;
          set({ currentTime: time });
        }
      },

      setVolume: (vol) => {
        const audio = get().audioRef;
        if (audio) audio.volume = vol;
        set({ volume: vol });
      },

      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (dur) => set({ duration: dur }),
      setIsPlaying: (val) => set({ isPlaying: val }),

      // Restore playback after rehydration
      restorePlayback: async () => {
        const state = get();
        if (!state.currentSong || !state.audioUrl) return;
        try {
          const audio = state.audioRef;
          if (audio) {
            audio.src = state.audioUrl;
            audio.volume = state.volume;
            audio.load();
            // Seek to saved position
            audio.currentTime = state.currentTime || 0;
            // Don't auto-play on restore — wait for user gesture
          }
        } catch (err) {
          console.warn("Playback restore failed:", err);
        }
      },
    }),
    {
      name: "musix-player",
      partialize: (state) => ({
        currentSong: state.currentSong,
        audioUrl: state.audioUrl,
        queue: state.queue,
        queueIndex: state.queueIndex,
        volume: state.volume,
        currentTime: state.currentTime,
        repeat: state.repeat,
        shuffle: state.shuffle,
      }),
      onRehydrateStorage: () => (state) => {
        // Auto-restore playback state after reload
        if (state?.currentSong) {
          // Defer restoration until audio ref is attached
          setTimeout(() => {
            state.restorePlayback?.();
          }, 500);
        }
      },
    }
  )
);
