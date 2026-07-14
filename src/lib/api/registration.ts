import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapRegistration } from "@/lib/mappers/admin";
import {
  countParticipantsByProgramId,
  fetchAllRegistrations,
  flattenRegistrationParticipants,
} from "@/lib/registrations/participants";
import type {
  ProgramParticipantRow,
  RegistrationListParams,
  RegistrationListResult,
  RegistrationStatusPayload,
} from "@/types/admin";
import http from ".";

export const registrationKeys = {
  all: ["registrations"] as const,
  list: (params: RegistrationListParams) =>
    [...registrationKeys.all, "list", params] as const,
  detail: (id: string) => [...registrationKeys.all, "detail", id] as const,
  programParticipants: (programId: string) =>
    [...registrationKeys.all, "program-participants", programId] as const,
  participantCounts: ["registrations", "participant-counts"] as const,
  pendingCount: ["registrations", "pending-count"] as const,
};

export const useGetPendingRegistrationCount = () =>
  useQuery({
    queryKey: registrationKeys.pendingCount,
    queryFn: async () => {
      const res = await http.get("/registration/pending-count");
      return (res.data?.count ?? 0) as number;
    },
    refetchInterval: 60_000,
  });

export const useGetRegistrations = (params: RegistrationListParams = {}) =>
  useQuery({
    queryKey: registrationKeys.list(params),
    queryFn: async (): Promise<RegistrationListResult> => {
      const res = await http.get("/registration/", { params });
      const payload = res.data as {
        items?: unknown[];
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
      };
      return {
        items: (payload.items ?? []).map((item) =>
          mapRegistration(item as Parameters<typeof mapRegistration>[0]),
        ),
        page: payload.page ?? params.page ?? 1,
        limit: payload.limit ?? params.limit ?? 20,
        total: payload.total ?? 0,
        totalPages: payload.totalPages ?? 0,
      };
    },
  });

export const useGetRegistration = (id: string | null) =>
  useQuery({
    queryKey: registrationKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await http.get(`/registration/${id}`);
      return mapRegistration(res.data);
    },
  });

export const useGetProgramParticipants = (programId: string | null) =>
  useQuery({
    queryKey: registrationKeys.programParticipants(programId ?? ""),
    enabled: Boolean(programId),
    queryFn: async (): Promise<ProgramParticipantRow[]> => {
      const registrations = await fetchAllRegistrations({
        programId: programId!,
      });
      return flattenRegistrationParticipants(registrations);
    },
  });

export const useGetParticipantCountsByProgram = () =>
  useQuery({
    queryKey: registrationKeys.participantCounts,
    queryFn: async (): Promise<Record<string, number>> => {
      const registrations = await fetchAllRegistrations();
      return countParticipantsByProgramId(registrations);
    },
  });

export const useUpdateRegistrationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: RegistrationStatusPayload;
    }) => {
      const res = await http.patch(`/registration/status/${id}`, body);
      return mapRegistration(res.data);
    },
    onSuccess: (updated) => {
      qc.setQueriesData<RegistrationListResult>(
        { queryKey: registrationKeys.all },
        (current) => {
          if (
            !current ||
            typeof current !== "object" ||
            !("items" in current)
          ) {
            return current;
          }
          return {
            ...current,
            items: current.items.map((item) =>
              item.id === updated.id ? updated : item,
            ),
          };
        },
      );
      qc.setQueryData(registrationKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: registrationKeys.pendingCount });
      qc.invalidateQueries({ queryKey: registrationKeys.participantCounts });
      if (updated.programId) {
        qc.invalidateQueries({
          queryKey: registrationKeys.programParticipants(updated.programId),
        });
      }
    },
  });
};
