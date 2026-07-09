import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapChapter, mapPublicChapter } from "@/lib/mappers/admin";
import type { ChapterFormPayload } from "@/types/admin";
import http from ".";
import { adminKeys } from "./admin";

export const chapterKeys = {
  all: ["chapters"] as const,
  public: ["chapters", "public"] as const,
};

export const useGetChapters = () =>
  useQuery({
    queryKey: chapterKeys.all,
    queryFn: async () => {
      const res = await http.get("/church/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) => mapChapter(item as Parameters<typeof mapChapter>[0]));
    },
  });

export const useGetPublicChapters = () =>
  useQuery({
    queryKey: chapterKeys.public,
    queryFn: async () => {
      const res = await http.get("/church/public");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapPublicChapter(item as Parameters<typeof mapPublicChapter>[0]),
      );
    },
  });

export const useCreateChapter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ChapterFormPayload) => {
      const res = await http.post("/church/create", body);
      return mapChapter(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chapterKeys.all });
      qc.invalidateQueries({ queryKey: chapterKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useUpdateChapter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<ChapterFormPayload>;
    }) => {
      const res = await http.patch(`/church/update/${id}`, body);
      return mapChapter(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chapterKeys.all });
      qc.invalidateQueries({ queryKey: chapterKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteChapter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/church/delete/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chapterKeys.all });
      qc.invalidateQueries({ queryKey: chapterKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteChaptersBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.delete("/church/delete/bulk", { data: { ids } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chapterKeys.all });
      qc.invalidateQueries({ queryKey: chapterKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};
