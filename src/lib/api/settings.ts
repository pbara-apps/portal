import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HeroStat } from "@/types";
import type { PaymentAccount } from "@/types/admin";
import http from ".";

export const settingsKeys = {
  heroStats: ["settings", "hero-stats"] as const,
  paymentAccount: ["settings", "payment-account"] as const,
};

/** The association bank account; null until a super admin sets it. */
export const usePaymentAccount = () =>
  useQuery({
    queryKey: settingsKeys.paymentAccount,
    queryFn: async () => {
      const res = await http.get("/settings/payment-account");
      return (res.data ?? null) as PaymentAccount | null;
    },
  });

export const useUpdatePaymentAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PaymentAccount) => {
      const res = await http.put("/settings/payment-account", body);
      return res.data as PaymentAccount;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.paymentAccount });
      qc.invalidateQueries({ queryKey: ["programs"] });
    },
  });
};

type HeroStatsPayload = {
  stats: HeroStat[];
};

export const useGetHeroStatsForSettings = (enabled = true) =>
  useQuery({
    queryKey: settingsKeys.heroStats,
    queryFn: async () => {
      const res = await http.get("/admin/hero-stats");
      return ((res.data ?? []) as HeroStat[]).map((item) => ({
        end: Number(item.end ?? 0),
        label: String(item.label ?? "").trim(),
        suffix: String(item.suffix ?? "+").trim() || "+",
      }));
    },
    enabled,
  });

export const useUpdateHeroStats = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HeroStatsPayload) => {
      const res = await http.patch("/admin/hero-stats", payload);
      return (res.data ?? []) as HeroStat[];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.heroStats });
    },
  });
};
