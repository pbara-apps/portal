import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { useAdminChapters } from "@/lib/api/chapter-admin";
import { useGetChapters } from "@/lib/api/church";
import { type CreateDuePayload, useCreateDue } from "@/lib/api/finance";
import { cn } from "@/lib/utils";

/** Two-option toggle used for the due's main choices. */
function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              value === o.value ? "border-primary bg-primary/5" : "border-text-dark/10 hover:border-primary/30",
            )}
          >
            <span className="block text-sm font-semibold text-primary">{o.label}</span>
            <span className="block text-xs text-text-muted">{o.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const EMPTY: CreateDuePayload = {
  title: "",
  description: "",
  type: "due",
  billTo: "chapter",
  chargeBasis: "flat",
  amount: 0,
  period: String(new Date().getFullYear()),
  dueDate: "",
  appliesTo: "all",
};

/**
 * Create a due or levy. Saving creates a bill for every targeted chapter
 * (or church) straight away and notifies them.
 */
export function CreateDueDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateDue();
  const { data: churches = [] } = useGetChapters();
  const { data: chapters = [] } = useAdminChapters();
  const [form, setForm] = useState<CreateDuePayload>(EMPTY);
  const [amountText, setAmountText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setAmountText("");
      setSelected(new Set());
    }
  }, [open]);

  const set = <K extends keyof CreateDuePayload>(key: K, value: CreateDuePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Selectable targets follow "bill to": chapters or churches.
  const targets =
    form.billTo === "chapter"
      ? chapters.map((c) => ({ id: c.id, label: `${c.name} — ${c.church?.name ?? ""}` }))
      : churches.filter((c) => c.status === "active").map((c) => ({ id: c.id, label: c.name }));

  const toggleTarget = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = async () => {
    const amount = Number(amountText);
    if (form.title.trim().length < 3) return errorToast("Enter a title.", "Validation");
    if (!Number.isFinite(amount) || amount <= 0) return errorToast("Enter an amount above 0.", "Validation");
    if (!form.dueDate) return errorToast("Choose a due date.", "Validation");
    if (form.appliesTo === "selected" && selected.size === 0) {
      return errorToast(`Select at least one ${form.billTo}.`, "Validation");
    }
    const ids = [...selected];
    try {
      const result = (await create.mutateAsync({
        ...form,
        title: form.title.trim(),
        amount,
        ...(form.appliesTo === "selected"
          ? form.billTo === "chapter"
            ? { chapterIds: ids }
            : { churchIds: ids }
          : {}),
      })) as { billsCreated: number; skipped: number };
      successToast(
        `${result.billsCreated} bill(s) sent.${result.skipped ? ` ${result.skipped} skipped (no active members).` : ""}`,
        "Due created",
      );
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to create.", "Error");
    }
  };

  const perMemberHint = form.billTo === "chapter" ? "× active members in each chapter" : "× active members in each church";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New due or levy</DialogTitle>
          <DialogDescription>Bills are created and sent as soon as you save.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input label="Title" placeholder="e.g. Annual Chapter Dues" value={form.title} onChange={(e) => set("title", e.target.value)} />
          <Toggle
            label="Type"
            value={form.type}
            onChange={(v) => set("type", v)}
            options={[
              { value: "due", label: "Due", hint: "Recurring, e.g. yearly" },
              { value: "levy", label: "Levy", hint: "One-off charge" },
            ]}
          />
          <Toggle
            label="Bill to"
            value={form.billTo}
            onChange={(v) => {
              set("billTo", v);
              setSelected(new Set());
            }}
            options={[
              { value: "chapter", label: "Each chapter", hint: "Chapter officers pay" },
              { value: "church", label: "Each church", hint: "The counsellor pays" },
            ]}
          />
          <Toggle
            label="Charge"
            value={form.chargeBasis}
            onChange={(v) => set("chargeBasis", v)}
            options={[
              { value: "flat", label: "Flat amount", hint: `Same for every ${form.billTo}` },
              { value: "per_member", label: "Per member", hint: perMemberHint },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={form.chargeBasis === "flat" ? "Amount (₦)" : "Amount per member (₦)"}
              type="number"
              min={1}
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
            />
            <Input label="Period" placeholder="e.g. 2027" value={form.period ?? ""} onChange={(e) => set("period", e.target.value)} />
          </div>
          <Input label="Due date" type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          <Toggle
            label="Applies to"
            value={form.appliesTo}
            onChange={(v) => set("appliesTo", v)}
            options={[
              { value: "all", label: `All ${form.billTo === "chapter" ? "chapters" : "churches"}`, hint: "Every active one" },
              { value: "selected", label: "Selected only", hint: "Pick below" },
            ]}
          />
          {form.appliesTo === "selected" && (
            <ul className="max-h-56 overflow-y-auto rounded-xl border border-text-dark/10">
              {targets.map((t) => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-center gap-3 border-b border-text-dark/5 px-3 py-2 text-sm last:border-0 hover:bg-background/60">
                    <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleTarget(t.id)} />
                    {t.label}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <Textarea label="Description (optional)" rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={create.isPending} className="bg-primary text-white">Create & send bills</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
