import type { IconType } from "react-icons";
import {
  LuArrowRight,
  LuCalendarClock,
  LuPencil,
  LuPlus,
  LuUserPlus,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActivityKind = "publish" | "upload" | "update" | "user";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  message: React.ReactNode;
  detail?: string;
  timestamp: string;
}

const kindMeta: Record<ActivityKind, { icon: IconType; bubbleClass: string }> =
  {
    publish: {
      icon: LuPencil,
      bubbleClass: "bg-white text-gold ring-gold/20",
    },
    upload: {
      icon: LuPlus,
      bubbleClass: "bg-primary text-white ring-primary/20",
    },
    update: {
      icon: LuCalendarClock,
      bubbleClass: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    },
    user: {
      icon: LuUserPlus,
      bubbleClass: "bg-white text-text-dark ring-text-dark/10",
    },
  };

interface ActivityFeedProps {
  entries: ActivityEntry[];
  onViewAll?: () => void;
}

export function ActivityFeed({ entries, onViewAll }: ActivityFeedProps) {
  return (
    <section className="flex flex-col rounded-2xl borde border-text-dark/[0.05] bg-surface shadow">
      <header className="flex items-center justify-between border-b border-text-dark/[0.05] px-5 py-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-primary">
            Recent Activity
          </h2>
          <p className="text-xs text-text-muted">
            Latest changes across the pages
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="rounded-full text-sm font-semibold text-primary hover:text-gold"
        >
          View Audit Log
          <LuArrowRight size={16} />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            Recent registrations will appear here as you add executives and
            chapters.
          </p>
        ) : (
          <ol
            className={cn(
              "relative space-y-6 pl-7",
              "before:absolute before:left-[11px] before:top-1 before:h-[calc(100%-1rem)] before:w-px before:bg-text-dark/[0.08]",
            )}
          >
            <div className="absolute top-0 left-[11px] h-[calc(100%-1rem)] border-[0.5px] border-gray-200" />
            {entries.map((e) => {
              const meta = kindMeta[e.kind];
              const Icon = meta.icon;
              return (
                <li key={e.id} className="relative space-x-3">
                  <span
                    className={cn(
                      "absolute -left-7 top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-surface z-20",
                      meta.bubbleClass,
                    )}
                    aria-hidden
                  >
                    <Icon size={12} />
                  </span>
                  <p className="text-sm text-text-dark">{e.message}</p>
                  {e.detail && (
                    <p className="mt-0.5 text-sm italic text-text-muted">
                      “{e.detail}”
                    </p>
                  )}
                  <p className="text-[11px] font-medium tracking-wider text-text-muted/80">
                    {e.timestamp}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
