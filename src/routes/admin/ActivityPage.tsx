import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuBellRing, LuCalendarCheck, LuClipboardCheck, LuRefreshCw, LuUsers } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetChapters } from "@/lib/api/church";
import {
  useCensusProgress,
  useCensusRemind,
  useMeetingReports,
  type CensusProgressRow,
  type MeetingReport,
} from "@/lib/api/engagement";
import { canWriteAdminContent } from "@/types/user";

type Tab = "meetings" | "census";

const frame = "rounded-xl border border-border bg-surface shadow-[var(--surface-shadow)]";

/**
 * Chapter activity: meeting reports from every chapter, and progress of
 * this year's census (which chapters have confirmed their members).
 */
export default function ActivityPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "census" ? "census" : "meetings";
  const year = new Date().getFullYear();

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Chapter activity" description="Meeting reports from every chapter and the yearly census of active members." />
      <ViewTabs
        aria-label="Activity view"
        tabs={[
          { id: "meetings", label: "Meeting reports" },
          { id: "census", label: `${year} census` },
        ]}
        value={tab}
        onChange={(t) => setParams(t === "meetings" ? {} : { tab: t }, { replace: true })}
      />
      {tab === "meetings" ? <MeetingReports /> : <CensusProgress year={year} />}
    </div>
  );
}

/* ----------------------------- Meeting reports ----------------------------- */

