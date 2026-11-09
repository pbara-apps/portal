import { useState } from "react";
import { LuBuilding2, LuPencil, LuPlus, LuTrash2, LuUserCog } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CounsellorDrawer } from "@/features/admin/components/churches/CounsellorDrawer";
import { ChapterStatusChip } from "@/features/admin/components/executives/StatusChip";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDeleteChapter, useDeleteChaptersBulk, useGetChapters } from "@/lib/api/church";
import { useDrawer } from "@/store/useDrawer";
import { CHAPTER_STATUSES, type AdminChapter, type ChapterStatus } from "@/types/admin";
import { canManageCounsellors, canWriteAdminContent } from "@/types/user";

/** A church record. `name` is the church; `chapter` is its default chapter. */
function ChurchName({ church }: { church: AdminChapter }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        {church.image ? <AvatarImage src={church.image} alt="" /> : null}
        <AvatarFallback>{church.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{church.name}</p>
        <p className="truncate text-xs text-muted">{church.chapter}</p>
      </div>
    </div>
  );
}

const COLUMNS: DataTableColumn<AdminChapter>[] = [
  { id: "name", header: "Church / chapter", sortable: true, isRowHeader: true, cell: (c) => <ChurchName church={c} /> },
  { id: "counsellor", header: "Counsellor", sortable: true, cell: (c) => c.counsellor || <span className="text-muted">—</span> },
  {
    id: "address",
    header: "Address",
    hideBelow: "lg",
    cell: (c) => <p className="line-clamp-2 max-w-xs text-muted">{c.address || "—"}</p>,
  },
  { id: "status", header: "Status", sortable: true, className: "w-28", cell: (c) => <ChapterStatusChip status={c.status} /> },
];

const searchText = (c: AdminChapter) => `${c.name} ${c.chapter} ${c.counsellor ?? ""} ${c.address ?? ""}`;
const sortValue = (c: AdminChapter, column: string) =>
  column === "counsellor" ? c.counsellor : column === "status" ? c.status : c.name;

export default function ChapterAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const role = useCurrentUser((s) => s.user)?.role;
  const canManage = canWriteAdminContent(role);
  const canSetCounsellor = canManageCounsellors(role);
  const { data: churches = [], isLoading, isError, refetch } = useGetChapters();
  const deleteChurch = useDeleteChapter();
  const deleteBulk = useDeleteChaptersBulk();

  const [status, setStatus] = useState<ChapterStatus | "all">("all");
  const [counsellorChurch, setCounsellorChurch] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const table = useClientTable({
    rows: status === "all" ? churches : churches.filter((c) => c.status === status),
    searchText,
    sortValue,
    resetKey: status,
  });
  const filtering = table.query.trim() !== "" || status !== "all";

  const openCreate = () => openDrawer("create-church");
  const openEdit = (church: AdminChapter) => openDrawer("edit-church", { body: church });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) await deleteChurch.mutateAsync(deleteTarget.ids[0]);
      else await deleteBulk.mutateAsync(deleteTarget.ids);
      successToast(deleteTarget.ids.length === 1 ? "Church deleted." : `${deleteTarget.ids.length} churches deleted.`);
      table.clearSelection();
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Churches"
        description="Churches in the association. Each church has a default chapter, and its counsellor signs in to the chapter portal."
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <LuPlus size={16} aria-hidden />
              Register church
            </Button>
          ) : null
        }
      />

      <div className="space-y-3">
        <TableToolbar
          search={{ value: table.query, onChange: table.setQuery, placeholder: "Search church, chapter, counsellor…" }}
          filters={
            <Select value={status} onValueChange={(v) => setStatus(v as ChapterStatus | "all")}>
              <SelectTrigger aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {CHAPTER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        <DataTable
          aria-label="Churches"
          columns={COLUMNS}
          rows={table.pageRows}
          getRowId={(c) => c.id}
          getRowLabel={(c) => c.name}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load churches."
          onRetry={() => refetch()}
          sort={table.sort}
          onSortChange={table.setSort}
          selectedIds={canManage ? table.selectedIds : undefined}
          onSelectionChange={canManage ? table.setSelectedIds : undefined}
          onRowAction={canManage ? openEdit : undefined}
          rowActions={
            canManage || canSetCounsellor
              ? (church) => (
                  <RowActions
                    label={`Actions for ${church.name}`}
                    actions={[
                      canSetCounsellor && {
                        label: "Counsellor login",
                        icon: LuUserCog,
                        onAction: () => setCounsellorChurch({ id: church.id, name: church.name }),
                      },
                      canManage && { label: "Edit church", icon: LuPencil, tone: "accent", onAction: () => openEdit(church) },
                      canManage && {
                        label: "Delete church",
                        icon: LuTrash2,
                        danger: true,
                        onAction: () => setDeleteTarget({ ids: [church.id], label: church.name }),
                      },
                    ]}
                  />
                )
              : undefined
          }
          renderCard={(church) => (
            <div className="space-y-2">
              <ChurchName church={church} />
              <div className="flex flex-wrap items-center gap-2 pl-12 text-xs text-muted">
                {church.counsellor ? <span>{church.counsellor}</span> : null}
                <ChapterStatusChip status={church.status} />
              </div>
            </div>
          )}
          emptyState={
            filtering ? (
              <EmptyState
                icon={LuBuilding2}
                title="No churches match your filters"
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      table.setQuery("");
                      setStatus("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={LuBuilding2}
                title="No churches registered"
                description="Register a church to create its default chapter."
                action={
                  canManage ? (
                    <Button type="button" size="sm" onClick={openCreate}>
                      <LuPlus size={14} aria-hidden />
                      Register church
                    </Button>
                  ) : undefined
                }
              />
            )
          }
          summary={`${table.total} church${table.total === 1 ? "" : "es"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          minWidth={760}
        />
      </div>

      <BulkActionBar
        count={table.selectedIds.size}
        entityLabel="Church"
        entityPlural="Churches"
        onClear={table.clearSelection}
        onDelete={() =>
          setDeleteTarget({ ids: Array.from(table.selectedIds), label: `${table.selectedIds.size} selected churches` })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <CounsellorDrawer church={counsellorChurch} onClose={() => setCounsellorChurch(null)} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete church"
        message={`Remove ${deleteTarget?.label ?? "the selected churches"}? Executives and chapters linked to them will be affected.`}
        loading={deleteChurch.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
