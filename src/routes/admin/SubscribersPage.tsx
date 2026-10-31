import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { LuDownload, LuSearch, LuTrash2 } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminFilterSearchCx,
  adminFilterSelectWideCx,
  adminPageCx,
  adminTableMinCx,
  adminTableScrollCx,
  adminTableSectionCx,
} from "@/features/admin/components/shared/adminLayout";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { ConfirmDialog } from "@/features/admin/components/shared/ConfirmDialog";
import { SendNewsletterDialog } from "@/features/admin/components/subscribers/SendNewsletterDialog";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import {
  type AdminSubscriber,
  useDeleteSubscriber,
  useDeleteSubscribersBulk,
  useGetNewsletters,
  useGetSubscribers,
} from "@/lib/api/subscriber";
import useCurrentUser from "@/hooks/useCurrentUser";
import { canWriteAdminContent } from "@/types/user";

const PAGE_SIZE = 15;

const NEWSLETTER_STATUS: Record<string, { label: string; cx: string }> = {
  sent: { label: "Sent", cx: "bg-emerald-100 text-emerald-700" },
  partial: { label: "Partly sent", cx: "bg-gold/15 text-primary" },
  failed: { label: "Failed", cx: "bg-rose-100 text-rose-700" },
  sending: { label: "Sending", cx: "bg-primary/10 text-primary" },
};

const SOURCE_LABELS: Record<string, string> = {
  "events-page": "Events page",
  "newsletter-cta": "Newsletter banner",
};

