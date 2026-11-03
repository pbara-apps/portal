import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { mapNotificationFeed } from "@/types/notification";

/**
 * Builds the notification hooks for one portal. Both portals use the same
 * endpoint shape; only the HTTP client (and so the login) differs.
 *
 * @param client   axios instance whose interceptor resolves to the response body
 * @param basePath notifications path on that client, e.g. "/notifications"
 * @param key      react-query cache key prefix for this portal
 */
export function makeNotificationHooks(client: AxiosInstance, basePath: string, key: string) {
  const feedKey = [key, "notifications"] as const;

  const useNotifications = (enabled = true) =>
    useQuery({
      queryKey: feedKey,
      enabled,
      refetchInterval: 60_000,
      queryFn: async () => {
        const res = (await client.get(basePath)) as { data?: unknown };
        return mapNotificationFeed(res.data as Parameters<typeof mapNotificationFeed>[0]);
      },
    });

  const useMarkRead = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await client.patch(`${basePath}/${id}/read`);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: feedKey }),
    });
  };

  const useMarkAllRead = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async () => {
        await client.post(`${basePath}/read-all`);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: feedKey }),
    });
  };

  return { useNotifications, useMarkRead, useMarkAllRead };
}

export type NotificationHooks = ReturnType<typeof makeNotificationHooks>;
