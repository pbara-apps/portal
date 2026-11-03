import { LuCopy } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { successToast } from "@/components/shared/toast-notification";

/**
 * Shown when an account's one-time password could not be emailed.
 * The password is displayed once so it can be passed on another way.
 */
export function TemporaryPasswordDialog({
  info,
  onClose,
}: {
  info: { name: string; email: string; password: string } | null;
  onClose: () => void;
}) {
  if (!info) return null;
  const copy = async () => {
    await navigator.clipboard.writeText(info.password);
    successToast("One-time password copied.");
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Email could not be sent</DialogTitle>
          <DialogDescription>
            The account for {info.name} is ready, but we couldn't email the sign-in details.
            Share them privately. This password is shown only once.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-lg bg-background p-4 text-sm">
          <p><span className="text-text-muted">Email:</span> <strong>{info.email}</strong></p>
          <p className="flex items-center gap-2">
            <span className="text-text-muted">One-time password:</span>
            <code className="rounded bg-surface px-2 py-1 text-base font-semibold">{info.password}</code>
            <Button size="icon" variant="ghost" onClick={copy} aria-label="Copy password"><LuCopy size={14} /></Button>
          </p>
          <p className="text-xs text-text-muted">They'll be asked to choose their own password when they first sign in.</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="bg-primary text-white">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
