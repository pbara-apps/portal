import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import { ImageUploadField } from "@/features/admin/components/shared/ImageUploadField";
import { useCreateProgram, useGetPrograms, useUpdateProgram } from "@/lib/api/program";
import type { AdminProgram, ProgramFormPayload } from "@/types/admin";
import {
  REGISTRATION_MODE_LABELS,
  REGISTRATION_MODES,
} from "@/types/admin";

interface ProgramFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminProgram;
  onClose: () => void;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toForm(initial?: AdminProgram): ProgramFormPayload {
  return {
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    programCode: initial?.programCode ?? "",
    category: initial?.category ?? "",
    description: initial?.description ?? "",
    flyerImageUrl: initial?.flyerImageUrl ?? null,
    amount: initial?.amount ?? 0,
    bankDetails: {
      bankName: initial?.bankDetails.bankName ?? "",
      accountName: initial?.bankDetails.accountName ?? "",
      accountNumber: initial?.bankDetails.accountNumber ?? "",
    },
    registrationMode: initial?.registrationMode ?? "both",
    registrationDeadline: initial?.registrationDeadline ?? "",
    isActive: initial?.isActive ?? true,
    termsAndConditions: initial?.termsAndConditions ?? "",
  };
}

export function ProgramFormDrawer({
  mode,
  initial,
  onClose,
}: ProgramFormDrawerProps) {
  const [form, setForm] = useState<ProgramFormPayload>(toForm(initial));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const { data: programs = [] } = useGetPrograms();

  const existingCategories = useMemo(() => {
    const set = new Set(programs.map((p) => p.category).filter(Boolean));
    if (initial?.category) set.add(initial.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [programs, initial?.category]);

  useEffect(() => {
    setForm(toForm(initial));
    setSlugTouched(mode === "edit");
  }, [initial, mode]);

  const saving = createProgram.isPending || updateProgram.isPending;
  const isCreate = mode === "create";

  const setTitle = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugify(title),
    }));
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const slug = (form.slug ?? "").trim();
    const category = form.category.trim();
    const amount = Number(form.amount);

    if (!title || title.length < 3) {
      errorToast("Title must be at least 3 characters.", "Validation");
      return;
    }
    if (!slug || !SLUG_PATTERN.test(slug)) {
      errorToast(
        "Slug must be URL-safe (lowercase letters, numbers, hyphens).",
        "Validation",
      );
      return;
    }
    const programCode = (form.programCode ?? "").trim();
    if (programCode && !/^[A-Za-z0-9]{2,12}$/.test(programCode)) {
      errorToast(
        "Program code must be 2–12 letters or numbers (optional).",
        "Validation",
      );
      return;
    }
    if (!category || category.length < 2) {
      errorToast("Category is required.", "Validation");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errorToast("Amount must be a positive number.", "Validation");
      return;
    }
    if (
      !form.bankDetails.bankName.trim() ||
      !form.bankDetails.accountName.trim() ||
      !form.bankDetails.accountNumber.trim()
    ) {
      errorToast("Bank name, account name, and account number are required.", "Validation");
      return;
    }

    const payload: ProgramFormPayload = {
      title,
      slug,
      programCode: form.programCode?.trim()
        ? form.programCode.trim().toUpperCase()
        : null,
      category,
      description: form.description?.trim() || null,
      flyerImageUrl: form.flyerImageUrl || null,
      amount,
      bankDetails: {
        bankName: form.bankDetails.bankName.trim(),
        accountName: form.bankDetails.accountName.trim(),
        accountNumber: form.bankDetails.accountNumber.trim(),
      },
      registrationMode: form.registrationMode,
      registrationDeadline: form.registrationDeadline?.trim() || null,
      isActive: form.isActive ?? true,
      termsAndConditions: form.termsAndConditions?.trim() || null,
    };

    try {
      if (isCreate) {
        await createProgram.mutateAsync(payload);
        successToast("Program created successfully.");
      } else if (initial?.id) {
        await updateProgram.mutateAsync({ id: initial.id, body: payload });
        successToast("Program updated successfully.");
      }
      onClose();
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Unable to save program.",
        "Save failed",
      );
    }
  };

  return (
    <DrawerFormShell>
      <SheetHeader className="flex flex-col gap-1 bg-background/40">
        <h3 className="text-lg font-semibold tracking-tight text-primary">
          {isCreate ? "Create Program" : "Edit Program"}
        </h3>
        <p className="text-xs text-text-muted">
          Registration categories shown on the public registration portal.
        </p>
      </SheetHeader>

      <SheetBody className="space-y-5">
        <ImageUploadField
          label="Flyer image"
          value={form.flyerImageUrl}
          onChange={(url) => setForm((f) => ({ ...f, flyerImageUrl: url }))}
          folder="programs"
          previewName={form.title || "Program"}
        />

        <Input
          label="Title"
          placeholder="e.g. Annual Convention 2026"
          value={form.title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          label="Slug"
          placeholder="annual-convention-2026"
          value={form.slug ?? ""}
          onChange={(e) => {
            setSlugTouched(true);
            setForm((f) => ({ ...f, slug: e.target.value }));
          }}
          required
        />

        <div className="space-y-2">
          <Input
            label="Program code (optional)"
            placeholder="e.g. RCAMP26"
            value={form.programCode ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                programCode: e.target.value.toUpperCase(),
              }))
            }
          />
          <p className="text-xs text-text-muted">
            Used in registration numbers (PBARA/CODE/…). If empty, a code is
            derived from the slug.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-dark">Category</label>
          <Input
            list="program-category-suggestions"
            placeholder="e.g. Convention, Training"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
          />
          <datalist id="program-category-suggestions">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <Textarea
          label="Description"
          rows={3}
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Short overview of this registration program…"
        />

        <Input
          type="number"
          min={0}
          step="0.01"
          label="Amount (₦)"
          value={form.amount ? String(form.amount) : ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, amount: Number(e.target.value || 0) }))
          }
          required
        />

        <div className="space-y-3 rounded-xl border border-text-dark/10 bg-background/40 p-3 sm:p-4">
          <p className="text-xs font-semibold text-text-dark">Bank details</p>
          <Input
            label="Bank name"
            value={form.bankDetails.bankName}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                bankDetails: { ...f.bankDetails, bankName: e.target.value },
              }))
            }
            required
          />
          <Input
            label="Account name"
            value={form.bankDetails.accountName}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                bankDetails: { ...f.bankDetails, accountName: e.target.value },
              }))
            }
            required
          />
          <Input
            label="Account number"
            value={form.bankDetails.accountNumber}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                bankDetails: {
                  ...f.bankDetails,
                  accountNumber: e.target.value,
                },
              }))
            }
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-dark">
              Registration mode
            </label>
            <Select
              value={form.registrationMode}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  registrationMode: v as typeof form.registrationMode,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_MODES.map((modeOption) => (
                  <SelectItem key={modeOption} value={modeOption}>
                    {REGISTRATION_MODE_LABELS[modeOption]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            type="date"
            label="Registration deadline (optional)"
            value={form.registrationDeadline ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                registrationDeadline: e.target.value || null,
              }))
            }
          />
        </div>

        <Textarea
          label="Terms and conditions (optional)"
          rows={4}
          value={form.termsAndConditions ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, termsAndConditions: e.target.value }))
          }
          placeholder="Shown to registrants before they pay…"
        />

        <div className="flex items-center justify-between rounded-xl border border-text-dark/10 bg-background/40 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-text-dark">Active</p>
            <p className="text-xs text-text-muted">
              Inactive programs are hidden from public registration.
            </p>
          </div>
          <Switch
            checked={form.isActive !== false}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, isActive: checked }))
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
          {isCreate ? "Create Program" : "Save Changes"}
        </Button>
      </SheetFooter>
    </DrawerFormShell>
  );
}
