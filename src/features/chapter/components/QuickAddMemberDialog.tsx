import { useEffect, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { useAddMembers, useRanks } from "../api/members";
import { ageWarning } from "../lib/member-utils";
import type { PortalMember } from "../types";

/**
 * Short "add member" form used while registering for a program, for someone
 * who isn't on the roster yet. They are saved as awaiting approval and can
 * be registered straight away.
 */
export function QuickAddMemberDialog({
  open,
  chapterId,
  initialName = "",
  onClose,
  onAdded,
}: {
  open: boolean;
  chapterId: string;
  initialName?: string;
  onClose: () => void;
  onAdded: (member: PortalMember) => void;
}) {
  const { data: ranks = [] } = useRanks();
  const addMembers = useAddMembers();
  const [fullName, setFullName] = useState("");
  const [rankId, setRankId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  useEffect(() => {
    if (open) {
      setFullName(initialName);
      setRankId("");
      setDateOfBirth("");
    }
  }, [open, initialName]);

  const warning = ageWarning(dateOfBirth, ranks.find((r) => r.id === rankId));

  const handleSave = async () => {
    if (fullName.trim().length < 3) return errorToast("Enter the full name.", "Validation");
    if (!rankId) return errorToast("Select a rank.", "Validation");
    try {
      const [created] = await addMembers.mutateAsync({
        chapterId,
        members: [{ fullName: fullName.trim(), rankId, dateOfBirth: dateOfBirth || null }],
      });
      successToast(`${created.fullName} added and waiting for approval.`);
      onAdded(created);
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to add.", "Error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new member</DialogTitle>
          <DialogDescription>
            They'll be registered now and added to your chapter once the association approves them.
            You can add their photo and other details later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-dark">Rank</label>
            <Select value={rankId} onValueChange={setRankId}>
              <SelectTrigger aria-label="Rank"><SelectValue placeholder="Select rank" /></SelectTrigger>
              <SelectContent>
                {ranks.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input label="Date of birth (optional)" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            {warning && <p className="mt-1 text-xs text-amber-700">{warning}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={addMembers.isPending} className="bg-primary text-white">Add & select</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
