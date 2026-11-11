import { useMemo, useState } from "react";
import { LuCheck, LuSearch } from "react-icons/lu";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRequestTransfer, useTransferDestinations } from "../api/transfers";
import type { PortalMember } from "../types";
import { preventEnterSubmit } from "../lib/form-keys";

/**
 * Ask to move an approved member to another chapter (any church).
 * The association approves; the member keeps their ID and history.
 */
export function TransferDrawer({ member, open, onClose }: { member: PortalMember; open: boolean; onClose: () => void }) {
  const { data: chapters = [], isLoading } = useTransferDestinations(open);
  const request = useRequestTransfer();
  const [search, setSearch] = useState("");
  const [toChapterId, setToChapterId] = useState("");
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chapters
      .filter((c) => c.id !== member.chapter?.id)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.churchName.toLowerCase().includes(q));
  }, [chapters, search, member.chapter?.id]);

  const close = () => {
    setSearch("");
    setToChapterId("");
    setReason("");
    setShowError(false);
    onClose();
  };

  const handleSubmit = async () => {
    setShowError(true);
    if (!toChapterId) return;
    try {
      await request.mutateAsync({ memberId: member.id, toChapterId, reason: reason.trim() || null });
      successToast("Transfer request sent. The association will review it.");
      close();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send.", "Error");
    }
  };

  return (
    <FormDrawer
      open={open}
      title={`Transfer ${member.fullName}`}
      description="Pick the chapter they are moving to. They keep their member ID and history."
      onSubmit={handleSubmit}
      onCancel={close}
      submitting={request.isPending}
      submitLabel="Request transfer"
    >
      <div className="space-y-2">
        <Input
          label="Moving to"
          placeholder="Search chapter or church…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={preventEnterSubmit}
          startContent={<LuSearch size={16} />}
        />
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <ul className="max-h-72 overflow-y-auto rounded-xl border border-border" aria-label="Chapters">
            {options.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted">No chapters match.</li>
            ) : (
              options.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setToChapterId(c.id)}
                    aria-pressed={toChapterId === c.id}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-separator px-3 py-2.5 text-left last:border-0 hover:bg-surface-secondary",
                      toChapterId === c.id && "bg-primary/5",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{c.name}</span>
                      <span className="block text-xs text-muted">{c.churchName}</span>
                    </span>
                    {toChapterId === c.id ? <LuCheck size={16} className="text-primary" aria-hidden /> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
        {showError && !toChapterId ? <p className="text-xs text-danger">Choose the chapter they are moving to.</p> : null}
      </div>
      <Textarea
        label="Reason (optional)"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Family relocated"
      />
    </FormDrawer>
  );
}
