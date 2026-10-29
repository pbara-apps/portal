import { useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { useGetChapters } from "@/lib/api/church";
import { useAddRegistrationEntries } from "@/lib/api/registration";
import { useGetRanks } from "@/lib/api/rank";
import type { AdminRegistration } from "@/types/admin";

type EntryDraft = {
  id: string;
  name: string;
  rankId: string;
  churchId: string;
};

type EntryErrors = {
  name?: string;
  rankId?: string;
  churchId?: string;
};

interface AddRegistrationEntriesDialogProps {
  open: boolean;
  registration: AdminRegistration;
  onClose: () => void;
  onUpdated: (updated: AdminRegistration) => void;
}

function createDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyDraft(): EntryDraft {
  return {
    id: createDraftId(),
    name: "",
    rankId: "",
    churchId: "",
  };
}

function chapterLabel(name: string, chapter?: string) {
  if (chapter && chapter !== name) return `${chapter} · ${name}`;
  return chapter || name;
}

export function AddRegistrationEntriesDialog({
  open,
  registration,
  onClose,
  onUpdated,
}: AddRegistrationEntriesDialogProps) {
  const { data: ranks = [], isLoading: ranksLoading } = useGetRanks();
  const { data: allChurches = [], isLoading: churchesLoading } = useGetChapters();
  const addEntries = useAddRegistrationEntries();
  const churches = allChurches.filter((church) => church.status === "active");

  const [drafts, setDrafts] = useState<EntryDraft[]>([emptyDraft()]);
  const [errors, setErrors] = useState<Record<string, EntryErrors>>({});

  const resetForm = () => {
    setDrafts([emptyDraft()]);
    setErrors({});
  };

  const handleClose = () => {
    if (addEntries.isPending) return;
    resetForm();
    onClose();
  };

  const updateDraft = (id: string, patch: Partial<EntryDraft>) => {
    setDrafts((prev) =>
      prev.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    );
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addDraft = () => {
    setDrafts((prev) => [...prev, emptyDraft()]);
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((draft) => draft.id !== id);
    });
  };

  const validate = () => {
    const nextErrors: Record<string, EntryErrors> = {};

    drafts.forEach((draft) => {
      const fieldErrors: EntryErrors = {};
      if (draft.name.trim().length < 2) {
        fieldErrors.name = "Name is required";
      }
      if (!draft.rankId) fieldErrors.rankId = "Select a rank";
      if (!draft.churchId) fieldErrors.churchId = "Select a church";
      if (Object.keys(fieldErrors).length > 0) {
        nextErrors[draft.id] = fieldErrors;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const updated = await addEntries.mutateAsync({
        id: registration.id,
        entries: drafts.map((draft) => ({
          name: draft.name.trim(),
          rank: draft.rankId,
          church: draft.churchId,
        })),
      });
      successToast(
        drafts.length === 1
          ? "Participant added."
          : `${drafts.length} participants added.`,
      );
      onUpdated(updated);
      resetForm();
      onClose();
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Unable to add participants.",
        "Error",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add participants</DialogTitle>
          <p className="text-sm text-text-muted">
            New registration codes will be generated for each participant added
            to {registration.registrantName}&apos;s submission.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {drafts.map((draft, index) => (
            <div
              key={draft.id}
              className="space-y-3 rounded-xl border border-text-dark/10 bg-background/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-dark">
                  Participant {index + 1}
                </p>
                {drafts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeDraft(draft.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    <LuTrash2 size={13} />
                    Remove
                  </button>
                ) : null}
              </div>

              <Input
                label="Full name"
                value={draft.name}
                onChange={(e) => updateDraft(draft.id, { name: e.target.value })}
                placeholder="Participant full name"
                error={errors[draft.id]?.name}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-dark">
                    Rank
                  </label>
                  <Select
                    value={draft.rankId || undefined}
                    onValueChange={(value) =>
                      updateDraft(draft.id, { rankId: value })
                    }
                    disabled={ranksLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={ranksLoading ? "Loading…" : "Select rank"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {ranks.map((rank) => (
                        <SelectItem key={rank.id} value={rank.id}>
                          {rank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[draft.id]?.rankId ? (
                    <p className="mt-1 text-xs text-rose-600">
                      {errors[draft.id]?.rankId}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-dark">
                    Church
                  </label>
                  <Select
                    value={draft.churchId || undefined}
                    onValueChange={(value) =>
                      updateDraft(draft.id, { churchId: value })
                    }
                    disabled={churchesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          churchesLoading ? "Loading…" : "Select church"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {chapterLabel(church.name, church.chapter)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[draft.id]?.churchId ? (
                    <p className="mt-1 text-xs text-rose-600">
                      {errors[draft.id]?.churchId}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDraft}
            className="w-full sm:w-auto"
          >
            <LuPlus size={14} />
            Add another participant
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={addEntries.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary text-white"
            loading={addEntries.isPending}
            onClick={handleSubmit}
          >
            Save participants
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
