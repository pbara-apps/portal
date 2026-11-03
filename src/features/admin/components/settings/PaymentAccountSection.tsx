import { useEffect, useState } from "react";
import { LuLandmark } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { usePaymentAccount, useUpdatePaymentAccount } from "@/lib/api/settings";
import type { PaymentAccount } from "@/types/admin";

const EMPTY: PaymentAccount = { bankName: "", accountName: "", accountNumber: "" };

/**
 * The association's single bank account. Every payment screen (program
 * registration now, chapter dues later) shows this account.
 * Only a super admin can change it.
 */
export function PaymentAccountSection({ canEdit }: { canEdit: boolean }) {
  const { data: account, isLoading } = usePaymentAccount();
  const save = useUpdatePaymentAccount();
  const [form, setForm] = useState<PaymentAccount>(EMPTY);

  useEffect(() => setForm(account ?? EMPTY), [account]);

  const changed =
    form.bankName !== (account?.bankName ?? "") ||
    form.accountName !== (account?.accountName ?? "") ||
    form.accountNumber !== (account?.accountNumber ?? "");

  const handleSave = async () => {
    const payload = {
      bankName: form.bankName.trim(),
      accountName: form.accountName.trim(),
      accountNumber: form.accountNumber.trim(),
    };
    if (payload.bankName.length < 2 || payload.accountName.length < 2) {
      return errorToast("Enter the bank name and account name.", "Validation");
    }
    if (!/^\d{10}$/.test(payload.accountNumber)) {
      return errorToast("Account number must be 10 digits.", "Validation");
    }
    try {
      await save.mutateAsync(payload);
      successToast("Payment account saved. All payment screens now show it.");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  return (
    <section className="rounded-2xl border border-text-dark/[0.05] bg-surface p-4 shadow-[0_1px_2px_rgba(27,36,82,0.04)] sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-primary">
        <LuLandmark size={16} /> Payment account
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        All payments go to this one association account. It's shown on every program registration and,
        later, on chapter dues and levies.
      </p>

      {isLoading ? (
        <div className="py-6"><Spinner /></div>
      ) : (
        <>
          {!account && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              No account set yet. Until it is, programs show the bank details they were created with.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Input label="Bank name" value={form.bankName} disabled={!canEdit} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} />
            <Input label="Account name" value={form.accountName} disabled={!canEdit} onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))} />
            <Input
              label="Account number"
              inputMode="numeric"
              maxLength={10}
              value={form.accountNumber}
              disabled={!canEdit}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))}
            />
          </div>
          {canEdit ? (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} loading={save.isPending} disabled={!changed} className="bg-primary text-white">
                Save account
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-text-muted">Only a super admin can change the payment account.</p>
          )}
        </>
      )}
    </section>
  );
}
