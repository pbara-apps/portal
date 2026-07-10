import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserType } from "@/types/user";
import useCurrentUser from "@/hooks/useCurrentUser";
import http from ".";

interface LoginTypes {
  email: string;
  password: string;
}

export type ProfileUpdatePayload = {
  image?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  description?: string;
  password?: string;
};

type RawProfileUser = {
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
  start_year?: number;
  end_year?: number | null;
  status?: "active" | "inactive" | "completed";
  office?: { _id?: string; name?: string };
  church?: { _id?: string; name?: string; chapter?: string };
  role?: UserType["role"];
};

function mapProfileUser(user: RawProfileUser): UserType {
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
    status: user.status ?? "active",
    startYear: user.start_year,
    endYear: user.end_year ?? null,
    role: user.role ?? "viewer",
    token: "",
  };
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (body: LoginTypes) => {
      const res = await http.post("auth/login", body);
      return res.data as { user: unknown; token: string };
    },
  });
};

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
