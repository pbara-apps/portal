import dayjs from "dayjs";
import { useState } from "react";
import { LuDownload, LuMailOpen, LuSend, LuTrash2, LuUsers } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { StatusPill, type StatusTone } from "@/components/shared/StatusPill";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { SendNewsletterDrawer } from "@/features/admin/components/subscribers/SendNewsletterDrawer";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  type AdminNewsletter,
  type AdminSubscriber,
  useDeleteSubscriber,
  useDeleteSubscribersBulk,
  useGetNewsletters,
  useGetSubscribers,
} from "@/lib/api/subscriber";
import { canWriteAdminContent } from "@/types/user";

type Tab = "subscribers" | "newsletters";
type StatusFilter = "all" | "active" | "unsubscribed";

const NEWSLETTER_STATUS: Record<AdminNewsletter["status"], { label: string; tone: StatusTone }> = {
  sent: { label: "Sent", tone: "success" },
  partial: { label: "Partly sent", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  sending: { label: "Sending", tone: "neutral" },
};

const SOURCE_LABELS: Record<string, string> = {
  "events-page": "Events page",
  "newsletter-cta": "Newsletter banner",
};
const sourceLabel = (source: string | null) => (source ? (SOURCE_LABELS[source] ?? source) : "Unknown");

function downloadCsv(rows: AdminSubscriber[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    ["Email", "Status", "Source", "Subscribed"].join(","),
    ...rows.map((s) =>
      [
        escape(s.email),
        escape(s.isActive ? "Active" : "Unsubscribed"),
        escape(sourceLabel(s.source)),
        escape(s.createdAt ? dayjs(s.createdAt).format("YYYY-MM-DD HH:mm") : ""),
      ].join(","),
    ),
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `subscribers-${dayjs().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const SubscriberStatus = ({ s }: { s: AdminSubscriber }) =>
  s.isActive ? <StatusPill tone="success" label="Active" /> : <StatusPill tone="neutral" label="Unsubscribed" />;

const SUBSCRIBER_COLUMNS: DataTableColumn<AdminSubscriber>[] = [
  {
    id: "email",
    header: "Email",
    sortable: true,
    isRowHeader: true,
    cell: (s) => <span className="truncate font-medium text-foreground">{s.email}</span>,
  },
  { id: "status", header: "Status", className: "w-36", cell: (s) => <SubscriberStatus s={s} /> },
  { id: "source", header: "Source", hideBelow: "lg", cell: (s) => <span className="text-muted">{sourceLabel(s.source)}</span> },
  {
    id: "subscribed",
    header: "Subscribed",
    sortable: true,
    hideBelow: "md",
    cell: (s) => <span className="whitespace-nowrap text-muted">{s.createdAt ? dayjs(s.createdAt).format("MMM D, YYYY") : "—"}</span>,
  },
];

const NEWSLETTER_COLUMNS: DataTableColumn<AdminNewsletter>[] = [
  { id: "subject", header: "Subject", isRowHeader: true, cell: (n) => <p className="max-w-md truncate font-medium text-foreground">{n.subject}</p> },
  { id: "status", header: "Status", className: "w-32", cell: (n) => <StatusPill {...NEWSLETTER_STATUS[n.status]} /> },
  {
    id: "delivered",
    header: "Delivered",
    align: "end",
    cell: (n) => (
      <span className="tabular-nums">
        {n.sentCount} / {n.recipientCount}
        {n.failedCount ? <span className="block text-xs text-danger">{n.failedCount} failed</span> : null}
      </span>
    ),
  },
  { id: "by", header: "Sent by", hideBelow: "lg", cell: (n) => <span className="text-muted">{n.sentByName || "—"}</span> },
  {
    id: "date",
    header: "Date",
    hideBelow: "md",
    cell: (n) => <span className="whitespace-nowrap text-muted">{n.createdAt ? dayjs(n.createdAt).format("MMM D, YYYY · h:mm A") : "—"}</span>,
  },
];

/** People who signed up for updates on the public website, and newsletters sent to them. */
export default function SubscribersAdminPage() {
  const user = useCurrentUser((s) => s.user);
  const canManage = canWriteAdminContent(user?.role);
  const canSend = user?.role === "super_admin" || user?.role === "admin";
  const { data: subscribers = [], isLoading, isError, refetch } = useGetSubscribers();
  const newslettersQuery = useGetNewsletters();
  const newsletters = newslettersQuery.data ?? [];
  const deleteOne = useDeleteSubscriber();
  const deleteBulk = useDeleteSubscribersBulk();

  const [tab, setTab] = useState<Tab>("subscribers");
  const [composeOpen, setComposeOpen] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [source, setSource] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const sources = Array.from(new Set(subscribers.map((s) => s.source).filter((s): s is string => !!s))).sort();
  const activeCount = subscribers.filter((s) => s.isActive).length;
  const thisMonth = subscribers.filter((s) => s.createdAt && dayjs(s.createdAt).isSame(dayjs(), "month")).length;

  const table = useClientTable({
    rows: subscribers.filter(
      (s) => (source === "all" || s.source === source) && (status === "all" || (status === "active") === s.isActive),
    ),
    pageSize: 15,
    searchText: (s) => s.email,
    sortValue: (s, column) => (column === "subscribed" ? new Date(s.createdAt).getTime() : s.email),
    initialSort: { column: "subscribed", direction: "descending" },
    resetKey: `${source}|${status}`,
  });
  const filtering = table.query.trim() !== "" || source !== "all" || status !== "all";

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) await deleteOne.mutateAsync(deleteTarget.ids[0]);
      else await deleteBulk.mutateAsync(deleteTarget.ids);
      table.clearSelection();
      successToast(`Removed ${deleteTarget.label}.`);
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Subscribers"
        description="People who signed up for updates on the public website."
        meta={
          !isLoading && !isError ? (
            <p className="text-sm text-muted">
              <span className="font-medium tabular-nums text-foreground">{activeCount}</span> active
              {subscribers.length > activeCount ? ` · ${subscribers.length - activeCount} unsubscribed` : ""}
              {thisMonth > 0 ? ` · ${thisMonth} new this month` : ""}
            </p>
          ) : null
        }
        actions={
          canSend ? (
            <Button type="button" onClick={() => setComposeOpen(true)} disabled={activeCount === 0}>
              <LuSend size={16} aria-hidden />
              Send newsletter
            </Button>
          ) : null
        }
      />

      <ViewTabs
        aria-label="Subscribers view"
        tabs={[
          { id: "subscribers", label: "Subscribers" },
          { id: "newsletters", label: "Sent newsletters", count: newslettersQuery.isSuccess ? newsletters.length : undefined },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "subscribers" ? (
        <div className="space-y-3">
          <TableToolbar
            search={{ value: table.query, onChange: table.setQuery, placeholder: "Search by email…" }}
            filters={
              <>
                <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger aria-label="Source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {sources.map((s) => (
                      <SelectItem key={s} value={s}>
                        {sourceLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            actions={
              <Button type="button" variant="outline" onClick={() => downloadCsv(table.filteredRows)} disabled={table.total === 0}>
                <LuDownload size={15} aria-hidden />
                Export CSV
              </Button>
            }
          />
          <DataTable
            aria-label="Subscribers"
            columns={SUBSCRIBER_COLUMNS}
            rows={table.pageRows}
            getRowId={(s) => s.id}
            getRowLabel={(s) => s.email}
            isLoading={isLoading}
            isError={isError}
            errorMessage="We couldn't load subscribers."
            onRetry={() => refetch()}
            sort={table.sort}
            onSortChange={table.setSort}
            selectedIds={canManage ? table.selectedIds : undefined}
            onSelectionChange={canManage ? table.setSelectedIds : undefined}
            rowActions={
              canManage
                ? (s) => (
                    <RowActions
                      actions={[
                        {
                          label: `Remove ${s.email}`,
                          icon: LuTrash2,
                          danger: true,
                          onAction: () => setDeleteTarget({ ids: [s.id], label: s.email }),
                        },
                      ]}
                    />
                  )
                : undefined
            }
            renderCard={(s) => (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{s.email}</p>
                  <p className="text-xs text-muted">
                    {sourceLabel(s.source)}
                    {s.createdAt ? ` · ${dayjs(s.createdAt).format("MMM D, YYYY")}` : ""}
                  </p>
                </div>
                <SubscriberStatus s={s} />
              </div>
            )}
            emptyState={
              filtering ? (
                <EmptyState
                  icon={LuUsers}
                  title="No subscribers match your filters"
                  action={
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        table.setQuery("");
                        setStatus("all");
                        setSource("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState icon={LuUsers} title="No subscribers yet" description="Sign-ups from the public website appear here." />
              )
            }
            summary={`${table.total} subscriber${table.total === 1 ? "" : "s"}`}
            pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
            minWidth={640}
          />
        </div>
      ) : (
        <DataTable
          aria-label="Sent newsletters"
          columns={NEWSLETTER_COLUMNS}
          rows={newsletters}
          getRowId={(n) => n.id}
          isLoading={newslettersQuery.isLoading}
          isError={newslettersQuery.isError}
          errorMessage="We couldn't load newsletters."
          onRetry={() => newslettersQuery.refetch()}
          renderCard={(n) => (
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-medium text-foreground">{n.subject}</p>
                <StatusPill {...NEWSLETTER_STATUS[n.status]} />
              </div>
              <p className="text-xs tabular-nums text-muted">
                {n.sentCount} of {n.recipientCount} delivered
                {n.createdAt ? ` · ${dayjs(n.createdAt).format("MMM D, YYYY")}` : ""}
              </p>
            </div>
          )}
          emptyState={
            <EmptyState
              icon={LuMailOpen}
              title="No newsletters sent yet"
              description={canSend ? "Newsletters you send to subscribers are listed here." : undefined}
            />
          }
          summary={`${newsletters.length} newsletter${newsletters.length === 1 ? "" : "s"}`}
          minWidth={720}
        />
      )}

      <BulkActionBar
        count={tab === "subscribers" ? table.selectedIds.size : 0}
        entityLabel="Subscriber"
        onClear={table.clearSelection}
        onDelete={() =>
          setDeleteTarget({
            ids: Array.from(table.selectedIds),
            label: `${table.selectedIds.size} subscriber${table.selectedIds.size === 1 ? "" : "s"}`,
          })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <SendNewsletterDrawer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        activeCount={activeCount}
        defaultTestEmail={user?.email ?? ""}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove subscribers?"
        message={`This permanently removes ${deleteTarget?.label ?? "the selected subscribers"} from the list.`}
        confirmLabel="Remove"
        loading={deleteOne.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
