import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearLanguageCache } from "../services/api";

const applyThemeToDOM = () => {
  const root = document.documentElement;
  root.classList.add("dark");
  root.classList.remove("light");
};

export const useSettingsStore = create(
  persist(
    (set) => ({
      // Bug 1 Fix: Default to empty array (all languages) instead of
      // hardcoding ["hindi", "english", "telugu"] which caused Hindi/English
      // songs to appear even when the user hadn't explicitly chosen them.
      languages: [],
      theme: "dark",

      setLanguages: (langs) => {
        // Bug 2 Fix: Clear the API response cache whenever the language
        // preference changes so stale responses from the old language
        // setting are never served to the autoplay engine.
        clearLanguageCache();
        set({ languages: langs });
      },

      setTheme: () => set({ theme: "dark" }),
      toggleTheme: () => set({ theme: "dark" }),
    }),
    {
      name: "musix-settings",
      onRehydrateStorage: () => () => {
        applyThemeToDOM();
      },
    }
  )
);
