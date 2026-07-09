import { useMemo, useState } from "react";
import {
  LuBuilding2,
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
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
  useDeleteChapter,
  useDeleteChaptersBulk,
  useGetChapters,
} from "@/lib/api/church";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDrawer } from "@/store/useDrawer";
import type { ChapterStatus } from "@/types/admin";
import { CHAPTER_STATUSES } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const PAGE_SIZE = 10;

export default function ChapterAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: chapters = [], isLoading, isError, refetch } = useGetChapters();
  const deleteChapter = useDeleteChapter();
  const deleteBulk = useDeleteChaptersBulk();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChapterStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[];
    label: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chapters.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.chapter.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.counsellor ?? "").toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q)
      );
    });
  }, [chapters, search, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = pageItems.map((c) => c.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedKeys.has(id));
  const activeCount = chapters.filter((c) => c.status === "active").length;

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
        await deleteChapter.mutateAsync(deleteTarget.ids[0]);
      } else {
        await deleteBulk.mutateAsync(deleteTarget.ids);
      }
      successToast(
        deleteTarget.ids.length === 1
          ? "Chapter deleted."
          : `${deleteTarget.ids.length} chapters deleted.`,
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
        title="Chapters & Units"
        description="Manage local RA chapters displayed on the public chapters page."
        actionLabel="Register Chapter"
        onAction={() => openDrawer("create-church")}
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit chapter updates."
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">{chapters.length} chapters</Badge>
            <Badge variant="success">{activeCount} active</Badge>
          </>
        }
      />

      <section className={adminFilterBarCx}>
        <div className={adminFilterSearchCx}>
          <Input
            placeholder="Search chapter, church, commander…"
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
            setStatusFilter(v as ChapterStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className={adminFilterSelectCx}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {CHAPTER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Spinner label="Loading chapters…" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-rose-600">Unable to load chapters.</p>
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
                    <TableHead>CHAPTER / CHURCH</TableHead>
                    <TableHead>COMMANDER</TableHead>
                    <TableHead>ADDRESS</TableHead>
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
                            <LuBuilding2 size={20} />
                          </div>
                          <p className="text-sm font-semibold text-text-dark">No chapters registered</p>
                          <Button size="sm" className="bg-primary text-white" onClick={() => openDrawer("create-church")} disabled={!canManage}>
                            <LuPlus size={14} />
                            Register Chapter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((chapter) => (
                      <TableRow
                        key={chapter.id}
                        className="cursor-pointer hover:bg-background/60"
                        onClick={() => {
                          if (canManage) openDrawer("edit-church", { body: chapter });
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedKeys.has(chapter.id)}
                            onCheckedChange={(v) => {
                              setSelectedKeys((prev) => {
                                const next = new Set(prev);
                                if (v === true) next.add(chapter.id);
                                else next.delete(chapter.id);
                                return next;
                              });
                            }}
                            aria-label={`Select ${chapter.chapter}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-[#040e3d] text-white">
                              <AvatarImage src={chapter.image ?? undefined} alt={chapter.chapter} />
                              <AvatarFallback>{chapter.chapter.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-primary">{chapter.chapter}</p>
                              <p className="truncate text-[11px] text-text-muted">{chapter.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-text-dark">{chapter.counsellor || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="line-clamp-2 max-w-xs text-sm text-text-muted">
                            {chapter.address || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <ChapterStatusChip status={chapter.status} />
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
                                  onClick={() => openDrawer("edit-church", { body: chapter })}
                                >
                                  <LuPencil size={14} />
                                  Edit chapter
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!canManage}
                                  className="text-rose-600 focus:text-rose-600"
                                  onClick={() => {
                                    if (!canManage) return;
                                    setDeleteTarget({ ids: [chapter.id], label: chapter.chapter });
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
                {filtered.length} chapter{filtered.length === 1 ? "" : "s"}
              </p>
              <Pagination page={page} totalPages={pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>

      <BulkActionBar
        count={selectedKeys.size}
        entityLabel="Chapter"
        onClear={() => setSelectedKeys(new Set())}
        onDelete={() =>
          setDeleteTarget({
            ids: Array.from(selectedKeys),
            label: `${selectedKeys.size} selected chapters`,
          })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete chapter"
        message={`Remove ${deleteTarget?.label ?? "selected chapter(s)"}? This will affect executives linked to these chapters.`}
        loading={deleteChapter.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
