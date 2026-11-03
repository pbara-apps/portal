import { useEffect, useMemo, useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { MemberAvatar } from "@/features/chapter/components/MemberAvatar";
import { MemberStatusBadge } from "@/features/chapter/components/MemberStatusBadge";
import { RankProgressLine } from "@/features/chapter/components/RankProgressLine";
import { ageFrom, ageWarning, formatDate, toDateInput } from "@/features/chapter/lib/member-utils";
import type { PortalRank } from "@/features/chapter/types";
import { useAdminMember, useAdminSetMemberStatus, useAdminUpdateMember } from "@/lib/api/chapter-admin";
import { useGetRanks } from "@/lib/api/rank";

type Form = { fullName: string; dateOfBirth: string; rankId: string; phone: string; guardianName: string; guardianPhone: string };

/**
 * One member, association view: details, rank progress and (for super
 * admins and admins) corrections and active/inactive status.
 */
export function AdminMemberDialog({
  memberId,
  canEdit,
  onClose,
}: {
  memberId: string | null;
  canEdit: boolean;
  onClose: () => void;
}) {
  const { data: member, isLoading } = useAdminMember(memberId);
  const { data: adminRanks = [] } = useGetRanks();
  const ranks: PortalRank[] = useMemo(
    () => adminRanks.map((r) => ({ id: r.id, name: r.name, order: r.order, maxAge: r.maxAge })),
    [adminRanks],
  );
  const update = useAdminUpdateMember();
  const setStatus = useAdminSetMemberStatus();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [inactiveReason, setInactiveReason] = useState("");
  const [confirmInactive, setConfirmInactive] = useState(false);

  useEffect(() => {
    setEditing(false);
    setConfirmInactive(false);
    setInactiveReason("");
    if (member) {
      setForm({
        fullName: member.fullName,
        dateOfBirth: toDateInput(member.dateOfBirth),
        rankId: member.rank?.id ?? "",
        phone: member.phone ?? "",
        guardianName: member.guardianName ?? "",
        guardianPhone: member.guardianPhone ?? "",
      });
    }
  }, [member]);

  if (!memberId) return null;

  const handleSave = async () => {
    if (!member || !form) return;
    if (form.fullName.trim().length < 3) return errorToast("Enter the full name.", "Validation");
    try {
      await update.mutateAsync({
        id: member.id,
        body: {
          fullName: form.fullName.trim(),
          dateOfBirth: form.dateOfBirth || null,
          rankId: form.rankId,
          phone: form.phone || null,
          guardianName: form.guardianName || null,
          guardianPhone: form.guardianPhone || null,
        },
      });
      successToast("Member updated.");
      setEditing(false);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  const handleStatus = async (status: "active" | "inactive") => {
    if (!member) return;
    if (status === "inactive" && inactiveReason.trim().length < 3) return errorToast("Give a short reason.", "Reason needed");
    try {
      await setStatus.mutateAsync({ id: member.id, status, reason: status === "inactive" ? inactiveReason.trim() : null });
      successToast(status === "inactive" ? "Member set inactive." : "Member is active again.");
      setConfirmInactive(false);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to update.", "Error");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {isLoading || !member || !form ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <MemberAvatar photo={member.photo} name={member.fullName} size={56} />
                <div>
                  <DialogTitle className="flex flex-wrap items-center gap-2">
                    {member.fullName} <MemberStatusBadge member={member} />
                  </DialogTitle>
                  <DialogDescription>
                    {member.memberId ?? "No ID"} · {member.chapter?.name} · {member.church?.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {member.status === "inactive" && member.statusReason && (
              <p className="rounded-lg bg-background p-3 text-sm text-text-muted">Inactive: {member.statusReason}</p>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <section className="space-y-3">
                {editing ? (
                  <>
                    <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                    <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Current rank</label>
                      <Select value={form.rankId} onValueChange={(v) => setForm({ ...form, rankId: v })}>
                        <SelectTrigger aria-label="Rank"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ranks.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <Input label="Parent / guardian name" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
                    <Input label="Parent / guardian phone" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
                  </>
                ) : (
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs text-text-muted">Date of birth</dt><dd>{member.dateOfBirth ? formatDate(member.dateOfBirth) : "—"}</dd></div>
                    <div><dt className="text-xs text-text-muted">Age</dt><dd>{ageFrom(member.dateOfBirth) ?? "—"}</dd></div>
                    <div><dt className="text-xs text-text-muted">Rank</dt><dd>{member.rank?.name ?? "—"}</dd></div>
                    <div><dt className="text-xs text-text-muted">Phone</dt><dd>{member.phone ?? "—"}</dd></div>
                    <div><dt className="text-xs text-text-muted">Guardian</dt><dd>{member.guardianName ?? "—"}</dd></div>
                    <div><dt className="text-xs text-text-muted">Guardian phone</dt><dd>{member.guardianPhone ?? "—"}</dd></div>
                    <div><dt className="text-xs text-text-muted">Approved</dt><dd>{member.approvedAt ? formatDate(member.approvedAt) : "—"}</dd></div>
                  </dl>
                )}
                {(() => {
                  const warning = ageWarning(member.dateOfBirth, ranks.find((r) => r.id === member.rank?.id));
                  return warning ? <p className="text-xs text-amber-700">{warning}</p> : null;
                })()}
              </section>
              <section>
                <h3 className="mb-3 text-sm font-semibold text-primary">Rank progress</h3>
                <RankProgressLine ranks={ranks} history={member.rankHistory} currentRankId={member.rank?.id} />
              </section>
            </div>

            {confirmInactive && (
              <Textarea
                label="Reason for setting inactive"
                rows={2}
                value={inactiveReason}
                onChange={(e) => setInactiveReason(e.target.value)}
                placeholder="e.g. Relocated to another city"
              />
            )}

            <DialogFooter className="flex-wrap gap-2">
              {canEdit && !editing && member.status === "active" && !confirmInactive && (
                <Button variant="ghost" className="text-rose-600" onClick={() => setConfirmInactive(true)}>Set inactive</Button>
              )}
              {canEdit && confirmInactive && (
                <Button variant="destructive" loading={setStatus.isPending} onClick={() => handleStatus("inactive")}>Confirm inactive</Button>
              )}
              {canEdit && member.status === "inactive" && (
                <Button variant="outline" loading={setStatus.isPending} onClick={() => handleStatus("active")}>Set active again</Button>
              )}
              {canEdit && !editing && <Button variant="outline" onClick={() => setEditing(true)}>Correct details</Button>}
              {editing && (
                <>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} loading={update.isPending} className="bg-primary text-white">Save</Button>
                </>
              )}
              {!editing && <Button onClick={onClose} className="bg-primary text-white">Close</Button>}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
