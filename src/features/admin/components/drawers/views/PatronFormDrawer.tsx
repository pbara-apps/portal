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
import { Textarea } from "@/components/ui/textarea";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { ImageUploadField } from "@/features/admin/components/shared/ImageUploadField";
import { useCreatePatron, useUpdatePatron } from "@/lib/api/patron";
import type { AdminPatron, PatronFormPayload } from "@/types/admin";
import { PATRON_STATUSES } from "@/types/admin";

interface PatronFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminPatron;
  onClose: () => void;
}

function toForm(initial?: AdminPatron): PatronFormPayload {
  return {
    name: initial?.name ?? "",
    role: initial?.role ?? "Patron",
    quote: initial?.quote ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? null,
    status: initial?.status ?? "active",
    sort_order: initial?.sortOrder ?? 0,
  };
}

export function PatronFormDrawer({
  mode,
  initial,
  onClose,
}: PatronFormDrawerProps) {
  const [form, setForm] = useState<PatronFormPayload>(toForm(initial));
  const createPatron = useCreatePatron();
  const updatePatron = useUpdatePatron();

  useEffect(() => {
    setForm(toForm(initial));
  }, [initial]);

  const saving = createPatron.isPending || updatePatron.isPending;
  const isCreate = mode === "create";

  const handleSave = async () => {
    if (!form.name.trim() || !form.role.trim() || !form.quote.trim()) {
      errorToast("Name, role, and quote are required.", "Validation");
      return;
    }

    const payload: PatronFormPayload = {
      name: form.name.trim(),
      role: form.role.trim(),
      quote: form.quote.trim(),
      description: form.description?.trim() || null,
      image: form.image,
      status: form.status,
      sort_order: Number(form.sort_order ?? 0),
    };

    try {
      if (isCreate) {
        await createPatron.mutateAsync(payload);
        successToast("Patron created successfully.");
      } else if (initial?.id) {
        await updatePatron.mutateAsync({ id: initial.id, body: payload });
        successToast("Patron updated successfully.");
      }
      onClose();
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? "Unable to save patron.";
      errorToast(message, "Save failed");
    }
  };

  return (
    <DrawerFormShell>
      <SheetHeader className="flex flex-col gap-1 bg-background/40">
        <h3 className="text-lg font-semibold tracking-tight text-primary">
          {isCreate ? "Add Patron" : "Edit Patron"}
        </h3>
        <p className="text-xs text-text-muted">
          Patrons appear on the public executives page as spiritual guides and
          supporters.
        </p>
      </SheetHeader>

      <SheetBody className="space-y-5">
        <ImageUploadField
          label="Patron Photo"
          value={form.image}
          onChange={(url) => setForm((f) => ({ ...f, image: url }))}
          folder="patrons"
          previewName={form.name || "Patron"}
        />

        <Input
          label="Full Name"
          placeholder="e.g. Patron Alabi Adeoye"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />

        <Input
          label="Role / Title"
          placeholder="e.g. Patron, Grand Patron"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          required
        />

        <Textarea
          label="Quote"
          rows={3}
          value={form.quote}
          onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
          placeholder="A short guiding quote shown on the public site…"
          required
        />

        <Textarea
          label="Description (optional)"
          rows={3}
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Brief bio or supporting description…"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {PATRON_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            type="number"
            label="Sort order"
            value={String(form.sort_order ?? 0)}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sort_order: Number(e.target.value || 0),
              }))
            }
          />
        </div>
      </SheetBody>

      <SheetFooter className="bg-background/40">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
          className="w-full bg-primary font-semibold text-white shadow-md hover:bg-[#040e3d] sm:w-auto"
        >
          {isCreate ? "Create Patron" : "Save Changes"}
        </Button>
      </SheetFooter>
    </DrawerFormShell>
  );
}
