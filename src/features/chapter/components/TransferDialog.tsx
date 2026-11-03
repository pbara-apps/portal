import { useMemo, useState } from "react";
import { LuSearch } from "react-icons/lu";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { cn } from "@/lib/utils";
import { useRequestTransfer, useTransferDestinations } from "../api/transfers";
import type { PortalMember } from "../types";

/**
 * Ask to move an approved member to another chapter (any church).
 * The association approves; the member keeps their ID and history.
 */
export function TransferDialog({ member, open, onClose }: { member: PortalMember; open: boolean; onClose: () => void }) {
  const { data: chapters = [], isLoading } = useTransferDestinations(open);
  const request = useRequestTransfer();
  const [search, setSearch] = useState("");
  const [toChapterId, setToChapterId] = useState("");
  const [reason, setReason] = useState("");

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chapters
      .filter((c) => c.id !== member.chapter?.id)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.churchName.toLowerCase().includes(q));
  }, [chapters, search, member.chapter?.id]);

  const handleSubmit = async () => {
    if (!toChapterId) return errorToast("Choose the chapter they are moving to.", "Destination");
    try {
      await request.mutateAsync({ memberId: member.id, toChapterId, reason: reason.trim() || null });
      successToast("Transfer request sent. The association will review it.");
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send.", "Error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer {member.fullName}</DialogTitle>
          <DialogDescription>Pick the chapter they are moving to. They keep their member ID and history.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search chapter or church…" value={search} onChange={(e) => setSearch(e.target.value)} startContent={<LuSearch size={16} />} />
        {isLoading ? (
          <Spinner />
        ) : (
          <ul className="max-h-60 overflow-y-auto rounded-xl border border-text-dark/10">
            {options.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setToChapterId(c.id)}
                  className={cn(
                    "flex w-full flex-col border-b border-text-dark/5 px-3 py-2 text-left last:border-0 hover:bg-background/60",
                    toChapterId === c.id && "bg-primary/5",
                  )}
                >
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-text-muted">{c.churchName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Textarea label="Reason (optional)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Family relocated" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={request.isPending} className="bg-primary text-white">Request transfer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
