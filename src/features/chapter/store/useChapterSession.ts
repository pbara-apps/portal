import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PortalProfile } from "../types";

/**
 * Chapter portal session — stored separately from the admin session,
 * so being signed in to one never affects the other.
 *
 * `selectedChapterId` is the chapter a counsellor is currently viewing
 * ("all" = every chapter in their church). Presidents and secretaries
 * are always on their own chapter.
 */
interface ChapterSessionState {
  token: string | null;
  profile: PortalProfile | null;
  selectedChapterId: string | "all";
  signIn: (token: string, profile: PortalProfile) => void;
  setProfile: (profile: PortalProfile) => void;
  selectChapter: (chapterId: string | "all") => void;
  signOut: () => void;
}

export const useChapterSession = create<ChapterSessionState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      selectedChapterId: "all",
      signIn: (token, profile) =>
        set({ token, profile, selectedChapterId: profile.chapterId ?? "all" }),
      setProfile: (profile) => set({ profile }),
      selectChapter: (selectedChapterId) => set({ selectedChapterId }),
      signOut: () => set({ token: null, profile: null, selectedChapterId: "all" }),
    }),
    {
      name: "pbara-chapter-session",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * The chapter id to send to the API: undefined means "all chapters in scope".
 */
export function useActiveChapterId(): string | undefined {
  const selected = useChapterSession((s) => s.selectedChapterId);
  return selected === "all" ? undefined : selected;
}

/**
 * The single chapter to act on (adding members, registering for programs).
 * Presidents/secretaries: their chapter. Counsellors: the selected chapter,
 * or their church's first chapter when "All chapters" is selected.
 */
export function useWorkingChapter(): { chapterId: string; chapterName: string } {
  const profile = useChapterSession((s) => s.profile);
  const selected = useChapterSession((s) => s.selectedChapterId);
  const chapterId =
    selected !== "all" ? selected : (profile?.chapterId ?? profile?.chapters[0]?.id ?? "");
  const chapterName = profile?.chapters.find((c) => c.id === chapterId)?.name ?? "";
  return { chapterId, chapterName };
}
