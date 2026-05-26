import { create } from "zustand";
import backendApi from "../services/backendApi";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("musix_token") || null,
  isAuthenticated: !!localStorage.getItem("musix_token"),
  likedSongs: [],
  history: [],
  playlists: [],
  isAuthModalOpen: false,

  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),

  // Auth actions
  login: async (email, password) => {
    try {
      const res = await backendApi.post("/auth/login", { email, password });
      const { token, ...userData } = res.data;
      localStorage.setItem("musix_token", token);
      set({ 
        user: userData, 
        token, 
        isAuthenticated: true,
        likedSongs: userData.likedSongs || [],
        history: userData.history || []
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || "Login failed" };
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await backendApi.post("/auth/register", { name, email, password });
      const { token, ...userData } = res.data;
      localStorage.setItem("musix_token", token);
      set({ 
        user: userData, 
        token, 
        isAuthenticated: true,
        likedSongs: [],
        history: []
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || "Registration failed" };
    }
  },

  logout: () => {
    localStorage.removeItem("musix_token");
    set({ user: null, token: null, isAuthenticated: false, likedSongs: [], history: [], playlists: [] });
  },

  fetchMe: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await backendApi.get("/user/me");
      set({ 
        user: res.data, 
        likedSongs: res.data.likedSongs || [],
        history: res.data.history || [],
        playlists: res.data.playlists || [],
        isAuthenticated: true
      });
    } catch (error) {
       // Token invalid or expired
       get().logout();
    }
  },

  // Interactions
  toggleLikeSong: async (songId) => {
    const { likedSongs, isAuthenticated } = get();
    if (!isAuthenticated) return get().setAuthModalOpen(true);

    const isLiked = likedSongs.includes(songId);
    
    // Optimistic UI update
    set({ 
      likedSongs: isLiked 
        ? likedSongs.filter(id => id !== songId) 
        : [...likedSongs, songId] 
    });

    try {
      if (isLiked) {
        await backendApi.post("/user/unlike", { songId });
      } else {
        await backendApi.post("/user/like", { songId });
      }
    } catch (error) {
      // Revert on error
      set({ likedSongs });
      console.error("Failed to toggle like", error);
    }
  },

  saveHistory: async (song) => {
    if (!get().isAuthenticated) return;

    // Robust extraction — song data varies by API path
    const imgRaw = song.image;
    const image = Array.isArray(imgRaw)
      ? (imgRaw[imgRaw.length - 1]?.link || imgRaw[imgRaw.length - 1]?.url || "")
      : (typeof imgRaw === "string" ? imgRaw : (song.imageFileUrl || song.squareImageUrl || ""));

    const title = song.title || song.name || song.header_desc || "Unknown";

    const artists = song.moreInfo?.artistMap?.primaryArtists;
    const artist = artists?.length > 0
      ? artists.map(a => a.name).join(", ")
      : (song.subtitle?.split(" - ")[0] || song.moreInfo?.primaryArtists || song.moreInfo?.music || "Unknown Artist");

    const payload = { songId: song.id, title, image, artist };

    try {
       const res = await backendApi.post("/user/history", payload);
       set({ history: res.data });
    } catch (error) {
       console.error("Failed to save history", error);
    }
  },

  fetchHistory: async () => {
    if (!get().isAuthenticated) return;
    try {
      const res = await backendApi.get("/user/history");
      set({ history: res.data });
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  },

  clearHistory: async () => {
    if (!get().isAuthenticated) return;
    try {
      await backendApi.delete("/user/history");
      set({ history: [] });
    } catch (error) {
      console.error("Failed to clear history", error);
    }
  },

  fetchPlaylists: async () => {
    if (!get().isAuthenticated) return;
    try {
      const res = await backendApi.get("/playlist/user");
      set({ playlists: res.data });
    } catch (error) {
      console.error("Failed to fetch playlists");
    }
  },

  createPlaylist: async (name) => {
    if (!get().isAuthenticated) {
      get().setAuthModalOpen(true);
      return { success: false };
    }
    try {
      const res = await backendApi.post("/playlist/create", { name });
      set((state) => ({ playlists: [res.data, ...state.playlists] }));
      return { success: true, playlist: res.data };
    } catch (error) {
      console.error("Failed to create playlist", error);
      return { success: false };
    }
  },

  addSongToPlaylist: async (playlistId, songData) => {
    if (!get().isAuthenticated) {
      get().setAuthModalOpen(true);
      return { success: false };
    }
    try {
      const res = await backendApi.post("/playlist/add-song", { playlistId, songData });
      // update local state
      const { playlists } = get();
      set({ playlists: playlists.map(p => p._id === playlistId ? res.data : p) });
      return { success: true };
    } catch (error) {
      console.error("Failed to add song to playlist", error);
      return { success: false };
    }
  }
}));
