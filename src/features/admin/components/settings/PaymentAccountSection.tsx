import { Skeleton } from "@heroui/react";
import { useState } from "react";
import { LuInfo } from "react-icons/lu";
import { Panel } from "@/components/shared/Panel";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePaymentAccount, useUpdatePaymentAccount } from "@/lib/api/settings";
import type { PaymentAccount } from "@/types/admin";

const EMPTY: PaymentAccount = { bankName: "", accountName: "", accountNumber: "" };
type Errors = Partial<Record<keyof PaymentAccount, string>>;

/**
 * The association's single bank account. Every payment screen (program
 * registration, chapter dues) shows this account. Only a super admin can change it.
 */
export function PaymentAccountSection({ canEdit }: { canEdit: boolean }) {
  const { data: account, isLoading, isError } = usePaymentAccount();

  return (
    <Panel
      title="Payment account"
      description="All payments go to this one association account. It's shown on program registrations and chapter dues."
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-danger">We couldn't load the payment account. Refresh the page to try again.</p>
      ) : (
        // Keyed so the form starts again from the saved account after each save.
        <PaymentAccountForm key={JSON.stringify(account)} account={account ?? null} canEdit={canEdit} />
      )}
    </Panel>
  );
}

function PaymentAccountForm({ account, canEdit }: { account: PaymentAccount | null; canEdit: boolean }) {
  const save = useUpdatePaymentAccount();
  const [form, setForm] = useState<PaymentAccount>(account ?? EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const saved = account ?? EMPTY;
  const changed = (Object.keys(EMPTY) as (keyof PaymentAccount)[]).some((k) => form[k] !== saved[k]);

  const set = (key: keyof PaymentAccount, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      bankName: form.bankName.trim(),
      accountName: form.accountName.trim(),
      accountNumber: form.accountNumber.trim(),
    };
    const found: Errors = {};
    if (payload.bankName.length < 2) found.bankName = "Enter the bank name.";
    if (payload.accountName.length < 2) found.accountName = "Enter the account name.";
    if (!/^\d{10}$/.test(payload.accountNumber)) found.accountNumber = "Enter the 10-digit account number.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      await save.mutateAsync(payload);
      successToast("Payment account saved. All payment screens now show it.");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {!account ? (
        <p className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2.5 text-sm text-warning">
          <LuInfo size={16} className="mt-0.5 shrink-0" aria-hidden />
          No account set yet. Until it is, programs show the bank details they were created with.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Bank name" value={form.bankName} error={errors.bankName} disabled={!canEdit} onChange={(e) => set("bankName", e.target.value)} />
        <Input label="Account name" value={form.accountName} error={errors.accountName} disabled={!canEdit} onChange={(e) => set("accountName", e.target.value)} />
        <Input
          label="Account number"
          inputMode="numeric"
          maxLength={10}
          value={form.accountNumber}
          error={errors.accountNumber}
          disabled={!canEdit}
          onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, ""))}
        />
      </div>
      {canEdit ? (
        <div className="flex justify-end">
          <Button type="submit" loading={save.isPending} disabled={!changed}>
            Save account
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted">Only a super admin can change the payment account.</p>
      )}
    </form>
  );
}
