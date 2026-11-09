import { useState } from "react";
import { LuBriefcase, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { RowActions } from "@/components/shared/RowActions";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import { adminPageCx } from "@/features/admin/components/shared/adminLayout";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDeleteOffice, useDeleteOfficesBulk, useGetOffices } from "@/lib/api/office";
import { useDrawer } from "@/store/useDrawer";
import type { AdminOffice } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const COLUMNS: DataTableColumn<AdminOffice>[] = [
  {
    id: "name",
    header: "Office / position",
    sortable: true,
    className: "w-72",
    cell: (o) => <span className="font-medium text-foreground">{o.name}</span>,
  },
  {
    id: "description",
    header: "Description",
    cell: (o) => <p className="line-clamp-2 max-w-xl text-muted">{o.description}</p>,
  },
];

const officeId = (o: AdminOffice) => o.id;
const officeSearchText = (o: AdminOffice) => `${o.name} ${o.description}`;
const officeSortValue = (o: AdminOffice, column: string) => (column === "name" ? o.name : o.description);

export default function OfficeAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: offices = [], isLoading, isError, refetch } = useGetOffices();
  const deleteOffice = useDeleteOffice();
  const deleteBulk = useDeleteOfficesBulk();

  const table = useClientTable({
    rows: offices,
    searchText: officeSearchText,
    sortValue: officeSortValue,
  });
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const openCreate = () => openDrawer("create-office");
  const openEdit = (office: AdminOffice) => openDrawer("edit-office", { body: office });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) {
        await deleteOffice.mutateAsync(deleteTarget.ids[0]);
      } else {
        await deleteBulk.mutateAsync(deleteTarget.ids);
      }
      successToast(
        deleteTarget.ids.length === 1 ? "Office deleted." : `${deleteTarget.ids.length} offices deleted.`,
      );
      table.clearSelection();
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  const hasSearch = table.query.trim() !== "";

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Offices & Positions"
        description="Define executive roles used when assigning officers across chapters."
        actionLabel="Add office"
        onAction={openCreate}
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit office updates."
        stats={isLoading ? null : <Badge variant="secondary">{offices.length} offices registered</Badge>}
      />

      <div className="space-y-3">
        <TableToolbar search={{ value: table.query, onChange: table.setQuery, placeholder: "Search offices…" }} />

        <DataTable
          aria-label="Offices and positions"
          columns={COLUMNS}
          rows={table.pageRows}
          getRowId={officeId}
          getRowLabel={(o) => o.name}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load offices."
          onRetry={() => refetch()}
          sort={table.sort}
          onSortChange={table.setSort}
          selectedIds={table.selectedIds}
          onSelectionChange={table.setSelectedIds}
          onRowAction={canManage ? openEdit : undefined}
          rowActions={(office) => (
            <RowActions
              label={`Actions for ${office.name}`}
              actions={[
                { label: "Edit office", icon: LuPencil, tone: "accent", disabled: !canManage, onAction: () => openEdit(office) },
                {
                  label: "Delete office",
                  icon: LuTrash2,
                  danger: true,
                  disabled: !canManage,
                  onAction: () => setDeleteTarget({ ids: [office.id], label: office.name }),
                },
              ]}
            />
          )}
          renderCard={(office) => (
            <>
              <p className="text-sm font-medium text-foreground">{office.name}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted">{office.description}</p>
            </>
          )}
          emptyState={
            hasSearch ? (
              <EmptyState
                icon={LuBriefcase}
                title="No offices match your search"
                description="Try a different name or keyword."
                action={
                  <Button type="button" size="sm" variant="outline" onClick={() => table.setQuery("")}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={LuBriefcase}
                title="No offices defined yet"
                description="Offices are the roles executives hold, such as President or Treasurer."
                action={
                  <Button type="button" size="sm" onClick={openCreate} disabled={!canManage}>
                    <LuPlus size={14} />
                    Add office
                  </Button>
                }
              />
            )
          }
          summary={`${table.total} office${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          minWidth={640}
        />
      </div>

      <BulkActionBar
        count={table.selectedIds.size}
        entityLabel="Office"
        onClear={table.clearSelection}
        onDelete={() =>
          setDeleteTarget({
            ids: Array.from(table.selectedIds),
            label: `${table.selectedIds.size} selected offices`,
          })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete office"
        message={`Remove ${deleteTarget?.label ?? "selected office(s)"}? Executives assigned to these offices may need reassignment.`}
        loading={deleteOffice.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
