import dayjs from "dayjs";
import { useState } from "react";
import { LuMail, LuMailCheck, LuReply, LuTrash2 } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { DetailDrawer, DetailItem, DetailList, DetailSection } from "@/components/shared/DetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import {
  useDeleteMessage,
  useDeleteMessagesBulk,
  useGetMessages,
  useMarkMessageRead,
  useMarkMessagesReadBulk,
} from "@/lib/api/message";
import { cn } from "@/lib/utils";
import type { AdminMessage } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

type View = "all" | "unread" | "read";

const received = (iso: string) => {
  if (!iso) return "—";
  const d = dayjs(iso);
  return d.isSame(dayjs(), "day") ? d.format("h:mm A") : d.isSame(dayjs(), "year") ? d.format("MMM D") : d.format("MMM D, YYYY");
};

function Sender({ m }: { m: AdminMessage }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden
        className={cn("size-2 shrink-0 rounded-full", m.isRead ? "bg-transparent" : "bg-focus")}
      />
      <div className="min-w-0">
        <p className={cn("truncate text-foreground", !m.isRead && "font-semibold")}>
          {m.fullName}
          {!m.isRead ? <span className="sr-only"> (unread)</span> : null}
        </p>
        <p className="truncate text-xs text-muted">{m.email}</p>
      </div>
    </div>
  );
}

const COLUMNS: DataTableColumn<AdminMessage>[] = [
  { id: "from", header: "From", sortable: true, isRowHeader: true, className: "w-64", cell: (m) => <Sender m={m} /> },
  {
    id: "subject",
    header: "Message",
    cell: (m) => (
      <p className="max-w-xl truncate text-sm">
        <span className={cn("text-foreground", !m.isRead && "font-semibold")}>{m.subject}</span>
        <span className="text-muted"> — {m.message}</span>
      </p>
    ),
  },
  {
    id: "received",
    header: "Received",
    sortable: true,
    align: "end",
    className: "w-28",
    cell: (m) => <span className="whitespace-nowrap text-xs text-muted">{received(m.createdAt)}</span>,
  },
];

