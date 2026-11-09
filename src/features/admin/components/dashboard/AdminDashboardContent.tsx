import { Skeleton } from "@heroui/react";
import {
  LuArrowRight,
  LuBriefcase,
  LuCalendar,
  LuCalendarPlus,
  LuImage,
  LuMail,
  LuNetwork,
  LuNewspaper,
  LuRefreshCw,
  LuUsers,
  LuWallet,
} from "react-icons/lu";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetAdminDashboard } from "@/lib/api/admin";
import type { AdminDashboardStats } from "@/types/admin-dashboard";
import { ActivityFeed } from "./ActivityFeed";
import { DirectorDeskPreview } from "./DirectorDeskPreview";
import { QuickActions, type QuickLink } from "./QuickActions";

const SHORTCUTS: QuickLink[] = [
  { label: "News", description: "Write and publish articles", icon: LuNewspaper, href: "/admin/news" },
  { label: "Events", description: "Plan upcoming events", icon: LuCalendarPlus, href: "/admin/event" },
  { label: "Executives", description: "Officers and their offices", icon: LuUsers, href: "/admin/executive" },
  { label: "Dues & Levies", description: "Payments and statements", icon: LuWallet, href: "/admin/dues" },
];

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/** Headline numbers, each linked to the page where they can be acted on. */
function Stats({ data, loading }: { data?: AdminDashboardStats; loading: boolean }) {
  const d = data;
  const cards = [
    {
      label: "Churches",
      value: d?.totalChapters,
      description: d && `${d.activeChapters.toLocaleString()} active`,
      icon: LuNetwork,
      to: "/admin/chapter",
    },
    {
      label: "Active officers",
      value: d?.activeExecutives,
      description: d && `of ${plural(d.totalExecutives, "executive")}`,
      icon: LuUsers,
      to: "/admin/executive",
    },
    {
      label: "Offices",
      value: d?.totalOffices,
      description: "Executive roles defined",
      icon: LuBriefcase,
      to: "/admin/office",
    },
    {
      label: "Published news",
      value: d?.publishedNews,
      description: d && `of ${plural(d.totalNews, "article")}`,
      icon: LuNewspaper,
      to: "/admin/news",
    },
    {
      label: "Upcoming events",
      value: d?.upcomingEvents,
      description: d && `of ${plural(d.totalEvents, "event")}`,
      icon: LuCalendar,
      to: "/admin/event",
    },
    {
      label: "Gallery",
      value: d?.activeGallery,
      description: d && `visible of ${plural(d.totalGallery, "item")}`,
      icon: LuImage,
      to: "/admin/gallery",
    },
  ];

  return (
    <div aria-label="Key numbers" role="group" className="grid grid-cols-2 gap-3 xl:grid-cols-3 xl:gap-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value?.toLocaleString() ?? "—"}
          description={card.description}
          icon={card.icon}
          to={card.to}
          loading={loading}
        />
      ))}
    </div>
  );
}

function UnreadMessagesNotice({ count }: { count: number }) {
  return (
    <Link
      to="/admin/messages"
      className="group flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/[0.07] px-4 py-3 outline-none transition-colors hover:bg-gold/[0.12] focus-visible:ring-2 focus-visible:ring-focus"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-[#7a5f0c]">
        <LuMail size={17} aria-hidden />
      </span>
      <p className="min-w-0 flex-1 text-sm text-foreground">
        <span className="font-semibold">{plural(count, "unread message")}</span>
        <span className="text-muted"> from the website contact form</span>
      </p>
      <span className="hidden items-center gap-1 text-sm font-medium text-foreground sm:flex">
        Open inbox
        <LuArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function AdminDashboardContent() {
  const user = useCurrentUser((s) => s.user);
  const { data, isLoading, isError, refetch, isRefetching } = useGetAdminDashboard();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const now = new Date();

  return (
    <div className="min-w-0 space-y-6 lg:space-y-8">
      <PageHeader
        title={`${greeting(now.getHours())}${firstName ? `, ${firstName}` : ""}`}
        description={`${now.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Here's what's happening across PBA Royal Ambassadors.`}
      />

      {isError ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            tone="danger"
            title="We couldn't load the dashboard"
            description="Check your connection and try again."
            action={
              <Button type="button" variant="outline" onClick={() => refetch()} loading={isRefetching}>
                <LuRefreshCw size={15} aria-hidden />
                Try again
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {data && data.unreadMessages > 0 ? <UnreadMessagesNotice count={data.unreadMessages} /> : null}

          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-6">
            <div className="min-w-0 space-y-6 lg:col-span-2">
              <Stats data={data} loading={isLoading} />
              {isLoading ? (
                <Skeleton className="h-80 w-full rounded-xl" />
              ) : (
                <ActivityFeed items={data?.recentActivity ?? []} />
              )}
            </div>
            <div className="min-w-0 space-y-6">
              <DirectorDeskPreview />
              <QuickActions links={SHORTCUTS} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
