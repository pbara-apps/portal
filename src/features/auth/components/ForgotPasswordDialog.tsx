import { LuKeyRound } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Self-service password reset is switched off (it sends emails and would use
 * up the email limit). Instead, people ask the right person to send them a
 * new one-time password from the portal.
 */
export function ForgotPasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const who = [
    { role: "Administrator?", contact: "a super admin of the association" },
    { role: "Counsellors?", contact: "the association administration" },
    { role: "Chapter presidents and secretary?", contact: "your church counsellor" },
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuKeyRound size={18} className="text-gold" /> Forgot your password?
          </DialogTitle>
          <DialogDescription>
            Get in touch with the administration and they will reset it for you. You'll receive a new one-time
            password by email, and choose your own password when you sign in.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 rounded-xl bg-background p-4 text-sm">
          {who.map((w) => (
            <li key={w.role}>
              <span className="font-semibold text-primary">{w.role}:</span>{" "}
              <span className="text-text-muted">contact {w.contact}.</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={onClose} className="bg-primary text-white">Okay</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
