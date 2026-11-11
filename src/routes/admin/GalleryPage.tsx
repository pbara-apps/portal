import { useState } from "react";
import { LuImage, LuPencil, LuPlus, LuTrash2, LuVideo } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { TableSort } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import type { StatusTone } from "@/components/shared/StatusPill";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { ContentCard } from "@/features/admin/components/shared/ContentCard";
import { ContentGrid } from "@/features/admin/components/shared/ContentGrid";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDeleteGalleryBulk, useDeleteGalleryItem, useGetGallery } from "@/lib/api/gallery";
import { useDrawer } from "@/store/useDrawer";
import {
  GALLERY_STATUSES,
  GALLERY_TYPES,
  type AdminGalleryItem,
  type GalleryStatus,
  type GalleryType,
} from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const STATUS: Record<GalleryStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Hidden", tone: "neutral" },
};

const TYPE_LABEL: Record<GalleryType, string> = { photo: "Photo", video: "Video" };

const SORTS: Record<string, { label: string; sort: TableSort }> = {
  order: { label: "Display order", sort: { column: "order", direction: "ascending" } },
  title: { label: "Title A–Z", sort: { column: "title", direction: "ascending" } },
};

const searchText = (g: AdminGalleryItem) => `${g.title} ${g.category} ${g.alt}`;
const sortValue = (g: AdminGalleryItem, column: string) => (column === "order" ? g.sortOrder : g.title);

export default function GalleryAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const canManage = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: items = [], isLoading, isError, refetch } = useGetGallery();
  const deleteOne = useDeleteGalleryItem();
  const deleteBulk = useDeleteGalleryBulk();

  const [type, setType] = useState<GalleryType | "all">("all");
  const [status, setStatus] = useState<GalleryStatus | "all">("all");
  const [sortKey, setSortKey] = useState("order");
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const table = useClientTable({
    rows: items.filter((g) => (type === "all" || g.type === type) && (status === "all" || g.status === status)),
    pageSize: 9,
    searchText,
    sortValue,
    initialSort: SORTS.order.sort,
    resetKey: `${type}|${status}`,
  });
  const filtering = table.query.trim() !== "" || type !== "all" || status !== "all";
  const activeCount = items.filter((g) => g.status === "active").length;

  const openCreate = () => openDrawer("create-gallery");
  const openEdit = (item: AdminGalleryItem) => openDrawer("edit-gallery", { body: item });
  const clearFilters = () => {
    table.setQuery("");
    setType("all");
    setStatus("all");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) await deleteOne.mutateAsync(deleteTarget.ids[0]);
      else await deleteBulk.mutateAsync(deleteTarget.ids);
      successToast(deleteTarget.ids.length === 1 ? "Media item deleted." : `${deleteTarget.ids.length} media items deleted.`);
      table.clearSelection();
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Media gallery"
        description="Photos and videos shown on the public media page."
        meta={
          !isLoading && !isError ? (
            <p className="text-sm text-muted">
              <span className="font-medium text-foreground tabular-nums">{activeCount}</span> of {items.length} visible
            </p>
          ) : null
        }
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <LuPlus size={16} aria-hidden />
              Add media
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        <TableToolbar
          search={{ value: table.query, onChange: table.setQuery, placeholder: "Search title, category, alt text…" }}
          filters={
            <>
              <Select value={type} onValueChange={(v) => setType(v as GalleryType | "all")}>
                <SelectTrigger aria-label="Type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Photos and videos</SelectItem>
                  {GALLERY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABEL[t]}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => setStatus(v as GalleryStatus | "all")}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {GALLERY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortKey}
                onValueChange={(v) => {
                  setSortKey(v);
                  table.setSort(SORTS[v].sort);
                }}
              >
                <SelectTrigger aria-label="Sort by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORTS).map(([key, s]) => (
                    <SelectItem key={key} value={key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />

        <ContentGrid
          aria-label="Media items"
          items={table.pageRows}
          getId={(n) => n.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load the gallery."
          onRetry={() => refetch()}
          selection={canManage ? { selectedIds: table.selectedIds, onChange: table.setSelectedIds } : undefined}
          summary={`${table.total} item${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          renderCard={(item, select) => (
            <ContentCard
              title={item.title}
              eyebrow={`${TYPE_LABEL[item.type]} · ${item.category}`}
              image={item.type === "photo" ? item.url : null}
              fallbackIcon={item.type === "video" ? LuVideo : LuImage}
              status={STATUS[item.status]}
              onOpen={canManage ? () => openEdit(item) : undefined}
              {...select}
              actions={[
                canManage && { label: "Edit media item", icon: LuPencil, tone: "accent", onAction: () => openEdit(item) },
                canManage && {
                  label: "Delete media item",
                  icon: LuTrash2,
                  danger: true,
                  onAction: () => setDeleteTarget({ ids: [item.id], label: `“${item.title}”` }),
                },
              ]}
            />
          )}
          emptyState={
            filtering ? (
              <EmptyState
                icon={LuImage}
                title="No media matches your filters"
                action={
                  <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={LuImage}
                title="No media yet"
                description="Active photos and videos appear on the public media page."
                action={
                  canManage ? (
                    <Button type="button" size="sm" onClick={openCreate}>
                      <LuPlus size={14} aria-hidden />
                      Add media
                    </Button>
                  ) : undefined
                }
              />
            )
          }
        />
      </div>

      <BulkActionBar
        count={table.selectedIds.size}
        entityLabel="Item"
        onClear={table.clearSelection}
        onDelete={() =>
          setDeleteTarget({ ids: Array.from(table.selectedIds), label: `${table.selectedIds.size} selected items` })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete media item"
        message={`Remove ${deleteTarget?.label ?? "the selected items"}? They will no longer appear on the public media page.`}
        loading={deleteOne.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
