import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { LuCopy, LuPlus, LuTrash2, LuUpload } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetBody, SheetFooter, SheetHeader } from "@/components/ui/sheet";
import {
  errorToast,
  successToast,
  warningToast,
} from "@/components/shared/toast-notification";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import { useGetPublicChapters } from "@/lib/api/church";
import { useGetPrograms } from "@/lib/api/program";
import {
  useCreateRegistration,
  useUploadRegistrationProof,
  type CreatedRegistration,
} from "@/lib/api/registration";
import { useGetRanks } from "@/lib/api/rank";
import useCurrentUser from "@/hooks/useCurrentUser";
import type {
  AdminProgram,
  RegistrationMode,
  RegistrationType,
} from "@/types/admin";

type Step = "select" | "payment" | "details" | "success";

type EntryDraft = {
  id: string;
  name: string;
  rankId: string;
  churchId: string;
  sameChurchAsFirst: boolean;
};

type EntryFieldErrors = {
  name?: string;
  rankId?: string;
  churchId?: string;
};

type FormErrors = {
  registrantName?: string;
  registrantPhone?: string;
  proofOfPayment?: string;
  registrationType?: string;
  entries?: Record<string, EntryFieldErrors>;
  submit?: string;
};

interface CreateRegistrationDrawerProps {
  initialProgramId?: string | null;
  onClose: () => void;
}

function createEntryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyEntry(): EntryDraft {
  return {
    id: createEntryId(),
    name: "",
    rankId: "",
    churchId: "",
    sameChurchAsFirst: false,
  };
}

function resolveInitialType(mode: RegistrationMode): RegistrationType {
  if (mode === "bulk") return "bulk";
  return "single";
}

