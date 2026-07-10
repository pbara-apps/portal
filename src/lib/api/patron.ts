import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapPatron, mapPublicPatron } from "@/lib/mappers/admin";
import type { PatronFormPayload } from "@/types/admin";
import http from ".";
import { adminKeys } from "./admin";

export const patronKeys = {
  all: ["patrons"] as const,
  public: ["patrons", "public"] as const,
};

export const useGetPatrons = () =>
  useQuery({
    queryKey: patronKeys.all,
    queryFn: async () => {
      const res = await http.get("/patron/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapPatron(item as Parameters<typeof mapPatron>[0]),
      );
    },
  });

export const useGetPublicPatrons = () =>
  useQuery({
    queryKey: patronKeys.public,
    queryFn: async () => {
      const res = await http.get("/patron/public");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapPublicPatron(item as Parameters<typeof mapPublicPatron>[0]),
      );
    },
  });

export const useCreatePatron = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PatronFormPayload) => {
      const res = await http.post("/patron/create", body);
      return mapPatron(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patronKeys.all });
      qc.invalidateQueries({ queryKey: patronKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useUpdatePatron = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<PatronFormPayload>;
    }) => {
      const res = await http.patch(`/patron/update/${id}`, body);
      return mapPatron(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patronKeys.all });
      qc.invalidateQueries({ queryKey: patronKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeletePatron = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/patron/delete/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patronKeys.all });
      qc.invalidateQueries({ queryKey: patronKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeletePatronsBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.delete("/patron/delete/bulk", { data: { ids } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patronKeys.all });
      qc.invalidateQueries({ queryKey: patronKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};