function Attendance({ m }: { m: MeetingReport }) {
  const pct = m.memberCount > 0 ? Math.min(100, Math.round((m.attended / m.memberCount) * 100)) : 0;
  return (
    <div className="w-full sm:w-44">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">Present</span>
        <span className="font-medium tabular-nums text-foreground">
          {m.attended} / {m.memberCount}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-default"
        role="meter"
        aria-label="Attendance"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${m.attended} of ${m.memberCount} members present`}
      >
        <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
      </div>
      {m.visitors ? <p className="mt-1 text-xs text-muted">+{m.visitors} visitor{m.visitors === 1 ? "" : "s"}</p> : null}
    </div>
  );
}

function MeetingReports() {
  const [churchId, setChurchId] = useState("all");
  const { data: churches = [] } = useGetChapters();
  const { data: meetings = [], isLoading, isError, refetch, isRefetching } = useMeetingReports(
    churchId === "all" ? undefined : churchId,
  );
  const list = useClientTable({
    rows: meetings,
    searchText: (m) => `${m.activity} ${m.chapterName} ${m.churchName} ${m.report ?? ""}`,
    resetKey: churchId,
  });
  const filtering = list.query.trim() !== "" || churchId !== "all";

  return (
    <div className="space-y-3">
      <TableToolbar
        search={{ value: list.query, onChange: list.setQuery, placeholder: "Search activity, chapter, report…" }}
        filters={
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
        }
        actions={!isLoading && !isError ? <p className="text-sm text-muted tabular-nums">{list.total} meetings</p> : null}
      />

      {isLoading ? (
        <div className={`${frame} divide-y divide-separator`}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-4 p-5">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className={frame}>
          <EmptyState
            tone="danger"
            title="We couldn't load meeting reports"
            action={
              <Button type="button" variant="outline" onClick={() => refetch()} loading={isRefetching}>
                <LuRefreshCw size={15} aria-hidden />
                Try again
              </Button>
            }
          />
        </div>
      ) : list.total === 0 ? (
        <div className={frame}>
          <EmptyState
            icon={LuCalendarCheck}
            title={filtering ? "No meetings match your filters" : "No meetings recorded yet"}
            description={filtering ? undefined : "Chapters record meetings and attendance from their portal."}
            action={
              filtering ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    list.setQuery("");
                    setChurchId("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <ul className={`${frame} divide-y divide-separator`} aria-label="Meeting reports">
            {list.pageRows.map((m) => (
              <li key={m.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-focus/[0.08] text-focus">
                    <LuCalendarCheck size={18} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground">{m.activity}</h3>
                    <p className="mt-0.5 text-xs text-muted">
                      <time dateTime={m.date}>{formatDate(m.date)}</time> · {m.chapterName} · {m.churchName}
                    </p>
                    {m.report ? (
                      <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-foreground/80">{m.report}</p>
                    ) : null}
                  </div>
                </div>
                <div className="pl-14 sm:pl-0">
                  <Attendance m={m} />
                </div>
              </li>
            ))}
          </ul>
          {list.totalPages > 1 ? (
            <div className="flex justify-center pt-1">
              <Pagination page={list.page} totalPages={list.totalPages} onPageChange={list.setPage} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ---------------------------------- Census --------------------------------- */

type CensusFilter = "all" | "done" | "pending";

const CENSUS_COLUMNS: DataTableColumn<CensusProgressRow>[] = [
  {
    id: "chapter",
    header: "Chapter",
    sortable: true,
    isRowHeader: true,
    cell: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{r.chapterName}</p>
        <p className="truncate text-xs text-muted">{r.churchName}</p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    className: "w-28",
    cell: (r) => (r.done ? <StatusPill tone="success" label="Done" /> : <StatusPill tone="warning" label="Not yet" />),
  },
  {
    id: "confirmed",
    header: "Confirmed",
    align: "end",
    sortable: true,
    cell: (r) => <span className="tabular-nums">{r.done ? (r.confirmedCount ?? 0) : "—"}</span>,
  },
  {
    id: "removed",
    header: "Set inactive",
    align: "end",
    hideBelow: "lg",
    cell: (r) => <span className="tabular-nums text-muted">{r.done ? (r.removedCount ?? 0) : "—"}</span>,
  },
  {
    id: "submitted",
    header: "Submitted",
    sortable: true,
    hideBelow: "lg",
    cell: (r) => <span className="text-muted">{r.submittedAt ? formatDate(r.submittedAt) : "—"}</span>,
  },
];

function CensusProgress({ year }: { year: number }) {
  const canRemind = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: rows = [], isLoading, isError, refetch } = useCensusProgress(year);
  const remind = useCensusRemind();
  const [filter, setFilter] = useState<CensusFilter>("all");
  const [confirmRemind, setConfirmRemind] = useState(false);

  const done = rows.filter((r) => r.done).length;
  const pending = rows.length - done;
  const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;

  const table = useClientTable({
    rows: rows.filter((r) => filter === "all" || (filter === "done") === r.done),
    searchText: (r) => `${r.chapterName} ${r.churchName}`,
    sortValue: (r, column) =>
      ({
        status: r.done ? 1 : 0,
        confirmed: r.confirmedCount,
        submitted: r.submittedAt ? new Date(r.submittedAt).getTime() : null,
      })[column] ?? r.chapterName,
    resetKey: filter,
  });

  const handleRemind = async () => {
    try {
      const result = (await remind.mutateAsync()) as { reminded: number };
      successToast(`Reminded ${result.reminded} chapter${result.reminded === 1 ? "" : "s"}.`);
      setConfirmRemind(false);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send.", "Error");
    }
  };

  return (
    <div className="space-y-5">
      <section aria-label="Census progress" className={`${frame} p-5`}>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">Chapters that have confirmed their members</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {done} <span className="text-base font-normal text-muted">of {rows.length}</span>
              </p>
              <div
                className="mt-3 h-2 max-w-xl overflow-hidden rounded-full bg-default"
                role="progressbar"
                aria-label={`${year} census progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {canRemind && pending > 0 ? (
              <Button type="button" variant="outline" onClick={() => setConfirmRemind(true)}>
                <LuBellRing size={15} aria-hidden />
                Remind {pending} chapter{pending === 1 ? "" : "s"}
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <div className="space-y-3">
        <TableToolbar
          search={{ value: table.query, onChange: table.setQuery, placeholder: "Search chapter or church…" }}
          filters={
            <Select value={filter} onValueChange={(v) => setFilter(v as CensusFilter)}>
              <SelectTrigger aria-label="Census status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All chapters</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="pending">Not yet</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <DataTable
          aria-label={`${year} census by chapter`}
          columns={CENSUS_COLUMNS}
          rows={table.pageRows}
          getRowId={(r) => r.chapterId}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load census progress."
          onRetry={() => refetch()}
          sort={table.sort}
          onSortChange={table.setSort}
          renderCard={(r) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{r.chapterName}</p>
                <p className="truncate text-xs text-muted">
                  {r.churchName}
                  {r.done ? ` · ${r.confirmedCount ?? 0} confirmed` : ""}
                </p>
              </div>
              {r.done ? <StatusPill tone="success" label="Done" /> : <StatusPill tone="warning" label="Not yet" />}
            </div>
          )}
          emptyState={
            <EmptyState
              icon={rows.length ? LuClipboardCheck : LuUsers}
              title={rows.length ? "No chapters match" : "No chapters to show"}
            />
          }
          summary={`${table.total} chapter${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          minWidth={640}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmRemind}
        title="Send census reminders?"
        message={`Chapters that haven't confirmed their ${year} members (${pending}) will get a reminder.`}
        confirmLabel="Send reminders"
        tone="accent"
        loading={remind.isPending}
        onClose={() => setConfirmRemind(false)}
        onConfirm={handleRemind}
      />
    </div>
  );
}
