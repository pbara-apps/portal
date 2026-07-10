import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import { Textarea } from "@/components/ui/textarea";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { useCreateOffice, useUpdateOffice } from "@/lib/api/office";
import type { AdminOffice, OfficeFormPayload } from "@/types/admin";

interface OfficeFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminOffice;
  onClose: () => void;
}

export function OfficeFormDrawer({
  mode,
  initial,
  onClose,
}: OfficeFormDrawerProps) {
  const [form, setForm] = useState<OfficeFormPayload>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
  });
  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();

  useEffect(() => {
    setForm({
      name: initial?.name ?? "",
      description: initial?.description ?? "",
    });
  }, [initial]);

  const saving = createOffice.isPending || updateOffice.isPending;
  const isCreate = mode === "create";

  const handleSave = async () => {
    if (!form.name.trim() || form.description.trim().length < 5) {
      errorToast("Name and description (min 5 chars) are required.", "Validation");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
    };

    try {
      if (isCreate) {
        await createOffice.mutateAsync(payload);
        successToast("Office created successfully.");
      } else if (initial?.id) {
        await updateOffice.mutateAsync({ id: initial.id, body: payload });
        successToast("Office updated successfully.");
      }
      onClose();
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? "Unable to save office.";
      errorToast(message, "Save failed");
    }
  };

  return (
    <DrawerFormShell>
      <SheetHeader className="flex flex-col gap-1 bg-background/40">
        <h3 className="text-lg font-semibold tracking-tight text-primary">
          {isCreate ? "Add Office / Position" : "Edit Office / Position"}
        </h3>
        <p className="text-xs text-text-muted">
          Offices define executive roles such as President, Treasurer, and
          Director.
        </p>
      </SheetHeader>

      <SheetBody className="space-y-5">
        <Input
          label="Office Name"
          placeholder="e.g. General Secretary"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <Textarea
          label="Description"
          rows={5}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Responsibilities and scope of this office…"
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
          {isCreate ? "Create Office" : "Save Changes"}
        </Button>
      </SheetFooter>
    </DrawerFormShell>
  );
}
