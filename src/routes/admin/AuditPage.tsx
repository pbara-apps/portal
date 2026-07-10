import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { LuFileText } from "react-icons/lu";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { AuditFilters } from "@/features/admin/components/audit/AuditFilters";
import {
  AuditDateGroup,
  AuditTimelineEntry,
} from "@/features/admin/components/audit/AuditTimeline";
import { eventTypeLabel } from "@/features/admin/components/audit/auditMeta";
import { adminPageCx } from "@/features/admin/components/shared/adminLayout";
import { useGetAuditLogs } from "@/lib/api/audit";
import type { AdminAuditEntry } from "@/types/admin";

const PAGE_SIZE = 20;

function dateGroupLabel(iso: string) {
  const d = dayjs(iso);
  if (!d.isValid()) return "Unknown date";
  if (d.isSame(dayjs(), "day")) return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("D MMM YYYY");
}

function groupByDate(logs: AdminAuditEntry[]) {
  const groups: { key: string; label: string; items: AdminAuditEntry[] }[] = [];
  const index = new Map<string, number>();

  for (const log of logs) {
    const key = log.timestamp
      ? dayjs(log.timestamp).format("YYYY-MM-DD")
      : "unknown";
    const existing = index.get(key);
    if (existing === undefined) {
      index.set(key, groups.length);
      groups.push({
        key,
        label: log.timestamp ? dateGroupLabel(log.timestamp) : "Unknown date",
        items: [log],
      });
    } else {
      groups[existing].items.push(log);
    }
  }

  return groups;
}

export default function AuditAdminPage() {
  const { data: logs = [], isLoading, isError } = useGetAuditLogs(200);

  const [fromDraft, setFromDraft] = useState("");
  const [toDraft, setToDraft] = useState("");
  const [fromApplied, setFromApplied] = useState("");
  const [toApplied, setToApplied] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(
    null,
  );
  const [page, setPage] = useState(1);

  const users = useMemo(
    () =>
      Array.from(new Set(logs.map((l) => l.actorName).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [logs],
  );

  const eventTypes = useMemo(
    () =>
      Array.from(
        new Set(logs.map((l) => eventTypeLabel(l.action, l.entityType))),
      ).sort((a, b) => a.localeCompare(b)),
    [logs],
  );

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (selectedUser && log.actorName !== selectedUser) return false;
      if (
        selectedEventType &&
        eventTypeLabel(log.action, log.entityType) !== selectedEventType
      ) {
        return false;
      }

      if (!log.timestamp) return !(fromApplied || toApplied);

      const ts = dayjs(log.timestamp);
      if (fromApplied) {
        const from = dayjs(fromApplied);
        if (from.isValid() && ts.isBefore(from)) return false;
      }
      if (toApplied) {
        const to = dayjs(toApplied);
        if (to.isValid() && ts.isAfter(to)) return false;
      }
      return true;
    });
  }, [logs, selectedUser, selectedEventType, fromApplied, toApplied]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);
  const groups = useMemo(() => groupByDate(pageItems), [pageItems]);
  const timeActive = Boolean(fromApplied || toApplied);

  const applyTime = () => {
    setFromApplied(fromDraft);
    setToApplied(toDraft);
    setPage(1);
  };

  const clearTime = () => {
    setFromDraft("");
    setToDraft("");
    setFromApplied("");
    setToApplied("");
    setPage(1);
  };

  const selectUser = (user: string | null) => {
    setSelectedUser(user);
    setPage(1);
  };

  const selectEventType = (eventType: string | null) => {
    setSelectedEventType(eventType);
    setPage(1);
  };

  return (
    <div className={adminPageCx}>
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          Admin
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-primary sm:text-2xl lg:text-3xl">
          Audit Log
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_16.5rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="order-2 min-w-0 lg:order-1">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner label="" />
            </div>
          ) : isError ? (
            <p className="py-24 text-center text-sm text-rose-600">
              Unable to load audit logs.
            </p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <LuFileText size={28} className="text-primary/40" />
              <p className="text-sm text-text-muted">
                {logs.length === 0
                  ? "Audit entries will appear here as content is created or modified."
                  : "No audit entries match the current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {groups.map((group) => (
                <AuditDateGroup key={group.key} label={group.label}>
                  {group.items.map((log, index) => (
                    <AuditTimelineEntry
                      key={log.id}
                      log={log}
                      timeLabel={
                        log.timestamp
                          ? dayjs(log.timestamp).format("HH:mm:ss")
                          : "—"
                      }
                      isLast={index === group.items.length - 1}
                      actorActive={selectedUser === log.actorName}
                      onActorClick={(name) =>
                        selectUser(selectedUser === name ? null : name)
                      }
                    />
                  ))}
                </AuditDateGroup>
              ))}

              <div className="flex flex-col items-center justify-between gap-3 border-t border-text-dark/8 pt-6 sm:flex-row">
                <p className="text-xs text-text-muted">
                  Showing{" "}
                  {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                  {"–"}
                  {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <Pagination
                  page={page}
                  totalPages={pages}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </div>

        <AuditFilters
          className="order-1 lg:order-2"
          from={fromDraft}
          to={toDraft}
          onFromChange={setFromDraft}
          onToChange={setToDraft}
          onApplyTime={applyTime}
          onClearTime={clearTime}
          timeActive={timeActive}
          users={users}
          selectedUser={selectedUser}
          onUserSelect={selectUser}
          eventTypes={eventTypes}
          selectedEventType={selectedEventType}
          onEventTypeSelect={selectEventType}
        />
      </div>
    </div>
  );
}
