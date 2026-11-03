import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CredentialDelivery } from "@/features/chapter/types";
import type {
  CounsellorAccount,
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
