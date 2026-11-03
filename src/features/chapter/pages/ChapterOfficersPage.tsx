import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LuMail, LuPhone, LuRefreshCw, LuUserMinus, LuUserPlus } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AccountDetailsDialog, type AccountDetails } from "@/components/shared/AccountDetailsDialog";
import { TemporaryPasswordDialog } from "@/components/shared/TemporaryPasswordDialog";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { ConfirmDialog } from "@/features/admin/components/shared/ConfirmDialog";
import {
  useAssignOfficer,
  useOfficers,
  useRemoveOfficer,
  useResendOfficerPassword,
} from "../api/officers";
import { useChapterSession } from "../store/useChapterSession";
import { PORTAL_ROLE_LABELS, type CredentialDelivery, type PortalAccount } from "../types";

type OfficerRole = "president" | "secretary";
type EditTarget = { chapterId: string; chapterName: string; role: OfficerRole; current: PortalAccount | null };

/**
 * Counsellor only: sets up the President and Secretary login for each
 * chapter in the church. Each gets a one-time password by email.
 * Replacing an officer removes the previous person's access.
 */
export default function ChapterOfficersPage() {
  const isCounsellor = useChapterSession((s) => s.profile?.role === "counsellor");
  if (!isCounsellor) return <Navigate to="/chapter" replace />;
  return <OfficersManager />;
}

function OfficersManager() {
  const { data: chapters = [], isLoading, isError, refetch } = useOfficers();
  const assign = useAssignOfficer();
  const resend = useResendOfficerPassword();
  const remove = useRemoveOfficer();

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PortalAccount | null>(null);
  const [tempPassword, setTempPassword] = useState<{ name: string; email: string; password: string } | null>(null);

  /** Tells the user whether the one-time password went out by email. */
  const reportDelivery = (delivery: CredentialDelivery, account: { name: string; email: string }) => {
    if (delivery.temporaryPassword) {
      setTempPassword({ ...account, password: delivery.temporaryPassword });
    } else if (delivery.emailSent) {
      successToast(`Sign-in details emailed to ${account.email}.`);
    }
  };

  const handleSave = async (details: AccountDetails) => {
    if (!editTarget) return;
    try {
      const result = await assign.mutateAsync({ chapterId: editTarget.chapterId, role: editTarget.role, ...details });
      setEditTarget(null);
      if (!result.emailSent && !result.temporaryPassword) successToast("Details updated.");
      reportDelivery(result, result.account);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  const handleResend = async (officer: PortalAccount) => {
    try {
      reportDelivery(await resend.mutateAsync(officer.id), officer);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to reset.", "Error");
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await remove.mutateAsync(removeTarget.id);
      successToast(`${removeTarget.name} can no longer sign in.`);
      setRemoveTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to remove.", "Error");
    }
  };

  const renderSlot = (chapter: { id: string; name: string }, role: OfficerRole, officer: PortalAccount | null) => (
    <div className="flex flex-col gap-3 rounded-xl border border-text-dark/5 bg-background/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{PORTAL_ROLE_LABELS[role]}</p>
        {officer && (
          officer.hasChangedPassword
            ? <Badge variant="success">Active</Badge>
            : <Badge className="bg-sky-100 text-sky-800">Awaiting first sign-in</Badge>
        )}
      </div>
      {officer ? (
        <>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-primary">{officer.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-text-muted"><LuMail size={12} /> {officer.email}</p>
            <p className="flex items-center gap-1.5 text-xs text-text-muted"><LuPhone size={12} /> {officer.phone}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditTarget({ chapterId: chapter.id, chapterName: chapter.name, role, current: officer })}
            >
              Edit / replace
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleResend(officer)} loading={resend.isPending && resend.variables === officer.id}>
              <LuRefreshCw size={14} /> New password
            </Button>
            <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setRemoveTarget(officer)}>
              <LuUserMinus size={14} /> Remove
            </Button>
          </div>
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-fit"
          onClick={() => setEditTarget({ chapterId: chapter.id, chapterName: chapter.name, role, current: null })}
        >
          <LuUserPlus size={14} /> Add {PORTAL_ROLE_LABELS[role]}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Chapter Officers</h1>
        <p className="mt-1 text-sm text-text-muted">
          Give each chapter's President and Secretary their own login. They can only see their own chapter.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner label="Loading officers…" /></div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <p className="text-sm text-rose-600">Unable to load officers.</p>
          <Button size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map(({ chapter, president, secretary }) => (
            <section key={chapter.id} className="rounded-2xl border border-text-dark/5 bg-surface p-5">
              <h2 className="text-base font-semibold text-primary">{chapter.name}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {renderSlot(chapter, "president", president)}
                {renderSlot(chapter, "secretary", secretary)}
              </div>
            </section>
          ))}
        </div>
      )}

      <AccountDetailsDialog
        open={!!editTarget}
        title={editTarget ? `${PORTAL_ROLE_LABELS[editTarget.role]} — ${editTarget.chapterName}` : ""}
        description={
          editTarget?.current
            ? "Change the email to hand this role to someone else. The previous person will lose access."
            : "We'll email a one-time password. They choose their own password at first sign-in."
        }
        initial={editTarget?.current}
        saving={assign.isPending}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={!!removeTarget}
        title="Remove officer access"
        message={`${removeTarget?.name ?? "This officer"} will no longer be able to sign in to the chapter portal.`}
        loading={remove.isPending}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
      />

      <TemporaryPasswordDialog info={tempPassword} onClose={() => setTempPassword(null)} />
    </div>
  );
}
