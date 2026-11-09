import { Skeleton } from "@heroui/react";
import { Link } from "react-router-dom";
import {
  LuArrowRight,
  LuCake,
  LuCircleX,
  LuClock,
  LuMedal,
  LuRefreshCw,
  LuTriangleAlert,
  LuUserPlus,
  LuUsers,
} from "react-icons/lu";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/shared/Panel";
import { StatCard } from "@/components/shared/StatCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { useChapterDashboard } from "../api/members";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { MemberAvatar } from "../components/MemberAvatar";
import { useActiveChapterId, useChapterSession } from "../store/useChapterSession";

const AWAITING = "/chapter/members?view=awaiting";

/**
 * Chapter dashboard: member totals, members per rank (in ladder order)
 * and this month's birthdays. Counsellors can switch chapter or see all.
 */
export default function ChapterDashboardPage() {
  const profile = useChapterSession((s) => s.profile);
  const chapterId = useActiveChapterId();
  const { data, isLoading, isError, refetch, isRefetching } = useChapterDashboard(chapterId);

  const totals = data?.totals;
  const needsAttention = totals ? totals.changesRequested + totals.rejected : 0;
  const maxRankCount = Math.max(1, ...(data?.byRank.map((r) => r.count) ?? [0]));
  const firstName = profile?.name?.trim().split(/\s+/)[0];

  return (
    <div className="min-w-0 space-y-6 lg:space-y-8">
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : "Welcome"}
        description={profile?.church?.name}
        actions={
          <>
            <ChapterSwitcher />
            <Link to="/chapter/members/add" className={buttonVariants()}>
              <LuUserPlus size={16} aria-hidden />
              Add members
            </Link>
          </>
        }
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
          {needsAttention > 0 ? (
            <Link
              to={AWAITING}
              className="group flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/[0.06] px-4 py-3 outline-none transition-colors hover:bg-warning/10 focus-visible:ring-2 focus-visible:ring-focus"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <LuTriangleAlert size={17} aria-hidden />
              </span>
              <p className="min-w-0 flex-1 text-sm text-foreground">
                <span className="font-semibold">
                  {needsAttention} member{needsAttention === 1 ? "" : "s"} need your attention.
                </span>{" "}
                <span className="text-muted">The association asked for changes or rejected them.</span>
              </p>
              <span className="hidden items-center gap-1 text-sm font-medium sm:flex">
                Review
                <LuArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ) : null}

          <div role="group" aria-label="Member totals" className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
            <StatCard
              label="Active ambassadors"
              value={totals?.active.toLocaleString()}
              icon={LuUsers}
              to="/chapter/members"
              loading={isLoading}
            />
            <StatCard
              label="Awaiting approval"
              value={totals?.awaitingApproval.toLocaleString()}
              icon={LuClock}
              tone={totals?.awaitingApproval ? "gold" : "default"}
              to={AWAITING}
              loading={isLoading}
            />
            <StatCard
              label="Changes requested"
              value={totals?.changesRequested.toLocaleString()}
              icon={LuTriangleAlert}
              tone={totals?.changesRequested ? "warning" : "default"}
              to={AWAITING}
              loading={isLoading}
            />
            <StatCard
              label="Rejected"
              value={totals?.rejected.toLocaleString()}
              icon={LuCircleX}
              tone={totals?.rejected ? "danger" : "default"}
              to={AWAITING}
              loading={isLoading}
            />
          </div>

          <div className="grid min-w-0 gap-6 lg:grid-cols-3">
            <Panel
              title="Ambassadors by rank"
              description="Active members only, from the first rank upwards"
              className="lg:col-span-2"
            >
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-4 w-full rounded" />
                  ))}
                </div>
              ) : !data?.byRank.length ? (
                <EmptyState icon={LuMedal} title="No ranks yet" description="Ranks appear once members are approved." className="py-8" />
              ) : (
                <ul className="space-y-3.5">
                  {data.byRank.map((rank) => (
                    <li key={rank.rankId} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-3 sm:grid-cols-[minmax(0,11rem)_1fr_3rem]">
                      <span className="truncate text-sm text-foreground">{rank.name}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-surface-secondary" aria-hidden>
                        <span
                          className="block h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                          style={{ width: `${(rank.count / maxRankCount) * 100}%` }}
                        />
                      </span>
                      <span className="text-right text-sm font-semibold tabular-nums text-foreground">
                        {rank.count}
                        <span className="sr-only"> members</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Birthdays this month" action={<LuCake size={17} aria-hidden className="mt-1 text-gold" />} bodyClassName="p-0">
              {isLoading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-lg" />
                  ))}
                </div>
              ) : !data?.birthdays.length ? (
                <EmptyState icon={LuCake} title="No birthdays this month" className="py-10" />
              ) : (
                <ul className="divide-y divide-separator">
                  {data.birthdays.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <MemberAvatar photo={b.photo} name={b.fullName} size={32} />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{b.fullName}</span>
                      <span className="shrink-0 rounded-md bg-gold/10 px-2 py-0.5 text-xs font-medium text-[#7a5f0c]">
                        {new Date(b.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
