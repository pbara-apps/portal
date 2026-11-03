import { useMutation, useQuery } from "@tanstack/react-query";
import { useChapterSession } from "../store/useChapterSession";
import type { PortalProfile } from "../types";
import chapterHttp from "./http";

export const portalAuthKeys = { me: ["chapter-portal", "me"] as const };

export const useChapterLogin = () =>
  useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const res = await chapterHttp.post("/auth/login", body);
      return res.data as { token: string; user: PortalProfile };
    },
  });

/** Refreshes the signed-in profile (e.g. after the counsellor's chapters change). */
export const useChapterProfile = () => {
  const token = useChapterSession((s) => s.token);
  const setProfile = useChapterSession((s) => s.setProfile);
  return useQuery({
    queryKey: portalAuthKeys.me,
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await chapterHttp.get("/auth/me");
      const profile = res.data as PortalProfile;
      setProfile(profile);
      return profile;
    },
  });
};

export const useChangePassword = () => {
  const setProfile = useChapterSession((s) => s.setProfile);
  return useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      const res = await chapterHttp.post("/auth/change-password", body);
      return res.data as PortalProfile;
    },
    onSuccess: (profile) => setProfile(profile),
  });
};
