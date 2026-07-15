import { useEffect, useState } from "react";
import { LuMail, LuPhone } from "react-icons/lu";
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
import { useGetChapters } from "@/lib/api/church";
import { useCreateExecutive, useUpdateExecutive } from "@/lib/api/executive";
import { useGetOffices } from "@/lib/api/office";
import { useGetRanks } from "@/lib/api/rank";
import type { AdminExecutive, ExecutiveFormPayload } from "@/types/admin";
import { EXECUTIVE_STATUSES } from "@/types/admin";

interface ExecutiveFormDrawerProps {
  mode: "create" | "edit";
  initial?: AdminExecutive;
  onClose: () => void;
}

const currentYear = new Date().getFullYear();
const NO_RANK = "__none__";

function toForm(
  initial?: AdminExecutive,
): ExecutiveFormPayload & { id?: string } {
  return {
    id: initial?.id,
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    office_id: initial?.officeId ?? "",
    church_id: initial?.churchId ?? "",
    rank_id: initial?.rankId ?? null,
    start_year: initial?.startYear ?? currentYear,
    end_year: initial?.endYear ?? null,
    status: initial?.status ?? "active",
    description: initial?.description ?? "",
    image: initial?.image ?? null,
    password: "",
    title: "Director's Desk",
  };
}

export function ExecutiveFormDrawer({
  mode,
  initial,
  onClose,
}: ExecutiveFormDrawerProps) {
  const [form, setForm] = useState(toForm(initial));
  const { data: offices = [], isLoading: officesLoading } = useGetOffices();
  const { data: chapters = [], isLoading: chaptersLoading } = useGetChapters();
  const { data: ranks = [], isLoading: ranksLoading } = useGetRanks();
  const createExecutive = useCreateExecutive();
  const updateExecutive = useUpdateExecutive();

  useEffect(() => {
    setForm(toForm(initial));
  }, [initial]);

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const saving = createExecutive.isPending || updateExecutive.isPending;
  const isCreate = mode === "create";

  const chapterOptions = chapters.map((c) => ({
    id: c.id,
    label: `${c.chapter} · ${c.name}`,
  }));

  const resetCreateForm = () => {
    setForm(toForm(undefined));
  };

  const handleSave = async (options?: { closeAfterSave?: boolean }) => {
    const closeAfterSave = options?.closeAfterSave ?? true;
    if (
      !form.name.trim() ||
      !form.office_id ||
      !form.church_id ||
      !form.phone.trim()
    ) {
      errorToast("Please complete all required fields.", "Validation");
      return;
    }

    const payload: ExecutiveFormPayload = {
      name: form.name.trim(),
      email: form.email?.trim() || undefined,
      phone: form.phone.trim(),
      office_id: form.office_id,
      church_id: form.church_id,
      rank_id: form.rank_id || null,
      start_year: Number(form.start_year),
      end_year: form.end_year ? Number(form.end_year) : null,
      status: form.status,
      description: form.description.trim() || "—",
      image: form.image,
      title: form.title,
    };

    if (isCreate) {
      const pwd = form.password?.trim();
      if (!pwd || pwd.length < 8) {
        errorToast("Password must be at least 8 characters.", "Validation");
        return;
      }
      payload.password = pwd;
    } else if (form.password?.trim()) {
      payload.password = form.password.trim();
    }

    try {
      if (isCreate) {
        await createExecutive.mutateAsync(payload);
        successToast("Executive created successfully.");
      } else if (initial?.id) {
        await updateExecutive.mutateAsync({ id: initial.id, body: payload });
        successToast("Executive updated successfully.");
      }
      if (isCreate && !closeAfterSave) {
        resetCreateForm();
      } else {
        onClose();
      }
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? "Unable to save executive.";
      errorToast(message, "Save failed");
    }
  };

  return (
    <DrawerFormShell>
      <SheetHeader className="flex flex-col gap-1 bg-background/40">
        <h3 className="text-lg font-semibold tracking-tight text-primary">
          {isCreate ? "Add New Executive" : "Edit Executive"}
        </h3>
        <p className="text-xs text-text-muted">
          Assign office, chapter, rank, and contact details. Active executives
          appear on the public site.
        </p>
      </SheetHeader>

      <SheetBody className="space-y-5">
        <ImageUploadField
          label="Profile Photo"
          value={form.image}
          onChange={(url) => update("image", url)}
          folder="executives"
          previewName={form.name || "Executive"}
        />

        <Input
          label="Full Name"
          placeholder="e.g. Dr. Sarah Adesina"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-dark">
              Office / Role <span className="text-rose-500">*</span>
            </label>
            <Select
              value={form.office_id || undefined}
              onValueChange={(v) => update("office_id", v)}
              disabled={officesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select office" />
              </SelectTrigger>
              <SelectContent>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-dark">
              Chapter <span className="text-rose-500">*</span>
            </label>
            <Select
              value={form.church_id || undefined}
              onValueChange={(v) => update("church_id", v)}
              disabled={chaptersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapterOptions.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-dark">Rank</label>
          <Select
            value={form.rank_id || NO_RANK}
            onValueChange={(v) => update("rank_id", v === NO_RANK ? null : v)}
            disabled={ranksLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rank (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_RANK}>No rank</SelectItem>
              {ranks.map((rank) => (
                <SelectItem key={rank.id} value={rank.id}>
                  {rank.name}
                  {rank.category ? ` · ${rank.category}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            type="number"
            label="Start Year"
            value={String(form.start_year)}
            onChange={(e) =>
              update("start_year", Number(e.target.value) || currentYear)
            }
          />
          <Input
            type="number"
            label="End Year"
            placeholder="Optional"
            value={form.end_year ? String(form.end_year) : ""}
            onChange={(e) =>
              update("end_year", e.target.value ? Number(e.target.value) : null)
            }
          />
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-dark">
              Status
            </label>
            <Select
              value={form.status}
              onValueChange={(v) => update("status", v as typeof form.status)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXECUTIVE_STATUSES.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Textarea
          label="Bio / Description"
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Professional bio shown on the public site…"
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
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
            startContent={<LuPhone size={16} className="text-text-muted" />}
          />
        </div>

        {isCreate && (
          <Input
            type={isCreate ? "password" : "text"}
            label={isCreate ? "Login Password" : "Reset Password (optional)"}
            placeholder={
              isCreate
                ? "Enter a secure password"
                : "Leave blank to keep current"
            }
            value={form.password ?? ""}
            onChange={(e) => update("password", e.target.value)}
          />
        )}
      </SheetBody>

      <SheetFooter className="bg-background/40">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={saving}
          className="w-full border-text-dark/15 font-semibold text-text-dark sm:w-auto"
        >
          Cancel
        </Button>
        {isCreate ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
            {/* <Button
              onClick={() => handleSave({ closeAfterSave: false })}
              loading={saving}
              className="w-full bg-primary font-semibold text-white shadow-md hover:bg-[#040e3d] sm:w-auto"
            >
              Create & Add Another
            </Button> */}
            <Button
              onClick={() => handleSave({ closeAfterSave: true })}
              loading={saving}
              variant="outline"
              className="w-full border-text-dark/15 font-semibold text-text-dark sm:w-auto"
            >
              Create Executive
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => handleSave({ closeAfterSave: true })}
            loading={saving}
            className="w-full bg-primary font-semibold text-white shadow-md hover:bg-[#040e3d] sm:w-auto"
          >
            Save Changes
          </Button>
        )}
      </SheetFooter>
    </DrawerFormShell>
  );
}
