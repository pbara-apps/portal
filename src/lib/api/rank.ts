import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapRank } from "@/lib/mappers/admin";
import type { AdminRank, RankFormPayload } from "@/types/admin";
import http from ".";

export const rankKeys = {
  all: ["ranks"] as const,
};

type RawRankList = Parameters<typeof mapRank>[0][];

/** All ranks, already sorted by ladder position (lowest first) by the API. */
export const useGetRanks = () =>
  useQuery({
    queryKey: rankKeys.all,
    queryFn: async () => {
      const res = await http.get("/rank/");
      return ((res.data ?? []) as RawRankList).map(mapRank);
    },
  });

export const useCreateRank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: RankFormPayload) => {
      const res = await http.post("/rank/create", body);
      return mapRank(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rankKeys.all }),
  });
};

export const useUpdateRank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<RankFormPayload> }) => {
      const res = await http.patch(`/rank/update/${id}`, body);
      return mapRank(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rankKeys.all }),
  });
};

/**
 * Saves a full new ladder. The list is applied to the cache straight away
 * so the move feels instant, and rolled back if the request fails.
 */
export const useReorderRanks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ranks: AdminRank[]) => {
      const res = await http.patch("/rank/reorder", {
        ids: ranks.map((r) => r.id),
      });
      return ((res.data ?? []) as RawRankList).map(mapRank);
    },
    onMutate: async (ranks) => {
      await qc.cancelQueries({ queryKey: rankKeys.all });
      const previous = qc.getQueryData<AdminRank[]>(rankKeys.all);
      qc.setQueryData<AdminRank[]>(
        rankKeys.all,
        ranks.map((r, index) => ({ ...r, order: index + 1 })),
      );
      return { previous };
    },
    onError: (_err, _ranks, context) => {
      if (context?.previous) qc.setQueryData(rankKeys.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: rankKeys.all }),
  });
};

export const useDeleteRank = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/rank/delete/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rankKeys.all }),
  });
};
