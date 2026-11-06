import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CredentialDelivery } from "@/features/chapter/types";
import type { ExecutiveRole } from "@/types/user";
import http from ".";

/** An account with admin portal access (managed by super admins). */
export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasChangedPassword: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  memberId: string | null;
  admin: {
    role: ExecutiveRole;
    isFinance: boolean;
    active: boolean;
    executiveId: string | null;
    executive: { id: string | null; name: string; image: string | null; office: string; church: string } | null;
  };
  chapterAccess: { role: string; churchId: string; chapterId: string | null; active: boolean } | null;
}

export interface AvailableExecutive {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  office: string;
  status: string;
}

export type CreateAdminAccountInput =
  | { executiveId: string; email?: string; role: ExecutiveRole; is_finance?: boolean }
  | { name: string; email: string; phone?: string; role: ExecutiveRole };

export const accountKeys = {
  admins: ["accounts", "admins"] as const,
  availableExecutives: ["accounts", "available-executives"] as const,
};

export const useAdminAccounts = (enabled = true) =>
  useQuery({
    queryKey: accountKeys.admins,
    enabled,
    queryFn: async () => {
      const res = await http.get("/accounts/admins");
      return (res.data ?? []) as AdminAccount[];
    },
  });

export const useAvailableExecutives = (enabled = true) =>
  useQuery({
    queryKey: accountKeys.availableExecutives,
    enabled,
    queryFn: async () => {
      const res = await http.get("/accounts/admins/available-executives");
      return (res.data ?? []) as AvailableExecutive[];
    },
  });

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: accountKeys.admins });
    qc.invalidateQueries({ queryKey: accountKeys.availableExecutives });
  };
}

export const useCreateAdminAccount = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (body: CreateAdminAccountInput) => {
      const res = await http.post("/accounts/admins", body);
      return res.data as CredentialDelivery & { account: AdminAccount; created: boolean };
    },
    onSuccess: invalidate,
  });
};

export const useUpdateAdminAccount = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: { id: string; role?: ExecutiveRole; is_finance?: boolean; active?: boolean; executiveId?: string | null }) => {
      const res = await http.patch(`/accounts/admins/${id}`, body);
      return res.data as AdminAccount;
    },
    onSuccess: invalidate,
  });
};

export const useResendAdminPassword = () =>
  useMutation({
    mutationFn: async (id: string) => {
      const res = await http.post(`/accounts/admins/${id}/resend-password`);
      return res.data as CredentialDelivery;
    },
  });
