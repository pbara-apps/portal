import { LuCheck, LuFileText } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { formatDate } from "../lib/member-utils";
import type { PortalRank, RankProgressEntry } from "../types";

/**
 * The member's progress through the official rank ladder, drawn as a
 * connected line from the first rank to the last:
 * - reached ranks are filled (with date and proof link if recorded)
 * - the current rank is highlighted
 * - ranks not reached yet are grey
 */
export function RankProgressLine({
  ranks,
  history,
  currentRankId,
}: {
  ranks: PortalRank[];
  history: RankProgressEntry[];
  currentRankId?: string | null;
}) {
  const reached = new Map(history.map((h) => [h.rank.id, h]));
  // Older records may have no history yet: treat the current rank as reached.
  if (currentRankId && !reached.has(currentRankId)) {
    reached.set(currentRankId, { rank: { id: currentRankId, name: "", order: null }, dateReached: null, proofUrl: null });
  }

  return (
    <ol className="relative">
      {ranks.map((rank, index) => {
        const entry = reached.get(rank.id);
        const isCurrent = rank.id === currentRankId;
        const isLast = index === ranks.length - 1;
        // The connector below a rank is "done" when the next rank is reached too.
        const nextReached = !isLast && reached.has(ranks[index + 1].id);
        return (
          <li key={rank.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5",
                  entry && nextReached ? "bg-primary" : "bg-text-dark/10",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                isCurrent
                  ? "border-gold bg-gold text-primary ring-4 ring-gold/20"
                  : entry
                    ? "border-primary bg-primary text-white"
                    : "border-text-dark/15 bg-surface text-text-muted",
              )}
            >
              {entry && !isCurrent ? <LuCheck size={14} /> : index + 1}
            </span>
            <div className="min-w-0 pt-1">
              <p className={cn("text-sm font-semibold", entry ? "text-primary" : "text-text-muted")}>
                {rank.name}
                {isCurrent && <span className="ml-2 text-xs font-medium text-gold">Current rank</span>}
              </p>
              {entry && (
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  {entry.dateReached ? `Reached ${formatDate(entry.dateReached)}` : "Date not recorded"}
                  {entry.proofUrl && (
                    <a href={entry.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                      <LuFileText size={12} /> Proof
                    </a>
                  )}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
