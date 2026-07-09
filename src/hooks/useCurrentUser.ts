import type { UserType } from "@/types/user";
import { create } from "zustand";
import { createJSONStorage } from "zustand/middleware";
import { persist } from "zustand/middleware";

interface CurrentUserState {
  token: string | null;
  user: UserType | null;
  setCurrentUser: (data: { user: UserType; token: string }) => void;
  removeCurrentUser: () => void;
}

const useCurrentUser = create<CurrentUserState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      onboardingState: null,
      setCurrentUser: (data: { user: UserType; token: string }) =>
        set((state) => ({
          token: data.token,
          user: { ...state.user, ...data.user },
        })),
      removeCurrentUser: () => set({ token: null, user: null }),
    }),
    {
      name: "pbara-auth-session",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useCurrentUser;
