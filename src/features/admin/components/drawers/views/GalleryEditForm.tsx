import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { ImageUploadField } from "@/features/admin/components/shared/ImageUploadField";
import { useUpdateGalleryItem } from "@/lib/api/gallery";
import type { AdminGalleryItem, GalleryFormPayload } from "@/types/admin";
import { GALLERY_STATUSES, GALLERY_TYPES } from "@/types/admin";

interface GalleryEditFormProps {
  initial: AdminGalleryItem;
  onClose: () => void;
}

export function GalleryEditForm({ initial, onClose }: GalleryEditFormProps) {
  const [form, setForm] = useState<GalleryFormPayload>({
    title: initial.title,
    alt: initial.alt ?? "",
    url: initial.url,
    type: initial.type,
    category: initial.category,
    status: initial.status,
    sort_order: initial.sortOrder,
  });
  const updateItem = useUpdateGalleryItem();

  useEffect(() => {
    setForm({
      title: initial.title,
      alt: initial.alt ?? "",
      url: initial.url,
      type: initial.type,
      category: initial.category,
      status: initial.status,
      sort_order: initial.sortOrder,
    });
  }, [initial]);

  const saving = updateItem.isPending;

  const handleSave = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      errorToast("Title and media file are required.", "Validation");
      return;
    }
    try {
      await updateItem.mutateAsync({ id: initial.id, body: form });
      successToast("Gallery item updated.");
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Save failed.", "Error");
    }
  };

  return (
    <DrawerFormShell>
      <SheetHeader className="bg-background/40">
        <h3 className="text-lg font-semibold text-primary">Edit Gallery Item</h3>
      </SheetHeader>
      <SheetBody className="space-y-4">
        <ImageUploadField
          label="Media"
          value={form.url}
          onChange={(url) => setForm((f) => ({ ...f, url: url ?? "" }))}
          folder="gallery"
          previewName={form.title || "Gallery"}
          accept="media"
        />
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <Input
          label="Alt text"
          value={form.alt ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
        />
        <Input
          label="Category"
          value={form.category ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-dark">Type</label>
            <Select
              value={form.type ?? "photo"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, type: v as typeof form.type }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GALLERY_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-dark">Status</label>
            <Select
              value={form.status ?? "active"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, status: v as typeof form.status }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GALLERY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input
          type="number"
          label="Sort order"
          value={String(form.sort_order ?? 0)}
          onChange={(e) =>
            setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
          }
        />
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} className="w-full bg-primary text-white sm:w-auto">
          Save
        </Button>
      </SheetFooter>
    </DrawerFormShell>
  );
}