function isProgramOpen(program: AdminProgram) {
  if (!program.isActive) return false;
  if (
    program.registrationDeadline &&
    new Date() > new Date(program.registrationDeadline)
  ) {
    return false;
  }
  return true;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function chapterLabel(chapter: {
  chapterName?: string;
  churchName?: string;
  chapter?: string;
  name?: string;
}) {
  const chapterName = chapter.chapterName ?? chapter.chapter ?? "";
  const churchName = chapter.churchName ?? chapter.name ?? "";
  if (chapterName && churchName && chapterName !== churchName) {
    return `${chapterName} · ${churchName}`;
  }
  return chapterName || churchName || "—";
}

/** Marks portal-submitted registrations as admin submissions. */
function formatAdminRegistrantName(name?: string | null) {
  const base = (name ?? "").trim().replace(/\s*\(admin\)\s*$/i, "");
  return base ? `${base}(admin)` : "";
}

function digitsOnly(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

export function CreateRegistrationDrawer({
  initialProgramId,
  onClose,
}: CreateRegistrationDrawerProps) {
  const proofInputId = useId();
  const { user } = useCurrentUser();
  const { data: programs = [], isLoading: programsLoading } = useGetPrograms();
  const { data: ranks = [], isLoading: ranksLoading } = useGetRanks();
  const { data: churches = [], isLoading: churchesLoading } =
    useGetPublicChapters();
  const uploadProof = useUploadRegistrationProof();
  const createRegistration = useCreateRegistration();

  const adminRegistrantName = useMemo(
    () => formatAdminRegistrantName(user?.name),
    [user?.name],
  );
  const adminRegistrantPhone = useMemo(
    () => digitsOnly(user?.phone),
    [user?.phone],
  );

  const openPrograms = useMemo(
    () => programs.filter(isProgramOpen),
    [programs],
  );

  const preselected = useMemo(() => {
    if (!initialProgramId || initialProgramId === "all") return null;
    return openPrograms.find((p) => p.id === initialProgramId) ?? null;
  }, [initialProgramId, openPrograms]);

  const [step, setStep] = useState<Step>(() =>
    preselected ? "payment" : "select",
  );
  const [programId, setProgramId] = useState(preselected?.id ?? "");
  const [agreed, setAgreed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [registrationType, setRegistrationType] = useState<RegistrationType>(
    () => resolveInitialType(preselected?.registrationMode ?? "single"),
  );
  const [registrantName, setRegistrantName] = useState(adminRegistrantName);
  const [registrantPhone, setRegistrantPhone] = useState(adminRegistrantPhone);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [entries, setEntries] = useState<EntryDraft[]>(() => [emptyEntry()]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [created, setCreated] = useState<CreatedRegistration | null>(null);

  const program =
    openPrograms.find((p) => p.id === programId) ?? preselected ?? null;
  const modeChoice = program?.registrationMode === "both";

  useEffect(() => {
    if (preselected) {
      setProgramId(preselected.id);
      setRegistrationType(resolveInitialType(preselected.registrationMode));
      setStep("payment");
    }
  }, [preselected]);

  useEffect(() => {
    if (adminRegistrantName) setRegistrantName(adminRegistrantName);
    if (adminRegistrantPhone) setRegistrantPhone(adminRegistrantPhone);
  }, [adminRegistrantName, adminRegistrantPhone]);

  useEffect(() => {
    return () => {
      if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    };
  }, [proofPreviewUrl]);

  useEffect(() => {
    if (registrationType === "single" && entries.length > 1) {
      setEntries((prev) => prev.slice(0, 1));
    }
  }, [registrationType, entries.length]);

  const firstChurchId = entries[0]?.churchId ?? "";

  useEffect(() => {
    setEntries((prev) => {
      let changed = false;
      const next = prev.map((entry, index) => {
        if (index === 0 || !entry.sameChurchAsFirst) return entry;
        if (entry.churchId === firstChurchId) return entry;
        changed = true;
        return { ...entry, churchId: firstChurchId };
      });
      return changed ? next : prev;
    });
  }, [firstChurchId]);

  const sortedRanks = useMemo(
    () => [...ranks].sort((a, b) => a.name.localeCompare(b.name)),
    [ranks],
  );

  const sortedChurches = useMemo(
    () =>
      [...churches].sort((a, b) =>
        `${a.chapterName} ${a.churchName}`.localeCompare(
          `${b.chapterName} ${b.churchName}`,
        ),
      ),
    [churches],
  );

  const saving = uploadProof.isPending || createRegistration.isPending;

  const selectProgramAndContinue = () => {
    const selected = openPrograms.find((p) => p.id === programId);
    if (!selected) {
      errorToast("Select an open program to continue.", "Validation");
      return;
    }
    setRegistrationType(resolveInitialType(selected.registrationMode));
    setAgreed(false);
    setStep("payment");
  };

  const copyAccountNumber = async () => {
    if (!program) return;
    try {
      await navigator.clipboard.writeText(program.bankDetails.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleProofChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);

    if (!file) {
      setProofFile(null);
      setProofPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProofFile(null);
      setProofPreviewUrl(null);
      setErrors((prev) => ({
        ...prev,
        proofOfPayment: "Upload an image of the payment proof (max 5MB).",
      }));
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProofFile(null);
      setProofPreviewUrl(null);
      setErrors((prev) => ({
        ...prev,
        proofOfPayment: "Proof of payment must be 5MB or smaller.",
      }));
      e.target.value = "";
      return;
    }

    setProofFile(file);
    setProofPreviewUrl(URL.createObjectURL(file));
    setErrors((prev) => ({
      ...prev,
      proofOfPayment: undefined,
      submit: undefined,
    }));
  };

  const updateEntry = (id: string, patch: Partial<EntryDraft>) => {
    setEntries((prev) => {
      const firstChurch = prev[0]?.churchId ?? "";
      return prev.map((entry) => {
        if (entry.id !== id) return entry;
        const next = { ...entry, ...patch };
        if (patch.sameChurchAsFirst === true) {
          next.churchId = firstChurch;
        }
        return next;
      });
    });
    setErrors((prev) => {
      if (!prev.entries?.[id]) return prev;
      const nextEntryErrors = { ...prev.entries };
      delete nextEntryErrors[id];
      return { ...prev, entries: nextEntryErrors, submit: undefined };
    });
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const nameForSubmit = formatAdminRegistrantName(
      registrantName || adminRegistrantName || user?.name,
    );
    const phoneForSubmit = digitsOnly(registrantPhone || adminRegistrantPhone);

    if (nameForSubmit.replace(/\(admin\)$/i, "").trim().length < 2) {
      next.registrantName = "Your profile name is missing. Update your profile first.";
    }
    if (!/^\d{7,15}$/.test(phoneForSubmit)) {
      next.registrantPhone = "Enter a valid phone number (digits only).";
    }
    if (!proofFile) {
      next.proofOfPayment = "Upload proof of payment to continue.";
    }
    if (modeChoice && !registrationType) {
      next.registrationType = "Choose single or bulk registration.";
    }

    const entryErrors: Record<string, EntryFieldErrors> = {};
    const activeEntries =
      registrationType === "single" ? entries.slice(0, 1) : entries;

    activeEntries.forEach((entry) => {
      const fieldErrors: EntryFieldErrors = {};
      if (entry.name.trim().length < 2) {
        fieldErrors.name = "Name is required.";
      }
      if (!entry.rankId) fieldErrors.rankId = "Select a rank.";
      if (!entry.churchId) fieldErrors.churchId = "Select a chapter.";
      if (Object.keys(fieldErrors).length > 0) {
        entryErrors[entry.id] = fieldErrors;
      }
    });

    if (Object.keys(entryErrors).length > 0) {
      next.entries = entryErrors;
    }

    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!program) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      warningToast(
        "Complete all required registration fields.",
        "Validation",
      );
      return;
    }
    if (!proofFile) return;

    setErrors({});

    try {
      const uploaded = await uploadProof.mutateAsync(proofFile);
      const activeEntries =
        registrationType === "single" ? entries.slice(0, 1) : entries;

      const result = await createRegistration.mutateAsync({
        programId: program.id,
        registrantName: formatAdminRegistrantName(
          registrantName || adminRegistrantName || user?.name,
        ),
        registrantPhone: digitsOnly(registrantPhone || adminRegistrantPhone),
        proofOfPaymentUrl: uploaded.url,
        registrationType,
        entries: activeEntries.map((entry) => ({
          name: entry.name.trim(),
          rank: entry.rankId,
          church: entry.churchId,
        })),
      });

      setCreated(result);
      setStep("success");
      successToast("Registration submitted successfully.");
    } catch (err) {
      const message =
        (err as { message?: string })?.message ??
        "Unable to submit registration.";
      setErrors({ submit: message });
      errorToast(message, "Submission failed");
    }
  };

  const terms =
    program?.termsAndConditions?.trim() ||
    "By proceeding, you confirm that payment will be made to the official account listed above, that the details submitted are accurate, and that registration remains subject to verification by PBA Royal Ambassadors.";

  return (
    <DrawerFormShell>
      <SheetHeader className="bg-background/40">
        <h3 className="text-lg font-semibold text-primary">
          {step === "success" ? "Registration submitted" : "New Registration"}
        </h3>
        {program && step !== "select" && step !== "success" ? (
          <p className="text-xs text-text-muted">{program.title}</p>
        ) : (
          <p className="text-xs text-text-muted">
            Same public registration flow — payment, proof, participants.
          </p>
        )}
      </SheetHeader>

      <SheetBody className="space-y-5">
        {step === "select" ? (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Choose an open program to register someone against.
            </p>
            {programsLoading ? (
              <p className="text-sm text-text-muted">Loading programs…</p>
            ) : openPrograms.length === 0 ? (
              <p className="rounded-lg border border-dashed border-text-dark/10 px-4 py-8 text-center text-sm text-text-muted">
                No open programs available for registration right now.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-dark">
                  Program
                </label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {openPrograms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ) : null}

        {step === "payment" && program ? (
          <div className="space-y-5">
            {program.flyerImageUrl ? (
              <img
                src={program.flyerImageUrl}
                alt={`${program.title} flyer`}
                className="max-h-64 w-full rounded-xl border border-text-dark/[0.06] object-contain bg-background"
              />
            ) : null}

            <div className="overflow-hidden rounded-xl border border-text-dark/[0.06]">
              <div className="bg-primary px-5 py-4 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                  Amount to pay
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatAmount(program.amount)}
                </p>
              </div>
              <div className="space-y-3 bg-surface px-5 py-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted">Bank</span>
                  <span className="font-medium text-text-dark">
                    {program.bankDetails.bankName}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted">Account name</span>
                  <span className="font-medium text-text-dark text-right">
                    {program.bankDetails.accountName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-muted">Account number</span>
                  <button
                    type="button"
                    onClick={copyAccountNumber}
                    className="inline-flex items-center gap-1.5 font-semibold text-primary"
                  >
                    {program.bankDetails.accountNumber}
                    <LuCopy size={14} />
                    <span className="text-xs font-medium text-text-muted">
                      {copied ? "Copied" : "Copy"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-text-dark/[0.06] bg-background/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                Terms
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-text-dark">
                {terms}
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm text-text-dark">
              <Checkbox
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="mt-0.5"
              />
              <span>I confirm payment will be made to this account.</span>
            </label>
          </div>
        ) : null}

        {step === "details" && program ? (
          <form id="admin-create-registration" onSubmit={handleSubmit} className="space-y-5">
            <section className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-text-dark">
                  Contact details
                </h4>
                <p className="mt-1 text-xs text-text-muted">
                  Taken from your admin profile. Name is tagged with (admin) so
                  this submission is identifiable as staff-created.
                </p>
              </div>
              <Input
                label="Registrant full name"
                value={registrantName}
                readOnly
                error={errors.registrantName}
                required
              />
              <Input
                label="Phone"
                value={registrantPhone}
                readOnly={Boolean(adminRegistrantPhone)}
                onChange={
                  adminRegistrantPhone
                    ? undefined
                    : (e) => {
                        setRegistrantPhone(digitsOnly(e.target.value));
                        setErrors((prev) => ({
                          ...prev,
                          registrantPhone: undefined,
                          submit: undefined,
                        }));
                      }
                }
                inputMode="numeric"
                error={errors.registrantPhone}
                required
              />
              {!adminRegistrantPhone ? (
                <p className="text-xs text-amber-700">
                  No phone on your profile — enter one here, or update your
                  profile first.
                </p>
              ) : null}
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-text-dark">
                Proof of payment
              </h4>
              <label
                htmlFor={proofInputId}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-text-dark/15 bg-background/40 px-4 py-8 text-center hover:border-primary/40"
              >
                <LuUpload size={22} className="text-primary" />
                <span className="text-sm font-medium text-text-dark">
                  {proofFile ? proofFile.name : "Upload payment proof image"}
                </span>
                <span className="text-xs text-text-muted">
                  Image up to 5MB
                </span>
                <input
                  id={proofInputId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleProofChange}
                />
              </label>
              {proofPreviewUrl ? (
                <img
                  src={proofPreviewUrl}
                  alt="Proof of payment preview"
                  className="max-h-40 rounded-lg border border-text-dark/[0.06] object-contain"
                />
              ) : null}
              {errors.proofOfPayment ? (
                <p className="text-xs text-rose-600">{errors.proofOfPayment}</p>
              ) : null}
            </section>

            {modeChoice ? (
              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-text-dark">
                  Registration type
                </h4>
                <Select
                  value={registrationType}
                  onValueChange={(v) =>
                    setRegistrationType(v as RegistrationType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="bulk">Bulk</SelectItem>
                  </SelectContent>
                </Select>
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-text-dark">
                  Participants
                </h4>
                {registrationType === "bulk" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setEntries((prev) => [...prev, emptyEntry()])
                    }
                  >
                    <LuPlus size={14} />
                    Add
                  </Button>
                ) : null}
              </div>

              {(registrationType === "single" ? entries.slice(0, 1) : entries).map(
                (entry, index) => {
                  const entryErrors = errors.entries?.[entry.id];
                  return (
                    <fieldset
                      key={entry.id}
                      className="space-y-3 rounded-xl border border-text-dark/[0.06] bg-background/40 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <legend className="text-sm font-semibold text-primary">
                          Participant {index + 1}
                        </legend>
                        {registrationType === "bulk" && entries.length > 1 ? (
                          <button
                            type="button"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() =>
                              setEntries((prev) =>
                                prev.length <= 1
                                  ? prev
                                  : prev.filter((e) => e.id !== entry.id),
                              )
                            }
                            aria-label={`Remove participant ${index + 1}`}
                          >
                            <LuTrash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                      <Input
                        label="Full name"
                        value={entry.name}
                        onChange={(e) =>
                          updateEntry(entry.id, { name: e.target.value })
                        }
                        error={entryErrors?.name}
                        required
                      />
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-dark">
                          Rank
                        </label>
                        <Select
                          value={entry.rankId || undefined}
                          onValueChange={(v) =>
                            updateEntry(entry.id, { rankId: v })
                          }
                          disabled={ranksLoading}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                ranksLoading ? "Loading ranks…" : "Select rank"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedRanks.map((rank) => (
                              <SelectItem key={rank.id} value={rank.id}>
                                {rank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {entryErrors?.rankId ? (
                          <p className="text-xs text-rose-600">
                            {entryErrors.rankId}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-dark">
                          Chapter
                        </label>
                        <Select
                          value={entry.churchId || undefined}
                          onValueChange={(v) =>
                            updateEntry(entry.id, {
                              churchId: v,
                              sameChurchAsFirst: false,
                            })
                          }
                          disabled={
                            churchesLoading ||
                            (index > 0 && entry.sameChurchAsFirst)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                churchesLoading
                                  ? "Loading chapters…"
                                  : "Select chapter"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedChurches.map((church) => (
                              <SelectItem key={church.id} value={church.id}>
                                {chapterLabel(church)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {entryErrors?.churchId ? (
                          <p className="text-xs text-rose-600">
                            {entryErrors.churchId}
                          </p>
                        ) : null}
                      </div>
                      {index > 0 && registrationType === "bulk" ? (
                        <label className="flex items-center gap-2 text-sm text-text-dark">
                          <Checkbox
                            checked={entry.sameChurchAsFirst}
                            onCheckedChange={(v) =>
                              updateEntry(entry.id, {
                                sameChurchAsFirst: v === true,
                              })
                            }
                          />
                          Same chapter as first participant
                        </label>
                      ) : null}
                    </fieldset>
                  );
                },
              )}
            </section>

            {errors.submit ? (
              <p className="text-sm text-rose-600">{errors.submit}</p>
            ) : null}
          </form>
        ) : null}

        {step === "success" && created ? (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Submitted for <strong>{created.registrantName}</strong> ·{" "}
              {created.programTitle}. Status is pending verification.
            </p>
            <div className="space-y-2">
              {created.participants.map((participant) => (
                <div
                  key={`${participant.registrationCode}-${participant.name}`}
                  className="rounded-lg border border-text-dark/[0.06] bg-background/50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-text-dark">
                    {participant.name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-primary">
                    {participant.registrationCode}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {participant.rankName} · {participant.churchName}
                    {participant.churchChapter
                      ? ` (${participant.churchChapter})`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </SheetBody>

      <SheetFooter>
        {step === "select" ? (
          <>
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={selectProgramAndContinue}
              disabled={!programId || openPrograms.length === 0}
              className="w-full bg-primary text-white sm:w-auto"
            >
              Continue
            </Button>
          </>
        ) : null}

        {step === "payment" ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                if (preselected) onClose();
                else setStep("select");
              }}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep("details")}
              disabled={!agreed}
              className="w-full bg-primary text-white sm:w-auto"
            >
              Continue to details
            </Button>
          </>
        ) : null}

        {step === "details" ? (
          <>
            <Button
              variant="outline"
              onClick={() => setStep("payment")}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              type="submit"
              form="admin-create-registration"
              loading={saving}
              className="w-full bg-primary text-white sm:w-auto"
            >
              Submit registration
            </Button>
          </>
        ) : null}

        {step === "success" ? (
          <Button
            onClick={onClose}
            className="w-full bg-primary text-white sm:w-auto"
          >
            Done
          </Button>
        ) : null}
      </SheetFooter>
    </DrawerFormShell>
  );
}
