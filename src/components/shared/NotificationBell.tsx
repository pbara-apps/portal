import { useNavigate } from "react-router-dom";
import { LuBell, LuCheckCheck } from "react-icons/lu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { NotificationHooks } from "@/lib/notifications/makeNotificationHooks";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification";

/** "5m ago", "3h ago", "2d ago", or a date for older items. */
function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / 1440)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Bell button with a dropdown of recent notifications. Works in either
 * portal: pass that portal's hooks. Clicking an item marks it read and
 * opens its page.
 */
export function NotificationBell({ hooks }: { hooks: NotificationHooks }) {
  const navigate = useNavigate();
  const { data } = hooks.useNotifications();
  const markRead = hooks.useMarkRead();
  const markAllRead = hooks.useMarkAllRead();
  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  const open = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="outline-none focus-visible:focus-ring relative flex h-9 w-9 items-center justify-center rounded-full text-text-dark transition-colors hover:bg-text-dark/5"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <LuBell size={18} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary ring-2 ring-surface">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b border-text-dark/5 px-4 py-3">
          <p className="text-sm font-semibold text-primary">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-primary"
            >
              <LuCheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-text-muted">You're all caught up.</p>
        ) : (
          <ul className="max-h-[24rem] overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={cn(
                    "flex w-full gap-3 border-b border-text-dark/5 px-4 py-3 text-left transition-colors hover:bg-background/60",
                    !n.readAt && "bg-primary/[0.03]",
                  )}
                >
                  <span
                    className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-gold")}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-text-dark">{n.title}</span>
                    <span className="mt-0.5 block text-xs text-text-muted">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-text-muted/80">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
