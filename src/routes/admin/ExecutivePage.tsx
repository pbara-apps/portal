import { useMemo, useState } from "react";
import {
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
  LuUsers,
} from "react-icons/lu";
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
import { StatusChip } from "@/features/admin/components/executives/StatusChip";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminFilterSearchCx,
  adminFilterSelectCx,
  adminFilterSelectExtraWideCx,
  adminFilterSelectWideCx,
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
import { useGetChapters } from "@/lib/api/church";
import {
  useDeleteExecutive,
  useDeleteExecutivesBulk,
  useGetExecutives,
} from "@/lib/api/executive";
import { useGetOffices } from "@/lib/api/office";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDrawer } from "@/store/useDrawer";
import type { ExecutiveStatus } from "@/types/admin";
import { EXECUTIVE_STATUSES } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const PAGE_SIZE = 8;

export default function ExecutiveAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: executives = [], isLoading, isError, refetch } = useGetExecutives();
  const { data: offices = [] } = useGetOffices();
  const { data: chapters = [] } = useGetChapters();
  const deleteExecutive = useDeleteExecutive();
  const deleteBulk = useDeleteExecutivesBulk();

  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<ExecutiveStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[];
    label: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return executives.filter((e) => {
      if (officeFilter !== "all" && e.officeId !== officeFilter) return false;
      if (chapterFilter !== "all" && e.churchId !== chapterFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.officeName.toLowerCase().includes(q) ||
        e.chapterName.toLowerCase().includes(q) ||
        e.churchName.toLowerCase().includes(q)
      );
    });
  }, [executives, search, officeFilter, chapterFilter, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pageIds = pageItems.map((e) => e.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedKeys.has(id));

  const activeCount = executives.filter((e) => e.status === "active").length;

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

  const toggleRowSelection = (id: string, checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) {
        await deleteExecutive.mutateAsync(deleteTarget.ids[0]);
      } else {
        await deleteBulk.mutateAsync(deleteTarget.ids);
      }
      successToast(
        deleteTarget.ids.length === 1
          ? "Executive deleted."
          : `${deleteTarget.ids.length} executives deleted.`,
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
        title="Executive Leadership"
        description="Manage association executives, office assignments, and public visibility."
        actionLabel="Add Executive"
        onAction={() => openDrawer("create-executive")}
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit executive updates."
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">{executives.length} total</Badge>
            <Badge variant="success">{activeCount} active</Badge>
          </>
        }
      />

      <section className={adminFilterBarCx}>
        <div className={adminFilterSearchCx}>
          <Input
            placeholder="Search by name, email, office, chapter…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            startContent={<LuSearch size={16} className="text-text-muted" />}
          />
        </div>

        <Select
          value={officeFilter}
          onValueChange={(v) => {
            setOfficeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className={adminFilterSelectWideCx}>
            <SelectValue placeholder="All Offices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Offices</SelectItem>
            {offices.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={chapterFilter}
          onValueChange={(v) => {
            setChapterFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className={adminFilterSelectExtraWideCx}>
            <SelectValue placeholder="All Chapters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chapters</SelectItem>
            {chapters.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.chapter} · {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as ExecutiveStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className={adminFilterSelectCx}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {EXECUTIVE_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Spinner label="Loading executives…" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-rose-600">Unable to load executives.</p>
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
                        onCheckedChange={(v) => togglePageSelection(v === true)}
                        aria-label="Select all on page"
                      />
                    </TableHead>
                    <TableHead>EXECUTIVE</TableHead>
                    <TableHead>OFFICE</TableHead>
                    <TableHead>CHAPTER</TableHead>
                    <TableHead className="text-center">STATUS</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.06] text-primary">
                            <LuUsers size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-dark">No executives found</p>
                            <p className="mt-1 text-xs text-text-muted">Add your first executive or adjust filters.</p>
                          </div>
                          <Button size="sm" className="bg-primary text-white" onClick={() => openDrawer("create-executive")} disabled={!canManage}>
                            <LuPlus size={14} />
                            Add Executive
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((exec) => (
                      <TableRow
                        key={exec.id}
                        className="cursor-pointer hover:bg-background/60"
                        onClick={() => {
                          if (canManage) openDrawer("edit-executive", { body: exec });
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedKeys.has(exec.id)}
                            onCheckedChange={(v) => toggleRowSelection(exec.id, v === true)}
                            aria-label={`Select ${exec.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 bg-gradient-to-br from-primary to-[#040e3d] text-[11px] font-bold text-white">
                              <AvatarImage src={exec.image ?? undefined} alt={exec.name} />
                              <AvatarFallback>{exec.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-primary">{exec.name}</p>
                              <p className="truncate text-[11px] text-text-muted">{exec.email || exec.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-text-dark">{exec.officeName || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-text-dark">{exec.chapterName}</p>
                            <p className="truncate text-[11px] text-text-muted">{exec.churchName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <StatusChip status={exec.status} />
                          </div>
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
                                  onClick={() => openDrawer("edit-executive", { body: exec })}
                                >
                                  <LuPencil size={14} />
                                  Edit profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!canManage}
                                  className="text-rose-600 focus:text-rose-600"
                                  onClick={() => {
                                    if (!canManage) return;
                                    setDeleteTarget({ ids: [exec.id], label: exec.name });
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
                Showing{" "}
                <span className="font-semibold text-text-dark">
                  {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                </span>
                –
                <span className="font-semibold text-text-dark">
                  {Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-text-dark">{filtered.length}</span>{" "}
                executives
              </p>
              <Pagination page={page} totalPages={pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>

      <BulkActionBar
        count={selectedKeys.size}
        entityLabel="Executive"
        onClear={() => setSelectedKeys(new Set())}
        onDelete={() =>
          setDeleteTarget({
            ids: Array.from(selectedKeys),
            label: `${selectedKeys.size} selected executives`,
          })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete executive"
        message={`This will permanently remove ${deleteTarget?.label ?? "the selected record(s)"}. This action cannot be undone.`}
        loading={deleteExecutive.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
