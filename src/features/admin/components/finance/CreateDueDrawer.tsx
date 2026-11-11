import { useState } from "react";
import { CheckList } from "@/components/shared/CheckList";
import { ChoiceCards } from "@/components/shared/ChoiceCards";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdminChapters } from "@/lib/api/chapter-admin";
import { useGetChapters } from "@/lib/api/church";
import { type CreateDuePayload, useCreateDue } from "@/lib/api/finance";

const emptyForm = (): CreateDuePayload => ({
  title: "",
  description: "",
  type: "due",
  billTo: "chapter",
  chargeBasis: "flat",
  amount: 0,
  period: String(new Date().getFullYear()),
  dueDate: "",
  appliesTo: "all",
});

type Errors = Partial<Record<"title" | "amount" | "dueDate" | "targets", string>>;

/**
 * Create a due or levy. Saving creates a bill for every targeted chapter
 * (or church) straight away and notifies them.
 */
export function CreateDueDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateDue();
  const { data: churches = [] } = useGetChapters();
  const { data: chapters = [] } = useAdminChapters();
  const [form, setForm] = useState<CreateDuePayload>(emptyForm);
  const [amountText, setAmountText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof CreateDuePayload>(key: K, value: CreateDuePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const clearError = (key: keyof Errors) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const close = () => {
    setForm(emptyForm());
    setAmountText("");
    setSelected(new Set());
    setErrors({});
    onClose();
  };

  // Selectable targets follow "bill to": chapters or churches.
  const targets =
    form.billTo === "chapter"
      ? chapters.map((c) => ({ id: c.id, label: c.name, hint: c.church?.name ?? "" }))
      : churches.filter((c) => c.status === "active").map((c) => ({ id: c.id, label: c.name, hint: c.chapter }));
  const place = form.billTo === "chapter" ? "chapter" : "church";

  const save = async () => {
    const amount = Number(amountText);
    const found: Errors = {};
    if (form.title.trim().length < 3) found.title = "Enter a title (at least 3 characters).";
    if (!Number.isFinite(amount) || amount <= 0) found.amount = "Enter an amount above 0.";
    if (!form.dueDate) found.dueDate = "Choose the date payment is due.";
    if (form.appliesTo === "selected" && selected.size === 0) found.targets = `Select at least one ${place}.`;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const ids = [...selected];
    try {
      const result = (await create.mutateAsync({
        ...form,
        title: form.title.trim(),
        amount,
        ...(form.appliesTo === "selected" ? (form.billTo === "chapter" ? { chapterIds: ids } : { churchIds: ids }) : {}),
      })) as { billsCreated: number; skipped: number };
      successToast(
        `${result.billsCreated} bill${result.billsCreated === 1 ? "" : "s"} sent.${
          result.skipped ? ` ${result.skipped} skipped (no active members).` : ""
        }`,
        "Due created",
      );
      close();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to create.", "Error");
    }
  };

  return (
    <FormDrawer
      open={open}
      size="lg"
      title="New due or levy"
      description="Bills are created and sent to every targeted chapter or church as soon as you save."
      onSubmit={save}
      onCancel={close}
      submitting={create.isPending}
      submitLabel="Create and send bills"
    >
      <Input
        label="Title"
        placeholder="e.g. Annual chapter dues"
        value={form.title}
        error={errors.title}
        onChange={(e) => {
          set("title", e.target.value);
          clearError("title");
        }}
        autoFocus
      />
      <ChoiceCards
        label="Type"
        name="due-type"
        value={form.type}
        onChange={(v) => set("type", v)}
        options={[
          { value: "due", label: "Due", hint: "Recurring, e.g. yearly" },
          { value: "levy", label: "Levy", hint: "One-off charge" },
        ]}
      />
      <ChoiceCards
        label="Bill to"
        name="due-bill-to"
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
      <ChoiceCards
        label="Charge"
        name="due-charge"
        value={form.chargeBasis}
        onChange={(v) => set("chargeBasis", v)}
        options={[
          { value: "flat", label: "Flat amount", hint: `Same for every ${place}` },
          { value: "per_member", label: "Per member", hint: `× active members in each ${place}` },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={form.chargeBasis === "flat" ? "Amount (₦)" : "Amount per member (₦)"}
          type="number"
          inputMode="decimal"
          min={1}
          value={amountText}
          error={errors.amount}
          onChange={(e) => {
            setAmountText(e.target.value);
            clearError("amount");
          }}
        />
        <Input label="Period" placeholder="e.g. 2027" value={form.period ?? ""} onChange={(e) => set("period", e.target.value)} />
      </div>
      <Input
        label="Due date"
        type="date"
        value={form.dueDate}
        error={errors.dueDate}
        onChange={(e) => {
          set("dueDate", e.target.value);
          clearError("dueDate");
        }}
      />
      <ChoiceCards
        label="Applies to"
        name="due-applies"
        value={form.appliesTo}
        onChange={(v) => {
          set("appliesTo", v);
          clearError("targets");
        }}
        options={[
          { value: "all", label: `All ${place === "chapter" ? "chapters" : "churches"}`, hint: "Every active one" },
          { value: "selected", label: "Selected only", hint: "Pick below" },
        ]}
      />
      {form.appliesTo === "selected" ? (
        <CheckList
          aria-label={`${place === "chapter" ? "Chapters" : "Churches"} to bill`}
          items={targets.map((t) => ({ id: t.id, label: t.label, hint: t.hint && t.hint !== t.label ? t.hint : undefined }))}
          selected={selected}
          onChange={(next) => {
            clearError("targets");
            setSelected(next);
          }}
          error={errors.targets}
        />
      ) : null}
      <Textarea
        label="Description (optional)"
        rows={3}
        value={form.description ?? ""}
        onChange={(e) => set("description", e.target.value)}
      />
    </FormDrawer>
  );
}
