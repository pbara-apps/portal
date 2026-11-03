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
import { useRanks, useUpdateMember } from "../api/members";
import { ageWarning, toDateInput } from "../lib/member-utils";
import type { MemberPayload, PortalMember } from "../types";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { PhotoUploadField } from "./PhotoUploadField";

type FormState = {
  [K in Exclude<keyof MemberPayload, "photo">]-?: string;
} & { photo: string | null };

function toForm(member: PortalMember): FormState {
  return {
    fullName: member.fullName,
    rankId: member.rank?.id ?? "",
    dateOfBirth: toDateInput(member.dateOfBirth),
    photo: member.photo,
    phone: member.phone ?? "",
    guardianName: member.guardianName ?? "",
    guardianPhone: member.guardianPhone ?? "",
  };
}

/**
 * View and edit one member.
 * - Approved members: name and date of birth are locked.
 * - Rejected / "changes requested" members: saving resubmits them for approval.
 */
export function MemberEditDialog({
  member,
  onClose,
}: {
  member: PortalMember | null;
  onClose: () => void;
}) {
  const { data: ranks = [] } = useRanks();
  const updateMember = useUpdateMember();
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => setForm(member ? toForm(member) : null), [member]);

  if (!member || !form) return null;

  const isActive = member.status === "active";
  const canEdit = ["active", "pending", "rejected"].includes(member.status);
  const resubmits = member.status === "rejected" || member.changesRequested;
  const warning = ageWarning(form.dateOfBirth, ranks.find((r) => r.id === form.rankId));
  const set = (key: keyof FormState, value: string | null) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const handleSave = async () => {
    if (form.fullName.trim().length < 3) return errorToast("Enter the member's full name.", "Validation");
    if (!form.rankId) return errorToast("Select a rank.", "Validation");
    try {
      await updateMember.mutateAsync({
        id: member.id,
        body: {
          // Name and date of birth are locked once approved.
          ...(isActive ? {} : { fullName: form.fullName, dateOfBirth: form.dateOfBirth || null }),
          rankId: form.rankId,
          photo: form.photo,
          phone: form.phone || null,
          guardianName: form.guardianName || null,
          guardianPhone: form.guardianPhone || null,
        },
      });
      successToast(resubmits ? "Member resubmitted for approval." : "Member updated.");
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {member.fullName} <MemberStatusBadge member={member} />
          </DialogTitle>
          <DialogDescription>
            {member.memberId ? `Member ID ${member.memberId}` : "No member ID yet — given on approval."}
            {member.chapter ? ` · ${member.chapter.name}` : ""}
          </DialogDescription>
        </DialogHeader>

        {member.reviewNote && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">
              {member.status === "rejected" ? "Reason for rejection" : "Changes requested"}
            </p>
            <p className="mt-1">{member.reviewNote}</p>
          </div>
        )}

        <div className="space-y-4">
          <PhotoUploadField value={form.photo} name={form.fullName} onChange={(url) => set("photo", url)} />
          <Input
            label="Full name"
            value={form.fullName}
            disabled={!canEdit || isActive}
            onChange={(e) => set("fullName", e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-dark">Rank</label>
            <Select value={form.rankId} onValueChange={(v) => set("rankId", v)} disabled={!canEdit}>
              <SelectTrigger aria-label="Rank"><SelectValue placeholder="Select rank" /></SelectTrigger>
              <SelectContent>
                {ranks.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              disabled={!canEdit || isActive}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
            {warning && <p className="mt-1 text-xs text-amber-700">{warning}</p>}
          </div>
          <Input label="Phone" value={form.phone} disabled={!canEdit} onChange={(e) => set("phone", e.target.value)} />
          <Input
            label="Parent / guardian name"
            value={form.guardianName}
            disabled={!canEdit}
            onChange={(e) => set("guardianName", e.target.value)}
          />
          <Input
            label="Parent / guardian phone"
            value={form.guardianPhone}
            disabled={!canEdit}
            onChange={(e) => set("guardianPhone", e.target.value)}
          />
          {isActive && (
            <p className="text-xs text-text-muted">
              Name and date of birth can't be changed after approval. Contact the association if they are wrong.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {canEdit && (
            <Button onClick={handleSave} loading={updateMember.isPending} className="bg-primary text-white">
              {resubmits ? "Save & resubmit" : "Save changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
