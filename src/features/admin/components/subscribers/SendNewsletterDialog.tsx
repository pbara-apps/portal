import { useState } from "react";
import { LuSend } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { RichTextEditor } from "@/features/admin/components/shared/RichTextEditor";
import { useSendNewsletter } from "@/lib/api/subscriber";

interface SendNewsletterDialogProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  defaultTestEmail?: string;
}

// Quill leaves "<p><br></p>" when the editor is empty.
const isBlank = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";

export function SendNewsletterDialog({
  open,
  onClose,
  activeCount,
  defaultTestEmail = "",
}: SendNewsletterDialogProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [confirming, setConfirming] = useState(false);
  const send = useSendNewsletter();
  const [sendingTest, setSendingTest] = useState(false);

  const ready = subject.trim().length >= 3 && !isBlank(content);
  const busy = send.isPending;

  const reset = () => {
    setSubject("");
    setContent("");
    setConfirming(false);
  };

  const close = () => {
    if (busy) return;
    setConfirming(false);
    onClose();
  };

  const handleTest = async () => {
    if (!ready || !testEmail.trim()) return;
    setSendingTest(true);
    try {
      const res = await send.mutateAsync({
        subject: subject.trim(),
        content,
        test_email: testEmail.trim(),
      });
      successToast(res?.message ?? "Test email sent.");
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Test email failed.",
        "Error",
      );
    } finally {
      setSendingTest(false);
    }
  };

  const handleSend = async () => {
    if (!ready) return;
    try {
      const res = await send.mutateAsync({ subject: subject.trim(), content });
      successToast(res?.message ?? "Newsletter sent.");
      reset();
      onClose();
    } catch (err) {
      setConfirming(false);
      errorToast(
        (err as { message?: string })?.message ?? "Sending failed.",
        "Error",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send newsletter</DialogTitle>
          <DialogDescription>
            Emails every active subscriber ({activeCount}). Each email includes an
            unsubscribe link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            label="Subject"
            placeholder="e.g. November program schedule"
            value={subject}
            maxLength={150}
            onChange={(e) => setSubject(e.target.value)}
            disabled={busy}
          />
          <RichTextEditor
            label="Message"
            value={content}
            onChange={setContent}
            placeholder="Write your newsletter…"
            minHeight={240}
          />

          <div className="rounded-xl bg-background/60 p-3">
            <p className="mb-2 text-xs font-semibold text-text-dark">
              Send a test first
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={busy}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                loading={sendingTest}
                disabled={!ready || !testEmail.trim() || busy}
              >
                Send test
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {confirming ? (
            <>
              <p className="mr-auto self-center text-sm text-text-dark">
                Send to <strong>{activeCount}</strong> subscribers? This can't be undone.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSend}
                loading={busy && !sendingTest}
                disabled={busy}
              >
                Yes, send now
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={!ready || activeCount === 0 || busy}
              >
                <LuSend size={14} className="mr-1.5" />
                Send to {activeCount} subscribers
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
