import { create } from "zustand";

interface AppStoreState {
  ready: boolean;
  setReady: (ready: boolean) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  ready: true,
  setReady: (ready) => set({ ready }),
}));
