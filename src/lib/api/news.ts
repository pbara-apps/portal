import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapNews, mapPublicNews } from "@/lib/mappers/admin";
import type { NewsFormPayload } from "@/types/admin";
import http from ".";
import { adminKeys } from "./admin";

export const newsKeys = {
  all: ["news"] as const,
  public: ["news", "public"] as const,
};

export const useGetNews = () =>
  useQuery({
    queryKey: newsKeys.all,
    queryFn: async () => {
      const res = await http.get("/news/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) => mapNews(item as Parameters<typeof mapNews>[0]));
    },
  });

export const useGetPublicNews = () =>
  useQuery({
    queryKey: newsKeys.public,
    queryFn: async () => {
      const res = await http.get("/news/public");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapPublicNews(item as Parameters<typeof mapPublicNews>[0]),
      );
    },
  });

export const useCreateNews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: NewsFormPayload) => {
      const res = await http.post("/news/create", body);
      return mapNews(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: newsKeys.all });
      qc.invalidateQueries({ queryKey: newsKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useUpdateNews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<NewsFormPayload> }) => {
      const res = await http.patch(`/news/update/${id}`, body);
      return mapNews(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: newsKeys.all });
      qc.invalidateQueries({ queryKey: newsKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteNews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/news/delete/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: newsKeys.all });
      qc.invalidateQueries({ queryKey: newsKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteNewsBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.delete("/news/delete/bulk", { data: { ids } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: newsKeys.all });
      qc.invalidateQueries({ queryKey: newsKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};
