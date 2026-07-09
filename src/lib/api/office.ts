import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapOffice } from "@/lib/mappers/admin";
import type { OfficeFormPayload } from "@/types/admin";
import http from ".";
import { adminKeys } from "./admin";

export const officeKeys = {
  all: ["offices"] as const,
};

export const useGetOffices = () =>
  useQuery({
    queryKey: officeKeys.all,
    queryFn: async () => {
      const res = await http.get("/office/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) => mapOffice(item as Parameters<typeof mapOffice>[0]));
    },
  });

export const useCreateOffice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: OfficeFormPayload) => {
      const res = await http.post("/office/create", body);
      return mapOffice(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: officeKeys.all });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useUpdateOffice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<OfficeFormPayload>;
    }) => {
      const res = await http.patch(`/office/update/${id}`, body);
      return mapOffice(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: officeKeys.all });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteOffice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/office/delete/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: officeKeys.all });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteOfficesBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.delete("/office/delete/bulk", { data: { ids } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: officeKeys.all });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};
