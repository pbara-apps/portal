import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapExecutive } from "@/lib/mappers/admin";
import type { HeroStat } from "@/types";
import type { ExecutiveRole } from "@/types/user";
import http from ".";
import { executiveKeys } from "./executive";

export const settingsKeys = {
  executives: ["settings", "executives"] as const,
  heroStats: ["settings", "hero-stats"] as const,
};

type HeroStatsPayload = {
  stats: HeroStat[];
};

export const useGetExecutivesForSettings = (enabled = true) =>
  useQuery({
    queryKey: settingsKeys.executives,
    queryFn: async () => {
      const res = await http.get("/settings/executives");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapExecutive(item as Parameters<typeof mapExecutive>[0]),
      );
    },
    enabled,
  });

export const useUpdateExecutiveRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      role,
    }: {
      id: string;
      role: ExecutiveRole;
    }) => {
      const res = await http.patch(`/settings/executives/${id}/role`, { role });
      return mapExecutive(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.executives });
      qc.invalidateQueries({ queryKey: executiveKeys.all });
    },
  });
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
