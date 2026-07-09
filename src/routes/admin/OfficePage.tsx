import { useMemo, useState } from "react";
import {
  LuBriefcase,
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
} from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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
  adminPageCx,
  adminTableFooterCx,
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
  useDeleteOffice,
  useDeleteOfficesBulk,
  useGetOffices,
} from "@/lib/api/office";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDrawer } from "@/store/useDrawer";
import { canWriteAdminContent } from "@/types/user";

const PAGE_SIZE = 10;

export default function OfficeAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: offices = [], isLoading, isError, refetch } = useGetOffices();
  const deleteOffice = useDeleteOffice();
  const deleteBulk = useDeleteOfficesBulk();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[];
    label: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return offices;
    return offices.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q),
    );
  }, [offices, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = pageItems.map((o) => o.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedKeys.has(id));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) {
        await deleteOffice.mutateAsync(deleteTarget.ids[0]);
      } else {
        await deleteBulk.mutateAsync(deleteTarget.ids);
      }
      successToast(
        deleteTarget.ids.length === 1
          ? "Office deleted."
          : `${deleteTarget.ids.length} offices deleted.`,
      );
      setSelectedKeys(new Set());
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
        title="Offices & Positions"
        description="Define executive roles used when assigning officers across chapters."
        actionLabel="Add Office"
        onAction={() => openDrawer("create-office")}
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit office updates."
        stats={
          <Badge className="bg-primary/10 text-primary">
            {offices.length} offices registered
          </Badge>
        }
      />

      <section className={adminFilterBarCx}>
        <Input
          placeholder="Search offices…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          startContent={<LuSearch size={16} className="text-text-muted" />}
          className="w-full sm:max-w-md"
        />
      </section>

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Spinner label="Loading offices…" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-rose-600">Unable to load offices.</p>
            <Button size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
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
                          setSelectedKeys((prev) => {
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
                    <TableHead>OFFICE / POSITION</TableHead>
                    <TableHead>DESCRIPTION</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.06] text-primary">
                            <LuBriefcase size={20} />
                          </div>
                          <p className="text-sm font-semibold text-text-dark">No offices defined yet</p>
                          <Button size="sm" className="bg-primary text-white" onClick={() => openDrawer("create-office")} disabled={!canManage}>
                            <LuPlus size={14} />
                            Add Office
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((office) => (
                      <TableRow
                        key={office.id}
                        className="cursor-pointer hover:bg-background/60"
                        onClick={() => {
                          if (canManage) openDrawer("edit-office", { body: office });
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedKeys.has(office.id)}
                            onCheckedChange={(v) => {
                              setSelectedKeys((prev) => {
                                const next = new Set(prev);
                                if (v === true) next.add(office.id);
                                else next.delete(office.id);
                                return next;
                              });
                            }}
                            aria-label={`Select ${office.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-primary">{office.name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-2 max-w-xl text-sm text-text-muted">
                            {office.description}
                          </p>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Open actions" className="text-text-muted">
                                  ⋮
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={!canManage}
                                  onClick={() => openDrawer("edit-office", { body: office })}
                                >
                                  <LuPencil size={14} />
                                  Edit office
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!canManage}
                                  className="text-rose-600 focus:text-rose-600"
                                  onClick={() => {
                                    if (!canManage) return;
                                    setDeleteTarget({ ids: [office.id], label: office.name });
                                  }}
                                >
                                  <LuTrash2 size={14} />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className={adminTableFooterCx}>
              <p className="text-xs text-text-muted">
                {filtered.length} office{filtered.length === 1 ? "" : "s"}
              </p>
              <Pagination page={page} totalPages={pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>

      <BulkActionBar
        count={selectedKeys.size}
        entityLabel="Office"
        onClear={() => setSelectedKeys(new Set())}
        onDelete={() =>
          setDeleteTarget({
            ids: Array.from(selectedKeys),
            label: `${selectedKeys.size} selected offices`,
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
