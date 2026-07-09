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
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { ImageUploadField } from "@/features/admin/components/shared/ImageUploadField";
import { useCreateChapter, useUpdateChapter } from "@/lib/api/church";
import type { AdminChapter, ChapterFormPayload } from "@/types/admin";
import { CHAPTER_STATUSES } from "@/types/admin";

interface ChapterFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminChapter;
  onClose: () => void;
}

export function ChapterFormDrawer({
  mode,
  initial,
  onClose,
}: ChapterFormDrawerProps) {
  const [form, setForm] = useState<ChapterFormPayload>({
    name: initial?.name ?? "",
    chapter: initial?.chapter ?? "",
    address: initial?.address ?? "",
    counsellor: initial?.counsellor ?? "",
    status: initial?.status ?? "active",
    image: initial?.image ?? null,
  });
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();

  useEffect(() => {
    setForm({
      name: initial?.name ?? "",
      chapter: initial?.chapter ?? "",
      address: initial?.address ?? "",
      counsellor: initial?.counsellor ?? "",
      status: initial?.status ?? "active",
      image: initial?.image ?? null,
    });
  }, [initial]);

  const saving = createChapter.isPending || updateChapter.isPending;
  const isCreate = mode === "create";

  const handleSave = async () => {
    if (!form.name.trim() || !form.chapter.trim()) {
      errorToast("Chapter name and church name are required.", "Validation");
      return;
    }

    const payload: ChapterFormPayload = {
      name: form.name.trim(),
      chapter: form.chapter.trim(),
      address: form.address?.trim() || undefined,
      counsellor: form.counsellor?.trim() || undefined,
      status: form.status,
      image: form.image,
    };

    try {
      if (isCreate) {
        await createChapter.mutateAsync(payload);
        successToast("Chapter created successfully.");
      } else if (initial?.id) {
        await updateChapter.mutateAsync({ id: initial.id, body: payload });
        successToast("Chapter updated successfully.");
      }
      onClose();
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? "Unable to save chapter.";
      errorToast(message, "Save failed");
    }
  };

  return (
    <>
      <SheetHeader className="flex flex-col gap-1 bg-background/40">
        <h3 className="text-lg font-semibold tracking-tight text-primary">
          {isCreate ? "Register Chapter" : "Edit Chapter"}
        </h3>
        <p className="text-xs text-text-muted">
          Chapters represent local RA units linked to a Baptist church.
        </p>
      </SheetHeader>

      <SheetBody className="space-y-5">
        <ImageUploadField
          label="Chapter Image"
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          folder="chapters"
          previewName={form.chapter || "Chapter"}
        />

        <Input
          label="Chapter Name"
          placeholder="e.g. Lagos Central"
          value={form.chapter}
          onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))}
          required
        />

        <Input
          label="Church Name"
          placeholder="e.g. First Baptist Church, Yaba"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />

        <Input
          label="Commander / Counsellor"
          placeholder="Unit commander name"
          value={form.counsellor ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, counsellor: e.target.value }))}
        />

        <Input
          label="Address"
          placeholder="Church address"
          value={form.address ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />

        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-dark">Status</label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, status: v as typeof form.status }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAPTER_STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SheetBody>

      <SheetFooter className="bg-background/40">
        <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
          className="w-full bg-primary font-semibold text-white shadow-md hover:bg-[#040e3d] sm:w-auto"
        >
          {isCreate ? "Create Chapter" : "Save Changes"}
        </Button>
      </SheetFooter>
    </>
  );
}
