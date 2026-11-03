import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import chapterHttp from "./http";

/** Chapter portal hooks: announcements, meetings, attendance, census. */

export interface PortalAnnouncement { id: string; title: string; body: string; createdAt: string; read: boolean }
export interface Meeting {
  id: string;
  date: string;
  activity: string;
  report: string | null;
  present: string[];
  memberCount: number;
  visitors: number;
  chapter: { id: string; name: string } | null;
  recordedBy: { name: string } | null;
}
export interface CensusRecord { year: number; confirmedCount: number; removed: { member: string; reason: string }[]; createdAt: string }

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapMeeting = (m: any): Meeting => ({
  id: m._id,
  date: m.date,
  activity: m.activity,
  report: m.report ?? null,
  present: (m.present ?? []).map(String),
  memberCount: m.memberCount,
  visitors: m.visitors ?? 0,
  chapter: m.chapter?._id ? { id: m.chapter._id, name: m.chapter.name } : null,
  recordedBy: m.recordedBy?.name ? { name: m.recordedBy.name } : null,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const keys = {
  announcements: ["chapter-portal", "announcements"] as const,
  meetings: ["chapter-portal", "meetings"] as const,
  census: ["chapter-portal", "census"] as const,
};

export const useAnnouncements = () =>
  useQuery({
    queryKey: keys.announcements,
    queryFn: async () =>
      ((await chapterHttp.get("/announcements")).data as (Omit<PortalAnnouncement, "id"> & { _id: string })[]).map(
        ({ _id, ...a }) => ({ id: _id, ...a }),
      ),
  });

export const useReadAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await chapterHttp.post(`/announcements/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.announcements }),
  });
};

export const useMeetings = (chapterId?: string) =>
  useQuery({
    queryKey: [...keys.meetings, chapterId ?? "all"],
    queryFn: async () => ((await chapterHttp.get("/meetings", { params: { chapterId } })).data as unknown[]).map(mapMeeting),
  });

export type MeetingPayload = { date: string; activity: string; report?: string | null; presentIds: string[]; visitors?: number };

export const useSaveMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, chapterId, body }: { id?: string; chapterId: string; body: MeetingPayload }) => {
      if (id) await chapterHttp.patch(`/meetings/${id}`, body);
      else await chapterHttp.post("/meetings", { ...body, chapterId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.meetings }),
  });
};

export const useDeleteMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await chapterHttp.delete(`/meetings/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.meetings }),
  });
};

export const useMemberAttendance = (memberId?: string) =>
  useQuery({
    queryKey: ["chapter-portal", "attendance", memberId],
    enabled: Boolean(memberId),
    queryFn: async () =>
      (await chapterHttp.get(`/members/${memberId}/attendance`)).data as { held: number; attended: number; rate: number | null },
  });

export const useCensus = (chapterId: string, year: number) =>
  useQuery({
    queryKey: [...keys.census, chapterId, year],
    enabled: Boolean(chapterId),
    queryFn: async () =>
      ((await chapterHttp.get("/census", { params: { chapterId, year } })).data as { census: CensusRecord | null }).census,
  });

export const useSubmitCensus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { chapterId: string; year: number; removed: { memberId: string; reason: string }[] }) => {
      await chapterHttp.post("/census", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.census });
      qc.invalidateQueries({ queryKey: ["chapter-portal", "members"] });
      qc.invalidateQueries({ queryKey: ["chapter-portal", "dashboard"] });
    },
  });
};
