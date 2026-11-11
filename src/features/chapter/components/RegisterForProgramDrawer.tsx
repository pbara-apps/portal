import { type KeyboardEvent, useMemo, useState } from "react";
import { LuCopy, LuUserPlus, LuX } from "react-icons/lu";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useRetained } from "@/hooks/useRetained";
import { useAddMembers, useChapterMembers, useRanks } from "../api/members";
import { type OpenProgram, useRegisteredMemberIds, useRegisterMembers } from "../api/registrations";
import { ageWarning, formatDate } from "../lib/member-utils";
import { useWorkingChapter } from "../store/useChapterSession";
import type { PortalMember } from "../types";
import { ChapterField } from "./ChapterField";
import { FileUploadButton } from "./FileUploadButton";
import { MemberPicker } from "./MemberPicker";

const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

/**
 * Register chapter members for one program:
 * 1. pick members (approved, or awaiting approval); anyone not on the
 *    roster can be added on the spot,
 * 2. pay the total into the association account and upload the proof,
 * 3. submit. The association verifies the payment as usual.
 */
export function RegisterForProgramDrawer({ program, onClose }: { program: OpenProgram | null; onClose: () => void }) {
  const shown = useRetained(program);
  const working = useWorkingChapter();
  const [pickedChapterId, setPickedChapterId] = useState<string | null>(null);
  const chapterId = pickedChapterId ?? working.chapterId;

  const { data: members = [], isLoading: loadingMembers } = useChapterMembers(
    { chapterId, view: "all" },
    Boolean(program && chapterId),
  );
  const { data: registeredIds } = useRegisteredMemberIds(program?.id, chapterId);
  const register = useRegisterMembers();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState(false);

  // Only approved members and those awaiting approval can be registered.
  const eligible = useMemo(
    () => members.filter((m) => m.status === "active" || m.status === "pending"),
    [members],
  );
  const pendingSelected = eligible.filter((m) => selected.has(m.id) && m.status === "pending").length;

  const close = () => {
    setSelected(new Set());
    setProofUrl(null);
    setQuickAdd(false);
    setPickedChapterId(null);
    onClose();
  };

  if (!shown) return null;
  const singleOnly = shown.registrationMode === "single";
  const total = shown.amount * selected.size;

  const copyAccount = async () => {
    await navigator.clipboard.writeText(shown.bankDetails.accountNumber);
    successToast("Account number copied.");
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return errorToast("Pick at least one member.", "Nobody selected");
    if (singleOnly && selected.size > 1) {
      return errorToast("This program takes one person per registration.", "One at a time");
    }
    if (!proofUrl) return errorToast("Upload the proof of payment.", "Proof needed");
    try {
      await register.mutateAsync({
        programId: shown.id,
        chapterId,
        memberIds: [...selected],
        proofOfPaymentUrl: proofUrl,
      });
      successToast("Registration sent. The association will confirm once the payment is checked.", "Submitted");
      close();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to register.", "Registration failed");
    }
  };

  return (
    <FormDrawer
      open={Boolean(program)}
      size="xl"
      title={`Register for ${shown.title}`}
      description={
        <>
          {naira(shown.amount)} per person
          {shown.registrationDeadline ? ` · closes ${formatDate(shown.registrationDeadline)}` : ""}
          {singleOnly ? " · one person per registration" : ""}
        </>
      }
      onSubmit={handleSubmit}
      onCancel={close}
      submitting={register.isPending}
      submitLabel="Submit registration"
      footerStart={
        <p className="text-sm text-muted">
          {selected.size} × {naira(shown.amount)} ={" "}
          <span className="font-semibold tabular-nums text-foreground">{naira(total)}</span>
        </p>
      }
    >
      <ChapterField
        chapterId={chapterId}
        onChange={(id) => {
          setPickedChapterId(id);
          setSelected(new Set());
        }}
      />

      <section className="space-y-3" aria-labelledby="register-who">
        <div className="flex items-center justify-between gap-3">
          <h3 id="register-who" className="text-sm font-semibold text-foreground">
            1. Who is going?
          </h3>
          {!quickAdd ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setQuickAdd(true)}>
              <LuUserPlus size={14} aria-hidden /> Not on the list?
            </Button>
          ) : null}
        </div>
        {quickAdd ? (
          <QuickAddMember
            chapterId={chapterId}
            onCancel={() => setQuickAdd(false)}
            onAdded={(m) => {
              setSelected((prev) => new Set(prev).add(m.id));
              setQuickAdd(false);
            }}
          />
        ) : null}
        {loadingMembers ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <MemberPicker
            members={eligible}
            selected={selected}
            onChange={setSelected}
            disabledIds={registeredIds}
            disabledReason="already registered"
            showStatus
            maxHeight="18rem"
          />
        )}
        {pendingSelected > 0 ? (
          <p className="text-xs text-muted">
            {pendingSelected} selected member{pendingSelected === 1 ? " is" : "s are"} still awaiting approval. They
            can attend, but count as members only once approved.
          </p>
        ) : null}
      </section>

      <section className="space-y-3" aria-labelledby="register-pay">
        <h3 id="register-pay" className="text-sm font-semibold text-foreground">
          2. Pay and upload proof
        </h3>
        <div className="rounded-xl bg-surface-secondary p-4 text-sm">
          <p className="text-muted">Pay {naira(total)} into the association account:</p>
          <p className="mt-2 font-semibold">{shown.bankDetails.bankName || "Account not set yet"}</p>
          <p>{shown.bankDetails.accountName}</p>
          <p className="flex items-center gap-2 font-mono text-base">
            {shown.bankDetails.accountNumber}
            {shown.bankDetails.accountNumber ? (
              <Button type="button" size="icon" variant="ghost" aria-label="Copy account number" onClick={copyAccount}>
                <LuCopy size={14} />
              </Button>
            ) : null}
          </p>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Proof of payment</p>
          <FileUploadButton purpose="payment-proof" value={proofUrl} onChange={setProofUrl} label="Upload proof" />
        </div>
      </section>
    </FormDrawer>
  );
}

