import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapEvent, mapPublicEvent } from "@/lib/mappers/admin";
import type { EventFormPayload } from "@/types/admin";
import http from ".";
import { adminKeys } from "./admin";

export const eventKeys = {
  all: ["events"] as const,
  public: ["events", "public"] as const,
};

export const useGetEvents = () =>
  useQuery({
    queryKey: eventKeys.all,
    queryFn: async () => {
      const res = await http.get("/event/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) => mapEvent(item as Parameters<typeof mapEvent>[0]));
    },
  });

export const useGetPublicEvents = () =>
  useQuery({
    queryKey: eventKeys.public,
    queryFn: async () => {
      const res = await http.get("/event/public");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapPublicEvent(item as Parameters<typeof mapPublicEvent>[0]),
      );
    },
  });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: EventFormPayload) => {
      const res = await http.post("/event/create", body);
      return mapEvent(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
      qc.invalidateQueries({ queryKey: eventKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<EventFormPayload> }) => {
      const res = await http.patch(`/event/update/${id}`, body);
      return mapEvent(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
      qc.invalidateQueries({ queryKey: eventKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/event/delete/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
      qc.invalidateQueries({ queryKey: eventKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteEventsBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.delete("/event/delete/bulk", { data: { ids } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
      qc.invalidateQueries({ queryKey: eventKeys.public });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};
