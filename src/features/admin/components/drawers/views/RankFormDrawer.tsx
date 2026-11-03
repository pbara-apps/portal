import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import { ImageUploadField } from "@/features/admin/components/shared/ImageUploadField";
import { useCreateRank, useGetRanks, useUpdateRank } from "@/lib/api/rank";
import type { AdminRank, RankFormPayload } from "@/types/admin";

interface RankFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminRank;
  onClose: () => void;
}

type RankFormState = Omit<RankFormPayload, "order"> & { order: string };

function toFormState(rank?: AdminRank): RankFormState {
  return {
    name: rank?.name ?? "",
    description: rank?.description ?? "",
    category: rank?.category ?? "",
    image: rank?.image ?? null,
    order: rank?.order ? String(rank.order) : "",
  };
}

/**
 * Create / edit a rank. "Position in ladder" is optional when creating:
 * left empty, the new rank is placed after the most senior rank.
 */
export function RankFormDrawer({ mode, initial, onClose }: RankFormDrawerProps) {
  const [form, setForm] = useState<RankFormState>(() => toFormState(initial));
  const { data: ranks = [] } = useGetRanks();
  const createRank = useCreateRank();
  const updateRank = useUpdateRank();

  useEffect(() => setForm(toFormState(initial)), [initial]);

  const isCreate = mode === "create";
  const saving = createRank.isPending || updateRank.isPending;
  // A new rank can take any slot up to one past the end.
  const maxPosition = isCreate ? ranks.length + 1 : Math.max(ranks.length, 1);

  const set = <K extends keyof RankFormState>(key: K, value: RankFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (form.name.trim().length < 2 || form.category.trim().length < 2) {
      errorToast("Name and category (min 2 characters) are required.", "Validation");
      return;
    }
    if (form.description.trim().length < 5) {
      errorToast("Description must be at least 5 characters.", "Validation");
      return;
    }
    const position = form.order.trim() ? Number(form.order) : undefined;
    if (
      position !== undefined &&
      (!Number.isInteger(position) || position < 1 || position > maxPosition)
    ) {
      errorToast(`Position must be a whole number from 1 to ${maxPosition}.`, "Validation");
      return;
    }

    const payload: RankFormPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      image: form.image ?? null,
      ...(position !== undefined ? { order: position } : {}),
    };

    try {
      if (isCreate) {
        await createRank.mutateAsync(payload);
        successToast("Rank created successfully.");
      } else if (initial?.id) {
        await updateRank.mutateAsync({ id: initial.id, body: payload });
        successToast("Rank updated successfully.");
      }
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save rank.", "Save failed");
    }
  };

  return (
    <DrawerFormShell>
      <SheetHeader className="flex flex-col gap-1 bg-background/40">
        <h3 className="text-lg font-semibold tracking-tight text-primary">
          {isCreate ? "Add Rank" : "Edit Rank"}
        </h3>
        <p className="text-xs text-text-muted">
          Ranks are shown everywhere in ladder order. Position 1 is the first (lowest) rank.
        </p>
      </SheetHeader>

      <SheetBody className="space-y-5">
        <ImageUploadField
          label="Rank Badge"
          value={form.image}
          onChange={(url) => set("image", url)}
          folder="general"
          previewName={form.name || "Rank"}
        />
        <Input
          label="Rank Name"
          placeholder="e.g. Envoy"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
        <Input
          label="Category"
          placeholder="e.g. Junior"
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          required
        />
        <Input
          label="Position in Ladder"
          type="number"
          min={1}
          max={maxPosition}
          placeholder={isCreate ? `Leave empty to add at the end (${maxPosition})` : ""}
          value={form.order}
          onChange={(e) => set("order", e.target.value)}
        />
        <Textarea
          label="Description"
          rows={5}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What this rank represents and its requirements…"
          required
        />
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
          {isCreate ? "Create Rank" : "Save Changes"}
        </Button>
      </SheetFooter>
    </DrawerFormShell>
  );
}
