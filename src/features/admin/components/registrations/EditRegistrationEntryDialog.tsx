import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
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
import { useUpdateRegistrationEntry } from "@/lib/api/registration";
import { useGetRanks } from "@/lib/api/rank";
import type {
  AdminRegistration,
  AdminRegistrationEntry,
} from "@/types/admin";

interface EditRegistrationEntryDialogProps {
  open: boolean;
  registrationId: string;
  entry: AdminRegistrationEntry | null;
  onClose: () => void;
  onUpdated: (updated: AdminRegistration) => void;
}

function chapterLabel(name: string, chapter?: string) {
  if (chapter && chapter !== name) return `${chapter} · ${name}`;
  return chapter || name;
}

export function EditRegistrationEntryDialog({
  open,
  registrationId,
  entry,
  onClose,
  onUpdated,
}: EditRegistrationEntryDialogProps) {
  const reducedMotion = useReducedMotion();
  const { data: ranks = [], isLoading: ranksLoading } = useGetRanks();
  const { data: allChurches = [], isLoading: churchesLoading } = useGetChapters();
  const updateEntry = useUpdateRegistrationEntry();
  const churches = allChurches.filter((church) => church.status === "active");

  const [name, setName] = useState("");
  const [rankId, setRankId] = useState("");
  const [churchId, setChurchId] = useState("");
  const [panelVisible, setPanelVisible] = useState(open);
  const [errors, setErrors] = useState<{
    name?: string;
    rankId?: string;
    churchId?: string;
  }>({});

  useEffect(() => {
    if (!entry) return;
    setName(entry.name);
    setRankId(entry.rankId);
    setChurchId(entry.churchId);
    setErrors({});
  }, [entry]);

  useEffect(() => {
    if (open) setPanelVisible(true);
  }, [open]);

  const requestClose = () => {
    if (updateEntry.isPending) return;
    setPanelVisible(false);
  };

  const handleSubmit = async () => {
    if (!entry?.registrationCode) {
      errorToast("This entry has no registration code and cannot be edited.");
      return;
    }

    const nextErrors: {
      name?: string;
      rankId?: string;
      churchId?: string;
    } = {};
    if (name.trim().length < 2) nextErrors.name = "Name is required";
    if (!rankId) nextErrors.rankId = "Select a rank";
    if (!churchId) nextErrors.churchId = "Select a church";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const updated = await updateEntry.mutateAsync({
        id: registrationId,
        body: {
          registrationCode: entry.registrationCode,
          name: name.trim(),
          rank: rankId,
          church: churchId,
        },
      });
      successToast("Participant updated.");
      onUpdated(updated);
      setPanelVisible(false);
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Unable to update participant.",
        "Error",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) requestClose();
      }}
    >
      <DialogContent
        hideClose
        className="max-w-lg border-0 bg-transparent p-0 shadow-none"
      >
        <AnimatePresence onExitComplete={onClose}>
          {panelVisible ? (
            <motion.div
              initial={
                reducedMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 0,
                      y: 24,
                      scale: 0.96,
                      filter: "blur(6px)",
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      y: 12,
                      scale: 0.98,
                      filter: "blur(4px)",
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.1 }
                  : {
                      type: "spring",
                      stiffness: 340,
                      damping: 28,
                      mass: 0.8,
                    }
              }
              className="relative overflow-hidden rounded-2xl border border-text-dark/10 bg-surface p-6 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.35)]"
            >
              <button
                type="button"
                onClick={requestClose}
                disabled={updateEntry.isPending}
                className="absolute right-4 top-4 rounded-full p-1.5 text-text-muted transition-colors hover:bg-background hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                aria-label="Close dialog"
              >
                <X size={17} />
              </button>

              <DialogHeader>
                <DialogTitle>Edit participant</DialogTitle>
                <p className="text-sm text-text-muted">
                  Code:{" "}
                  <span className="font-mono font-semibold text-primary">
                    {entry?.registrationCode ?? "—"}
                  </span>
                </p>
              </DialogHeader>

              <div className="space-y-4 py-5">
                <Input
                  label="Full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  error={errors.name}
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-dark">
                    Rank
                  </label>
                  <Select
                    value={rankId || undefined}
                    onValueChange={(value) => {
                      setRankId(value);
                      setErrors((prev) => ({ ...prev, rankId: undefined }));
                    }}
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
                  {errors.rankId ? (
                    <p className="mt-1 text-xs text-rose-600">
                      {errors.rankId}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-dark">
                    Church
                  </label>
                  <Select
                    value={churchId || undefined}
                    onValueChange={(value) => {
                      setChurchId(value);
                      setErrors((prev) => ({ ...prev, churchId: undefined }));
                    }}
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
                  {errors.churchId ? (
                    <p className="mt-1 text-xs text-rose-600">
                      {errors.churchId}
                    </p>
                  ) : null}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={requestClose}
                  disabled={updateEntry.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-primary text-white"
                  loading={updateEntry.isPending}
                  onClick={handleSubmit}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
