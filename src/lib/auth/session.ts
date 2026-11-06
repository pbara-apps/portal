import { useMutation } from "@tanstack/react-query";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PortalProfile } from "@/features/chapter/types";
import { useChapterSession } from "@/features/chapter/store/useChapterSession";
import useCurrentUser from "@/hooks/useCurrentUser";
import { mapProfileUser, type RawProfileUser } from "@/lib/api/auth";
import http from "@/lib/api";

/**
 * One sign-in for everyone. POST /auth/login returns one token plus what the
 * person can open:
 * - `admin`: the admin portal profile (stored in useCurrentUser)
 * - `chapter`: the chapter portal profile (stored in useChapterSession)
 * The same token works for both APIs. Someone with both picks where to go.
 */
export type AccountSession = {
  token: string;
  account: { id: string; name: string; email: string; phone: string; hasChangedPassword: boolean };
  admin: RawProfileUser | null;
  chapter: PortalProfile | null;
};

type AccountState = {
  token: string | null;
  name: string;
  email: string;
  hasChangedPassword: boolean;
  hasAdmin: boolean;
  hasChapter: boolean;
  set: (s: Omit<AccountState, "set" | "clear">) => void;
  clear: () => void;
};

/** What the signed-in account can open, kept between visits. */
export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      token: null,
      name: "",
      email: "",
      hasChangedPassword: true,
      hasAdmin: false,
      hasChapter: false,
      set: (s) => set(s),
      clear: () =>
        set({ token: null, name: "", email: "", hasChangedPassword: true, hasAdmin: false, hasChapter: false }),
    }),
    { name: "pbara-account", storage: createJSONStorage(() => localStorage) },
  ),
);

/** Stores a session from login, change-password or /auth/session in every store. */
export function applySession(session: Omit<AccountSession, "token">, token: string) {
  useAccount.getState().set({
    token,
    name: session.account.name,
    email: session.account.email,
    hasChangedPassword: session.account.hasChangedPassword,
    hasAdmin: Boolean(session.admin),
    hasChapter: Boolean(session.chapter),
  });

  if (session.admin) {
    useCurrentUser.getState().setCurrentUser({ user: { ...mapProfileUser(session.admin), token }, token });
  } else {
    useCurrentUser.getState().removeCurrentUser();
  }

  const chapter = useChapterSession.getState();
  if (session.chapter) {
    // Keep the chapter a counsellor was viewing if they're already signed in.
    if (chapter.token === token) chapter.setProfile(session.chapter);
    else chapter.signIn(token, session.chapter);
  } else {
    chapter.signOut();
  }
}

/** Signs out of both portals. */
export function signOutEverywhere() {
  useCurrentUser.getState().removeCurrentUser();
  useChapterSession.getState().signOut();
  useAccount.getState().clear();
}

/** Where to go after signing in (or after setting a first password). */
export function landingPath(
  s: { hasChangedPassword: boolean; hasAdmin: boolean; hasChapter: boolean },
  returnTo?: string | null,
) {
  if (!s.hasChangedPassword) return "/change-password";
  if (returnTo?.startsWith("/chapter") && s.hasChapter) return returnTo;
  if (returnTo?.startsWith("/admin") && returnTo !== "/admin" && s.hasAdmin) return returnTo;
  if (s.hasAdmin && s.hasChapter) return "/choose";
  if (s.hasAdmin) return returnTo?.startsWith("/admin") ? returnTo : "/admin";
  if (s.hasChapter) return "/chapter";
  return "/login";
}

export const useAccountLogin = () =>
  useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const res = await http.post("auth/login", body);
      return res.data as AccountSession;
    },
    onSuccess: (session) => applySession(session, session.token),
  });

export const useAccountChangePassword = () =>
  useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      const res = await http.post("auth/change-password", body, {
        headers: { Authorization: `Bearer ${useAccount.getState().token}` },
      });
      return res.data as Omit<AccountSession, "token">;
    },
    onSuccess: (session) => applySession(session, useAccount.getState().token ?? ""),
  });
