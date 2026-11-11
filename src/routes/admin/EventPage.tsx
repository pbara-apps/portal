import { useState } from "react";
import { LuCalendar, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { TableSort } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import type { StatusTone } from "@/components/shared/StatusPill";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { ContentCard } from "@/features/admin/components/shared/ContentCard";
import { ContentGrid } from "@/features/admin/components/shared/ContentGrid";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDeleteEvent, useDeleteEventsBulk, useGetEvents } from "@/lib/api/event";
import { formatEventDateLabel } from "@/lib/event-date";
import { useDrawer } from "@/store/useDrawer";
import { EVENT_CATEGORIES, EVENT_STATUSES, type AdminEvent, type EventStatus } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const STATUS: Record<EventStatus, { label: string; tone: StatusTone }> = {
  open: { label: "Open", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

const SORTS: Record<string, { label: string; sort: TableSort }> = {
  latest: { label: "Latest date first", sort: { column: "date", direction: "descending" } },
  earliest: { label: "Earliest date first", sort: { column: "date", direction: "ascending" } },
  title: { label: "Title A–Z", sort: { column: "title", direction: "ascending" } },
};

const searchText = (e: AdminEvent) => `${e.title} ${e.venue} ${e.description} ${e.category}`;
const sortValue = (e: AdminEvent, column: string) => (column === "date" ? new Date(e.date).getTime() : e.title);

export default function EventAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const canManage = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: items = [], isLoading, isError, refetch } = useGetEvents();
  const deleteOne = useDeleteEvent();
  const deleteBulk = useDeleteEventsBulk();

  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<EventStatus | "all">("all");
  const [sortKey, setSortKey] = useState("latest");
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const table = useClientTable({
    rows: items.filter((n) => (category === "all" || n.category === category) && (status === "all" || n.status === status)),
    pageSize: 9,
    searchText,
    sortValue,
    initialSort: SORTS.latest.sort,
    resetKey: `${category}|${status}`,
  });
  const filtering = table.query.trim() !== "" || category !== "all" || status !== "all";
  const openCount = items.filter((e) => e.status === "open").length;

  const openCreate = () => openDrawer("create-event");
  const openEdit = (item: AdminEvent) => openDrawer("edit-event", { body: item });
  const clearFilters = () => {
    table.setQuery("");
    setCategory("all");
    setStatus("all");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) await deleteOne.mutateAsync(deleteTarget.ids[0]);
      else await deleteBulk.mutateAsync(deleteTarget.ids);
      successToast(deleteTarget.ids.length === 1 ? "Event deleted." : `${deleteTarget.ids.length} events deleted.`);
      table.clearSelection();
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Events"
        description="Programmes, ceremonies and past events shown on the public website."
        meta={
          !isLoading && !isError ? (
            <p className="text-sm text-muted">
              <span className="font-medium text-foreground tabular-nums">{openCount}</span> of {items.length} open
            </p>
          ) : null
        }
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <LuPlus size={16} aria-hidden />
              New event
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        <TableToolbar
          search={{ value: table.query, onChange: table.setQuery, placeholder: "Search title, venue, description…" }}
          filters={
            <>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {EVENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => setStatus(v as EventStatus | "all")}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {EVENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortKey}
                onValueChange={(v) => {
                  setSortKey(v);
                  table.setSort(SORTS[v].sort);
                }}
              >
                <SelectTrigger aria-label="Sort by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORTS).map(([key, s]) => (
                    <SelectItem key={key} value={key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />

        <ContentGrid
          aria-label="Events"
          items={table.pageRows}
          getId={(n) => n.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load events."
          onRetry={() => refetch()}
          selection={canManage ? { selectedIds: table.selectedIds, onChange: table.setSelectedIds } : undefined}
          summary={`${table.total} event${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          renderCard={(item, select) => (
            <ContentCard
              title={item.title}
              eyebrow={`${formatEventDateLabel(item.date, item.endDate)} · ${item.venue}`}
              description={item.description}
              image={item.image}
              fallbackIcon={LuCalendar}
              tag={item.category}
              status={STATUS[item.status]}
              onOpen={canManage ? () => openEdit(item) : undefined}
              {...select}
              actions={[
                canManage && { label: "Edit event", icon: LuPencil, tone: "accent", onAction: () => openEdit(item) },
                canManage && {
                  label: "Delete event",
                  icon: LuTrash2,
                  danger: true,
                  onAction: () => setDeleteTarget({ ids: [item.id], label: `“${item.title}”` }),
                },
              ]}
            />
          )}
          emptyState={
            filtering ? (
              <EmptyState
                icon={LuCalendar}
                title="No events match your filters"
                action={
                  <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={LuCalendar}
                title="No events yet"
                description="Open and past events appear on the public events page."
                action={
                  canManage ? (
                    <Button type="button" size="sm" onClick={openCreate}>
                      <LuPlus size={14} aria-hidden />
                      New event
                    </Button>
                  ) : undefined
                }
              />
            )
          }
        />
      </div>

      <BulkActionBar
        count={table.selectedIds.size}
        entityLabel="Event"
        onClear={table.clearSelection}
        onDelete={() =>
          setDeleteTarget({ ids: Array.from(table.selectedIds), label: `${table.selectedIds.size} selected events` })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete event"
        message={`Remove ${deleteTarget?.label ?? "the selected events"}? They will no longer appear on the public site.`}
        loading={deleteOne.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
