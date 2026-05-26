import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiCollection, HiMusicNote } from "react-icons/hi";
import { useAuthStore } from "../store/authStore";

const UserPlaylists = () => {
  const navigate = useNavigate();
  const { playlists, isAuthenticated, setAuthModalOpen } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      navigate("/");
    }
  }, [isAuthenticated, navigate, setAuthModalOpen]);

  if (!isAuthenticated) return null;

  return (
    <div className="fade-in max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <HiCollection className="text-white text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary tracking-tight">
            My Playlists
          </h1>
          <p className="text-sm text-dark-300 font-medium mt-1">
            {playlists.length} {playlists.length === 1 ? "Playlist" : "Playlists"}
          </p>
        </div>
      </div>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-dark-700/50 flex items-center justify-center mb-6">
            <HiCollection className="text-dark-400 text-4xl" />
          </div>
          <h2 className="text-xl font-display font-bold text-primary mb-2">No Playlists Yet</h2>
          <p className="text-dark-300 max-w-sm mb-6">
            You haven't created any playlists yet. Start by expanding the player and clicking the Add to Playlist dropdown!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {playlists.map((pl) => {
            // Pick the first song's image for the cover, or a fallback
            const coverImage = pl.songs?.length > 0 && pl.songs[0]?.image 
               ? pl.songs[0].image 
               : "https://via.placeholder.com/500/18181b/ffffff?text=Playlist";

            const highResCover = typeof coverImage === "string" 
               ? coverImage.replace("150x150", "500x500").replace("50x50", "500x500") 
               : coverImage; // Handle arrays if necessary, but backend stores extracted string
               
            return (
              <Link key={pl._id} to={`/my-playlist/${pl._id}`} className="group block">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg bg-dark-700">
                  <img 
                    src={highResCover} 
                    alt={pl.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                     <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
                        <HiMusicNote />
                        {pl.songs?.length || 0}
                     </span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-primary truncate group-hover:text-accent-primary transition-colors">
                  {pl.name}
                </h3>
                <p className="text-xs text-dark-300 mt-1">
                  Created {new Date(pl.createdAt).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserPlaylists;
