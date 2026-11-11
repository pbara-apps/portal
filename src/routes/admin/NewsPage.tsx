import { useState } from "react";
import { LuNewspaper, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
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
import { useDeleteNews, useDeleteNewsBulk, useGetNews } from "@/lib/api/news";
import { useDrawer } from "@/store/useDrawer";
import { NEWS_CATEGORIES, NEWS_STATUSES, type AdminNews, type NewsStatus } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const STATUS: Record<NewsStatus, { label: string; tone: StatusTone }> = {
  published: { label: "Published", tone: "success" },
  draft: { label: "Draft", tone: "warning" },
};

const SORTS: Record<string, { label: string; sort: TableSort }> = {
  newest: { label: "Newest first", sort: { column: "date", direction: "descending" } },
  oldest: { label: "Oldest first", sort: { column: "date", direction: "ascending" } },
  title: { label: "Title A–Z", sort: { column: "title", direction: "ascending" } },
};

const searchText = (n: AdminNews) => `${n.title} ${n.excerpt} ${n.category} ${n.author ?? ""}`;
// `date` arrives formatted for display ("Mar 12, 2026"); Date.parse reads it back for sorting.
const sortValue = (n: AdminNews, column: string) => (column === "date" ? Date.parse(n.date) || 0 : n.title);

export default function NewsAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const canManage = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: items = [], isLoading, isError, refetch } = useGetNews();
  const deleteOne = useDeleteNews();
  const deleteBulk = useDeleteNewsBulk();

  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<NewsStatus | "all">("all");
  const [sortKey, setSortKey] = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const table = useClientTable({
    rows: items.filter((n) => (category === "all" || n.category === category) && (status === "all" || n.status === status)),
    pageSize: 9,
    searchText,
    sortValue,
    initialSort: SORTS.newest.sort,
    resetKey: `${category}|${status}`,
  });
  const filtering = table.query.trim() !== "" || category !== "all" || status !== "all";
  const publishedCount = items.filter((n) => n.status === "published").length;

  const openCreate = () => openDrawer("create-news");
  const openEdit = (item: AdminNews) => openDrawer("edit-news", { body: item });
  const clearFilters = () => {
    table.setQuery("");
    setCategory("all");
    setStatus("all");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) await deleteOne.mutateAsync(deleteTarget.ids[0]);
      else await deleteBulk.mutateAsync(deleteTarget.ids);
      successToast(deleteTarget.ids.length === 1 ? "Article deleted." : `${deleteTarget.ids.length} articles deleted.`);
      table.clearSelection();
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="News & announcements"
        description="Bulletins, press releases and association updates for the public website."
        meta={
          !isLoading && !isError ? (
            <p className="text-sm text-muted">
              <span className="font-medium text-foreground tabular-nums">{publishedCount}</span> of {items.length} published
            </p>
          ) : null
        }
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <LuPlus size={16} aria-hidden />
              New article
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        <TableToolbar
          search={{ value: table.query, onChange: table.setQuery, placeholder: "Search title, excerpt, author…" }}
          filters={
            <>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {NEWS_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => setStatus(v as NewsStatus | "all")}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {NEWS_STATUSES.map((s) => (
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
          aria-label="News articles"
          items={table.pageRows}
          getId={(n) => n.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load news."
          onRetry={() => refetch()}
          selection={canManage ? { selectedIds: table.selectedIds, onChange: table.setSelectedIds } : undefined}
          summary={`${table.total} article${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          renderCard={(item, select) => (
            <ContentCard
              title={item.title}
              eyebrow={[item.date !== "—" && item.date, item.author].filter(Boolean).join(" · ")}
              description={item.excerpt}
              image={item.image}
              fallbackIcon={LuNewspaper}
              tag={item.category}
              status={STATUS[item.status]}
              onOpen={canManage ? () => openEdit(item) : undefined}
              {...select}
              actions={[
                canManage && { label: "Edit article", icon: LuPencil, tone: "accent", onAction: () => openEdit(item) },
                canManage && {
                  label: "Delete article",
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
                icon={LuNewspaper}
                title="No articles match your filters"
                action={
                  <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={LuNewspaper}
                title="No articles yet"
                description="Published articles appear on the public news page."
                action={
                  canManage ? (
                    <Button type="button" size="sm" onClick={openCreate}>
                      <LuPlus size={14} aria-hidden />
                      New article
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
        entityLabel="Article"
        onClear={table.clearSelection}
        onDelete={() =>
          setDeleteTarget({ ids: Array.from(table.selectedIds), label: `${table.selectedIds.size} selected articles` })
        }
        deleting={deleteBulk.isPending}
        disabled={!canManage}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete article"
        message={`Remove ${deleteTarget?.label ?? "the selected articles"}? They will no longer appear on the public site.`}
        loading={deleteOne.isPending || deleteBulk.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
