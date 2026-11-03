import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapTransfer } from "@/types/transfer";
import chapterHttp from "./http";

const key = ["chapter-portal", "transfers"] as const;

export const useTransfers = () =>
  useQuery({
    queryKey: key,
    queryFn: async () => ((await chapterHttp.get("/transfers")).data as unknown[]).map(mapTransfer),
  });

/** Every active chapter in the association (where a member could move to). */
export const useTransferDestinations = (enabled: boolean) =>
  useQuery({
    queryKey: [...key, "destinations"],
    enabled,
    queryFn: async () =>
      (await chapterHttp.get("/transfers/destinations")).data as { id: string; name: string; churchName: string }[],
  });

export const useRequestTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { memberId: string; toChapterId: string; reason?: string | null }) => {
      await chapterHttp.post("/transfers", body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
};
