import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { LuAward, LuExternalLink, LuRefreshCw } from "react-icons/lu";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminAchievements } from "@/lib/api/chapter-admin";
import { useGetChapters } from "@/lib/api/church";
import { monthYear } from "@/types/achievement";

/** Every chapter's achievements (read only). Chapters add them from their portal. */
export default function AchievementsAdminPage() {
  const [churchId, setChurchId] = useState("all");
  const [year, setYear] = useState("all");
  const { data: churches = [] } = useGetChapters();
  const { data: achievements = [], isLoading, isError, refetch, isRefetching } = useAdminAchievements({
    churchId: churchId === "all" ? undefined : churchId,
    year: year === "all" ? undefined : Number(year),
  });
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => String(thisYear - i));
  const filtering = churchId !== "all" || year !== "all";

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Achievements"
        description="What chapters have accomplished, added by chapter officers from their portal."
      />

      <TableToolbar
        filters={
          <>
            <Select value={churchId} onValueChange={setChurchId}>
              <SelectTrigger aria-label="Church">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All churches</SelectItem>
                {churches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger aria-label="Year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        actions={!isLoading && !isError ? <p className="text-sm text-muted">{achievements.length} shown</p> : null}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            tone="danger"
            title="We couldn't load achievements"
            action={
              <Button type="button" variant="outline" onClick={() => refetch()} loading={isRefetching}>
                <LuRefreshCw size={15} aria-hidden />
                Try again
              </Button>
            }
          />
        </div>
      ) : achievements.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={LuAward}
            title={filtering ? "No achievements match these filters" : "No achievements yet"}
            description={filtering ? undefined : "Chapter officers add achievements from the chapter portal."}
            action={
              filtering ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setChurchId("all");
                    setYear("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map((a) => (
            <li key={a.id} className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-[var(--surface-shadow)]">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-[#8a6d12]">
                  <LuAward size={18} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold leading-snug text-foreground">{a.name}</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {a.chapter?.name} · {a.church?.name}
                  </p>
                </div>
              </div>
              {a.description ? <p className="mt-3 line-clamp-3 text-sm text-foreground/80">{a.description}</p> : null}
              <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-muted">
                <span>{monthYear(a.month, a.year)}</span>
                <a
                  href={a.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded font-medium text-focus outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
                >
                  View proof
                  <LuExternalLink size={12} aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
