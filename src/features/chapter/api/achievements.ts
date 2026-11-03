import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type RawAchievement, mapAchievement } from "@/types/achievement";
import chapterHttp from "./http";

export type AchievementPayload = {
  name: string;
  proofUrl: string;
  month: number;
  year: number;
  description?: string | null;
};

const key = ["chapter-portal", "achievements"] as const;

export const useAchievements = (chapterId?: string) =>
  useQuery({
    queryKey: [...key, chapterId ?? "all"],
    queryFn: async () => {
      const res = await chapterHttp.get("/achievements", { params: { chapterId } });
      return ((res.data ?? []) as RawAchievement[]).map(mapAchievement);
    },
  });

function useAchievementMutation<T>(fn: (vars: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
}

export const useCreateAchievement = () =>
  useAchievementMutation((body: AchievementPayload & { chapterId: string }) => chapterHttp.post("/achievements", body));

export const useUpdateAchievement = () =>
  useAchievementMutation(({ id, body }: { id: string; body: Partial<AchievementPayload> }) =>
    chapterHttp.patch(`/achievements/${id}`, body),
  );

export const useDeleteAchievement = () =>
  useAchievementMutation((id: string) => chapterHttp.delete(`/achievements/${id}`));
