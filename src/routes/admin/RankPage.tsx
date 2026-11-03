import { useMemo, useState } from "react";
import {
  LuArrowDown,
  LuArrowUp,
  LuMedal,
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
} from "react-icons/lu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminPageCx,
  adminTableFooterCx,
  adminTableMinCx,
  adminTableScrollCx,
  adminTableSectionCx,
} from "@/features/admin/components/shared/adminLayout";
import { ConfirmDialog } from "@/features/admin/components/shared/ConfirmDialog";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDeleteRank, useGetRanks, useReorderRanks } from "@/lib/api/rank";
import { useDrawer } from "@/store/useDrawer";
import { MIN_JOIN_AGE } from "@/features/chapter/lib/member-utils";
import type { AdminRank } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

/** Returns a copy of `list` with the item at `from` swapped with its neighbour at `to`. */
function swap<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/**
 * Ranks page — the official rank ladder.
 *
 * Ranks are listed lowest first. Admins move a rank one step at a time
 * with the up/down arrows; each move saves the whole ladder. Moving is
 * turned off while searching, because the filtered list doesn't show
 * every rank's neighbours.
 */
export default function RankAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: ranks = [], isLoading, isError, refetch } = useGetRanks();
  const reorderRanks = useReorderRanks();
  const deleteRank = useDeleteRank();

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminRank | null>(null);

  const isSearching = search.trim().length > 0;
  const canMove = canManage && !isSearching && !reorderRanks.isPending;

  const visibleRanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranks;
    return ranks.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q),
    );
  }, [ranks, search]);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ranks.length) return;
    try {
      await reorderRanks.mutateAsync(swap(ranks, index, target));
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Unable to change rank order.",
        "Reorder failed",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRank.mutateAsync(deleteTarget.id);
      successToast("Rank deleted.");
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Ranks"
        description="The official rank ladder, from the first rank to the most senior. This order is used everywhere ranks are shown."
        // actionLabel="Add Rank"
        // onAction={() => openDrawer("create-rank")}
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit rank updates."
        stats={
          <Badge className="bg-primary/10 text-primary">
            {ranks.length} rank{ranks.length === 1 ? "" : "s"}
          </Badge>
        }
      />

      <section className={adminFilterBarCx}>
        <Input
          placeholder="Search ranks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<LuSearch size={16} className="text-text-muted" />}
          className="w-full sm:max-w-md"
        />
        {isSearching && (
          <p className="text-xs text-text-muted">Clear the search to change the order.</p>
        )}
      </section>

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Spinner label="Loading ranks…" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-rose-600">Unable to load ranks.</p>
            <Button size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <>
            <div className={adminTableScrollCx}>
              <Table className={adminTableMinCx}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">POSITION</TableHead>
                    <TableHead>RANK</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>AGE RANGE</TableHead>
                    <TableHead>DESCRIPTION</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRanks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.06] text-primary">
                            <LuMedal size={20} />
                          </div>
                          <p className="text-sm font-semibold text-text-dark">
                            {isSearching ? "No ranks match your search" : "No ranks defined yet"}
                          </p>
                          {!isSearching && (
                            <Button
                              size="sm"
                              className="bg-primary text-white"
                              onClick={() => openDrawer("create-rank")}
                              disabled={!canManage}
                            >
                              <LuPlus size={14} />
                              Add Rank
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRanks.map((rank) => {
                      // Position in the full ladder, not in the filtered list.
                      const index = ranks.findIndex((r) => r.id === rank.id);
                      return (
                        <TableRow key={rank.id} className="hover:bg-background/60">
                          <TableCell>
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {index + 1}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                {rank.image ? <AvatarImage src={rank.image} alt={rank.name} /> : null}
                                <AvatarFallback>{rank.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <p className="text-sm font-semibold text-primary">{rank.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{rank.category}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-text-muted">
                            {rank.maxAge ? `${MIN_JOIN_AGE}–${rank.maxAge}` : `${MIN_JOIN_AGE}+`}
                          </TableCell>
                          <TableCell>
                            <p className="line-clamp-2 max-w-md text-sm text-text-muted">
                              {rank.description}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Move ${rank.name} up`}
                                disabled={!canMove || index === 0}
                                onClick={() => move(index, -1)}
                              >
                                <LuArrowUp size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Move ${rank.name} down`}
                                disabled={!canMove || index === ranks.length - 1}
                                onClick={() => move(index, 1)}
                              >
                                <LuArrowDown size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit ${rank.name}`}
                                disabled={!canManage}
                                onClick={() => openDrawer("edit-rank", { body: rank })}
                              >
                                <LuPencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete ${rank.name}`}
                                disabled={!canManage}
                                className="text-rose-600 hover:text-rose-600"
                                onClick={() => setDeleteTarget(rank)}
                              >
                                <LuTrash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className={adminTableFooterCx}>
              <p className="text-xs text-text-muted">
                Position 1 is the first rank. Use the arrows to move a rank up or down the ladder.
              </p>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete rank"
        message={`Remove ${deleteTarget?.name ?? "this rank"}? Ranks below it move up one position.`}
        loading={deleteRank.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
