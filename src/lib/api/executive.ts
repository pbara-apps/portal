import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  mapExecutive,
  mapPublicExecutive,
} from "@/lib/mappers/admin";
import type { ExecutiveFormPayload } from "@/types/admin";
import http from ".";
import { adminKeys } from "./admin";

export const executiveKeys = {
  all: ["executives"] as const,
  public: ["executives", "public"] as const,
};

export const useGetExecutives = () =>
  useQuery({
    queryKey: executiveKeys.all,
    queryFn: async () => {
      const res = await http.get("/executive/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) => mapExecutive(item as Parameters<typeof mapExecutive>[0]));
    },
  });

export const useGetPublicExecutives = () =>
  useQuery({
    queryKey: executiveKeys.public,
    queryFn: async () => {
      const res = await http.get("/executive/public");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapPublicExecutive(item as Parameters<typeof mapPublicExecutive>[0]),
      );
    },
  });

export const useCreateExecutive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ExecutiveFormPayload) => {
      const res = await http.post("/executive/create", body);
      return mapExecutive(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: executiveKeys.all });
      qc.invalidateQueries({ queryKey: executiveKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useUpdateExecutive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<ExecutiveFormPayload>;
    }) => {
      const res = await http.patch(`/executive/update/${id}`, body);
      return mapExecutive(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: executiveKeys.all });
      qc.invalidateQueries({ queryKey: executiveKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteExecutive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/executive/delete/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: executiveKeys.all });
      qc.invalidateQueries({ queryKey: executiveKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteExecutivesBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.delete("/executive/delete/bulk", { data: { ids } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: executiveKeys.all });
      qc.invalidateQueries({ queryKey: executiveKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};
