import { useCallback, useMemo, useState } from "react";
import { LuImage, LuTrash2, LuVideo } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/spinner";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { MultiMediaUploadZone } from "@/features/admin/components/shared/MultiMediaUploadZone";
import { useCreateGalleryBulk } from "@/lib/api/gallery";
import { useUploadMedia } from "@/lib/api/upload";
import type { GalleryFormPayload, GalleryStatus, GalleryType } from "@/types/admin";
import { GALLERY_STATUSES, GALLERY_TYPES } from "@/types/admin";

type DraftStatus = "uploading" | "ready" | "error";

interface DraftGalleryItem {
  id: string;
  url: string;
  title: string;
  alt: string;
  type: GalleryType;
  status: DraftStatus;
  error?: string;
}

interface SharedDefaults {
  category: string;
  type: GalleryType | "auto";
  status: GalleryStatus;
  sort_order: number;
}

interface GalleryBulkCreateFormProps {
  onClose: () => void;
}

const MAX_ITEMS = 50;
const UPLOAD_CONCURRENCY = 4;

function titleFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base.replace(/\b\w/g, (char) => char.toUpperCase());
}

function typeFromFile(file: File): GalleryType {
  return file.type.startsWith("video/") ? "video" : "photo";
}

function isVideoUrl(url: string) {
  return url.includes("/video/") || /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function newDraftId() {
  return crypto.randomUUID();
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

export function GalleryBulkCreateForm({ onClose }: GalleryBulkCreateFormProps) {
  const uploadMedia = useUploadMedia();
  const createBulk = useCreateGalleryBulk();

  const [shared, setShared] = useState<SharedDefaults>({
    category: "General",
    type: "auto",
    status: "active",
    sort_order: 0,
  });
  const [items, setItems] = useState<DraftGalleryItem[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const readyItems = useMemo(
    () => items.filter((item) => item.status === "ready"),
    [items],
  );
  const uploadingItems = useMemo(
    () => items.filter((item) => item.status === "uploading"),
    [items],
  );
  const failedItems = useMemo(
    () => items.filter((item) => item.status === "error"),
    [items],
  );

  const updateItem = useCallback((id: string, patch: Partial<DraftGalleryItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const remaining = MAX_ITEMS - items.length;
      if (remaining <= 0) {
        errorToast(`You can add up to ${MAX_ITEMS} items at a time.`, "Limit reached");
        return;
      }

      const batch = files.slice(0, remaining);
      const placeholders: DraftGalleryItem[] = batch.map((file) => ({
        id: newDraftId(),
        url: "",
        title: titleFromFilename(file.name),
        alt: "",
        type: shared.type === "auto" ? typeFromFile(file) : shared.type,
        status: "uploading",
      }));

      setItems((prev) => [...prev, ...placeholders]);
      setUploadingCount((count) => count + batch.length);

      await mapWithConcurrency(batch, UPLOAD_CONCURRENCY, async (file, index) => {
        const draft = placeholders[index];
        try {
          const result = await uploadMedia.mutateAsync({ file, folder: "gallery" });
          updateItem(draft.id, {
            url: result.url,
            type:
              shared.type === "auto"
                ? result.resourceType === "video"
                  ? "video"
                  : "photo"
                : shared.type,
            status: "ready",
            error: undefined,
          });
        } catch (err) {
          updateItem(draft.id, {
            status: "error",
            error:
              (err as { message?: string })?.message ?? "Upload failed.",
          });
        } finally {
          setUploadingCount((count) => Math.max(0, count - 1));
        }
      });
    },
    [items.length, shared.type, updateItem, uploadMedia],
  );

  const handleSave = async () => {
    if (uploadingItems.length > 0 || uploadingCount > 0) {
      errorToast("Wait for all uploads to finish.", "Upload in progress");
      return;
    }

    const payload: GalleryFormPayload[] = readyItems
      .filter((item) => item.title.trim() && item.url.trim())
      .map((item, index) => ({
        title: item.title.trim(),
        alt: item.alt.trim() || item.title.trim(),
        url: item.url.trim(),
        type: item.type,
        category: shared.category.trim() || "General",
        status: shared.status,
        sort_order: (shared.sort_order ?? 0) + index,
      }));

    if (payload.length === 0) {
      errorToast("Add at least one media file with a title.", "Validation");
      return;
    }

    try {
      await createBulk.mutateAsync(payload);
      successToast(
        `${payload.length} gallery item${payload.length === 1 ? "" : "s"} added.`,
      );
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Save failed.", "Error");
    }
  };

  const saving = createBulk.isPending;
  const canSave = readyItems.length > 0 && uploadingCount === 0 && !saving;
  const uploadProgress =
    items.length === 0
      ? 0
      : Math.round(
          ((items.length - uploadingItems.length) / items.length) * 100,
        );

  return (
    <>
      <SheetHeader className="bg-background/40">
        <div>
          <h3 className="text-lg font-semibold text-primary">Add Gallery Media</h3>
          <p className="mt-1 text-xs text-text-muted">
            Upload multiple photos or videos, then review details before saving.
          </p>
        </div>
      </SheetHeader>

      <SheetBody className="space-y-5">
        <section className="rounded-xl border border-text-dark/10 bg-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Shared defaults
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Category"
              value={shared.category}
              onChange={(e) => setShared((s) => ({ ...s, category: e.target.value }))}
            />
            <Input
              type="number"
              label="Starting sort order"
              value={String(shared.sort_order)}
              onChange={(e) =>
                setShared((s) => ({ ...s, sort_order: Number(e.target.value) || 0 }))
              }
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-dark">Default type</label>
              <Select
                value={shared.type}
                onValueChange={(v) =>
                  setShared((s) => ({
                    ...s,
                    type: v as SharedDefaults["type"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
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
                value={shared.status}
                onValueChange={(v) =>
                  setShared((s) => ({
                    ...s,
                    status: v as GalleryStatus,
                  }))
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
        </section>

        <MultiMediaUploadZone
          onFilesSelected={handleFilesSelected}
          disabled={uploadingCount > 0 || saving || items.length >= MAX_ITEMS}
          maxFiles={MAX_ITEMS - items.length}
        />

        {items.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-text-dark">
                  Uploaded items ({items.length})
                </p>
                <p className="text-xs text-text-muted">
                  {readyItems.length} ready
                  {uploadingItems.length > 0 ? ` · ${uploadingItems.length} uploading` : ""}
                  {failedItems.length > 0 ? ` · ${failedItems.length} failed` : ""}
                </p>
              </div>
              {uploadingItems.length > 0 && (
                <Badge className="bg-primary/10 text-primary">Uploading…</Badge>
              )}
            </div>

            {uploadingItems.length > 0 && (
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-background"
                role="progressbar"
                aria-label="Upload progress"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-text-dark/10 bg-background/40 p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-primary/5">
                      {item.status === "uploading" ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <Spinner label="" className="h-5 w-5" />
                        </div>
                      ) : item.url && isVideoUrl(item.url) ? (
                        <video
                          src={item.url}
                          className="h-full w-full object-cover"
                          muted
                        />
                      ) : item.url ? (
                        <img
                          src={item.url}
                          alt={item.alt || item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-primary/40">
                          {item.type === "video" ? (
                            <LuVideo size={24} aria-hidden />
                          ) : (
                            <LuImage size={24} aria-hidden />
                          )}
                        </div>
                      )}
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={
                              item.type === "video"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }
                          >
                            {item.type}
                          </Badge>
                          {item.status === "error" && (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-rose-600 hover:text-rose-700"
                          aria-label={`Remove ${item.title || "item"}`}
                          onClick={() => removeItem(item.id)}
                        >
                          <LuTrash2 size={16} />
                        </Button>
                      </div>

                      <Input
                        label="Title"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                        disabled={item.status === "uploading"}
                        required
                      />
                      <Input
                        label="Alt text"
                        value={item.alt}
                        onChange={(e) => updateItem(item.id, { alt: e.target.value })}
                        disabled={item.status === "uploading"}
                        placeholder={item.title || "Describe this media"}
                      />
                      {item.error && (
                        <p className="text-xs text-rose-600">{item.error}</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </SheetBody>

      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!canSave}
          className="w-full bg-primary text-white sm:w-auto"
        >
          {readyItems.length > 0
            ? `Add ${readyItems.length} item${readyItems.length === 1 ? "" : "s"}`
            : "Add items"}
        </Button>
      </SheetFooter>
    </>
  );
}
