import { Skeleton } from "@heroui/react";
import { useMemo, useState } from "react";
import { LuIdCard, LuPencil, LuUserCheck, LuUserX } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DetailDrawerContent, DetailItem, DetailList, DetailSection } from "@/components/shared/DetailDrawer";
import { FormDrawerContent } from "@/components/shared/FormDrawer";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "@/features/chapter/components/MemberAvatar";
import { MemberStatusBadge } from "@/features/chapter/components/MemberStatusBadge";
import { RankProgressLine } from "@/features/chapter/components/RankProgressLine";
import { ageFrom, ageWarning, formatDate, toDateInput } from "@/features/chapter/lib/member-utils";
import type { PortalMember, PortalRank } from "@/features/chapter/types";
import { useAdminMember, useAdminSetMemberStatus, useAdminUpdateMember } from "@/lib/api/chapter-admin";
import { useGetRanks } from "@/lib/api/rank";
import { downloadMembershipCard } from "@/lib/members/membership-card";

type Form = { fullName: string; dateOfBirth: string; rankId: string; phone: string; guardianName: string; guardianPhone: string };

function CorrectDetailsForm({
  member,
  ranks,
  onDone,
}: {
  member: PortalMember;
  ranks: PortalRank[];
  onDone: () => void;
}) {
  const update = useAdminUpdateMember();
  const [form, setForm] = useState<Form>({
    fullName: member.fullName,
    dateOfBirth: toDateInput(member.dateOfBirth),
    rankId: member.rank?.id ?? "",
    phone: member.phone ?? "",
    guardianName: member.guardianName ?? "",
    guardianPhone: member.guardianPhone ?? "",
  });
  const [nameError, setNameError] = useState("");
  const set = (field: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = async () => {
    if (form.fullName.trim().length < 3) {
      setNameError("Enter the member's full name (at least 3 characters).");
      return;
    }
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
      onDone();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Save failed");
    }
  };

  return (
    <FormDrawerContent
      title="Correct member details"
      description={`${member.fullName} · ${member.memberId ?? "No member ID"}`}
      onSubmit={save}
      onCancel={onDone}
      cancelLabel="Back"
      submitting={update.isPending}
      submitLabel="Save changes"
    >
      <Input
        label="Full name"
        value={form.fullName}
        error={nameError || undefined}
        onChange={(e) => {
          set("fullName")(e);
          if (nameError) setNameError("");
        }}
        required
        autoFocus
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
        <Select label="Current rank" value={form.rankId} onValueChange={(v) => setForm((f) => ({ ...f, rankId: v }))}>
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
      </div>
      <Input label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Parent / guardian name" value={form.guardianName} onChange={set("guardianName")} />
        <Input label="Parent / guardian phone" type="tel" value={form.guardianPhone} onChange={set("guardianPhone")} />
      </div>
    </FormDrawerContent>
  );
}

/**
 * One member, association view: details, rank progress and (for super
 * admins and admins) corrections and active/inactive status.
 */
export function AdminMemberDrawer({
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
  const setStatus = useAdminSetMemberStatus();
  const [editing, setEditing] = useState(false);
  const [confirmInactive, setConfirmInactive] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const close = () => {
    setEditing(false);
    onClose();
  };

  const changeStatus = async (status: "active" | "inactive") => {
    if (!member) return;
    if (status === "inactive" && reason.trim().length < 3) {
      setReasonError("Give a short reason (at least 3 characters).");
      return;
    }
    try {
      await setStatus.mutateAsync({ id: member.id, status, reason: status === "inactive" ? reason.trim() : null });
      successToast(status === "inactive" ? "Member set inactive." : "Member is active again.");
      setConfirmInactive(false);
      setReason("");
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to update.", "Error");
    }
  };

  const warning = member ? ageWarning(member.dateOfBirth, ranks.find((r) => r.id === member.rank?.id)) : null;

  return (
    <>
      <Sheet open={!!memberId} onOpenChange={(open) => !open && close()}>
        <SheetContent size="lg" aria-label={isLoading || !member ? "Loading member" : undefined}>
          {isLoading || !member ? (
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2 rounded" />
                  <Skeleton className="h-3.5 w-1/3 rounded" />
                </div>
              </div>
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : editing ? (
            <CorrectDetailsForm member={member} ranks={ranks} onDone={() => setEditing(false)} />
          ) : (
            <DetailDrawerContent
              title={member.fullName}
              description={[member.memberId ?? "No member ID", member.chapter?.name, member.church?.name].filter(Boolean).join(" · ")}
              media={<MemberAvatar photo={member.photo} name={member.fullName} size={56} />}
              badges={<MemberStatusBadge member={member} />}
              footer={
                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  {canEdit && member.status === "active" ? (
                    <Button type="button" variant="ghost" className="text-danger sm:mr-auto" onClick={() => setConfirmInactive(true)}>
                      <LuUserX size={15} aria-hidden />
                      Set inactive
                    </Button>
                  ) : null}
                  {canEdit && member.status === "inactive" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:mr-auto"
                      loading={setStatus.isPending}
                      onClick={() => changeStatus("active")}
                    >
                      <LuUserCheck size={15} aria-hidden />
                      Set active again
                    </Button>
                  ) : null}
                  {member.status === "active" ? (
                    <Button type="button" variant="outline" onClick={() => downloadMembershipCard(member)}>
                      <LuIdCard size={15} aria-hidden />
                      Membership card
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <Button type="button" onClick={() => setEditing(true)}>
                      <LuPencil size={15} aria-hidden />
                      Correct details
                    </Button>
                  ) : null}
                </div>
              }
            >
              {member.status === "inactive" && member.statusReason ? (
                <p className="rounded-lg bg-surface-secondary px-3 py-2.5 text-sm text-muted">
                  <span className="font-medium text-foreground">Inactive:</span> {member.statusReason}
                </p>
              ) : null}

              <DetailSection title="Details">
                <DetailList>
                  <DetailItem label="Date of birth">{member.dateOfBirth ? formatDate(member.dateOfBirth) : null}</DetailItem>
                  <DetailItem label="Age">{ageFrom(member.dateOfBirth)}</DetailItem>
                  <DetailItem label="Rank">{member.rank?.name}</DetailItem>
                  <DetailItem label="Phone">{member.phone}</DetailItem>
                  <DetailItem label="Parent / guardian">{member.guardianName}</DetailItem>
                  <DetailItem label="Guardian phone">{member.guardianPhone}</DetailItem>
                  <DetailItem label="Approved">{member.approvedAt ? formatDate(member.approvedAt) : null}</DetailItem>
                </DetailList>
                {warning ? <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">{warning}</p> : null}
              </DetailSection>

              <DetailSection title="Rank progress">
                <RankProgressLine ranks={ranks} history={member.rankHistory} currentRankId={member.rank?.id} />
              </DetailSection>
            </DetailDrawerContent>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        isOpen={confirmInactive}
        title="Set member inactive?"
        message={`${member?.fullName ?? "This member"} will no longer count as an active ambassador. You can make them active again later.`}
        confirmLabel="Set inactive"
        loading={setStatus.isPending}
        onClose={() => {
          setConfirmInactive(false);
          setReason("");
          setReasonError("");
        }}
        onConfirm={() => changeStatus("inactive")}
      >
        <Textarea
          label="Reason"
          rows={2}
          value={reason}
          error={reasonError || undefined}
          placeholder="e.g. Relocated to another city"
          onChange={(e) => {
            setReason(e.target.value);
            if (reasonError) setReasonError("");
          }}
          autoFocus
        />
      </ConfirmDialog>
    </>
  );
}
