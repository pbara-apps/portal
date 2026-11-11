import { useEffect, useState } from "react";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRanks, useUpdateMember } from "../api/members";
import { ageWarning, toDateInput } from "../lib/member-utils";
import type { MemberPayload, PortalMember } from "../types";
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

/** Members in these statuses can be edited from the chapter portal. */
export const canEditMember = (member: PortalMember) => ["active", "pending", "rejected"].includes(member.status);

/**
 * Edit one member.
 * - Approved members: name and date of birth are locked.
 * - Rejected / "changes requested" members: saving resubmits them for approval.
 */
export function MemberEditDrawer({ member, open, onClose }: { member: PortalMember; open: boolean; onClose: () => void }) {
  const { data: ranks = [] } = useRanks();
  const updateMember = useUpdateMember();
  const [form, setForm] = useState<FormState>(() => toForm(member));
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(toForm(member));
    setShowErrors(false);
  }, [open, member]);

  const isActive = member.status === "active";
  const resubmits = member.status === "rejected" || member.changesRequested;
  const warning = ageWarning(form.dateOfBirth, ranks.find((r) => r.id === form.rankId));
  const set = (key: keyof FormState, value: string | null) => setForm((f) => ({ ...f, [key]: value }));
  const nameError = showErrors && form.fullName.trim().length < 3 ? "Enter the member's full name" : undefined;
  const rankError = showErrors && !form.rankId ? "Choose a rank" : undefined;

  const handleSave = async () => {
    setShowErrors(true);
    if (form.fullName.trim().length < 3 || !form.rankId) return;
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
    <FormDrawer
      open={open}
      title={`Edit ${member.fullName}`}
      description={
        <>
          {member.memberId ? `Member ID ${member.memberId}` : "No member ID yet — given on approval."}
          {member.chapter ? ` · ${member.chapter.name}` : ""}
        </>
      }
      onSubmit={handleSave}
      onCancel={onClose}
      submitting={updateMember.isPending}
      submitLabel={resubmits ? "Save & resubmit" : "Save changes"}
    >
      {member.reviewNote ? (
        <div className="rounded-lg bg-warning/10 px-3 py-2.5 text-sm text-warning">
          <p className="font-semibold">{member.status === "rejected" ? "Reason for rejection" : "Changes requested"}</p>
          <p className="mt-1">{member.reviewNote}</p>
        </div>
      ) : null}

      <PhotoUploadField value={form.photo} name={form.fullName} onChange={(url) => set("photo", url)} />
      <Input
        label="Full name"
        required
        value={form.fullName}
        disabled={isActive}
        error={nameError}
        onChange={(e) => set("fullName", e.target.value)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Rank" required value={form.rankId} onValueChange={(v) => set("rankId", v)} error={rankError}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a rank" />
          </SelectTrigger>
          <SelectContent>
            {ranks.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          <Input
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            disabled={isActive}
            onChange={(e) => set("dateOfBirth", e.target.value)}
          />
          {warning ? <p className="mt-1 text-xs text-warning">{warning}</p> : null}
        </div>
      </div>
      <Input label="Phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Parent / guardian name" value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} />
        <Input
          label="Parent / guardian phone"
          type="tel"
          value={form.guardianPhone}
          onChange={(e) => set("guardianPhone", e.target.value)}
        />
      </div>
      {isActive ? (
        <p className="text-xs text-muted">
          Name and date of birth can't be changed after approval. Contact the association if they are wrong.
        </p>
      ) : null}
    </FormDrawer>
  );
}