/** Contact form submissions from the public website. */
export default function MessagesAdminPage() {
  const canManage = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: messages = [], isLoading, isError, refetch } = useGetMessages();
  const markRead = useMarkMessageRead();
  const markReadBulk = useMarkMessagesReadBulk();
  const deleteMessage = useDeleteMessage();
  const deleteBulk = useDeleteMessagesBulk();

  const [view, setView] = useState<View>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const unread = messages.filter((m) => !m.isRead).length;
  const table = useClientTable({
    rows: messages.filter((m) => view === "all" || (view === "unread") === !m.isRead),
    searchText: (m) => `${m.fullName} ${m.email} ${m.subject} ${m.message}`,
    sortValue: (m, column) => (column === "from" ? m.fullName : new Date(m.createdAt).getTime()),
    initialSort: { column: "received", direction: "descending" },
    resetKey: view,
  });
  // Read from the list so the drawer reflects "read" once the mutation lands.
  const open = messages.find((m) => m.id === openId) ?? null;

  const openMessage = (m: AdminMessage) => {
    setOpenId(m.id);
    // Opening marks it read; failing to do so shouldn't block reading.
    if (!m.isRead && canManage) markRead.mutate(m.id);
  };

  const handleMarkRead = async (ids: string[]) => {
    try {
      await markReadBulk.mutateAsync(ids);
      table.clearSelection();
      successToast(ids.length === 1 ? "Marked as read." : `${ids.length} messages marked as read.`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Action failed.", "Error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) await deleteMessage.mutateAsync(deleteTarget.ids[0]);
      else await deleteBulk.mutateAsync(deleteTarget.ids);
      if (openId && deleteTarget.ids.includes(openId)) setOpenId(null);
      table.clearSelection();
      successToast(deleteTarget.ids.length === 1 ? "Message deleted." : `${deleteTarget.ids.length} messages deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  const selectedUnread = messages.filter((m) => table.selectedIds.has(m.id) && !m.isRead).map((m) => m.id);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Messages" description="Contact form submissions from the public website." />

      <ViewTabs
        aria-label="Message filter"
        tabs={[
          { id: "all", label: "All" },
          { id: "unread", label: "Unread", count: unread },
          { id: "read", label: "Read" },
        ]}
        value={view}
        onChange={setView}
      />

      <div className="space-y-3">
        <TableToolbar search={{ value: table.query, onChange: table.setQuery, placeholder: "Search name, email, subject…" }} />
        <DataTable
          aria-label="Messages"
          columns={COLUMNS}
          rows={table.pageRows}
          getRowId={(m) => m.id}
          getRowLabel={(m) => `message from ${m.fullName}`}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load messages."
          onRetry={() => refetch()}
          sort={table.sort}
          onSortChange={table.setSort}
          selectedIds={canManage ? table.selectedIds : undefined}
          onSelectionChange={canManage ? table.setSelectedIds : undefined}
          onRowAction={openMessage}
          rowActions={
            canManage
              ? (m) => (
                  <RowActions
                    label={`Actions for message from ${m.fullName}`}
                    actions={[
                      !m.isRead && { label: "Mark as read", icon: LuMailCheck, onAction: () => handleMarkRead([m.id]) },
                      {
                        label: "Delete message",
                        icon: LuTrash2,
                        danger: true,
                        onAction: () => setDeleteTarget({ ids: [m.id], label: `the message from ${m.fullName}` }),
                      },
                    ]}
                  />
                )
              : undefined
          }
          renderCard={(m) => (
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <Sender m={m} />
                <span className="shrink-0 text-xs text-muted">{received(m.createdAt)}</span>
              </div>
              <p className={cn("truncate pl-[18px] text-sm", m.isRead ? "text-foreground/80" : "font-semibold text-foreground")}>
                {m.subject}
              </p>
              <p className="line-clamp-1 pl-[18px] text-xs text-muted">{m.message}</p>
            </div>
          )}
          emptyState={
            <EmptyState
              icon={LuMail}
              title={table.query ? "No messages match your search" : view === "unread" ? "You're all caught up" : "No messages yet"}
              description={!table.query && view === "all" ? "Messages sent through the website's contact form appear here." : undefined}
            />
          }
          summary={`${table.total} message${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          minWidth={720}
        />
      </div>

      <DetailDrawer
        open={!!open}
        onClose={() => setOpenId(null)}
        size="lg"
        title={open?.subject ?? ""}
        description={open ? dayjs(open.createdAt).format("MMMM D, YYYY · h:mm A") : undefined}
        footer={
          open ? (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
              {canManage ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger sm:mr-auto"
                  onClick={() => setDeleteTarget({ ids: [open.id], label: `the message from ${open.fullName}` })}
                >
                  <LuTrash2 size={15} aria-hidden />
                  Delete
                </Button>
              ) : null}
              <Button asChild>
                <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}>
                  <LuReply size={15} aria-hidden />
                  Reply by email
                </a>
              </Button>
            </div>
          ) : undefined
        }
      >
        {open ? (
          <>
            <DetailSection title="From">
              <DetailList>
                <DetailItem label="Name">{open.fullName}</DetailItem>
                <DetailItem label="Email">
                  <a href={`mailto:${open.email}`} className="text-focus hover:underline">
                    {open.email}
                  </a>
                </DetailItem>
                <DetailItem label="Phone">
                  {open.phone ? (
                    <a href={`tel:${open.phone}`} className="text-focus hover:underline">
                      {open.phone}
                    </a>
                  ) : null}
                </DetailItem>
              </DetailList>
            </DetailSection>
            <DetailSection title="Message">
              <p className="whitespace-pre-wrap rounded-xl bg-surface-secondary p-4 text-sm leading-relaxed text-foreground">
                {open.message}
              </p>
            </DetailSection>
          </>
        ) : null}
      </DetailDrawer>

      <BulkActionBar
        count={table.selectedIds.size}
        entityLabel="Message"
        onClear={table.clearSelection}
        onDelete={() =>
          setDeleteTarget({ ids: Array.from(table.selectedIds), label: `${table.selectedIds.size} selected messages` })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
        actions={
          selectedUnread.length > 0 ? (
            <button
              type="button"
              onClick={() => handleMarkRead(selectedUnread)}
              disabled={markReadBulk.isPending}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 font-medium text-white/85 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-50"
            >
              <LuMailCheck size={15} aria-hidden />
              Mark read
            </button>
          ) : null
        }
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete messages?"
        message={`This permanently deletes ${deleteTarget?.label ?? "the selected messages"}.`}
        confirmLabel="Delete"
        loading={deleteMessage.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
