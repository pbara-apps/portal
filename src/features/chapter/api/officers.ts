import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChapterOfficers, CredentialDelivery, PortalAccount } from "../types";
import chapterHttp from "./http";

const officerKeys = { all: ["chapter-portal", "officers"] as const };

/** Counsellor only: each chapter with its president and secretary. */
export const useOfficers = () =>
  useQuery({
    queryKey: officerKeys.all,
    queryFn: async () => {
      const res = await chapterHttp.get("/officers");
      return (res.data ?? []) as ChapterOfficers[];
    },
  });

export const useAssignOfficer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      chapterId: string;
      role: "president" | "secretary";
      memberId: string;
      email: string;
      phone?: string;
    }) => {
      const res = await chapterHttp.post("/officers", body);
      return res.data as CredentialDelivery & { account: PortalAccount; replaced: boolean };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: officerKeys.all }),
  });
};

export const useResendOfficerPassword = () =>
  useMutation({
    mutationFn: async (officerId: string) => {
      const res = await chapterHttp.post(`/officers/${officerId}/resend-password`);
      return res.data as CredentialDelivery;
    },
  });

export const useRemoveOfficer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (officerId: string) => {
      await chapterHttp.delete(`/officers/${officerId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: officerKeys.all }),
  });
};
