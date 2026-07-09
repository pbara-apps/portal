import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useState } from "react";
import { LuMail, LuSearch, LuTrash2 } from "react-icons/lu";
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
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import {
  useDeleteMessage,
  useDeleteMessagesBulk,
  useGetMessages,
  useMarkMessageRead,
  useMarkMessagesReadBulk,
} from "@/lib/api/message";
import useCurrentUser from "@/hooks/useCurrentUser";
import type { AdminMessage } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

const PAGE_SIZE = 10;

export default function MessagesAdminPage() {
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: messages = [], isLoading, isError } = useGetMessages();
  const markRead = useMarkMessageRead();
  const markReadBulk = useMarkMessagesReadBulk();
  const deleteMessage = useDeleteMessage();
  const deleteBulk = useDeleteMessagesBulk();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeMessage, setActiveMessage] = useState<AdminMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[];
    label: string;
  } | null>(null);

  const unreadCount = useMemo(
    () => messages.filter((m) => !m.isRead).length,
    [messages],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((msg) => {
      if (statusFilter === "unread" && msg.isRead) return false;
      if (statusFilter === "read" && !msg.isRead) return false;
      if (!q) return true;
      return (
        msg.fullName.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        msg.subject.toLowerCase().includes(q) ||
        msg.message.toLowerCase().includes(q)
      );
    });
  }, [messages, search, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = pageItems.map((m) => m.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const openMessage = async (msg: AdminMessage) => {
    setActiveMessage(msg);
    if (!msg.isRead) {
      if (!canManage) return;
      try {
        await markRead.mutateAsync(msg.id);
      } catch {
        // Non-blocking — detail still opens
      }
    }
  };

  const handleMarkSelectedRead = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!canManage) return;
    try {
      await markReadBulk.mutateAsync(ids);
      setSelected(new Set());
      successToast("Selected messages marked as read.");
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Action failed.",
        "Error",
      );
    }
  };

  const handleDeleteSelected = async () => {
    if (!deleteTarget) return;
    if (!canManage) return;
    try {
      await deleteBulk.mutateAsync(deleteTarget.ids);
      setSelected(new Set());
      setActiveMessage(null);
      setDeleteTarget(null);
      successToast("Selected messages deleted.");
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Delete failed.",
        "Error",
      );
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!canManage) return;
    try {
      await deleteMessage.mutateAsync(id);
      if (activeMessage?.id === id) setActiveMessage(null);
      successToast("Message deleted.");
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
        title="Messages"
        description="Contact form submissions from the public website."
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">{messages.length} total</Badge>
            {unreadCount > 0 ? (
              <Badge className="bg-gold/15 text-primary">{unreadCount} unread</Badge>
            ) : null}
          </>
        }
      />

      <Card className="border border-text-dark/[0.05] bg-surface shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <CardContent className={`${adminFilterBarCx} border-0 bg-transparent p-3 shadow-none`}>
          <Input
            placeholder="Search by name, email, subject…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            startContent={<LuSearch size={16} className="text-text-muted" />}
            className={adminFilterSearchCx}
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={adminFilterSelectWideCx}>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          {selected.size > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleMarkSelectedRead}
              disabled={!canManage}
              className="bg-primary/10 text-primary"
            >
              Mark {selected.size} as read
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <BulkActionBar
        count={selected.size}
        entityLabel="Message"
        onClear={() => setSelected(new Set())}
        onDelete={() =>
          setDeleteTarget({
            ids: Array.from(selected),
            label: `${selected.size} messages`,
          })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className={adminTableSectionCx}>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner label="" />
            </div>
          ) : isError ? (
            <p className="py-20 text-center text-sm text-rose-600">
              Unable to load messages.
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
                          onCheckedChange={(v) => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              pageIds.forEach((id) => {
                                if (v === true) next.add(id);
                                else next.delete(id);
                              });
                              return next;
                            });
                          }}
                          aria-label="Select all on page"
                        />
                      </TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-text-muted">
                          No messages yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageItems.map((msg) => (
                        <TableRow
                          key={msg.id}
                          className={cn(
                            "cursor-pointer hover:bg-background/30",
                            activeMessage?.id === msg.id && "bg-primary/[0.05]",
                            !msg.isRead && "font-medium",
                          )}
                          onClick={() => openMessage(msg)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selected.has(msg.id)}
                              onCheckedChange={(v) => {
                                setSelected((prev) => {
                                  const next = new Set(prev);
                                  if (v === true) next.add(msg.id);
                                  else next.delete(msg.id);
                                  return next;
                                });
                              }}
                              aria-label={`Select message from ${msg.fullName}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-text-dark">{msg.fullName}</p>
                              <p className="text-xs text-text-muted">{msg.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="max-w-[220px] truncate text-sm">{msg.subject}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-text-muted">
                              {msg.createdAt
                                ? dayjs(msg.createdAt).format("MMM D, YYYY")
                                : "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                msg.isRead
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gold/15 text-primary"
                              }
                            >
                              {msg.isRead ? "Read" : "New"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {pages > 1 ? (
                <div className="flex justify-center border-t border-text-dark/[0.05] py-4">
                  <Pagination page={page} totalPages={pages} onPageChange={setPage} />
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="rounded-2xl border border-text-dark/[0.05] bg-surface p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] sm:p-6">
          {activeMessage ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {activeMessage.subject}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    {activeMessage.fullName} · {activeMessage.email}
                  </p>
                  {activeMessage.phone ? (
                    <p className="text-xs text-text-muted">{activeMessage.phone}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-text-muted">
                    {activeMessage.createdAt
                      ? dayjs(activeMessage.createdAt).format("MMMM D, YYYY h:mm A")
                      : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-rose-600 hover:text-rose-700"
                  aria-label="Delete message"
                  onClick={() => handleDeleteOne(activeMessage.id)}
                  disabled={!canManage}
                >
                  <LuTrash2 size={16} />
                </Button>
              </div>

              <div className="rounded-xl bg-background/60 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-dark">
                  {activeMessage.message}
                </p>
              </div>

              <a
                href={`mailto:${activeMessage.email}?subject=Re: ${encodeURIComponent(activeMessage.subject)}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <LuMail size={14} /> Reply via email
              </a>
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center text-text-muted">
              <LuMail size={32} className="mb-3 opacity-40" />
              <p className="text-sm">Select a message to view details.</p>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete messages?"
        message={`This will permanently delete ${deleteTarget?.label ?? "selected messages"}.`}
        confirmLabel="Delete"
        loading={deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
}
