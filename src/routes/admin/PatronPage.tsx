import { useMemo, useState } from "react";
import { LuAward, LuPencil, LuPlus, LuSearch, LuTrash2 } from "react-icons/lu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ChapterStatusChip } from "@/features/admin/components/executives/StatusChip";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminFilterSearchCx,
  adminFilterSelectCx,
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
  useDeletePatron,
  useDeletePatronsBulk,
  useGetPatrons,
} from "@/lib/api/patron";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDrawer } from "@/store/useDrawer";
import type { PatronStatus } from "@/types/admin";
import { PATRON_STATUSES } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const PAGE_SIZE = 10;

export default function PatronAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: patrons = [], isLoading, isError, refetch } = useGetPatrons();
  const deletePatron = useDeletePatron();
  const deleteBulk = useDeletePatronsBulk();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatronStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[];
    label: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patrons.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.quote.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [patrons, search, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = pageItems.map((p) => p.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedKeys.has(id));
  const activeCount = patrons.filter((p) => p.status === "active").length;

  const togglePageSelection = (checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) {
        await deletePatron.mutateAsync(deleteTarget.ids[0]);
      } else {
        await deleteBulk.mutateAsync(deleteTarget.ids);
      }
      successToast(
        deleteTarget.ids.length === 1
          ? "Patron deleted."
          : `${deleteTarget.ids.length} patrons deleted.`,
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
        title="Patrons"
        description="Manage association patrons shown on the public executives page."
        actionLabel="Add Patron"
        onAction={() => openDrawer("create-patron")}
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit patron updates."
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">
              {patrons.length} patrons
            </Badge>
            <Badge variant="success">{activeCount} active</Badge>
          </>
        }
      />

      <section className={adminFilterBarCx}>
        <div className={adminFilterSearchCx}>
          <Input
            placeholder="Search name, role, quote…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            startContent={<LuSearch size={16} className="text-text-muted" />}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as PatronStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className={adminFilterSelectCx}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {PATRON_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Spinner label="Loading patrons…" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-rose-600">Unable to load patrons.</p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
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
                        onCheckedChange={(v) => togglePageSelection(v === true)}
                        aria-label="Select all on page"
                      />
                    </TableHead>
                    <TableHead>PATRON</TableHead>
                    <TableHead>ROLE</TableHead>
                    <TableHead>QUOTE</TableHead>
                    <TableHead className="text-center">ORDER</TableHead>
                    <TableHead className="text-center">STATUS</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/6 text-primary">
                            <LuAward size={20} />
                          </div>
                          <p className="text-sm font-semibold text-text-dark">
                            No patrons yet
                          </p>
                          <Button
                            size="sm"
                            className="bg-primary text-white"
                            onClick={() => openDrawer("create-patron")}
                            disabled={!canManage}
                          >
                            <LuPlus size={14} />
                            Add Patron
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((patron) => (
                      <TableRow
                        key={patron.id}
                        className="cursor-pointer hover:bg-background/60"
                        onClick={() => {
                          if (canManage)
                            openDrawer("edit-patron", { body: patron });
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedKeys.has(patron.id)}
                            onCheckedChange={(v) => {
                              setSelectedKeys((prev) => {
                                const next = new Set(prev);
                                if (v === true) next.add(patron.id);
                                else next.delete(patron.id);
                                return next;
                              });
                            }}
                            aria-label={`Select ${patron.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-[#040e3d] text-white">
                              <AvatarImage
                                src={patron.image ?? undefined}
                                alt={patron.name}
                              />
                              <AvatarFallback>
                                {patron.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-primary">
                                {patron.name}
                              </p>
                              {patron.description ? (
                                <p className="truncate text-[11px] text-text-muted">
                                  {patron.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-text-dark">
                            {patron.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="line-clamp-2 max-w-sm text-sm italic text-text-muted">
                            “{patron.quote}”
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-center text-sm text-text-muted">
                            {patron.sortOrder}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <ChapterStatusChip status={patron.status} />
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Open actions"
                                  className="text-text-muted"
                                >
                                  ⋮
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={!canManage}
                                  onClick={() =>
                                    openDrawer("edit-patron", { body: patron })
                                  }
                                >
                                  <LuPencil size={14} />
                                  Edit patron
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!canManage}
                                  className="text-rose-600 focus:text-rose-600"
                                  onClick={() => {
                                    if (!canManage) return;
                                    setDeleteTarget({
                                      ids: [patron.id],
                                      label: patron.name,
                                    });
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
                {filtered.length} patron{filtered.length === 1 ? "" : "s"}
              </p>
              <Pagination
                page={page}
                totalPages={pages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </section>

      <BulkActionBar
        count={selectedKeys.size}
        entityLabel="Patron"
        onClear={() => setSelectedKeys(new Set())}
        onDelete={() =>
          setDeleteTarget({
            ids: Array.from(selectedKeys),
            label: `${selectedKeys.size} selected patrons`,
          })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete patron"
        message={`Remove ${deleteTarget?.label ?? "selected patron(s)"} from the public site?`}
        loading={deletePatron.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
