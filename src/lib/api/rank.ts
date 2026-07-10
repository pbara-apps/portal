import { useQuery } from "@tanstack/react-query";
import { mapRank } from "@/lib/mappers/admin";
import http from ".";

export const rankKeys = {
  all: ["ranks"] as const,
};

export const useGetRanks = () =>
  useQuery({
    queryKey: rankKeys.all,
    queryFn: async () => {
      const res = await http.get("/rank/");
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapRank(item as Parameters<typeof mapRank>[0]),
      );
    },
  });
