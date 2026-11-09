import { useState } from "react";
import { LuAward, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
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
import { ChapterStatusChip } from "@/features/admin/components/executives/StatusChip";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDeletePatron, useDeletePatronsBulk, useGetPatrons } from "@/lib/api/patron";
import { useDrawer } from "@/store/useDrawer";
import { PATRON_STATUSES, type AdminPatron, type PatronStatus } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

function PatronName({ patron }: { patron: AdminPatron }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        {patron.image ? <AvatarImage src={patron.image} alt="" /> : null}
        <AvatarFallback>{patron.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{patron.name}</p>
        {patron.description ? <p className="truncate text-xs text-muted">{patron.description}</p> : null}
      </div>
    </div>
  );
}

const COLUMNS: DataTableColumn<AdminPatron>[] = [
  { id: "name", header: "Patron", sortable: true, isRowHeader: true, cell: (p) => <PatronName patron={p} /> },
  { id: "role", header: "Role", sortable: true, cell: (p) => p.role },
  {
    id: "quote",
    header: "Quote",
    hideBelow: "lg",
    cell: (p) => <p className="line-clamp-2 max-w-sm italic text-muted">“{p.quote}”</p>,
  },
  {
    id: "order",
    header: "Order",
    sortable: true,
    align: "end",
    className: "w-24",
    cell: (p) => <span className="tabular-nums text-muted">{p.sortOrder}</span>,
  },
  { id: "status", header: "Status", sortable: true, className: "w-28", cell: (p) => <ChapterStatusChip status={p.status} /> },
];

const searchText = (p: AdminPatron) => `${p.name} ${p.role} ${p.quote} ${p.description ?? ""}`;
const sortValue = (p: AdminPatron, column: string) =>
  column === "order" ? p.sortOrder : column === "role" ? p.role : column === "status" ? p.status : p.name;

export default function PatronAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const canManage = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: patrons = [], isLoading, isError, refetch } = useGetPatrons();
  const deletePatron = useDeletePatron();
  const deleteBulk = useDeletePatronsBulk();

  const [status, setStatus] = useState<PatronStatus | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const table = useClientTable({
    rows: status === "all" ? patrons : patrons.filter((p) => p.status === status),
    searchText,
    sortValue,
    resetKey: status,
  });

  const openCreate = () => openDrawer("create-patron");
  const openEdit = (patron: AdminPatron) => openDrawer("edit-patron", { body: patron });
  const filtering = table.query.trim() !== "" || status !== "all";

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) await deletePatron.mutateAsync(deleteTarget.ids[0]);
      else await deleteBulk.mutateAsync(deleteTarget.ids);
      successToast(deleteTarget.ids.length === 1 ? "Patron deleted." : `${deleteTarget.ids.length} patrons deleted.`);
      table.clearSelection();
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Patrons"
        description="Association patrons shown on the public executives page."
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <LuPlus size={16} aria-hidden />
              Add patron
            </Button>
          ) : null
        }
      />

      <div className="space-y-3">
        <TableToolbar
          search={{ value: table.query, onChange: table.setQuery, placeholder: "Search name, role or quote…" }}
          filters={
            <Select value={status} onValueChange={(v) => setStatus(v as PatronStatus | "all")}>
              <SelectTrigger aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {PATRON_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        <DataTable
          aria-label="Patrons"
          columns={COLUMNS}
          rows={table.pageRows}
          getRowId={(p) => p.id}
          getRowLabel={(p) => p.name}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load patrons."
          onRetry={() => refetch()}
          sort={table.sort}
          onSortChange={table.setSort}
          selectedIds={canManage ? table.selectedIds : undefined}
          onSelectionChange={canManage ? table.setSelectedIds : undefined}
          onRowAction={canManage ? openEdit : undefined}
          rowActions={
            canManage
              ? (patron) => (
                  <RowActions
                    actions={[
                      { label: "Edit patron", icon: LuPencil, tone: "accent", onAction: () => openEdit(patron) },
                      {
                        label: "Delete patron",
                        icon: LuTrash2,
                        danger: true,
                        onAction: () => setDeleteTarget({ ids: [patron.id], label: patron.name }),
                      },
                    ]}
                  />
                )
              : undefined
          }
          renderCard={(patron) => (
            <div className="space-y-2">
              <PatronName patron={patron} />
              <div className="flex flex-wrap items-center gap-2 pl-12 text-xs text-muted">
                <span>{patron.role}</span>
                <ChapterStatusChip status={patron.status} />
              </div>
            </div>
          )}
          emptyState={
            filtering ? (
              <EmptyState
                icon={LuAward}
                title="No patrons match your filters"
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
                icon={LuAward}
                title="No patrons yet"
                description="Patrons appear on the public executives page."
                action={
                  canManage ? (
                    <Button type="button" size="sm" onClick={openCreate}>
                      <LuPlus size={14} aria-hidden />
                      Add patron
                    </Button>
                  ) : undefined
                }
              />
            )
          }
          summary={`${table.total} patron${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          minWidth={760}
        />
      </div>

      <BulkActionBar
        count={table.selectedIds.size}
        entityLabel="Patron"
        onClear={table.clearSelection}
        onDelete={() =>
          setDeleteTarget({ ids: Array.from(table.selectedIds), label: `${table.selectedIds.size} selected patrons` })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete patron"
        message={`Remove ${deleteTarget?.label ?? "the selected patrons"} from the public site?`}
        loading={deletePatron.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
