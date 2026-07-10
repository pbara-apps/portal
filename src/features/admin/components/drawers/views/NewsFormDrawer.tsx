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
import { Textarea } from "@/components/ui/textarea";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { ImageUploadField } from "@/features/admin/components/shared/ImageUploadField";
import { RichTextEditor } from "@/features/admin/components/shared/RichTextEditor";
import { useCreateNews, useUpdateNews } from "@/lib/api/news";
import type { AdminNews, NewsFormPayload } from "@/types/admin";
import { NEWS_CATEGORIES, NEWS_STATUSES } from "@/types/admin";

interface NewsFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminNews;
  onClose: () => void;
}

export function NewsFormDrawer({ mode, initial, onClose }: NewsFormDrawerProps) {
  const [form, setForm] = useState<NewsFormPayload>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    category: initial?.category ?? "Announcements",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    image: initial?.image ?? null,
    author: initial?.author ?? "",
    read_time: initial?.readTime ?? 3,
    status: initial?.status ?? "draft",
  });
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();

  useEffect(() => {
    setForm({
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      category: initial?.category ?? "Announcements",
      excerpt: initial?.excerpt ?? "",
      content: initial?.content ?? "",
      image: initial?.image ?? null,
      author: initial?.author ?? "",
      read_time: initial?.readTime ?? 3,
      status: initial?.status ?? "draft",
    });
  }, [initial]);

  const saving = createNews.isPending || updateNews.isPending;

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim()) {
      errorToast("Title and excerpt are required.", "Validation");
      return;
    }
    try {
      if (mode === "create") {
        await createNews.mutateAsync(form);
        successToast("News article created.");
      } else if (initial?.id) {
        await updateNews.mutateAsync({ id: initial.id, body: form });
        successToast("News article updated.");
      }
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Save failed.", "Error");
    }
  };

  return (
    <DrawerFormShell>
      <SheetHeader className="bg-background/40">
        <h3 className="text-lg font-semibold text-primary">
          {mode === "create" ? "Create News Article" : "Edit News Article"}
        </h3>
      </SheetHeader>
      <SheetBody className="space-y-4">
        <ImageUploadField
          label="Cover Image"
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          folder="news"
          previewName={form.title || "News"}
        />
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <Input
          label="Slug (optional)"
          value={form.slug ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-dark">Category</label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NEWS_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          label="Excerpt"
          rows={3}
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          required
        />
        <RichTextEditor
          label="Content"
          value={form.content ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, content: v }))}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Author"
            value={form.author ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
          />
          <Input
            type="number"
            label="Read time (min)"
            value={String(form.read_time ?? 3)}
            onChange={(e) =>
              setForm((f) => ({ ...f, read_time: Number(e.target.value) || 3 }))
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-dark">Status</label>
          <Select
            value={form.status ?? "draft"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, status: v as typeof form.status }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NEWS_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} className="w-full bg-primary text-white sm:w-auto">
          {mode === "create" ? "Publish" : "Save"}
        </Button>
      </SheetFooter>
    </DrawerFormShell>
  );
}
