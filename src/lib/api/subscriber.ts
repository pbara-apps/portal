import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import http from ".";

export interface AdminSubscriber {
  id: string;
  email: string;
  source: string | null;
  isActive: boolean;
  unsubscribedAt: string | null;
  createdAt: string;
}

export interface AdminNewsletter {
  id: string;
  subject: string;
  status: "sending" | "sent" | "partial" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentByName: string | null;
  createdAt: string;
}

export interface SendNewsletterPayload {
  subject: string;
  content: string;
  test_email?: string;
}

type RawSubscriber = {
  _id?: string;
  id?: string;
  email: string;
  source?: string | null;
  is_active?: boolean;
  unsubscribed_at?: string | null;
  createdAt?: string;
};

type RawNewsletter = {
  _id?: string;
  id?: string;
  subject: string;
  status: AdminNewsletter["status"];
  recipient_count?: number;
  sent_count?: number;
  failed_count?: number;
  sent_by_name?: string | null;
  createdAt?: string;
};

const mapNewsletter = (raw: RawNewsletter): AdminNewsletter => ({
  id: String(raw._id ?? raw.id ?? ""),
  subject: raw.subject,
  status: raw.status,
  recipientCount: raw.recipient_count ?? 0,
  sentCount: raw.sent_count ?? 0,
  failedCount: raw.failed_count ?? 0,
  sentByName: raw.sent_by_name ?? null,
  createdAt: raw.createdAt ?? "",
});

const mapSubscriber = (raw: RawSubscriber): AdminSubscriber => ({
  id: String(raw._id ?? raw.id ?? ""),
  email: raw.email,
  source: raw.source ?? null,
  isActive: raw.is_active ?? true,
  unsubscribedAt: raw.unsubscribed_at ?? null,
  createdAt: raw.createdAt ?? "",
});

export const subscriberKeys = {
  all: ["subscribers"] as const,
  newsletters: ["subscribers", "newsletters"] as const,
};

export const useGetSubscribers = () =>
  useQuery({
    queryKey: subscriberKeys.all,
    queryFn: async () => {
      const res = await http.get("/subscriber/");
      const list = (res.data ?? []) as RawSubscriber[];
      return list.map(mapSubscriber);
    },
  });

export const useDeleteSubscriber = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/subscriber/delete/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriberKeys.all }),
  });
};

export const useDeleteSubscribersBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await http.delete("/subscriber/delete/bulk", { data: { ids } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriberKeys.all }),
  });
};

export const useGetNewsletters = () =>
  useQuery({
    queryKey: subscriberKeys.newsletters,
    queryFn: async () => {
      const res = await http.get("/subscriber/newsletter");
      return ((res.data ?? []) as RawNewsletter[]).map(mapNewsletter);
    },
  });

export const useSendNewsletter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: SendNewsletterPayload) => {
      // Sending can take a while for large lists.
      const res = await http.post("/subscriber/newsletter/send", body, {
        timeout: 5 * 60_000,
      });
      return res as unknown as { message: string };
    },
    onSuccess: (_d, vars) => {
      if (!vars.test_email) {
        qc.invalidateQueries({ queryKey: subscriberKeys.newsletters });
      }
    },
  });
};
