import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/features/admin/components/shared/ImageUploadField";

export type AccountDetails = { name: string; email: string; phone: string; photo?: string | null };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks the three fields; returns an error message per field. */
function validate(d: AccountDetails) {
  return {
    name: d.name.trim().length < 3 ? "Enter the full name" : "",
    email: EMAIL.test(d.email.trim()) ? "" : "Enter a valid email address",
    phone: d.phone.trim().length < 7 ? "Enter a valid phone number" : "",
  };
}

/**
 * Name / email / phone form for a portal login (counsellor, president or
 * secretary). A one-time password is emailed after saving.
 */
export function AccountDetailsDialog({
  open,
  title,
  description,
  initial,
  saving,
  withPhoto = false,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  description: string;
  initial?: Partial<AccountDetails> | null;
  saving: boolean;
  /** Show a photo field (e.g. counsellors, shown on the public site). */
  withPhoto?: boolean;
  onClose: () => void;
  onSave: (details: AccountDetails) => void;
}) {
  const [form, setForm] = useState<AccountDetails>({ name: "", email: "", phone: "" });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        email: initial?.email ?? "",
        phone: initial?.phone ?? "",
        photo: initial?.photo ?? null,
      });
      setTouched(false);
    }
  }, [open, initial]);

  const errors = validate(form);
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (!hasErrors) {
      onSave({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        ...(withPhoto ? { photo: form.photo ?? null } : {}),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {withPhoto && (
            <ImageUploadField
              label="Photo (optional)"
              value={form.photo ?? null}
              onChange={(url) => setForm((f) => ({ ...f, photo: url }))}
              folder="chapters"
              previewName={form.name || "Counsellor"}
            />
          )}
          <Input
            label="Full name"
            value={form.name}
            error={touched ? errors.name : undefined}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Email address"
            type="email"
            value={form.email}
            error={touched ? errors.email : undefined}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Phone number"
            type="tel"
            value={form.phone}
            error={touched ? errors.phone : undefined}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving} className="bg-primary text-white">Save & send login</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
