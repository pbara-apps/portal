import { useState } from "react";
import { LuMail, LuPhone, LuRefreshCw, LuUserCog } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { AccountDetailsDialog, type AccountDetails } from "@/components/shared/AccountDetailsDialog";
import { TemporaryPasswordDialog } from "@/components/shared/TemporaryPasswordDialog";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import type { CredentialDelivery } from "@/features/chapter/types";
import {
  useAssignCounsellor,
  useCounsellor,
  useResendCounsellorPassword,
} from "@/lib/api/chapter-admin";

/**
 * Manage a church's Counsellor login for the chapter portal.
 * The counsellor sees every chapter in the church and creates the
 * President and Secretary logins. A one-time password is emailed;
 * they must change it at first sign-in.
 */
export function CounsellorDialog({
  church,
  onClose,
}: {
  church: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const { data: counsellor, isLoading } = useCounsellor(church?.id ?? null);
  const assign = useAssignCounsellor();
  const resend = useResendCounsellorPassword();
  const [formOpen, setFormOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ name: string; email: string; password: string } | null>(null);

  if (!church) return null;

  const report = (delivery: CredentialDelivery, account: { name: string; email: string }) => {
    if (delivery.temporaryPassword) setTempPassword({ ...account, password: delivery.temporaryPassword });
    else if (delivery.emailSent) successToast(`Sign-in details emailed to ${account.email}.`);
    else successToast("Counsellor details updated.");
  };

  const handleSave = async (details: AccountDetails) => {
    try {
      const result = await assign.mutateAsync({ churchId: church.id, ...details });
      setFormOpen(false);
      report(result, result.account);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  const handleResend = async () => {
    if (!counsellor) return;
    try {
      report(await resend.mutateAsync(church.id), counsellor);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to reset.", "Error");
    }
  };

  return (
    <>
      <Dialog open={!formOpen && !tempPassword} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LuUserCog size={18} /> Counsellor login</DialogTitle>
            <DialogDescription>{church.name} — chapter portal access for the church counsellor.</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : counsellor ? (
            <div className="space-y-4">
              <div className="space-y-1 rounded-lg bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">{counsellor.name}</p>
                  {counsellor.hasChangedPassword
                    ? <Badge variant="success">Active</Badge>
                    : <Badge className="bg-sky-100 text-sky-800">Awaiting first sign-in</Badge>}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-text-muted"><LuMail size={12} /> {counsellor.email}</p>
                <p className="flex items-center gap-1.5 text-xs text-text-muted"><LuPhone size={12} /> {counsellor.phone}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setFormOpen(true)}>Edit / replace</Button>
                <Button variant="outline" onClick={handleResend} loading={resend.isPending}>
                  {!resend.isPending && <LuRefreshCw size={14} />} Send new one-time password
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">This church has no counsellor login yet.</p>
              <Button onClick={() => setFormOpen(true)} className="bg-primary text-white">Set counsellor</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AccountDetailsDialog
        open={formOpen}
        title={counsellor ? "Edit or replace counsellor" : "Set counsellor"}
        description={
          counsellor
            ? "Change the email to hand over to a new counsellor. The previous counsellor will lose access."
            : "We'll email a one-time password. They choose their own password at first sign-in."
        }
        initial={counsellor}
        saving={assign.isPending}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <TemporaryPasswordDialog info={tempPassword} onClose={() => setTempPassword(null)} />
    </>
  );
}
