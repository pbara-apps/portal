import { create } from "zustand";

interface SessionState {
  expired: boolean;
  returnTo: string | null;
  markSessionExpired: (returnTo: string) => void;
  clearSessionExpired: () => void;
}

export const useSession = create<SessionState>((set) => ({
  expired: false,
  returnTo: null,
  markSessionExpired: (returnTo) =>
    set((state) =>
      state.expired ? state : { expired: true, returnTo },
    ),
  clearSessionExpired: () => set({ expired: false, returnTo: null }),
}));
