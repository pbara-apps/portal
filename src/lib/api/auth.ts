import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserType } from "@/types/user";
import useCurrentUser from "@/hooks/useCurrentUser";
import http from ".";

export type ProfileUpdatePayload = {
  image?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  description?: string;
  password?: string;
};

export type RawProfileUser = {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  image?: string | null;
  title?: string;
  description?: string;
  office_id?: string;
  church_id?: string;
  rank_id?: string | null;
  start_year?: number;
  end_year?: number | null;
  status?: "active" | "inactive" | "completed";
  office?: { _id?: string; name?: string };
  church?: { _id?: string; name?: string; chapter?: string };
  rank?: { _id?: string; name?: string };
  role?: UserType["role"];
  is_finance?: boolean;
  has_changed_password?: boolean;
  /** The linked executive profile's id (the profile's own `_id` is the account id). */
  executive_id?: string | null;
};

export function mapProfileUser(user: RawProfileUser): UserType {
  return {
    id: user._id ?? user.id ?? "",
    name: user.name,
    email: user.email ?? "",
    phone: user.phone ?? "",
    image: user.image ?? null,
    title: user.title ?? "",
    description: user.description ?? "",
    officeId: user.office_id ?? user.office?._id ?? "",
    officeName: user.office?.name ?? "",
    churchId: user.church_id ?? user.church?._id ?? "",
    churchName: user.church?.name ?? "",
    chapterName: user.church?.chapter ?? "",
    rankId: user.rank_id ?? user.rank?._id ?? null,
    rankName: user.rank?.name ?? "",
    status: user.status ?? "active",
    startYear: user.start_year,
    endYear: user.end_year ?? null,
    role: user.role ?? "viewer",
    isFinance: user.is_finance === true,
    hasChangedPassword: user.has_changed_password !== false,
    executiveId: user.executive_id ?? null,
    token: "",
  };
}

export const authKeys = {
  profile: ["auth", "profile"] as const,
};

export const useProfile = (enabled = true) => {
  const { token, setCurrentUser } = useCurrentUser();

  return useQuery({
    queryKey: authKeys.profile,
    enabled: enabled && Boolean(token),
    queryFn: async () => {
      const res = await http.get("auth/me");
      const user = res.data as unknown as RawProfileUser;
      const mapped = mapProfileUser(user);

      if (token) {
        setCurrentUser({
          user: { ...mapped, token },
          token,
        });
      }

      return mapped;
    },
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const { token, setCurrentUser } = useCurrentUser();

  return useMutation({
    mutationFn: async (body: ProfileUpdatePayload) => {
      const res = await http.patch("auth/me", body);
      return mapProfileUser(res.data as RawProfileUser);
    },
    onSuccess: (mapped) => {
      if (token) {
        setCurrentUser({
          user: { ...mapped, token },
          token,
        });
      }
      qc.invalidateQueries({ queryKey: authKeys.profile });
    },
  });
};

/** Admin "forgot password": emails a reset link (same reply whether or not the email exists). */
export const useForgotPassword = () =>
  useMutation({
    mutationFn: async (email: string) => {
      await http.post("auth/forgot-password", { email });
    },
  });

/** Sets a new admin password using the token from the reset email. */
export const useResetPassword = () =>
  useMutation({
    mutationFn: async (body: { token: string; password: string }) => {
      await http.post("auth/reset-password", body);
    },
  });
