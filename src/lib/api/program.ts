import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapProgram } from "@/lib/mappers/admin";
import type { ProgramFormPayload } from "@/types/admin";
import http from ".";

export const programKeys = {
  all: ["programs"] as const,
};

export const useGetPrograms = () =>
  useQuery({
    queryKey: programKeys.all,
    queryFn: async () => {
      const res = await http.get("/program/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapProgram(item as Parameters<typeof mapProgram>[0]),
      );
    },
  });

export const useCreateProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ProgramFormPayload) => {
      const res = await http.post("/program/create", body);
      return mapProgram(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.all });
    },
  });
};

export const useUpdateProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<ProgramFormPayload>;
    }) => {
      const res = await http.patch(`/program/update/${id}`, body);
      return mapProgram(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.all });
    },
  });
};

export const useDeleteProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await http.delete(`/program/delete/${id}`);
      return mapProgram(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programKeys.all });
    },
  });
};
