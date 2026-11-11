import { useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { FormDrawerContent } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetChapters } from "@/lib/api/church";
import { useGetRanks } from "@/lib/api/rank";
import { useAddRegistrationEntries, useUpdateRegistrationEntry } from "@/lib/api/registration";
import type { AdminRegistration, AdminRegistrationEntry } from "@/types/admin";

type Participant = { name: string; rankId: string; churchId: string };
type ParticipantErrors = Partial<Record<keyof Participant, string>>;

const EMPTY: Participant = { name: "", rankId: "", churchId: "" };

function validate(p: Participant): ParticipantErrors {
  const errors: ParticipantErrors = {};
  if (p.name.trim().length < 2) errors.name = "Enter the participant's full name.";
  if (!p.rankId) errors.rankId = "Choose a rank.";
  if (!p.churchId) errors.churchId = "Choose a church.";
  return errors;
}

const chapterLabel = (name: string, chapter?: string) => (chapter && chapter !== name ? `${chapter} · ${name}` : chapter || name);

/** Name, rank and church fields shared by the add and edit forms. */
function ParticipantFields({
  value,
  errors,
  onChange,
  autoFocus,
}: {
  value: Participant;
  errors: ParticipantErrors;
  onChange: (patch: Partial<Participant>) => void;
  autoFocus?: boolean;
}) {
  const { data: ranks = [], isLoading: ranksLoading } = useGetRanks();
  const { data: churches = [], isLoading: churchesLoading } = useGetChapters();

  return (
    <>
      <Input
        label="Full name"
        value={value.name}
        error={errors.name}
        onChange={(e) => onChange({ name: e.target.value })}
        autoFocus={autoFocus}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Rank"
          value={value.rankId}
          error={errors.rankId}
          disabled={ranksLoading}
          onValueChange={(rankId) => onChange({ rankId })}
        >
          <SelectTrigger>
            <SelectValue placeholder={ranksLoading ? "Loading…" : "Choose a rank"} />
          </SelectTrigger>
          <SelectContent>
            {ranks.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          label="Church"
          value={value.churchId}
          error={errors.churchId}
          disabled={churchesLoading}
          onValueChange={(churchId) => onChange({ churchId })}
        >
          <SelectTrigger>
            <SelectValue placeholder={churchesLoading ? "Loading…" : "Choose a church"} />
          </SelectTrigger>
          <SelectContent>
            {churches
              .filter((c) => c.status === "active")
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {chapterLabel(c.name, c.chapter)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

interface FormProps {
  registration: AdminRegistration;
  onDone: (updated?: AdminRegistration) => void;
}

/** Adds one or more participants to a registration. Each gets a new registration code. */
export function AddParticipantsForm({ registration, onDone }: FormProps) {
  const addEntries = useAddRegistrationEntries();
  // Keys keep React from reusing a removed participant's inputs.
  const [rows, setRows] = useState<{ key: number; value: Participant; errors: ParticipantErrors }[]>([
    { key: 0, value: EMPTY, errors: {} },
  ]);
  const [nextKey, setNextKey] = useState(1);

  const update = (key: number, patch: Partial<Participant>) =>
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const errors = { ...r.errors };
        for (const field of Object.keys(patch) as (keyof Participant)[]) delete errors[field];
        return { ...r, value: { ...r.value, ...patch }, errors };
      }),
    );

  const submit = async () => {
    const checked = rows.map((r) => ({ ...r, errors: validate(r.value) }));
    setRows(checked);
    if (checked.some((r) => Object.keys(r.errors).length > 0)) return;
    try {
      const updated = await addEntries.mutateAsync({
        id: registration.id,
        entries: rows.map(({ value }) => ({ name: value.name.trim(), rank: value.rankId, church: value.churchId })),
      });
      successToast(rows.length === 1 ? "Participant added." : `${rows.length} participants added.`);
      onDone(updated);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to add participants.", "Error");
    }
  };

  return (
    <FormDrawerContent
      title="Add participants"
      description={`To ${registration.registrantName}'s registration. Each participant gets a new registration code.`}
      onSubmit={submit}
      onCancel={() => onDone()}
      cancelLabel="Back"
      submitting={addEntries.isPending}
      submitLabel={rows.length === 1 ? "Add participant" : `Add ${rows.length} participants`}
    >
      {rows.map((r, i) => (
        <div key={r.key} role="group" aria-label={`Participant ${i + 1}`} className="space-y-4 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Participant {i + 1}</p>
            {rows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-danger hover:bg-danger/[0.08]"
                onClick={() => setRows((prev) => prev.filter((x) => x.key !== r.key))}
              >
                <LuTrash2 size={13} aria-hidden />
                Remove
              </Button>
            ) : null}
          </div>
          <ParticipantFields
            value={r.value}
            errors={r.errors}
            onChange={(patch) => update(r.key, patch)}
            autoFocus={i === rows.length - 1}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setRows((prev) => [...prev, { key: nextKey, value: EMPTY, errors: {} }]);
          setNextKey((k) => k + 1);
        }}
      >
        <LuPlus size={14} aria-hidden />
        Add another participant
      </Button>
    </FormDrawerContent>
  );
}

/** Corrects one participant's name, rank or church. */
export function EditParticipantForm({ registration, entry, onDone }: FormProps & { entry: AdminRegistrationEntry }) {
  const updateEntry = useUpdateRegistrationEntry();
  const [value, setValue] = useState<Participant>({ name: entry.name, rankId: entry.rankId, churchId: entry.churchId });
  const [errors, setErrors] = useState<ParticipantErrors>({});

  const submit = async () => {
    const found = validate(value);
    setErrors(found);
    if (Object.keys(found).length > 0 || !entry.registrationCode) return;
    try {
      const updated = await updateEntry.mutateAsync({
        id: registration.id,
        body: { registrationCode: entry.registrationCode, name: value.name.trim(), rank: value.rankId, church: value.churchId },
      });
      successToast("Participant updated.");
      onDone(updated);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to update participant.", "Error");
    }
  };

  return (
    <FormDrawerContent
      title="Edit participant"
      description={
        <>
          Code <span className="font-mono font-medium text-foreground">{entry.registrationCode}</span>
        </>
      }
      onSubmit={submit}
      onCancel={() => onDone()}
      cancelLabel="Back"
      submitting={updateEntry.isPending}
      submitLabel="Save changes"
    >
      <ParticipantFields
        value={value}
        errors={errors}
        autoFocus
        onChange={(patch) => {
          setValue((v) => ({ ...v, ...patch }));
          setErrors((e) => {
            const next = { ...e };
            for (const field of Object.keys(patch) as (keyof Participant)[]) delete next[field];
            return next;
          });
        }}
      />
    </FormDrawerContent>
  );
}
