import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { LuKeyRound, LuMail, LuPencil, LuPhone, LuUserCog, LuUserPlus } from "react-icons/lu";
import { DetailDrawerContent, DetailItem, DetailList, DetailSection } from "@/components/shared/DetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormDrawerContent } from "@/components/shared/FormDrawer";
import { TemporaryPasswordDialog } from "@/components/shared/TemporaryPasswordDialog";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ImageUploadField } from "@/features/admin/components/shared/ImageUploadField";
import type { CredentialDelivery } from "@/features/chapter/types";
import { initials } from "@/components/layout/types";
import { useAssignCounsellor, useCounsellor, useResendCounsellorPassword } from "@/lib/api/chapter-admin";
import type { CounsellorAccount } from "@/types/chapter-admin";

type Details = { name: string; email: string; phone: string; photo: string | null };
type Errors = Partial<Record<keyof Details, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(d: Details): Errors {
  const errors: Errors = {};
  if (d.name.trim().length < 3) errors.name = "Enter the counsellor's full name.";
  if (!EMAIL.test(d.email.trim())) errors.email = "Enter a valid email address, e.g. name@church.org.";
  if (d.phone.trim().length < 7) errors.phone = "Enter a phone number with at least 7 digits.";
  return errors;
}

function CounsellorForm({
  churchName,
  counsellor,
  saving,
  onCancel,
  onSave,
}: {
  churchName: string;
  counsellor: CounsellorAccount | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (details: Details) => void;
}) {
  const [form, setForm] = useState<Details>({
    name: counsellor?.name ?? "",
    email: counsellor?.email ?? "",
    phone: counsellor?.phone ?? "",
    photo: counsellor?.photo ?? null,
  });
  const [errors, setErrors] = useState<Errors>({});

  const update = (field: keyof Details, value: string | null) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSave({ name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), photo: form.photo });
  };

  return (
    <FormDrawerContent
      title={counsellor ? "Edit or replace counsellor" : "Set counsellor"}
      description={
        counsellor
          ? `${churchName}. Change the email to hand over to a new counsellor; the previous counsellor loses access.`
          : `${churchName}. The counsellor is recorded as a member and listed on the public site. New accounts get a one-time password by email.`
      }
      onSubmit={submit}
      onCancel={onCancel}
      cancelLabel={counsellor ? "Back" : "Cancel"}
      submitting={saving}
      submitLabel="Save and send login"
    >
      <ImageUploadField
        label="Photo (optional)"
        value={form.photo}
        onChange={(url) => update("photo", url)}
        folder="chapters"
        previewName={form.name || "Counsellor"}
      />
      <Input
        label="Full name"
        value={form.name}
        error={errors.name}
        onChange={(e) => update("name", e.target.value)}
        autoComplete="name"
        required
        autoFocus
      />
      <Input
        label="Email address"
        type="email"
        value={form.email}
        error={errors.email}
        onChange={(e) => update("email", e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        label="Phone number"
        type="tel"
        value={form.phone}
        error={errors.phone}
        onChange={(e) => update("phone", e.target.value)}
        autoComplete="tel"
        required
      />
    </FormDrawerContent>
  );
}

/**
 * A church's Counsellor login for the chapter portal: view it, set or
 * replace it, or send a new one-time password. The counsellor sees every
 * chapter in the church and creates the President and Secretary logins.
 */
export function CounsellorDrawer({
  church,
  onClose,
}: {
  church: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const { data: counsellor = null, isLoading } = useCounsellor(church?.id ?? null);
  const assign = useAssignCounsellor();
  const resend = useResendCounsellorPassword();
  const [editing, setEditing] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ name: string; email: string; password: string } | null>(null);

  const close = () => {
    setEditing(false);
    onClose();
  };

  const report = (delivery: CredentialDelivery, account: { name: string; email: string }) => {
    if (delivery.temporaryPassword) setTempPassword({ ...account, password: delivery.temporaryPassword });
    else if (delivery.emailSent) successToast(`Sign-in details emailed to ${account.email}.`);
    else successToast("Counsellor details updated.");
  };

  const save = async (details: Details) => {
    if (!church) return;
    try {
      const result = await assign.mutateAsync({ churchId: church.id, ...details });
      setEditing(false);
      report(result, result.account);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  const resendPassword = async () => {
    if (!church || !counsellor) return;
    try {
      report(await resend.mutateAsync(church.id), counsellor);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send a new password.", "Error");
    }
  };

  return (
    <>
      <Sheet open={!!church && !tempPassword} onOpenChange={(open) => !open && !assign.isPending && close()}>
        <SheetContent size="md">
          {church && editing ? (
            <CounsellorForm
              churchName={church.name}
              counsellor={counsellor}
              saving={assign.isPending}
              onCancel={() => setEditing(false)}
              onSave={save}
            />
          ) : church ? (
            <DetailDrawerContent
              title="Counsellor login"
              description={`${church.name}: chapter portal access for the church counsellor.`}
              media={
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/[0.07] text-primary">
                  <LuUserCog size={20} aria-hidden />
                </span>
              }
              footer={
                counsellor ? (
                  <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={resendPassword} loading={resend.isPending}>
                      {!resend.isPending ? <LuKeyRound size={15} aria-hidden /> : null}
                      Send new one-time password
                    </Button>
                    <Button type="button" onClick={() => setEditing(true)}>
                      <LuPencil size={15} aria-hidden />
                      Edit or replace
                    </Button>
                  </div>
                ) : undefined
              }
            >
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-2/3 rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ) : counsellor ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      {counsellor.photo ? <AvatarImage src={counsellor.photo} alt="" /> : null}
                      <AvatarFallback>{initials(counsellor.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{counsellor.name}</p>
                      <div className="mt-1">
                        {counsellor.hasChangedPassword ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Awaiting first sign-in</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <DetailSection title="Contact">
                    <DetailList>
                      <DetailItem label="Email">
                        {counsellor.email ? (
                          <span className="inline-flex items-center gap-1.5">
                            <LuMail size={13} aria-hidden className="text-muted" />
                            {counsellor.email}
                          </span>
                        ) : null}
                      </DetailItem>
                      <DetailItem label="Phone">
                        {counsellor.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <LuPhone size={13} aria-hidden className="text-muted" />
                            {counsellor.phone}
                          </span>
                        ) : null}
                      </DetailItem>
                      <DetailItem label="Member ID">{counsellor.memberNumber}</DetailItem>
                      <DetailItem label="Last sign-in">
                        {counsellor.lastLoginAt ? new Date(counsellor.lastLoginAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : null}
                      </DetailItem>
                    </DetailList>
                  </DetailSection>
                </>
              ) : (
                <EmptyState
                  icon={LuUserPlus}
                  title="No counsellor login yet"
                  description="Set one so the church counsellor can sign in to the chapter portal."
                  action={
                    <Button type="button" onClick={() => setEditing(true)}>
                      Set counsellor
                    </Button>
                  }
                />
              )}
            </DetailDrawerContent>
          ) : null}
        </SheetContent>
      </Sheet>

      <TemporaryPasswordDialog info={tempPassword} onClose={() => setTempPassword(null)} />
    </>
  );
}
