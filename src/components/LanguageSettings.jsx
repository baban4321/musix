import { useState, useEffect } from "react";
import { HiCheck } from "react-icons/hi";
import { useSettingsStore } from "../store/settingsStore";

const LANGUAGES = [
  { id: "hindi", label: "Hindi" },
  { id: "english", label: "English" },
  { id: "punjabi", label: "Punjabi" },
  { id: "tamil", label: "Tamil" },
  { id: "telugu", label: "Telugu" },
  { id: "marathi", label: "Marathi" },
  { id: "gujarati", label: "Gujarati" },
  { id: "bengali", label: "Bengali" },
  { id: "kannada", label: "Kannada" },
  { id: "bhojpuri", label: "Bhojpuri" },
  { id: "malayalam", label: "Malayalam" },
  { id: "sanskrit", label: "Sanskrit" },
  { id: "haryanvi", label: "Haryanvi" },
  { id: "rajasthani", label: "Rajasthani" },
  { id: "odia", label: "Odia" },
  { id: "assamese", label: "Assamese" },
];

const LanguageSettings = ({ isOpen, onClose }) => {
  const globalLanguages = useSettingsStore((state) => state.languages);
  const setGlobalLanguages = useSettingsStore((state) => state.setLanguages);
  
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSelected(globalLanguages || []);
    }
  }, [isOpen, globalLanguages]);

  if (!isOpen) return null;

  const toggleLanguage = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((lang) => lang !== id);
      }
      return [...prev, id];
    });
  };

  const handleUpdate = () => {
    setGlobalLanguages(selected);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100]"
        onClick={onClose}
      />
      
      {/* Dropdown anchored top-right below navbar */}
      <div className="absolute top-full right-0 mt-2 w-[320px] bg-white dark:bg-dark-800 rounded-xl shadow-2xl shadow-black/20 dark:shadow-black/50 z-[101] border border-black/10 dark:border-dark-700/50">
        {/* Header */}
        <div className="px-5 pt-4 pb-3">
          <h2 className="text-sm font-bold text-primary">What music do you like?</h2>
          <p className="text-[11px] text-dark-300 italic mt-0.5">Pick all the languages you want to listen to.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 border-t border-black/10 dark:border-dark-700/40">
          {LANGUAGES.map((lang, index) => {
            const isSelected = selected.includes(lang.id);
            const isLeftCol = index % 2 === 0;
            
            return (
              <button
                key={lang.id}
                onClick={() => toggleLanguage(lang.id)}
                className={`flex items-center justify-between px-5 py-2 transition-colors border-b border-black/10 dark:border-dark-700/30 ${
                  isLeftCol ? "border-r border-black/10 dark:border-dark-700/30" : ""
                } hover:bg-black/5 dark:hover:bg-dark-700/30`}
              >
                <span className={`text-[13px] font-medium ${isSelected ? "text-accent-primary" : "text-primary"}`}>
                  {lang.label}
                </span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-accent-primary flex items-center justify-center">
                    <HiCheck className="text-white text-[10px]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3">
          <button
            onClick={handleUpdate}
            className="w-full py-2 rounded-full bg-accent-primary text-white text-sm font-semibold hover:bg-accent-glow transition-all active:scale-[0.98] shadow-lg shadow-accent-primary/20"
          >
            Update
          </button>
        </div>
      </div>
    </>
  );
};

export default LanguageSettings;
