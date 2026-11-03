import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import http from ".";

/** Admin hooks: announcements, meeting reports, census progress. */

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  audience: "all" | "selected";
  churches: string[];
  readCount: number;
  recipientCount: number;
  readers: { name: string; role: string }[];
  createdAt: string;
}

export interface MeetingReport {
  id: string;
  date: string;
  activity: string;
  report: string | null;
  attended: number;
  memberCount: number;
  visitors: number;
  chapterName: string;
  churchName: string;
}

export interface CensusProgressRow {
  chapterId: string;
  chapterName: string;
  churchName: string;
  done: boolean;
  confirmedCount: number | null;
  removedCount: number | null;
  submittedAt: string | null;
}

const root = ["engagement"] as const;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const useAdminAnnouncements = () =>
  useQuery({
    queryKey: [...root, "announcements"],
    queryFn: async () =>
      ((await http.get("/engagement/announcements")).data as any[]).map(
        (a): AdminAnnouncement => ({
          id: a._id,
          title: a.title,
          body: a.body,
          audience: a.audience,
          churches: (a.targetChurches ?? []).map((c: any) => c.name),
          readCount: a.readCount,
          recipientCount: a.recipientCount,
          readers: (a.reads ?? []).map((r: any) => ({ name: r.user?.name ?? "", role: r.user?.role ?? "" })),
          createdAt: a.createdAt,
        }),
      ),
  });

export const useMeetingReports = (churchId?: string) =>
  useQuery({
    queryKey: [...root, "meetings", churchId ?? "all"],
    queryFn: async () =>
      ((await http.get("/engagement/meetings", { params: { churchId } })).data as any[]).map(
        (m): MeetingReport => ({
          id: m._id,
          date: m.date,
          activity: m.activity,
          report: m.report ?? null,
          attended: m.presentCount ?? 0,
          memberCount: m.memberCount,
          visitors: m.visitors ?? 0,
          chapterName: m.chapter?.name ?? "",
          churchName: m.church?.name ?? "",
        }),
      ),
  });
/* eslint-enable @typescript-eslint/no-explicit-any */

export const useCensusProgress = (year: number) =>
  useQuery({
    queryKey: [...root, "census", year],
    queryFn: async () => (await http.get("/engagement/census", { params: { year } })).data as CensusProgressRow[],
  });

function useEngagementMutation<T>(fn: (vars: T) => Promise<{ data?: unknown }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: T) => (await fn(vars)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: root }),
  });
}

export const useCreateAnnouncement = () =>
  useEngagementMutation((body: { title: string; body: string; audience: "all" | "selected"; churchIds?: string[] }) =>
    http.post("/engagement/announcements", body),
  );
export const useDeleteAnnouncement = () =>
  useEngagementMutation((id: string) => http.delete(`/engagement/announcements/${id}`));
export const useCensusRemind = () => useEngagementMutation((_: void) => http.post("/engagement/census/remind"));
