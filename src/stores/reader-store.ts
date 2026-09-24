import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ReaderPreferences } from "@/types/reader";

const defaultPreferences: ReaderPreferences = {
  theme: "light",
  flow: "paginated",
  fontFamily: "serif",
  fontSize: 18,
  lineHeight: 1.65,
  contentWidth: "standard",
};

type ReaderState = {
  preferences: ReaderPreferences;
  tocOpen: boolean;
  settingsOpen: boolean;
  controlsVisible: boolean;
  setPreferences: (update: Partial<ReaderPreferences>) => void;
  resetPreferences: () => void;
  setTocOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setControlsVisible: (visible: boolean) => void;
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      tocOpen: false,
      settingsOpen: false,
      controlsVisible: true,
      setPreferences: (update) =>
        set((state) => ({
          preferences: { ...state.preferences, ...update },
        })),
      resetPreferences: () => set({ preferences: defaultPreferences }),
      setTocOpen: (tocOpen) => set({ tocOpen }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setControlsVisible: (controlsVisible) => set({ controlsVisible }),
    }),
    {
      name: "miraf-reader-preferences",
      partialize: (state) => ({ preferences: state.preferences }),
    },
  ),
);

