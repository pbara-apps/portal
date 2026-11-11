import { useEffect, useRef } from "react";
import { LuCheck, LuFileText } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { formatDate } from "../lib/member-utils";
import type { PortalRank, RankProgressEntry } from "../types";

type StepState = "done" | "current" | "upcoming";

const STATE_LABEL: Record<StepState, string> = {
  done: "completed",
  current: "current rank",
  upcoming: "not reached yet",
};

/**
 * The member's progress through the official rank ladder, drawn left to right:
 * - every rank below the current one is completed (green, with a check)
 * - the current rank is gold
 * - ranks above it are grey
 * Dates and proof links show when they were recorded. On narrow screens the
 * line scrolls sideways and starts centred on the current rank.
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
  const recorded = new Map(history.map((h) => [h.rank.id, h]));
  const currentIndex = ranks.findIndex((r) => r.id === currentRankId);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);

  // Bring the current rank into view without scrolling the page.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const step = currentRef.current;
    if (!scroller || !step || scroller.scrollWidth <= scroller.clientWidth) return;
    scroller.scrollLeft = step.offsetLeft - (scroller.clientWidth - step.clientWidth) / 2;
  }, [currentIndex, ranks.length]);

  const stateOf = (index: number): StepState =>
    currentIndex < 0 || index > currentIndex ? "upcoming" : index < currentIndex ? "done" : "current";

  return (
    <div ref={scrollerRef} className="-mx-2 overflow-x-auto px-2 pb-2 pt-1">
      <ol className="flex min-w-full" aria-label="Rank progress">
        {ranks.map((rank, index) => {
          const state = stateOf(index);
          const entry = recorded.get(rank.id);
          const isFirst = index === 0;
          const isLast = index === ranks.length - 1;
          return (
            <li
              key={rank.id}
              ref={state === "current" ? currentRef : undefined}
              aria-current={state === "current" ? "step" : undefined}
              className="relative flex min-w-[4.75rem] flex-1 basis-0 flex-col items-center px-1 text-center"
            >
              {/* Connector halves meet between neighbouring steps. */}
              {!isFirst && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 right-1/2 top-[15px] h-0.5",
                    state === "upcoming" ? "bg-text-dark/10" : "bg-success",
                  )}
                />
              )}
              {!isLast && (
                <span
                  aria-hidden
                  className={cn("absolute left-1/2 right-0 top-[15px] h-0.5", state === "done" ? "bg-success" : "bg-text-dark/10")}
                />
              )}

              <span
                aria-hidden
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  state === "done" && "border-success bg-success text-white",
                  state === "current" && "border-gold bg-gold text-primary ring-4 ring-gold/20",
                  state === "upcoming" && "border-text-dark/15 bg-surface text-text-muted",
                )}
              >
                {state === "done" ? <LuCheck size={15} strokeWidth={3} /> : index + 1}
              </span>

              <p
                className={cn(
                  "mt-2.5 line-clamp-2 hyphens-auto break-words text-[11px] leading-snug sm:text-xs",
                  state === "upcoming" ? "text-text-muted" : "font-semibold text-primary",
                )}
              >
                {rank.name}
                <span className="sr-only">, {STATE_LABEL[state]}</span>
              </p>

              {state === "current" && (
                <span className="mt-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6d12]">
                  Current
                </span>
              )}
              {state !== "upcoming" && entry?.dateReached && (
                <p className="mt-1 text-[11px] leading-tight text-text-muted">{formatDate(entry.dateReached)}</p>
              )}
              {state !== "upcoming" && entry?.proofUrl && (
                <a
                  href={entry.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary underline underline-offset-2"
                >
                  <LuFileText size={11} aria-hidden /> Proof
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
