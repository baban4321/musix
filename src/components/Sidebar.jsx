import { NavLink, Link } from "react-router-dom";
import { HiHome, HiSearch, HiHeart, HiClock } from "react-icons/hi";
import { RiPlayListFill } from "react-icons/ri";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";

const links = [
  { to: "/", icon: HiHome, label: "Home" },
  { to: "/search", icon: HiSearch, label: "Search" },
];

const SidebarItem = ({ to, icon: Icon, label, badge, colorClass = "" }) => (
  <NavLink
    to={to}
    end={to === "/"}
    className={({ isActive }) =>
      `relative flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${isActive
        ? "bg-purple-500/10 text-purple-400"
        : "text-dark-200 hover:text-white hover:bg-white/5"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <span className="absolute left-0 top-3 bottom-3 w-1 bg-accent-primary rounded-r-full shadow-[0_0_8px_#8b5cf6]" />
        )}
        <div className="flex items-center gap-3">
          <Icon className={`text-xl transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-purple-400" : "text-dark-300 group-hover:text-white"}`} />
          <span className="font-semibold tracking-wide font-display">{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

const Sidebar = () => {
  const { likedSongs, playlists, isAuthenticated, setAuthModalOpen, history } = useAuthStore();

  const handleAuthRoute = (e, to) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      {/* Desktop Sidebar (Docked full-height panel starting from top-0) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col bg-dark-900/60 dark:bg-dark-900/80 backdrop-blur-xl border-r border-white/5 dark:border-white/5 border-black/5 z-40 overflow-hidden">
        {/* Logo Header inside Sidebar */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 dark:border-white/5 border-black/5 shrink-0">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Musix"
              className="h-8 w-auto object-contain transition-transform hover:scale-102"
              style={{ aspectRatio: "300/106" }}
            />
          </Link>
        </div>

        <div className="flex-1 flex flex-col py-6 px-4 gap-2 overflow-y-auto scrollbar-hide">
          {/* Menu Section */}
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-dark-300 mb-2 font-display">
            Menu
          </p>
          {links.map((link) => (
            <motion.div
              key={link.to}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <SidebarItem {...link} />
            </motion.div>
          ))}

          {/* Library Section */}
          <div className="mt-8 px-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-dark-300 mb-4 font-display">
              Library
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={(e) => handleAuthRoute(e, "/liked")}
          >
            <SidebarItem
              to={isAuthenticated ? "/liked" : "#"}
              icon={HiHeart}
              label="Liked Songs"
              badge={isAuthenticated ? likedSongs.length : 0}
              colorClass="text-pink-500"
            />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={(e) => handleAuthRoute(e, "/playlists")}
          >
            <SidebarItem
              to={isAuthenticated ? "/playlists" : "#"}
              icon={RiPlayListFill}
              label="Playlists"
              badge={isAuthenticated ? playlists.length : 0}
            />
          </motion.div>

          {/* History Link */}
          <motion.div
            className="mt-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={(e) => handleAuthRoute(e, "/listening-history")}
          >
            <SidebarItem
              to={isAuthenticated ? "/listening-history" : "#"}
              icon={HiClock}
              label="History"
              badge={isAuthenticated ? history.length : 0}
            />
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-white/5 dark:border-white/5 border-black/5 bg-black/10">
          <p className="text-[10px] text-dark-300 text-center font-semibold tracking-wider uppercase font-display">
            Premium Experience
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-[85px] left-2 right-2 rounded-2xl glass-panel z-40 shadow-2xl shadow-black/50 dark:shadow-black/50">
        <div className="flex items-center justify-around py-2 px-2">
          {[
            { to: "/", icon: HiHome, label: "Home" },
            { to: "/search", icon: HiSearch, label: "Search" },
            { to: "/liked", icon: HiHeart, label: "Liked" },
            { to: "/playlists", icon: RiPlayListFill, label: "Playlists" },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-200 ${isActive
                  ? "text-purple-400 bg-purple-500/10 scale-105"
                  : "text-secondary hover:text-primary hover:bg-dark-700/50 dark:hover:bg-dark-700/50"
                }`
              }
            >
              <Icon className="text-xl" />
              <span className="text-[10px] font-medium hidden sm:block">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
