import { create } from "zustand";

import type { ReaderPreferences } from "@/types/reader";

export const defaultPreferences: ReaderPreferences = {
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
  replacePreferences: (preferences: ReaderPreferences) => void;
  resetPreferences: () => void;
  setTocOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setControlsVisible: (visible: boolean) => void;
};

export const useReaderStore = create<ReaderState>()(
    (set) => ({
      preferences: defaultPreferences,
      tocOpen: false,
      settingsOpen: false,
      controlsVisible: true,
      setPreferences: (update) =>
        set((state) => ({
          preferences: { ...state.preferences, ...update },
        })),
      replacePreferences: (preferences) => set({ preferences }),
      resetPreferences: () => set({ preferences: defaultPreferences }),
      setTocOpen: (tocOpen) => set({ tocOpen }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setControlsVisible: (controlsVisible) => set({ controlsVisible }),
    }),
);
