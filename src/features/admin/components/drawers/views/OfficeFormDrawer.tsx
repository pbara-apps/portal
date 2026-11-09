import { useEffect, useState } from "react";
import { FormDrawerContent } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateOffice, useUpdateOffice } from "@/lib/api/office";
import type { AdminOffice, OfficeFormPayload } from "@/types/admin";

interface OfficeFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminOffice;
  onClose: () => void;
}

type FieldErrors = Partial<Record<keyof OfficeFormPayload, string>>;

function validate(form: OfficeFormPayload): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Enter the office name.";
  if (form.description.trim().length < 5) errors.description = "Describe the office in at least 5 characters.";
  return errors;
}

export function OfficeFormDrawer({ mode, initial, onClose }: OfficeFormDrawerProps) {
  const [form, setForm] = useState<OfficeFormPayload>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();

  useEffect(() => {
    setForm({ name: initial?.name ?? "", description: initial?.description ?? "" });
    setErrors({});
  }, [initial]);

  const saving = createOffice.isPending || updateOffice.isPending;
  const isCreate = mode === "create";

  const update = (field: keyof OfficeFormPayload, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSave = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = { name: form.name.trim(), description: form.description.trim() };
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
      errorToast((err as { message?: string })?.message ?? "Unable to save office.", "Save failed");
    }
  };

  return (
    <FormDrawerContent
      title={isCreate ? "Add office / position" : "Edit office / position"}
      description="Offices define executive roles such as President, Treasurer and Director."
      onSubmit={handleSave}
      onCancel={onClose}
      submitting={saving}
      submitLabel={isCreate ? "Create office" : "Save changes"}
    >
      <Input
        label="Office name"
        placeholder="e.g. General Secretary"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        error={errors.name}
        required
        autoFocus
      />
      <Textarea
        label="Description"
        rows={5}
        value={form.description}
        onChange={(e) => update("description", e.target.value)}
        placeholder="Responsibilities and scope of this office…"
        error={errors.description}
        required
      />
    </FormDrawerContent>
  );
}
