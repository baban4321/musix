import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { HiX, HiMail, HiLockClosed, HiUser } from "react-icons/hi";

const AuthModal = () => {
  const { isAuthModalOpen, setAuthModalOpen, login, register } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let res;
    if (isLogin) {
      res = await login(formData.email, formData.password);
    } else {
      res = await register(formData.name, formData.email, formData.password);
    }

    if (res.success) {
      setAuthModalOpen(false);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           onClick={() => setAuthModalOpen(false)}
           className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div 
           initial={{ scale: 0.9, opacity: 0, y: 20 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           exit={{ scale: 0.9, opacity: 0, y: 20 }}
           className="relative w-full max-w-md bg-dark-800 glass-panel border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
        >
          <button 
             onClick={() => setAuthModalOpen(false)}
             className="absolute top-4 right-4 p-2 text-dark-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <HiX className="text-xl" />
          </button>

          <h2 className="text-2xl font-display font-bold text-primary mb-6 text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 text-lg" />
                <input 
                  type="text" name="name" 
                  placeholder="Full Name" 
                  value={formData.name} onChange={handleChange} required
                  className="w-full bg-dark-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 text-lg" />
              <input 
                type="email" name="email" 
                placeholder="Email Address" 
                value={formData.email} onChange={handleChange} required
                className="w-full bg-dark-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>

            <div className="relative">
              <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 text-lg" />
              <input 
                type="password" name="password" 
                placeholder="Password" 
                value={formData.password} onChange={handleChange} required
                className="w-full bg-dark-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-accent-primary hover:bg-accent-glow text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
            </button>
          </form>

          <p className="text-center text-sm text-dark-300 mt-6">
            {isLogin ? "New to Musix? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-accent-primary hover:underline font-medium"
            >
              {isLogin ? "Create an account" : "Sign in instead"}
            </button>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
