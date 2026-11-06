import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/config/env";
import { mapMember, type RawMember } from "../lib/mappers";
import type { MemberPayload, PortalDashboard, PortalRank } from "../types";
import chapterHttp from "./http";

export type MemberView = "active" | "awaiting" | "all";

export const memberKeys = {
  all: ["chapter-portal", "members"] as const,
  list: (params: object) => ["chapter-portal", "members", params] as const,
  dashboard: (chapterId?: string) => ["chapter-portal", "dashboard", chapterId ?? "all"] as const,
  ranks: ["chapter-portal", "ranks"] as const,
};

/** Members in the selected chapter (or all chapters in scope). */
export const useChapterMembers = (
  params: {
    chapterId?: string;
    view: MemberView;
    search?: string;
    rankId?: string;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: memberKeys.list(params),
    enabled,
    queryFn: async () => {
      const res = await chapterHttp.get("/members", { params });
      return ((res.data ?? []) as RawMember[]).map(mapMember);
    },
  });

export const useChapterDashboard = (chapterId?: string) =>
  useQuery({
    queryKey: memberKeys.dashboard(chapterId),
    queryFn: async () => {
      const res = await chapterHttp.get("/dashboard", { params: { chapterId } });
      type RawBirthday = Omit<PortalDashboard["birthdays"][number], "id"> & { _id?: string; id?: string };
      const data = res.data as Omit<PortalDashboard, "birthdays"> & { birthdays: RawBirthday[] };
      return {
        ...data,
        birthdays: data.birthdays.map((b) => ({ ...b, id: b._id ?? b.id ?? "" })),
      };
    },
  });

/** Official ranks in ladder order (public endpoint). */
export const useRanks = () =>
  useQuery({
    queryKey: memberKeys.ranks,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/rank/public`);
      type RawRank = { _id: string; name: string; order?: number | null; maxAge?: number | null };
      return ((res.data?.data ?? []) as RawRank[]).map(
        (r): PortalRank => ({ id: r._id, name: r.name, order: r.order ?? null, maxAge: r.maxAge ?? null }),
      );
    },
  });

/** Clears every member list and dashboard so counts refresh after a change. */
function useInvalidateMembers() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: memberKeys.all });
    qc.invalidateQueries({ queryKey: ["chapter-portal", "dashboard"] });
  };
}

export const useAddMembers = () => {
  const invalidate = useInvalidateMembers();
  return useMutation({
    mutationFn: async (body: { chapterId: string; members: MemberPayload[] }) => {
      const res = await chapterHttp.post("/members", body);
      return ((res.data ?? []) as RawMember[]).map(mapMember);
    },
    onSuccess: invalidate,
  });
};

export const useUpdateMember = () => {
  const invalidate = useInvalidateMembers();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<MemberPayload> }) => {
      const res = await chapterHttp.patch(`/members/${id}`, body);
      return mapMember(res.data as RawMember);
    },
    onSuccess: invalidate,
  });
};

export const useWithdrawMember = () => {
  const invalidate = useInvalidateMembers();
  return useMutation({
    mutationFn: async (id: string) => {
      await chapterHttp.delete(`/members/${id}`);
    },
    onSuccess: invalidate,
  });
};

/** What an upload is for. Photos must be images; proofs may be images or PDFs. */
export type UploadPurpose = "photo" | "rank-proof" | "achievement-proof" | "payment-proof";

export const useUploadFile = (purpose: UploadPurpose) =>
  useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await chapterHttp.post(`/upload/${purpose}`, form);
      return (res.data as { url: string }).url;
    },
  });

export const useUploadMemberPhoto = () => useUploadFile("photo");

/** One member with full details (including rank history). */
export const useMember = (id?: string) =>
  useQuery({
    queryKey: ["chapter-portal", "members", "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await chapterHttp.get(`/members/${id}`);
      return mapMember(res.data as RawMember);
    },
  });

export const useSetRankHistory = () => {
  const invalidate = useInvalidateMembers();
  return useMutation({
    mutationFn: async ({
      id,
      entries,
    }: {
      id: string;
      entries: { rankId: string; dateReached: string | null; proofUrl: string | null }[];
    }) => {
      const res = await chapterHttp.put(`/members/${id}/rank-history`, { entries });
      return mapMember(res.data as RawMember);
    },
    onSuccess: invalidate,
  });
};
