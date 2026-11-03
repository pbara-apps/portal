import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { portalAuthKeys } from "./auth";
import chapterHttp from "./http";

export interface ChapterOverview {
  churchActiveMembers: number;
  rules: { churchMembersBeforeNewChapter: number; minMembersInNewChapter: number };
  canRequest: boolean;
  chapters: {
    id: string;
    name: string;
    status: "pending" | "active" | "rejected";
    isDefault: boolean;
    activeMembers: number;
    requestedMemberCount: number;
    reviewNote: string | null;
    createdAt: string;
  }[];
}

const overviewKey = ["chapter-portal", "chapter-overview"] as const;

/** Counsellor only: the church's chapters and whether a new one can be requested. */
export const useChapterOverview = () =>
  useQuery({
    queryKey: overviewKey,
    queryFn: async () => {
      const res = await chapterHttp.get("/chapter-requests/overview");
      return res.data as ChapterOverview;
    },
  });

export const useCreateChapterRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; memberIds: string[] }) => {
      await chapterHttp.post("/chapter-requests", body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: overviewKey }),
  });
};

export const useCancelChapterRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await chapterHttp.delete(`/chapter-requests/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: overviewKey });
      qc.invalidateQueries({ queryKey: portalAuthKeys.me });
    },
  });
};
