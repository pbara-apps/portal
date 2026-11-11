import { useState } from "react";
import { LuFlaskConical } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { FieldMessage } from "@/components/ui/field-message";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/features/admin/components/shared/RichTextEditor";
import { useSendNewsletter } from "@/lib/api/subscriber";

// Quill leaves "<p><br></p>" when the editor is empty.
const isBlank = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";

type Errors = Partial<Record<"subject" | "content" | "testEmail", string>>;

/**
 * Compose a newsletter, optionally send a test to yourself, then confirm
 * before it goes to every active subscriber.
 */
export function SendNewsletterDrawer({
  open,
  onClose,
  activeCount,
  defaultTestEmail = "",
}: {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  defaultTestEmail?: string;
}) {
  const send = useSendNewsletter();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [errors, setErrors] = useState<Errors>({});
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState<"test" | "all" | null>(null);

  const clear = (key: keyof Errors) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const validateDraft = () => {
    const found: Errors = {};
    if (subject.trim().length < 3) found.subject = "Enter a subject (at least 3 characters).";
    if (isBlank(content)) found.content = "Write the newsletter before sending.";
    return found;
  };

  const close = () => {
    if (sending) return;
    setSubject("");
    setContent("");
    setErrors({});
    setConfirming(false);
    onClose();
  };

  const sendTest = async () => {
    const found = validateDraft();
    if (!/^\S+@\S+\.\S+$/.test(testEmail.trim())) found.testEmail = "Enter an email address for the test.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSending("test");
    try {
      const res = await send.mutateAsync({ subject: subject.trim(), content, test_email: testEmail.trim() });
      successToast(res?.message ?? "Test email sent.");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Test email failed.", "Error");
    } finally {
      setSending(null);
    }
  };

  const sendAll = async () => {
    setSending("all");
    try {
      const res = await send.mutateAsync({ subject: subject.trim(), content });
      successToast(res?.message ?? "Newsletter sent.");
      setSending(null);
      close();
    } catch (err) {
      setSending(null);
      setConfirming(false);
      errorToast((err as { message?: string })?.message ?? "Sending failed.", "Error");
    }
  };

  return (
    <>
      <FormDrawer
        open={open}
        size="lg"
        title="Send newsletter"
        description={`Emails every active subscriber (${activeCount}). Each email includes an unsubscribe link.`}
        onSubmit={() => {
          const found = validateDraft();
          setErrors(found);
          if (Object.keys(found).length === 0) setConfirming(true);
        }}
        onCancel={close}
        submitting={sending === "all"}
        submitDisabled={activeCount === 0 || sending !== null}
        submitLabel={`Send to ${activeCount} subscriber${activeCount === 1 ? "" : "s"}`}
      >
        <Input
          label="Subject"
          placeholder="e.g. November program schedule"
          value={subject}
          maxLength={150}
          error={errors.subject}
          onChange={(e) => {
            setSubject(e.target.value);
            clear("subject");
          }}
          autoFocus
        />
        <div className="space-y-1.5">
          <RichTextEditor
            label="Message"
            value={content}
            onChange={(html) => {
              setContent(html);
              clear("content");
            }}
            placeholder="Write your newsletter…"
            minHeight={260}
          />
          <FieldMessage message={errors.content} />
        </div>

        <section aria-labelledby="newsletter-test" className="rounded-xl border border-border bg-surface-secondary p-4">
          <h3 id="newsletter-test" className="text-sm font-medium text-foreground">
            Send a test first
          </h3>
          <p className="mt-0.5 text-xs text-muted">Check how it looks in an inbox before everyone gets it.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <Input
                type="email"
                aria-label="Test email address"
                placeholder="you@example.com"
                value={testEmail}
                error={errors.testEmail}
                onChange={(e) => {
                  setTestEmail(e.target.value);
                  clear("testEmail");
                }}
              />
            </div>
            <Button type="button" variant="outline" onClick={sendTest} loading={sending === "test"} disabled={sending !== null}>
              <LuFlaskConical size={15} aria-hidden />
              Send test
            </Button>
          </div>
        </section>
      </FormDrawer>

      <ConfirmDialog
        isOpen={confirming}
        tone="accent"
        title={`Send to ${activeCount} subscriber${activeCount === 1 ? "" : "s"}?`}
        message={`“${subject.trim()}” will be emailed now. This can't be undone.`}
        confirmLabel="Send now"
        loading={sending === "all"}
        onClose={() => setConfirming(false)}
        onConfirm={sendAll}
      />
    </>
  );
}
