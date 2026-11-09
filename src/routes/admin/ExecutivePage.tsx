import { useState } from "react";
import { LuEye, LuPencil, LuPlus, LuTrash2, LuUsers } from "react-icons/lu";
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
import { StatusChip } from "@/features/admin/components/executives/StatusChip";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetChapters } from "@/lib/api/church";
import { useDeleteExecutive, useDeleteExecutivesBulk, useGetExecutives } from "@/lib/api/executive";
import { useGetOffices } from "@/lib/api/office";
import { useDrawer } from "@/store/useDrawer";
import { EXECUTIVE_STATUSES, type AdminExecutive, type ExecutiveStatus } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

function ExecutiveName({ exec }: { exec: AdminExecutive }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        {exec.image ? <AvatarImage src={exec.image} alt="" /> : null}
        <AvatarFallback>{exec.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{exec.name}</p>
        <p className="truncate text-xs text-muted">{exec.email || exec.phone}</p>
      </div>
    </div>
  );
}

const COLUMNS: DataTableColumn<AdminExecutive>[] = [
  { id: "name", header: "Executive", sortable: true, isRowHeader: true, cell: (e) => <ExecutiveName exec={e} /> },
  { id: "office", header: "Office", sortable: true, cell: (e) => e.officeName || <span className="text-muted">—</span> },
  {
    id: "chapter",
    header: "Chapter",
    sortable: true,
    hideBelow: "lg",
    cell: (e) => (
      <div className="min-w-0">
        <p className="truncate">{e.chapterName}</p>
        <p className="truncate text-xs text-muted">{e.churchName}</p>
      </div>
    ),
  },
  { id: "status", header: "Status", sortable: true, className: "w-32", cell: (e) => <StatusChip status={e.status} /> },
];

const searchText = (e: AdminExecutive) =>
  `${e.name} ${e.email} ${e.officeName} ${e.chapterName} ${e.churchName}`;
const sortValue = (e: AdminExecutive, column: string) =>
  ({ office: e.officeName, chapter: e.chapterName, status: e.status })[column] ?? e.name;

export default function ExecutiveAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const canManage = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: executives = [], isLoading, isError, refetch } = useGetExecutives();
  const { data: offices = [] } = useGetOffices();
  const { data: chapters = [] } = useGetChapters();
  const deleteExecutive = useDeleteExecutive();
  const deleteBulk = useDeleteExecutivesBulk();

  const [office, setOffice] = useState("all");
  const [chapter, setChapter] = useState("all");
  const [status, setStatus] = useState<ExecutiveStatus | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const filteredRows = executives.filter(
    (e) =>
      (office === "all" || e.officeId === office) &&
      (chapter === "all" || e.churchId === chapter) &&
      (status === "all" || e.status === status),
  );
  const table = useClientTable({
    rows: filteredRows,
    searchText,
    sortValue,
    resetKey: `${office}|${chapter}|${status}`,
  });
  const filtering = table.query.trim() !== "" || office !== "all" || chapter !== "all" || status !== "all";

  const openCreate = () => openDrawer("create-executive");
  const openView = (exec: AdminExecutive) => openDrawer("view-executive", { body: exec });
  const openEdit = (exec: AdminExecutive) => openDrawer("edit-executive", { body: exec });
  const clearFilters = () => {
    table.setQuery("");
    setOffice("all");
    setChapter("all");
    setStatus("all");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) await deleteExecutive.mutateAsync(deleteTarget.ids[0]);
      else await deleteBulk.mutateAsync(deleteTarget.ids);
      successToast(deleteTarget.ids.length === 1 ? "Executive deleted." : `${deleteTarget.ids.length} executives deleted.`);
      table.clearSelection();
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Executives"
        description="Association executives, their offices and public visibility."
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <LuPlus size={16} aria-hidden />
              Add executive
            </Button>
          ) : null
        }
      />

      <div className="space-y-3">
        <TableToolbar
          search={{ value: table.query, onChange: table.setQuery, placeholder: "Search name, email, office…" }}
          filters={
            <>
              <Select value={office} onValueChange={setOffice}>
                <SelectTrigger aria-label="Office">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All offices</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={chapter} onValueChange={setChapter}>
                <SelectTrigger aria-label="Chapter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All chapters</SelectItem>
                  {chapters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.chapter} · {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => setStatus(v as ExecutiveStatus | "all")}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {EXECUTIVE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />

        <DataTable
          aria-label="Executives"
          columns={COLUMNS}
          rows={table.pageRows}
          getRowId={(e) => e.id}
          getRowLabel={(e) => e.name}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load executives."
          onRetry={() => refetch()}
          sort={table.sort}
          onSortChange={table.setSort}
          selectedIds={canManage ? table.selectedIds : undefined}
          onSelectionChange={canManage ? table.setSelectedIds : undefined}
          onRowAction={openView}
          rowActions={(exec) => (
            <RowActions
              label={`Actions for ${exec.name}`}
              actions={[
                { label: "View details", icon: LuEye, onAction: () => openView(exec) },
                canManage && { label: "Edit executive", icon: LuPencil, tone: "accent", onAction: () => openEdit(exec) },
                canManage && {
                  label: "Delete executive",
                  icon: LuTrash2,
                  danger: true,
                  onAction: () => setDeleteTarget({ ids: [exec.id], label: exec.name }),
                },
              ]}
            />
          )}
          renderCard={(exec) => (
            <div className="space-y-2">
              <ExecutiveName exec={exec} />
              <div className="flex flex-wrap items-center gap-2 pl-12 text-xs text-muted">
                {exec.officeName ? <span>{exec.officeName}</span> : null}
                <StatusChip status={exec.status} />
              </div>
            </div>
          )}
          emptyState={
            filtering ? (
              <EmptyState
                icon={LuUsers}
                title="No executives match your filters"
                action={
                  <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={LuUsers}
                title="No executives yet"
                description="Add the association's officers and assign their offices."
                action={
                  canManage ? (
                    <Button type="button" size="sm" onClick={openCreate}>
                      <LuPlus size={14} aria-hidden />
                      Add executive
                    </Button>
                  ) : undefined
                }
              />
            )
          }
          summary={`${table.total} executive${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          minWidth={760}
        />
      </div>

      <BulkActionBar
        count={table.selectedIds.size}
        entityLabel="Executive"
        onClear={table.clearSelection}
        onDelete={() =>
          setDeleteTarget({ ids: Array.from(table.selectedIds), label: `${table.selectedIds.size} selected executives` })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete executive"
        message={`Remove ${deleteTarget?.label ?? "the selected executives"}? They will no longer appear on the public site.`}
        loading={deleteExecutive.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
