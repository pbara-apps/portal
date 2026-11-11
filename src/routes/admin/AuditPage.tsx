import { Skeleton } from "@heroui/react";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { LuFileText, LuRefreshCw } from "react-icons/lu";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuditDateGroup, AuditTimelineEntry } from "@/features/admin/components/audit/AuditTimeline";
import { eventTypeLabel } from "@/features/admin/components/audit/auditMeta";
import { useClientTable } from "@/hooks/useClientTable";
import { useGetAuditLogs } from "@/lib/api/audit";
import type { AdminAuditEntry } from "@/types/admin";

/** How many recent entries the page loads. */
const LIMIT = 200;
const ALL = "all";
const frame = "rounded-xl border border-border bg-surface shadow-[var(--surface-shadow)]";

function dateGroupLabel(iso: string) {
  const d = dayjs(iso);
  if (!d.isValid()) return "Unknown date";
  if (d.isSame(dayjs(), "day")) return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("dddd, D MMM YYYY");
}

function groupByDate(logs: AdminAuditEntry[]) {
  const groups: { key: string; label: string; items: AdminAuditEntry[] }[] = [];
  for (const log of logs) {
    const key = log.timestamp ? dayjs(log.timestamp).format("YYYY-MM-DD") : "unknown";
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(log);
    else groups.push({ key, label: log.timestamp ? dateGroupLabel(log.timestamp) : "Unknown date", items: [log] });
  }
  return groups;
}

/** Recent changes made in the admin portal, newest first. */
export default function AuditAdminPage() {
  const { data: logs = [], isLoading, isError, refetch, isRefetching } = useGetAuditLogs(LIMIT);
  const [actor, setActor] = useState(ALL);
  const [eventType, setEventType] = useState(ALL);
  // Calendar days (YYYY-MM-DD); "to" includes the whole day.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const actors = useMemo(() => Array.from(new Set(logs.map((l) => l.actorName).filter(Boolean))).sort(), [logs]);
  const eventTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => eventTypeLabel(l.action, l.entityType)))).sort(),
    [logs],
  );

  const rows = logs.filter((log) => {
    if (actor !== ALL && log.actorName !== actor) return false;
    if (eventType !== ALL && eventTypeLabel(log.action, log.entityType) !== eventType) return false;
    if (!from && !to) return true;
    if (!log.timestamp) return false;
    const ts = dayjs(log.timestamp);
    if (from && ts.isBefore(dayjs(from).startOf("day"))) return false;
    if (to && ts.isAfter(dayjs(to).endOf("day"))) return false;
    return true;
  });

  const list = useClientTable({
    rows,
    pageSize: 25,
    searchText: (l) => `${l.actorName} ${l.entityTitle} ${l.entityType} ${l.detail ?? ""}`,
    resetKey: `${actor}|${eventType}|${from}|${to}`,
  });
  const filtering = list.query.trim() !== "" || actor !== ALL || eventType !== ALL || !!from || !!to;
  const clearFilters = () => {
    list.setQuery("");
    setActor(ALL);
    setEventType(ALL);
    setFrom("");
    setTo("");
  };
  const groups = groupByDate(list.pageRows);
  const firstShown = (list.page - 1) * 25 + 1;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Audit log"
        description={`Changes made in the admin portal, newest first. Shows the latest ${LIMIT} entries.`}
      />

      <div className="space-y-4">
        <TableToolbar
          search={{ value: list.query, onChange: list.setQuery, placeholder: "Search person, item, details…" }}
          filters={
            <>
              <Select value={actor} onValueChange={setActor}>
                <SelectTrigger aria-label="Person">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Everyone</SelectItem>
                  {actors.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger aria-label="Event type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All events</SelectItem>
                  {eventTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
              <Input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </>
          }
          actions={
            filtering ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />

        {isLoading ? (
          <div className={`${frame} space-y-5 p-5 sm:p-6`}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3 rounded" />
                  <Skeleton className="h-3 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className={frame}>
            <EmptyState
              tone="danger"
              title="We couldn't load the audit log"
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
              icon={LuFileText}
              title={filtering ? "No entries match your filters" : "No changes recorded yet"}
              description={filtering ? undefined : "Entries appear here as content is created, changed or deleted."}
              action={
                filtering ? (
                  <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className={`${frame} p-5 sm:p-6`}>
            <div className="space-y-8">
              {groups.map((group) => (
                <AuditDateGroup key={group.key} label={group.label}>
                  {group.items.map((log, i) => (
                    <AuditTimelineEntry
                      key={log.id}
                      log={log}
                      timeLabel={log.timestamp ? dayjs(log.timestamp).format("h:mm A") : "—"}
                      isLast={i === group.items.length - 1}
                      actorActive={actor === log.actorName}
                      onActorClick={(name) => setActor(actor === name ? ALL : name)}
                    />
                  ))}
                </AuditDateGroup>
              ))}
            </div>
            <div className="mt-2 flex flex-col items-center justify-between gap-3 border-t border-separator pt-4 sm:flex-row">
              <p className="text-xs tabular-nums text-muted">
                {firstShown}–{Math.min(firstShown + list.pageRows.length - 1, list.total)} of {list.total}
              </p>
              <Pagination page={list.page} totalPages={list.totalPages} onPageChange={list.setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
