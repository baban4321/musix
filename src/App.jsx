import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuthStore } from "./store/authStore";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import Search from "./pages/Search";
import SongDetails from "./pages/SongDetails";
import AlbumDetails from "./pages/AlbumDetails";
import PlaylistDetails from "./pages/PlaylistDetails";
import ArtistDetails from "./pages/ArtistDetails";
import MixDetails from "./pages/MixDetails";
import ShowDetails from "./pages/ShowDetails";
import ListeningHistory from "./pages/ListeningHistory";
import UserPlaylists from "./pages/UserPlaylists";
import UserPlaylistDetails from "./pages/UserPlaylistDetails";
import LikedSongs from "./pages/LikedSongs";
import { HiDownload, HiX } from "react-icons/hi";

const PageTransition = ({ children }) => {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </Motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
        <Route path="/song/:id" element={<PageTransition><SongDetails /></PageTransition>} />
        <Route path="/album/:id" element={<PageTransition><AlbumDetails /></PageTransition>} />
        <Route path="/playlist/:id" element={<PageTransition><PlaylistDetails /></PageTransition>} />
        <Route path="/artist/:id" element={<PageTransition><ArtistDetails /></PageTransition>} />
        <Route path="/mix/:token" element={<PageTransition><MixDetails /></PageTransition>} />
        <Route path="/show/:token" element={<PageTransition><ShowDetails /></PageTransition>} />
        <Route path="/listening-history" element={<PageTransition><ListeningHistory /></PageTransition>} />
        <Route path="/liked" element={<PageTransition><LikedSongs /></PageTransition>} />
        <Route path="/playlists" element={<PageTransition><UserPlaylists /></PageTransition>} />
        <Route path="/my-playlist/:id" element={<PageTransition><UserPlaylistDetails /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function InstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if dismissed this session
  if (!canInstall || dismissed) return null;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (!accepted) setDismissed(true);
  };

  return (
    <div className="install-banner fixed bottom-[80px] sm:bottom-[96px] left-4 right-4 md:left-[270px] md:right-12 z-[60] bg-accent-primary/95 backdrop-blur-xl text-white rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.4)] p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
        <HiDownload className="text-xl" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">Install Musix</p>
        <p className="text-xs text-white/80">Add to home screen for the best experience</p>
      </div>
      <button
        onClick={handleInstall}
        className="px-4 py-2 bg-white text-accent-primary font-bold text-sm rounded-xl hover:bg-white/90 transition-colors shrink-0"
      >
        Install
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="p-2 text-white/60 hover:text-white transition-colors shrink-0"
      >
        <HiX className="text-lg" />
      </button>
    </div>
  );
}

function App() {
  const fetchMe = useAuthStore(state => state.fetchMe);
  const fetchPlaylists = useAuthStore(state => state.fetchPlaylists);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
      fetchPlaylists();
    }
  }, [isAuthenticated, fetchMe, fetchPlaylists]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-light-900 dark:bg-dark-900 text-primary font-body selection:bg-accent-primary/30 relative transition-colors duration-300">
        <Navbar />
        <Sidebar />

        <main className="pt-20 md:pl-[260px] pb-[160px] md:pb-[130px] transition-all">
          <div className="px-4 md:px-8 pt-6 pb-4">
            <AnimatedRoutes />
          </div>
        </main>

        <Player />
        <InstallBanner />
        <AuthModal />
      </div>
    </BrowserRouter>
  );
}

export default App;
