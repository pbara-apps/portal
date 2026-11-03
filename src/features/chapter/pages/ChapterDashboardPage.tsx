import { Link } from "react-router-dom";
import { LuCake, LuClock, LuTriangleAlert, LuUserPlus, LuUsers } from "react-icons/lu";
import type { IconType } from "react-icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChapterDashboard } from "../api/members";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { MemberAvatar } from "../components/MemberAvatar";
import { useActiveChapterId, useChapterSession } from "../store/useChapterSession";

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: IconType; tone: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-text-dark/5 bg-surface p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

/**
 * Chapter dashboard: member totals, members per rank (in ladder order)
 * and this month's birthdays. Counsellors can switch chapter or see all.
 */
export default function ChapterDashboardPage() {
  const profile = useChapterSession((s) => s.profile);
  const chapterId = useActiveChapterId();
  const { data, isLoading, isError, refetch } = useChapterDashboard(chapterId);

  const maxRankCount = Math.max(1, ...(data?.byRank.map((r) => r.count) ?? [0]));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">
            Welcome, {profile?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{profile?.church?.name}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ChapterSwitcher />
          <Button asChild className="bg-primary text-white">
            <Link to="/chapter/members/add">
              <LuUserPlus size={16} />
              Add Members
            </Link>
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner label="Loading dashboard…" /></div>
      ) : isError || !data ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <p className="text-sm text-rose-600">Unable to load the dashboard.</p>
          <Button size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active ambassadors" value={data.totals.active} icon={LuUsers} tone="bg-primary/10 text-primary" />
            <StatCard label="Awaiting approval" value={data.totals.awaitingApproval} icon={LuClock} tone="bg-sky-100 text-sky-700" />
            <StatCard label="Changes requested" value={data.totals.changesRequested} icon={LuTriangleAlert} tone="bg-amber-100 text-amber-700" />
            <StatCard label="Rejected" value={data.totals.rejected} icon={LuTriangleAlert} tone="bg-rose-100 text-rose-700" />
          </section>

          {data.totals.changesRequested + data.totals.rejected > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-900">
                Some members need your attention: the association has asked for changes or rejected them.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link to="/chapter/members?view=awaiting">Review members</Link>
              </Button>
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-text-dark/5 bg-surface p-5 lg:col-span-2">
              <h2 className="text-base font-semibold text-primary">Ambassadors by rank</h2>
              <p className="text-xs text-text-muted">Active members only, from the first rank upwards.</p>
              <ul className="mt-5 space-y-3">
                {data.byRank.map((rank) => (
                  <li key={rank.rankId} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3">
                    <span className="truncate text-sm text-text-dark">{rank.name}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(rank.count / maxRankCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-right text-sm font-semibold text-primary">{rank.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-text-dark/5 bg-surface p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-primary">
                <LuCake size={16} /> Birthdays this month
              </h2>
              {data.birthdays.length === 0 ? (
                <p className="mt-4 text-sm text-text-muted">No birthdays this month.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.birthdays.map((b) => (
                    <li key={b.id} className="flex items-center gap-3">
                      <MemberAvatar photo={b.photo} name={b.fullName} size={32} />
                      <span className="flex-1 truncate text-sm">{b.fullName}</span>
                      <span className="text-xs text-text-muted">
                        {new Date(b.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
