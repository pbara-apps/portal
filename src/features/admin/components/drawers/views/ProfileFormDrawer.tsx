import { useEffect, useState } from "react";
import { LuMail, LuPhone } from "react-icons/lu";
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
import { useUpdateProfile, type ProfileUpdatePayload } from "@/lib/api/auth";
import type { UserType } from "@/types/user";

interface ProfileFormDrawerProps {
  initial?: UserType | null;
  onClose: () => void;
}

type ProfileFormState = ProfileUpdatePayload & {
  password?: string;
};

function toForm(initial?: UserType | null): ProfileFormState {
  return {
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? null,
    password: "",
  };
}

export function ProfileFormDrawer({
  initial,
  onClose,
}: ProfileFormDrawerProps) {
  const [form, setForm] = useState(toForm(initial));
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    setForm(toForm(initial));
  }, [initial]);

  const update = <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.name?.trim() || !form.phone?.trim()) {
      errorToast("Name and phone are required.", "Validation");
      return;
    }

    const payload: ProfileUpdatePayload = {
      name: form.name.trim(),
      email: form.email?.trim() || "",
      phone: form.phone.trim(),
      title: form.title?.trim() || "",
      description: form.description?.trim() || "",
      image: form.image ?? null,
    };

    const pwd = form.password?.trim();
    if (pwd) {
      if (pwd.length < 8) {
        errorToast("Password must be at least 8 characters.", "Validation");
        return;
      }
      payload.password = pwd;
    }

    try {
      await updateProfile.mutateAsync(payload);
      successToast("Profile updated successfully.");
      onClose();
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Unable to update profile.",
        "Save failed",
      );
    }
  };

  return (
    <DrawerFormShell>
      <SheetHeader className="flex flex-col gap-1 bg-background/40">
        <h3 className="text-lg font-semibold tracking-tight text-primary">
          Edit Profile
        </h3>
        <p className="text-xs text-text-muted">
          Update your contact details, photo, and public bio. Office and chapter
          assignments are managed by administrators.
        </p>
      </SheetHeader>

      <SheetBody className="space-y-5">
        <ImageUploadField
          label="Profile Photo"
          value={form.image ?? null}
          onChange={(url) => update("image", url)}
          folder="executives"
          previewName={form.name || "Executive"}
        />

        <Input
          label="Full Name"
          placeholder="Your full name"
          value={form.name ?? ""}
          onChange={(e) => update("name", e.target.value)}
          required
        />

        <Input
          label="Public Title"
          placeholder="e.g. Director's Desk"
          value={form.title ?? ""}
          onChange={(e) => update("title", e.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="email"
            label="Email"
            placeholder="email@pba.org"
            value={form.email ?? ""}
            onChange={(e) => update("email", e.target.value)}
            startContent={<LuMail size={16} className="text-text-muted" />}
          />
          <Input
            type="tel"
            label="Phone"
            placeholder="+234 803 123 4567"
            value={form.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            required
            startContent={<LuPhone size={16} className="text-text-muted" />}
          />
        </div>

        <Textarea
          label="Bio / Description"
          minRows={4}
          value={form.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Professional bio shown on the public site…"
        />

        <Input
          type="password"
          label="New Password (optional)"
          placeholder="Leave blank to keep current password"
          value={form.password ?? ""}
          onChange={(e) => update("password", e.target.value)}
        />

        <div className="rounded-xl border border-dashed border-text-dark/10 bg-background/40 px-4 py-3 text-xs text-text-muted">
          <p className="font-semibold text-text-dark">Managed by admin</p>
          <p className="mt-1">
            Office: {initial?.officeName || "—"} · Church:{" "}
            {initial?.churchName || "—"} · Chapter:{" "}
            {initial?.chapterName || "—"}
          </p>
        </div>
      </SheetBody>

      <SheetFooter className="border-t border-text-dark/5 bg-background/40">
        <Button variant="outline" onClick={onClose} disabled={updateProfile.isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving…" : "Save Profile"}
        </Button>
      </SheetFooter>
    </DrawerFormShell>
  );
}
