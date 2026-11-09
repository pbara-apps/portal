import { useMemo, useState } from "react";
import { LuArrowDown, LuArrowUp, LuMedal, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { MIN_JOIN_AGE } from "@/features/chapter/lib/member-utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { MEDIA, useMediaQuery } from "@/hooks/useMediaQuery";
import { useDeleteRank, useGetRanks, useReorderRanks } from "@/lib/api/rank";
import { useDrawer } from "@/store/useDrawer";
import type { AdminRank } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

/** Returns a copy of `list` with the item at `from` swapped with its neighbour at `to`. */
function swap<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

const ageRange = (rank: AdminRank) => (rank.maxAge ? `${MIN_JOIN_AGE}–${rank.maxAge}` : `${MIN_JOIN_AGE}+`);

function RankName({ rank }: { rank: AdminRank }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        {rank.image ? <AvatarImage src={rank.image} alt="" /> : null}
        <AvatarFallback>{rank.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <span className="truncate font-medium text-foreground">{rank.name}</span>
    </div>
  );
}

/**
 * Ranks page: the official rank ladder.
 *
 * Ranks are listed lowest first. Admins move a rank one step at a time
 * with the arrows beside its position; each move saves the whole ladder.
 * Moving is turned off while searching, because the filtered list doesn't
 * show every rank's neighbours.
 */
export default function RankAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const canManage = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: ranks = [], isLoading, isError, refetch } = useGetRanks();
  const reorderRanks = useReorderRanks();
  const deleteRank = useDeleteRank();

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminRank | null>(null);

  // Phones show cards without the position column, so moving goes in the row menu.
  const isDesktop = useMediaQuery(MEDIA.md);
  const isSearching = search.trim().length > 0;
  const canMove = canManage && !isSearching && !reorderRanks.isPending;

  const visibleRanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranks;
    return ranks.filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [ranks, search]);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ranks.length) return;
    try {
      await reorderRanks.mutateAsync(swap(ranks, index, target));
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to change rank order.", "Reorder failed");
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

  const openEdit = (rank: AdminRank) => openDrawer("edit-rank", { body: rank });

  const positionCell = (rank: AdminRank) => {
    // Position in the full ladder, not in the filtered list.
    const index = ranks.findIndex((r) => r.id === rank.id);
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/[0.07] text-xs font-semibold tabular-nums text-primary">
          {index + 1}
        </span>
        {canManage ? (
          <span className="flex">
            <Tooltip content="Move up">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move ${rank.name} up`}
                disabled={!canMove || index === 0}
                onClick={() => move(index, -1)}
                className="size-7 min-w-7 text-muted"
              >
                <LuArrowUp size={14} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content="Move down">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move ${rank.name} down`}
                disabled={!canMove || index === ranks.length - 1}
                onClick={() => move(index, 1)}
                className="size-7 min-w-7 text-muted"
              >
                <LuArrowDown size={14} aria-hidden />
              </Button>
            </Tooltip>
          </span>
        ) : null}
      </div>
    );
  };

  const columns: DataTableColumn<AdminRank>[] = [
    { id: "position", header: "Position", className: "w-32", cell: positionCell },
    { id: "name", header: "Rank", isRowHeader: true, cell: (r) => <RankName rank={r} /> },
    { id: "category", header: "Category", cell: (r) => <Badge variant="outline">{r.category}</Badge> },
    { id: "age", header: "Age range", className: "whitespace-nowrap", cell: (r) => <span className="tabular-nums text-muted">{ageRange(r)}</span> },
    {
      id: "description",
      header: "Description",
      hideBelow: "xl",
      cell: (r) => <p className="line-clamp-2 max-w-md text-muted">{r.description}</p>,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Ranks"
        description="The official rank ladder, from the first rank to the most senior. This order is used everywhere ranks are shown."
      />

      <div className="space-y-3">
        <TableToolbar
          search={{ value: search, onChange: setSearch, placeholder: "Search ranks or categories…" }}
          actions={
            isSearching && canManage ? <p className="text-xs text-muted">Clear the search to change the order.</p> : null
          }
        />

        <DataTable
          aria-label="Rank ladder"
          columns={columns}
          rows={visibleRanks}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load ranks."
          onRetry={() => refetch()}
          onRowAction={canManage ? openEdit : undefined}
          rowActions={(rank) => {
            const index = ranks.findIndex((r) => r.id === rank.id);
            return (
              <RowActions
                label={`Actions for ${rank.name}`}
                actions={[
                  !isDesktop && canManage && { label: "Move up", icon: LuArrowUp, disabled: !canMove || index === 0, onAction: () => move(index, -1) },
                  !isDesktop && canManage && { label: "Move down", icon: LuArrowDown, disabled: !canMove || index === ranks.length - 1, onAction: () => move(index, 1) },
                  { label: "Edit rank", icon: LuPencil, tone: "accent", disabled: !canManage, onAction: () => openEdit(rank) },
                  { label: "Delete rank", icon: LuTrash2, danger: true, disabled: !canManage, onAction: () => setDeleteTarget(rank) },
                ]}
              />
            );
          }}
          renderCard={(rank) => (
            <div className="flex items-start gap-3">
              <span className="mt-1.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/[0.07] text-[11px] font-semibold text-primary">
                {ranks.findIndex((r) => r.id === rank.id) + 1}
              </span>
              <div className="min-w-0">
                <RankName rank={rank} />
                <p className="mt-1 text-xs text-muted">
                  {rank.category} · Ages {ageRange(rank)}
                </p>
              </div>
            </div>
          )}
          emptyState={
            isSearching ? (
              <EmptyState
                icon={LuMedal}
                title="No ranks match your search"
                action={
                  <Button type="button" size="sm" variant="outline" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={LuMedal}
                title="No ranks defined yet"
                description="Ranks form the ladder ambassadors progress through."
                action={
                  <Button type="button" size="sm" onClick={() => openDrawer("create-rank")} disabled={!canManage}>
                    <LuPlus size={14} aria-hidden />
                    Add rank
                  </Button>
                }
              />
            )
          }
          summary={
            canManage
              ? "Position 1 is the first rank. Use the arrows to move a rank up or down."
              : `${ranks.length} rank${ranks.length === 1 ? "" : "s"}, first rank at the top`
          }
          minWidth={760}
        />
      </div>

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
