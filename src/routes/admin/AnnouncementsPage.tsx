import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { LuEye, LuMegaphone, LuPlus, LuRefreshCw, LuTrash2 } from "react-icons/lu";
import { CheckList } from "@/components/shared/CheckList";
import { ChoiceCards } from "@/components/shared/ChoiceCards";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DetailDrawer, DetailSection } from "@/components/shared/DetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/features/chapter/lib/member-utils";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetChapters } from "@/lib/api/church";
import {
  type AdminAnnouncement,
  useAdminAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
} from "@/lib/api/engagement";
import { canWriteAdminContent } from "@/types/user";

const frame = "rounded-xl border border-border bg-surface shadow-[var(--surface-shadow)]";

const audienceLabel = (a: AdminAnnouncement) =>
  a.audience === "all" ? "All churches" : a.churches.length === 1 ? a.churches[0] : `${a.churches.length} churches`;

function ReadMeter({ a }: { a: AdminAnnouncement }) {
  const pct = a.recipientCount > 0 ? Math.min(100, Math.round((a.readCount / a.recipientCount) * 100)) : 0;
  return (
    <div className="w-full sm:w-40">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">Read</span>
        <span className="font-medium tabular-nums text-foreground">
          {a.readCount} / {a.recipientCount}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-default" aria-hidden>
        <div className="h-full rounded-full bg-focus" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Announcements to chapter portal users — everyone, or selected churches.
 * Each shows how many recipients have read it.
 */
export default function AnnouncementsAdminPage() {
  const canPublish = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: items = [], isLoading, isError, refetch, isRefetching } = useAdminAnnouncements();
  const remove = useDeleteAnnouncement();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<AdminAnnouncement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAnnouncement | null>(null);
  const list = useClientTable({ rows: items, searchText: (a) => `${a.title} ${a.body} ${a.churches.join(" ")}` });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      successToast("Announcement deleted.");
      if (viewing?.id === deleteTarget.id) setViewing(null);
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to delete.", "Error");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Announcements"
        description="Circulars for counsellors, presidents and secretaries in the chapter portal."
        actions={
          canPublish ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <LuPlus size={16} aria-hidden />
              New announcement
            </Button>
          ) : null
        }
      />

      <div className="space-y-3">
        <TableToolbar
          search={{ value: list.query, onChange: list.setQuery, placeholder: "Search title, message, church…" }}
          actions={!isLoading && !isError ? <p className="text-sm tabular-nums text-muted">{list.total} announcements</p> : null}
        />

        {isLoading ? (
          <div className={`${frame} divide-y divide-separator`}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2.5 p-5">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className={frame}>
            <EmptyState
              tone="danger"
              title="We couldn't load announcements"
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
              icon={LuMegaphone}
              title={list.query ? "No announcements match your search" : "No announcements yet"}
              description={list.query ? undefined : "Recipients see announcements in their portal and get a notification."}
              action={
                !list.query && canPublish ? (
                  <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                    <LuPlus size={14} aria-hidden />
                    New announcement
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <ul aria-label="Announcements" className={`${frame} divide-y divide-separator`}>
              {list.pageRows.map((a) => (
                <li key={a.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-focus/[0.08] text-focus">
                      <LuMegaphone size={18} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground">{a.title}</h3>
                      <p className="mt-0.5 text-xs text-muted">
                        <time dateTime={a.createdAt}>{formatDate(a.createdAt)}</time> · {audienceLabel(a)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{a.body}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-14 sm:pl-0">
                    <ReadMeter a={a} />
                    <RowActions
                      label={`Actions for ${a.title}`}
                      actions={[
                        { label: "View announcement and readers", icon: LuEye, onAction: () => setViewing(a) },
                        canPublish && { label: "Delete announcement", icon: LuTrash2, danger: true, onAction: () => setDeleteTarget(a) },
                      ]}
                    />
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

      <DetailDrawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ""}
        description={viewing ? `${formatDate(viewing.createdAt)} · ${audienceLabel(viewing)}` : undefined}
        footer={
          canPublish && viewing ? (
            <Button type="button" variant="ghost" className="text-danger" onClick={() => setDeleteTarget(viewing)}>
              <LuTrash2 size={15} aria-hidden />
              Delete announcement
            </Button>
          ) : undefined
        }
      >
        {viewing ? (
          <>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{viewing.body}</p>
            {viewing.audience === "selected" ? (
              <DetailSection title="Sent to">
                <p className="text-sm text-foreground">{viewing.churches.join(", ")}</p>
              </DetailSection>
            ) : null}
            <DetailSection title={`Read by ${viewing.readCount} of ${viewing.recipientCount}`}>
              {viewing.readers.length ? (
                <ul className="divide-y divide-separator rounded-xl border border-border">
                  {viewing.readers.map((r, i) => (
                    <li key={`${r.name}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate text-foreground">{r.name}</span>
                      <span className="shrink-0 text-xs capitalize text-muted">{r.role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Nobody has opened it yet.</p>
              )}
            </DetailSection>
          </>
        ) : null}
      </DetailDrawer>

      <CreateAnnouncementDrawer open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete announcement?"
        message={`“${deleteTarget?.title ?? ""}” will be removed from every chapter portal.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

type Errors = Partial<Record<"title" | "body" | "churches", string>>;

function CreateAnnouncementDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateAnnouncement();
  const { data: churches = [] } = useGetChapters();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [errors, setErrors] = useState<Errors>({});
  const clear = (key: keyof Errors) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const close = () => {
    setTitle("");
    setBody("");
    setAudience("all");
    setSelected(new Set());
    setErrors({});
    onClose();
  };

  const save = async () => {
    const found: Errors = {};
    if (title.trim().length < 3) found.title = "Enter a title (at least 3 characters).";
    if (body.trim().length < 5) found.body = "Write the message (at least 5 characters).";
    if (audience === "selected" && selected.size === 0) found.churches = "Select at least one church.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      await create.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        audience,
        churchIds: audience === "selected" ? [...selected] : undefined,
      });
      successToast("Announcement published.");
      close();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to publish.", "Error");
    }
  };

  return (
    <FormDrawer
      open={open}
      title="New announcement"
      description="Recipients see it in their portal and get a notification."
      onSubmit={save}
      onCancel={close}
      submitting={create.isPending}
      submitLabel="Publish"
    >
      <Input
        label="Title"
        value={title}
        error={errors.title}
        onChange={(e) => {
          setTitle(e.target.value);
          clear("title");
        }}
        autoFocus
      />
      <Textarea
        label="Message"
        rows={7}
        value={body}
        error={errors.body}
        onChange={(e) => {
          setBody(e.target.value);
          clear("body");
        }}
      />
      <ChoiceCards
        label="Send to"
        name="announcement-audience"
        value={audience}
        onChange={(v) => {
          setAudience(v);
          clear("churches");
        }}
        options={[
          { value: "all", label: "All churches", hint: "Every chapter portal user" },
          { value: "selected", label: "Selected churches", hint: "Pick below" },
        ]}
      />
      {audience === "selected" ? (
        <CheckList
          aria-label="Churches to send to"
          items={churches.map((c) => ({ id: c.id, label: c.name, hint: c.chapter && c.chapter !== c.name ? c.chapter : undefined }))}
          selected={selected}
          onChange={(next) => {
            setSelected(next);
            clear("churches");
          }}
          error={errors.churches}
        />
      ) : null}
    </FormDrawer>
  );
}
