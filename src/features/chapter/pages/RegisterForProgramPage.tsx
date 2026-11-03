import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuCopy, LuUserPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { useChapterMembers } from "../api/members";
import { useOpenPrograms, useRegisteredMemberIds, useRegisterMembers } from "../api/registrations";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { FileUploadButton } from "../components/FileUploadButton";
import { MemberPicker } from "../components/MemberPicker";
import { QuickAddMemberDialog } from "../components/QuickAddMemberDialog";
import { formatDate } from "../lib/member-utils";
import { useChapterSession, useWorkingChapter } from "../store/useChapterSession";

const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

/**
 * Register chapter members for one program:
 * 1. pick members (approved, or awaiting approval) — searchable;
 *    anyone not on the roster can be added on the spot,
 * 2. pay the total into the association account and upload the proof,
 * 3. submit. The association verifies the payment as usual.
 */
export default function RegisterForProgramPage() {
  const { id: programId } = useParams();
  const navigate = useNavigate();
  const isCounsellor = useChapterSession((s) => s.profile?.role === "counsellor");
  const { chapterId, chapterName } = useWorkingChapter();

  const { data: programs = [], isLoading: loadingPrograms } = useOpenPrograms();
  const program = programs.find((p) => p.id === programId);
  const { data: members = [], isLoading: loadingMembers } = useChapterMembers({ chapterId, view: "all" });
  const { data: registeredIds } = useRegisteredMemberIds(programId, chapterId);
  const register = useRegisterMembers();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Only approved members and those awaiting approval can be registered.
  const eligible = useMemo(
    () => members.filter((m) => m.status === "active" || m.status === "pending"),
    [members],
  );
  const pendingSelected = eligible.filter((m) => selected.has(m.id) && m.status === "pending").length;

  if (loadingPrograms) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!program) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-text-muted">This program isn't open for registration.</p>
        <Button asChild variant="outline" size="sm"><Link to="/chapter/programs">Back to programs</Link></Button>
      </div>
    );
  }

  const singleOnly = program.registrationMode === "single";
  const total = program.amount * selected.size;

  const copyAccount = async () => {
    await navigator.clipboard.writeText(program.bankDetails.accountNumber);
    successToast("Account number copied.");
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return errorToast("Pick at least one member.", "Nobody selected");
    if (singleOnly && selected.size > 1) {
      return errorToast("This program takes one person per registration.", "One at a time");
    }
    if (!proofUrl) return errorToast("Upload the proof of payment.", "Proof needed");
    try {
      await register.mutateAsync({ programId: program.id, chapterId, memberIds: [...selected], proofOfPaymentUrl: proofUrl });
      successToast("Registration sent. The association will confirm once the payment is checked.", "Submitted");
      navigate("/chapter/programs");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to register.", "Registration failed");
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/chapter/programs" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary">
        <LuArrowLeft size={14} /> Programs
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">{program.title}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {naira(program.amount)} per person
            {program.registrationDeadline ? ` · closes ${formatDate(program.registrationDeadline)}` : ""}
            {singleOnly ? " · one person per registration" : ""}
          </p>
        </div>
        {isCounsellor && <ChapterSwitcher allowAll={false} />}
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-text-dark/5 bg-surface p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-primary">1. Who is going? <span className="text-xs font-normal text-text-muted">({chapterName})</span></h2>
            <Button size="sm" variant="outline" onClick={() => setQuickAddOpen(true)}>
              <LuUserPlus size={14} /> Not on the list?
            </Button>
          </div>
          {loadingMembers ? (
            <Spinner />
          ) : (
            <MemberPicker
              members={eligible}
              selected={selected}
              onChange={setSelected}
              disabledIds={registeredIds}
              disabledReason="already registered"
              showStatus
            />
          )}
          {pendingSelected > 0 && (
            <p className="mt-3 text-xs text-sky-800">
              {pendingSelected} selected member{pendingSelected === 1 ? " is" : "s are"} still awaiting approval.
              They can attend, but count as members only once approved.
            </p>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-text-dark/5 bg-surface p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-primary">2. Pay and upload proof</h2>
          <div className="rounded-xl bg-background p-4 text-sm">
            <p className="text-text-muted">Pay into the association account:</p>
            <p className="mt-2 font-semibold">{program.bankDetails.bankName || "Account not set yet"}</p>
            <p>{program.bankDetails.accountName}</p>
            <p className="flex items-center gap-2 font-mono text-base">
              {program.bankDetails.accountNumber}
              {program.bankDetails.accountNumber && (
                <Button size="icon" variant="ghost" aria-label="Copy account number" onClick={copyAccount}><LuCopy size={14} /></Button>
              )}
            </p>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
            <span className="text-sm text-text-muted">{selected.size} × {naira(program.amount)}</span>
            <span className="text-lg font-bold text-primary">{naira(total)}</span>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Proof of payment</p>
            <FileUploadButton purpose="payment-proof" value={proofUrl} onChange={setProofUrl} label="Upload proof" />
          </div>
          <Button onClick={handleSubmit} loading={register.isPending} className="w-full bg-primary text-white">
            3. Submit registration
          </Button>
        </section>
      </div>

      <QuickAddMemberDialog
        open={quickAddOpen}
        chapterId={chapterId}
        onClose={() => setQuickAddOpen(false)}
        onAdded={(m) => setSelected((prev) => new Set(prev).add(m.id))}
      />
    </div>
  );
}
