import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapMessage } from "@/lib/mappers/admin";
import type { ContactFormPayload } from "@/types/admin";
import http from ".";
import { adminKeys } from "./admin";

export const messageKeys = {
  all: ["messages"] as const,
  unreadCount: ["messages", "unread-count"] as const,
};

export const useGetMessages = () =>
  useQuery({
    queryKey: messageKeys.all,
    queryFn: async () => {
      const res = await http.get("/message/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapMessage(item as Parameters<typeof mapMessage>[0]),
      );
    },
  });

export const useGetUnreadMessageCount = () =>
  useQuery({
    queryKey: messageKeys.unreadCount,
    queryFn: async () => {
      const res = await http.get("/message/unread-count");
      return (res.data?.count ?? 0) as number;
    },
    refetchInterval: 60_000,
  });

export const useSubmitContactMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ContactFormPayload) => {
      const res = await http.post("/message/public/create", body);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all });
      qc.invalidateQueries({ queryKey: messageKeys.unreadCount });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useMarkMessageRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await http.patch(`/message/read/${id}`);
      return mapMessage(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all });
      qc.invalidateQueries({ queryKey: messageKeys.unreadCount });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useMarkMessagesReadBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.patch("/message/read/bulk", { ids });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all });
      qc.invalidateQueries({ queryKey: messageKeys.unreadCount });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/message/delete/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all });
      qc.invalidateQueries({ queryKey: messageKeys.unreadCount });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};

export const useDeleteMessagesBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.delete("/message/delete/bulk", { data: { ids } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all });
      qc.invalidateQueries({ queryKey: messageKeys.unreadCount });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
};