/**
 * Inline "add a new member" form for someone who isn't on the roster yet.
 * They're saved as awaiting approval and selected straight away.
 */
function QuickAddMember({
  chapterId,
  onCancel,
  onAdded,
}: {
  chapterId: string;
  onCancel: () => void;
  onAdded: (member: PortalMember) => void;
}) {
  const { data: ranks = [] } = useRanks();
  const addMembers = useAddMembers();
  const [fullName, setFullName] = useState("");
  const [rankId, setRankId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const warning = ageWarning(dateOfBirth, ranks.find((r) => r.id === rankId));

  const add = async () => {
    setShowErrors(true);
    if (fullName.trim().length < 3 || !rankId) return;
    try {
      const [created] = await addMembers.mutateAsync({
        chapterId,
        members: [{ fullName: fullName.trim(), rankId, dateOfBirth: dateOfBirth || null }],
      });
      successToast(`${created.fullName} added and selected. They'll wait for approval.`);
      onAdded(created);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to add.", "Error");
    }
  };

  // This sits inside the drawer's form: Enter adds the member, not the registration.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      void add();
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/[0.03] p-4" onKeyDown={handleKeyDown}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Add a new member</p>
          <p className="text-xs text-muted">Photo and other details can be added later.</p>
        </div>
        <Button type="button" size="icon" variant="ghost" aria-label="Close new member form" onClick={onCancel}>
          <LuX size={15} />
        </Button>
      </div>
      <Input
        label="Full name"
        required
        autoFocus
        value={fullName}
        error={showErrors && fullName.trim().length < 3 ? "Enter the full name" : undefined}
        onChange={(e) => setFullName(e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Rank"
          required
          value={rankId}
          onValueChange={setRankId}
          error={showErrors && !rankId ? "Choose a rank" : undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a rank" />
          </SelectTrigger>
          <SelectContent>
            {ranks.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          <Input label="Date of birth (optional)" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          {warning ? <p className="mt-1 text-xs text-warning">{warning}</p> : null}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" loading={addMembers.isPending} onClick={add}>
          Add & select
        </Button>
      </div>
    </div>
  );
}
