import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { IconType } from "react-icons";
import { LuActivity, LuArrowRight, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/EmptyState";
import { Panel } from "@/components/shared/Panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardActivityItem } from "@/types/admin-dashboard";

dayjs.extend(relativeTime);

const ACTION_META: Record<string, { icon: IconType; cx: string }> = {
  created: { icon: LuPlus, cx: "bg-success/10 text-success" },
  updated: { icon: LuPencil, cx: "bg-focus/[0.08] text-focus" },
  deleted: { icon: LuTrash2, cx: "bg-danger/[0.08] text-danger" },
};
const FALLBACK = { icon: LuActivity, cx: "bg-default text-muted" };

export function ActivityFeed({ items }: { items: DashboardActivityItem[] }) {
  return (
    <Panel
      title="Recent activity"
      description="Latest changes across the portal"
      bodyClassName="p-0"
      action={
        <Link to="/admin/audit" className={buttonVariants({ variant: "ghost", size: "sm", className: "text-muted" })}>
          Audit log
          <LuArrowRight size={14} aria-hidden />
        </Link>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={LuActivity}
          title="No activity yet"
          description="Changes to news, events, executives and chapters will show up here."
        />
      ) : (
        <ol className="divide-y divide-separator">
          {items.map((item) => {
            const meta = ACTION_META[item.action] ?? FALLBACK;
            const Icon = meta.icon;
            const time = item.timestamp ? dayjs(item.timestamp) : null;
            return (
              <li key={item.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", meta.cx)} aria-hidden>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    <span className="capitalize">{item.action}</span>{" "}
                    <span className="text-muted">{item.kind}</span>{" "}
                    <span className="font-medium">{item.title}</span>
                  </p>
                  {item.subtitle ? <p className="mt-0.5 truncate text-xs text-muted">By {item.subtitle}</p> : null}
                </div>
                {time ? (
                  <time dateTime={time.toISOString()} title={time.format("D MMM YYYY, h:mm a")} className="shrink-0 pt-0.5 text-xs text-muted">
                    {time.fromNow()}
                  </time>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
