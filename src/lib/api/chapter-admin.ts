import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapMember, type RawMember } from "@/features/chapter/lib/mappers";
import type { CredentialDelivery } from "@/features/chapter/types";
import type {
  AdminChapterRow,
  ChapterRequest,
  CounsellorAccount,
  DuplicateMatch,
  RecruitmentRequest,
  ReviewResult,
} from "@/types/chapter-admin";
import { type RawAchievement, mapAchievement } from "@/types/achievement";
import http from ".";

/**
 * Admin-side hooks for chapter administration:
 * church counsellor logins and the Recruitment Board.
 */
export const chapterAdminKeys = {
  counsellor: (churchId: string) => ["chapter-admin", "counsellor", churchId] as const,
  recruitment: (params: object) => ["chapter-admin", "recruitment", params] as const,
  recruitmentAll: ["chapter-admin", "recruitment"] as const,
  pendingCount: ["chapter-admin", "recruitment-pending-count"] as const,
};

// ─── Church counsellor ──────────────────────────────────────────────────────

export const useCounsellor = (churchId: string | null) =>
  useQuery({
    queryKey: chapterAdminKeys.counsellor(churchId ?? ""),
    enabled: Boolean(churchId),
    queryFn: async () => {
      const res = await http.get(`/chapter-admin/churches/${churchId}/counsellor`);
      return (res.data ?? null) as CounsellorAccount | null;
    },
  });

export const useAssignCounsellor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      churchId,
      ...body
    }: { churchId: string; name: string; email: string; phone: string }) => {
      const res = await http.put(`/chapter-admin/churches/${churchId}/counsellor`, body);
      return res.data as CredentialDelivery & { account: CounsellorAccount; replaced: boolean };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: chapterAdminKeys.counsellor(vars.churchId) });
      qc.invalidateQueries({ queryKey: ["chapters"] });
    },
  });
};

export const useResendCounsellorPassword = () =>
  useMutation({
    mutationFn: async (churchId: string) => {
      const res = await http.post(`/chapter-admin/churches/${churchId}/counsellor/resend-password`);
      return res.data as CredentialDelivery;
    },
  });

// ─── Recruitment Board ─────────────────────────────────────────────────────

export type RecruitmentParams = { status: "pending" | "rejected"; search?: string; churchId?: string };

export const useRecruitmentRequests = (params: RecruitmentParams) =>
  useQuery({
    queryKey: chapterAdminKeys.recruitment(params),
    queryFn: async () => {
      const res = await http.get("/chapter-admin/recruitment", { params });
      return ((res.data ?? []) as (RawMember & { duplicates: DuplicateMatch[] })[]).map(
        (raw): RecruitmentRequest => ({ ...mapMember(raw), duplicates: raw.duplicates ?? [] }),
      );
    },
  });

/** Members awaiting review — shown as the sidebar badge. */
export const useRecruitmentPendingCount = () =>
  useQuery({
    queryKey: chapterAdminKeys.pendingCount,
    queryFn: async () => {
      const res = await http.get("/chapter-admin/recruitment/pending-count");
      return (res.data ?? 0) as number;
    },
    refetchInterval: 60_000,
  });

function useReviewMutation<TBody>(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: TBody) => {
      const res = await http.post(`/chapter-admin/recruitment/${path}`, body);
      return res.data as ReviewResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chapterAdminKeys.recruitmentAll });
      qc.invalidateQueries({ queryKey: chapterAdminKeys.pendingCount });
    },
  });
}

export const useApproveMembers = () => useReviewMutation<{ ids: string[] }>("approve");
export const useRejectMembers = () => useReviewMutation<{ ids: string[]; note: string }>("reject");
export const useRequestMemberChanges = () =>
  useReviewMutation<{ ids: string[]; note: string }>("request-changes");

// ─── Chapters and new-chapter requests ─────────────────────────────────────

type RawRef = { _id?: string; name?: string; email?: string } | null | undefined;
const toRef = (r: RawRef) => (r && r._id ? { id: r._id, name: r.name ?? "" } : null);

export const useAdminChapters = () =>
  useQuery({
    queryKey: ["chapter-admin", "chapters"],
    queryFn: async () => {
      const res = await http.get("/chapter-admin/chapters");
      type Raw = Omit<AdminChapterRow, "church"> & { church: RawRef };
      return ((res.data ?? []) as Raw[]).map((c): AdminChapterRow => ({ ...c, church: toRef(c.church) }));
    },
  });

export const useChapterRequests = (status: "pending" | "rejected") =>
  useQuery({
    queryKey: ["chapter-admin", "chapter-requests", status],
    queryFn: async () => {
      const res = await http.get("/chapter-admin/chapter-requests", { params: { status } });
      type RawMember = {
        _id: string;
        fullName: string;
        memberId?: string | null;
        photo?: string | null;
        status: string;
        chapter?: RawRef;
        rank?: RawRef;
      };
      type Raw = {
        _id: string;
        name: string;
        status: ChapterRequest["status"];
        church: RawRef;
        requestedBy: RawRef;
        reviewNote?: string | null;
        createdAt: string;
        churchActiveMembers: number;
        members: RawMember[];
      };
      return ((res.data ?? []) as Raw[]).map(
        (r): ChapterRequest => ({
          id: r._id,
          name: r.name,
          status: r.status,
          church: toRef(r.church),
          requestedBy: r.requestedBy ? { name: r.requestedBy.name ?? "", email: r.requestedBy.email ?? "" } : null,
          reviewNote: r.reviewNote ?? null,
          createdAt: r.createdAt,
          churchActiveMembers: r.churchActiveMembers,
          members: r.members.map((m) => ({
            id: m._id,
            fullName: m.fullName,
            memberId: m.memberId ?? null,
            photo: m.photo ?? null,
            status: m.status,
            chapterName: m.chapter?.name ?? null,
            rankName: m.rank?.name ?? null,
          })),
        }),
      );
    },
  });

function useChapterRequestMutation<T>(fn: (vars: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chapter-admin"] }),
  });
}

export const useApproveChapterRequest = () =>
  useChapterRequestMutation((id: string) => http.post(`/chapter-admin/chapter-requests/${id}/approve`));

export const useRejectChapterRequest = () =>
  useChapterRequestMutation(({ id, note }: { id: string; note: string }) =>
    http.post(`/chapter-admin/chapter-requests/${id}/reject`, { note }),
  );

// ─── Achievements (read only) ──────────────────────────────────────────────

export const useAdminAchievements = (filter: { churchId?: string; year?: number }) =>
  useQuery({
    queryKey: ["chapter-admin", "achievements", filter],
    queryFn: async () => {
      const res = await http.get("/chapter-admin/achievements", { params: filter });
      return ((res.data ?? []) as RawAchievement[]).map(mapAchievement);
    },
  });
