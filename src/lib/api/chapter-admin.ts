import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapMember, type RawMember } from "@/features/chapter/lib/mappers";
import type { CredentialDelivery } from "@/features/chapter/types";
import type {
  CounsellorAccount,
  DuplicateMatch,
  RecruitmentRequest,
  ReviewResult,
} from "@/types/chapter-admin";
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