const sourceLabel = (source: string | null) =>
  source ? (SOURCE_LABELS[source] ?? source) : "Unknown";

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
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subscribers-${dayjs().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SubscribersAdminPage() {
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const canSend = user?.role === "super_admin" || user?.role === "admin";
  const { data: newsletters = [] } = useGetNewsletters();
  const [composeOpen, setComposeOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: subscribers = [], isLoading, isError } = useGetSubscribers();
  const deleteOne = useDeleteSubscriber();
  const deleteBulk = useDeleteSubscribersBulk();

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[];
    label: string;
  } | null>(null);

  const sources = useMemo(
    () =>
      Array.from(
        new Set(subscribers.map((s) => s.source).filter(Boolean) as string[]),
      ).sort(),
    [subscribers],
  );

  const activeCount = useMemo(
    () => subscribers.filter((s) => s.isActive).length,
    [subscribers],
  );

  const thisMonth = useMemo(
    () =>
      subscribers.filter(
        (s) => s.createdAt && dayjs(s.createdAt).isSame(dayjs(), "month"),
      ).length,
    [subscribers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscribers.filter((s) => {
      if (sourceFilter !== "all" && s.source !== sourceFilter) return false;
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "unsubscribed" && s.isActive) return false;
      return !q || s.email.toLowerCase().includes(q);
    });
  }, [subscribers, search, sourceFilter, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = pageItems.map((s) => s.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !canManage) return;
    try {
      if (deleteTarget.ids.length === 1) {
        await deleteOne.mutateAsync(deleteTarget.ids[0]);
      } else {
        await deleteBulk.mutateAsync(deleteTarget.ids);
      }
      setSelected((prev) => {
        const next = new Set(prev);
        deleteTarget.ids.forEach((id) => next.delete(id));
        return next;
      });
      successToast(`Removed ${deleteTarget.label}.`);
      setDeleteTarget(null);
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Delete failed.",
        "Error",
      );
    }
  };

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Subscribers"
        description="People who signed up for updates on the public website."
        actionLabel="Send newsletter"
        onAction={() => setComposeOpen(true)}
        actionDisabled={!canSend || activeCount === 0}
        actionDisabledText={
          !canSend
            ? "Only admins can send newsletters"
            : "No active subscribers yet"
        }
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">
              {activeCount} active
            </Badge>
            {subscribers.length > activeCount ? (
              <Badge className="bg-slate-100 text-slate-600">
                {subscribers.length - activeCount} unsubscribed
              </Badge>
            ) : null}
            {thisMonth > 0 ? (
              <Badge className="bg-gold/15 text-primary">
                {thisMonth} this month
              </Badge>
            ) : null}
          </>
        }
      />

      <Card className="border border-text-dark/[0.05] bg-surface shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <CardContent
          className={`${adminFilterBarCx} border-0 bg-transparent p-3 shadow-none`}
        >
          <Input
            placeholder="Search by email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            startContent={<LuSearch size={16} className="text-text-muted" />}
            className={adminFilterSearchCx}
          />
          <Select
            value={sourceFilter}
            onValueChange={(v) => {
              setSourceFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={adminFilterSelectWideCx}>
              <SelectValue placeholder="All sources" />
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
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={adminFilterSelectWideCx}>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <LuDownload size={14} className="mr-1.5" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <BulkActionBar
        count={selected.size}
        entityLabel="Subscriber"
        onClear={() => setSelected(new Set())}
        onDelete={() =>
          setDeleteTarget({
            ids: Array.from(selected),
            label: `${selected.size} subscriber${selected.size === 1 ? "" : "s"}`,
          })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner label="" />
          </div>
        ) : isError ? (
          <p className="py-20 text-center text-sm text-rose-600">
            Unable to load subscribers.
          </p>
        ) : (
          <>
            <div className={adminTableScrollCx}>
              <Table className={adminTableMinCx}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allPageSelected}
                        onCheckedChange={(v) =>
                          pageIds.forEach((id) => toggle(id, v === true))
                        }
                        aria-label="Select all on page"
                      />
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-sm text-text-muted"
                      >
                        {subscribers.length === 0
                          ? "No subscribers yet."
                          : "No subscribers match the current filters."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((s) => (
                      <TableRow key={s.id} className="hover:bg-background/30">
                        <TableCell>
                          <Checkbox
                            checked={selected.has(s.id)}
                            onCheckedChange={(v) => toggle(s.id, v === true)}
                            aria-label={`Select ${s.email}`}
                          />
                        </TableCell>
                        <TableCell>
                          <a
                            href={`mailto:${s.email}`}
                            className="text-sm text-text-dark hover:underline"
                          >
                            {s.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              s.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }
                          >
                            {s.isActive ? "Active" : "Unsubscribed"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-primary/10 text-primary">
                            {sourceLabel(s.source)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-text-muted">
                            {s.createdAt
                              ? dayjs(s.createdAt).format("MMM D, YYYY")
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-600 hover:text-rose-700"
                            aria-label={`Remove ${s.email}`}
                            disabled={!canManage}
                            onClick={() =>
                              setDeleteTarget({ ids: [s.id], label: s.email })
                            }
                          >
                            <LuTrash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {pages > 1 ? (
              <div className="flex justify-center border-t border-text-dark/[0.05] py-4">
                <Pagination
                  page={page}
                  totalPages={pages}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </>
        )}
      </section>

      {newsletters.length > 0 ? (
        <section className={adminTableSectionCx}>
          <h2 className="px-4 pt-4 text-sm font-semibold text-primary sm:px-6">
            Sent newsletters
          </h2>
          <div className={adminTableScrollCx}>
            <Table className={adminTableMinCx}>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Sent by</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsletters.map((n) => {
                  const st = NEWSLETTER_STATUS[n.status] ?? NEWSLETTER_STATUS.sending;
                  return (
                    <TableRow key={n.id}>
                      <TableCell>
                        <p className="max-w-[280px] truncate text-sm">{n.subject}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={st.cx}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {n.sentCount} / {n.recipientCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-text-muted">
                          {n.sentByName || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-text-muted">
                          {n.createdAt
                            ? dayjs(n.createdAt).format("MMM D, YYYY h:mm A")
                            : "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}

      <SendNewsletterDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        activeCount={activeCount}
        defaultTestEmail={user?.email ?? ""}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove subscribers?"
        message={`This will permanently remove ${deleteTarget?.label ?? "the selected subscribers"} from the list.`}
        confirmLabel="Remove"
        loading={deleteOne.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
