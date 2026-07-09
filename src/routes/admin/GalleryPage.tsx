import { useMemo, useState } from "react";
import { LuImage, LuPlus, LuSearch, LuVideo } from "react-icons/lu";
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
  useDeleteGalleryBulk,
  useDeleteGalleryItem,
  useGetGallery,
} from "@/lib/api/gallery";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDrawer } from "@/store/useDrawer";
import type { GalleryStatus, GalleryType } from "@/types/admin";
import { GALLERY_STATUSES, GALLERY_TYPES } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const PAGE_SIZE = 9;

export default function GalleryAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: items = [], isLoading, isError, refetch } = useGetGallery();
  const deleteOne = useDeleteGalleryItem();
  const deleteBulk = useDeleteGalleryBulk();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<GalleryType | "all">("all");
  const [status, setStatus] = useState<GalleryStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (type !== "all" && item.type !== type) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.alt.toLowerCase().includes(q)
      );
    });
  }, [items, search, type, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = items.filter((i) => i.status === "active").length;

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
      successToast("Gallery item deleted.");
      setSelected(new Set());
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Delete failed.", "Error");
    }
  };

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Media Gallery"
        description="Manage photos and videos displayed on the public media page."
        actionLabel="Add Media"
        onAction={() => openDrawer("create-gallery", { config: { size: "4xl" } })}
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit gallery updates."
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">{items.length} items</Badge>
            <Badge variant="success">{activeCount} active</Badge>
          </>
        }
      />

      <section className={adminFilterBarCx}>
        <Input placeholder="Search gallery…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} startContent={<LuSearch size={16} className="text-text-muted" />} className={adminFilterSearchCx} />
        <Select value={type} onValueChange={(v) => { setType(v as GalleryType | "all"); setPage(1); }}>
          <SelectTrigger className={adminFilterSelectCx}><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {GALLERY_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v as GalleryStatus | "all"); setPage(1); }}>
          <SelectTrigger className={adminFilterSelectWideCx}><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {GALLERY_STATUSES.map((s) => (
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
          <LuImage size={32} className="text-primary/40" />
          <p className="text-sm text-text-muted">No gallery items yet.</p>
          <Button className="bg-primary text-white" onClick={() => openDrawer("create-gallery", { config: { size: "4xl" } })} disabled={!canManage}>
            <LuPlus size={16} />
            Add Media
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((item) => (
              <AdminContentCard
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.category}
                image={item.type === "photo" ? item.url : undefined}
                chips={[
                  { label: item.type, color: item.type === "video" ? "warning" : "default" },
                  { label: item.status, color: item.status === "active" ? "success" : "danger" },
                ]}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                onEdit={() => openDrawer("edit-gallery", { body: item })}
                onDelete={() => setDeleteTarget({ ids: [item.id], label: item.title })}
                onClick={() => openDrawer("edit-gallery", { body: item })}
                fallbackIcon={item.type === "video" ? <LuVideo size={32} /> : <LuImage size={32} />}
                canManage={canManage}
              />
            ))}
          </div>
          <div className="flex justify-center pt-2">
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </div>
        </>
      )}

      <BulkActionBar count={selected.size} entityLabel="Item" onClear={() => setSelected(new Set())} onDelete={() => setDeleteTarget({ ids: Array.from(selected), label: `${selected.size} items` })} deleting={deleteBulk.isPending} disabled={!canManage} />
      <ConfirmDialog isOpen={!!deleteTarget} title="Delete gallery item" message={`Remove ${deleteTarget?.label ?? "selected items"}?`} loading={deleteOne.isPending || deleteBulk.isPending} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
}
