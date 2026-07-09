import { useMemo, useState } from "react";
import { LuNewspaper, LuPlus, LuSearch } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AdminContentCard } from "@/features/admin/components/shared/AdminContentCard";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminFilterSearchCx,
  adminFilterSelectCx,
  adminFilterSelectWideCx,
  adminPageCx,
} from "@/features/admin/components/shared/adminLayout";
import { BulkActionBar } from "@/features/admin/components/shared/BulkActionBar";
import { ConfirmDialog } from "@/features/admin/components/shared/ConfirmDialog";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import {
  useDeleteNews,
  useDeleteNewsBulk,
  useGetNews,
} from "@/lib/api/news";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDrawer } from "@/store/useDrawer";
import type { AdminNews, NewsStatus } from "@/types/admin";
import { NEWS_CATEGORIES, NEWS_STATUSES } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const PAGE_SIZE = 9;

export default function NewsAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: items = [], isLoading, isError, refetch } = useGetNews();
  const deleteOne = useDeleteNews();
  const deleteBulk = useDeleteNewsBulk();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<NewsStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, search, category, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const publishedCount = items.filter((i) => i.status === "published").length;

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) await deleteOne.mutateAsync(deleteTarget.ids[0]);
      else await deleteBulk.mutateAsync(deleteTarget.ids);
      successToast("News deleted.");
      setSelected(new Set());
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  const cardProps = (item: AdminNews) => ({
    id: item.id,
    title: item.title,
    subtitle: item.excerpt,
    image: item.image,
    chips: [
      { label: item.category },
      {
        label: item.status,
        color: item.status === "published" ? ("success" as const) : ("warning" as const),
      },
    ],
    selected: selected.has(item.id),
    onSelect: toggleSelect,
    onEdit: () => openDrawer("edit-news", { body: item }),
    onDelete: () => setDeleteTarget({ ids: [item.id], label: item.title }),
    onClick: () => openDrawer("edit-news", { body: item }),
    fallbackIcon: <LuNewspaper size={32} />,
  });

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="News & Announcements"
        description="Publish bulletins, press releases, and association updates."
        actionLabel="Create Article"
        onAction={() => openDrawer("create-news")}
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit news updates."
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">{items.length} articles</Badge>
            <Badge variant="success">{publishedCount} published</Badge>
          </>
        }
      />

      <section className={adminFilterBarCx}>
        <Input
          placeholder="Search news…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          startContent={<LuSearch size={16} className="text-text-muted" />}
          className={adminFilterSearchCx}
        />
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className={adminFilterSelectWideCx}>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {NEWS_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v as NewsStatus | "all"); setPage(1); }}>
          <SelectTrigger className={adminFilterSelectCx}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {NEWS_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner label="" /></div>
      ) : isError ? (
        <div className="py-20 text-center"><Button onClick={() => refetch()}>Retry</Button></div>
      ) : pageItems.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-text-dark/10 py-20">
          <LuNewspaper size={32} className="text-primary/40" />
          <p className="text-sm text-text-muted">No news articles yet.</p>
          <Button className="bg-primary text-white" onClick={() => openDrawer("create-news")} disabled={!canManage}>
            <LuPlus size={16} />
            Create Article
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((item) => (
              <AdminContentCard key={item.id} {...cardProps(item)} canManage={canManage} />
            ))}
          </div>
          <div className="flex justify-center pt-2">
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </div>
        </>
      )}

      <BulkActionBar count={selected.size} entityLabel="Article" onClear={() => setSelected(new Set())} onDelete={() => setDeleteTarget({ ids: Array.from(selected), label: `${selected.size} articles` })} deleting={deleteBulk.isPending} disabled={!canManage} />
      <ConfirmDialog isOpen={!!deleteTarget} title="Delete news" message={`Remove ${deleteTarget?.label ?? "selected articles"}?`} loading={deleteOne.isPending || deleteBulk.isPending} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
}
