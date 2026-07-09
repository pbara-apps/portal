import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapGallery } from "@/lib/mappers/admin";
import type { GalleryFormPayload } from "@/types/admin";
import http from ".";
import { adminKeys } from "./admin";

export const galleryKeys = {
  all: ["gallery"] as const,
  public: (type?: string) => ["gallery", "public", type ?? "all"] as const,
};

export const useGetGallery = () =>
  useQuery({
    queryKey: galleryKeys.all,
    queryFn: async () => {
      const res = await http.get("/gallery/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapGallery(item as Parameters<typeof mapGallery>[0]),
      );
    },
  });

export const useGetPublicGallery = (type?: "photo" | "video") =>
  useQuery({
    queryKey: galleryKeys.public(type),
    queryFn: async () => {
      const res = await http.get("/gallery/public", {
        params: type ? { type } : undefined,
      });
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapGallery(item as Parameters<typeof mapGallery>[0]),
      );
    },
  });

export const useCreateGalleryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: GalleryFormPayload) => {
      const res = await http.post("/gallery/create", body);
      return mapGallery(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: galleryKeys.all });
      qc.invalidateQueries({ queryKey: ["gallery", "public"] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useCreateGalleryBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: GalleryFormPayload[]) => {
      const res = await http.post("/gallery/create/bulk", body);
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapGallery(item as Parameters<typeof mapGallery>[0]),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: galleryKeys.all });
      qc.invalidateQueries({ queryKey: ["gallery", "public"] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useUpdateGalleryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<GalleryFormPayload>;
    }) => {
      const res = await http.patch(`/gallery/update/${id}`, body);
      return mapGallery(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: galleryKeys.all });
      qc.invalidateQueries({ queryKey: ["gallery", "public"] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteGalleryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/gallery/delete/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: galleryKeys.all });
      qc.invalidateQueries({ queryKey: ["gallery", "public"] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteGalleryBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.delete("/gallery/delete/bulk", { data: { ids } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: galleryKeys.all });
      qc.invalidateQueries({ queryKey: ["gallery", "public"] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};
