import { useNavigate } from "react-router-dom";
import {
  LuBriefcase,
  LuCalendar,
  LuImage,
  LuNetwork,
  LuNewspaper,
  LuUsers,
} from "react-icons/lu";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ActivityFeed,
  type ActivityEntry,
} from "@/features/admin/components/dashboard/ActivityFeed";
import { DirectorDeskPreview } from "@/features/admin/components/dashboard/DirectorDeskPreview";
import { KpiCard } from "@/features/admin/components/dashboard/KpiCard";
import {
  QuickActions,
  type QuickAction,
} from "@/features/admin/components/dashboard/QuickActions";
import { SystemStatus } from "@/features/admin/components/dashboard/SystemStatus";
import WelcomeHeader from "@/features/admin/components/dashboard/WelcomeHeader";
import { Spinner } from "@/components/ui/spinner";
import { useGetAdminDashboard } from "@/lib/api/admin";
import useCurrentUser from "@/hooks/useCurrentUser";
import type { DashboardActivityItem } from "@/types/admin-dashboard";
import { canWriteAdminContent } from "@/types/user";

dayjs.extend(relativeTime);

function mapActivity(item: DashboardActivityItem): ActivityEntry {
  return {
    id: item.id,
    kind: item.action === "deleted" ? "publish" : item.action === "updated" ? "update" : "upload",
    message: (
      <>
        <span className="font-semibold capitalize">{item.action}</span>{" "}
        <span className="capitalize">{item.kind}</span>:{" "}
        <span className="font-semibold">{item.title}</span>
      </>
    ),
    detail: item.subtitle ? `By ${item.subtitle}` : undefined,
    timestamp: item.timestamp ? dayjs(item.timestamp).fromNow() : "—",
  };
}

export function AdminDashboardContent() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const quickActions: QuickAction[] = [
    { label: "Create News", icon: LuNewspaper, href: "/admin/news" },
    { label: "Create Event", icon: LuCalendar, href: "/admin/event" },
    { label: "Add Gallery Item", icon: LuImage, href: "/admin/gallery" },
    { label: "Manage Executives", icon: LuUsers, href: "/admin/executive" },
  ].map((action) => ({
    ...action,
    disabled: !canManage,
    disabledReason: "Your role does not allow content creation.",
  }));
  const { data, isLoading, isError, refetch } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <Spinner label="Loading dashboard metrics…" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-rose-600">Unable to load dashboard data.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const activity = data.recentActivity.map(mapActivity);

  return (
    <div className="space-y-6 min-w-0 max-w-full lg:space-y-8">
      <WelcomeHeader />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-4">
        <div className="space-y-6 lg:col-span-2">
          <div
            aria-label="Key metrics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5"
          >
            <KpiCard label="Published News" value={data.publishedNews} icon={LuNewspaper} />
            <KpiCard label="Upcoming Events" value={data.upcomingEvents} icon={LuCalendar} />
            <KpiCard label="Gallery Items" value={data.activeGallery} icon={LuImage} />
            <KpiCard label="Registered Offices" value={data.totalOffices} icon={LuBriefcase} />
            <KpiCard label="Active Officers" value={data.activeExecutives} icon={LuUsers} />
            <KpiCard label="Total Chapters" value={data.totalChapters} icon={LuNetwork} />
          </div>

          <ActivityFeed
            entries={activity}
            onViewAll={() => navigate("/admin/audit")}
          />
        </div>

        <div className="space-y-6">
          <DirectorDeskPreview />
          <QuickActions actions={quickActions} />
          <SystemStatus />
        </div>
      </section>
    </div>
  );
}
