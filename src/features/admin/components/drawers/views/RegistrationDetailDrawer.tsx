import dayjs from "dayjs";
import { useState } from "react";
import { LuCheck, LuDownload, LuExternalLink, LuFileText, LuPencil, LuPlus, LuX } from "react-icons/lu";
import { DetailDrawerContent, DetailItem, DetailList, DetailSection } from "@/components/shared/DetailDrawer";
import { RowActions } from "@/components/shared/RowActions";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AddParticipantsForm, EditParticipantForm } from "@/features/admin/components/registrations/RegistrationEntryForms";
import { RegistrationStatusChip } from "@/features/admin/components/registrations/RegistrationStatusChip";
import { useUpdateRegistrationStatus } from "@/lib/api/registration";
import { useDrawer } from "@/store/useDrawer";
import type { AdminRegistration, AdminRegistrationEntry } from "@/types/admin";

type View = { kind: "detail" } | { kind: "add" } | { kind: "edit"; entry: AdminRegistrationEntry };

interface RegistrationDetailDrawerProps {
  registration?: AdminRegistration;
  canManage: boolean;
  onClose: () => void;
}

/**
 * One registration: proof of payment, participants and the verify/reject
 * decision. Adding or editing participants swaps the drawer to a form.
 */
export function RegistrationDetailDrawer({ registration, canManage }: RegistrationDetailDrawerProps) {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const [view, setView] = useState<View>({ kind: "detail" });

  if (!registration) return null;

  // Mutations return the updated record; show it in place.
  const done = (updated?: AdminRegistration) => {
    if (updated) openDrawer("view-registration", { body: updated });
    setView({ kind: "detail" });
  };

  if (view.kind === "add") return <AddParticipantsForm registration={registration} onDone={done} />;
  if (view.kind === "edit") return <EditParticipantForm registration={registration} entry={view.entry} onDone={done} />;

  return (
    <RegistrationDetail
      // Remount on a different record so the note starts from that record.
      key={registration.id}
      registration={registration}
      canManage={canManage}
      onUpdated={done}
      onAdd={() => setView({ kind: "add" })}
      onEdit={(entry) => setView({ kind: "edit", entry })}
    />
  );
}

function RegistrationDetail({
  registration,
  canManage,
  onUpdated,
  onAdd,
  onEdit,
}: {
  registration: AdminRegistration;
  canManage: boolean;
  onUpdated: (updated: AdminRegistration) => void;
  onAdd: () => void;
  onEdit: (entry: AdminRegistrationEntry) => void;
}) {
  const updateStatus = useUpdateRegistrationStatus();
  const [note, setNote] = useState(registration.adminNote ?? "");
  const [deciding, setDeciding] = useState<"verified" | "rejected" | null>(null);
  const reviewing = canManage && registration.status === "pending";
  const canEditEntries = canManage && registration.status !== "rejected";

  const decide = async (status: "verified" | "rejected") => {
    setDeciding(status);
    try {
      const updated = await updateStatus.mutateAsync({
        id: registration.id,
        body: { status, adminNote: note.trim() || null },
      });
      successToast(status === "verified" ? "Registration verified." : "Registration rejected.");
      onUpdated(updated);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Status update failed.", "Error");
    } finally {
      setDeciding(null);
    }
  };

  return (
    <DetailDrawerContent
      title={registration.registrantName}
      description={[registration.registrantPhone, registration.program?.title].filter(Boolean).join(" · ")}
      badges={<RegistrationStatusChip status={registration.status} />}
      footer={
        reviewing ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            <Button
              type="button"
              variant="outline"
              className="text-danger"
              disabled={updateStatus.isPending}
              loading={deciding === "rejected"}
              onClick={() => decide("rejected")}
            >
              <LuX size={15} aria-hidden />
              Reject
            </Button>
            <Button
              type="button"
              className="bg-success text-white hover:bg-success/90"
              disabled={updateStatus.isPending}
              loading={deciding === "verified"}
              onClick={() => decide("verified")}
            >
              <LuCheck size={15} aria-hidden />
              Verify registration
            </Button>
          </div>
        ) : undefined
      }
    >
      <DetailSection title="Details">
        <DetailList>
          <DetailItem label="Program">{registration.program?.title}</DetailItem>
          <DetailItem label="Type">
            <span className="capitalize">{registration.registrationType}</span>
          </DetailItem>
          <DetailItem label="Submitted">
            {registration.createdAt ? dayjs(registration.createdAt).format("MMM D, YYYY · h:mm A") : null}
          </DetailItem>
          <DetailItem label="Participants">{registration.entries.length}</DetailItem>
        </DetailList>
      </DetailSection>

      <DetailSection title="Proof of payment">
        <ProofOfPayment url={registration.proofOfPaymentUrl} />
      </DetailSection>

      <DetailSection
        title={`Participants (${registration.entries.length})`}
        action={
          canEditEntries ? (
            <Button type="button" size="sm" variant="outline" onClick={onAdd}>
              <LuPlus size={14} aria-hidden />
              Add
            </Button>
          ) : undefined
        }
      >
        <ul className="divide-y divide-separator rounded-xl border border-border">
          {registration.entries.map((entry, i) => (
            <li key={entry.registrationCode ?? `${entry.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-foreground">
                  {entry.name}
                  {entry.membership === "pending" ? (
                    <span className="rounded-full bg-focus/[0.08] px-2 py-0.5 text-[11px] font-medium text-focus">
                      Membership pending
                    </span>
                  ) : null}
                  {entry.membership === "non_member" ? (
                    <span className="rounded-full bg-danger/[0.08] px-2 py-0.5 text-[11px] font-medium text-danger">
                      Non-member
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {entry.registrationCode ? (
                    <span className="font-mono font-medium text-foreground/80">{entry.registrationCode}</span>
                  ) : (
                    "No code"
                  )}
                  {" · "}
                  {[entry.rankName, entry.churchChapter || entry.churchName].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              {canEditEntries && entry.registrationCode ? (
                <RowActions
                  actions={[{ label: `Edit ${entry.name}`, icon: LuPencil, tone: "accent", onAction: () => onEdit(entry) }]}
                />
              ) : null}
            </li>
          ))}
        </ul>
      </DetailSection>

      {reviewing ? (
        <Textarea
          label="Note to registrant (optional)"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Saved with your decision, e.g. why it was rejected."
          disabled={updateStatus.isPending}
        />
      ) : (
        <DetailSection title="Admin note">
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {registration.adminNote?.trim() || <span className="text-muted">No note.</span>}
          </p>
        </DetailSection>
      )}
    </DetailDrawerContent>
  );
}

function ProofOfPayment({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const linkCx =
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-focus outline-none hover:bg-focus/[0.08] focus-visible:ring-2 focus-visible:ring-focus";

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {failed ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 bg-surface-secondary text-muted">
          <LuFileText size={22} aria-hidden />
          <p className="text-xs">Preview not available. Open the file to view it.</p>
        </div>
      ) : (
        <img
          src={url}
          alt="Proof of payment"
          onError={() => setFailed(true)}
          className="max-h-64 min-h-32 w-full bg-surface-secondary object-contain"
        />
      )}
      <div className="flex flex-wrap gap-1 border-t border-separator px-2 py-2">
        <a href={url} target="_blank" rel="noreferrer" className={linkCx}>
          <LuExternalLink size={14} aria-hidden />
          Open
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <a href={url} download target="_blank" rel="noreferrer" className={linkCx}>
          <LuDownload size={14} aria-hidden />
          Download
        </a>
      </div>
    </div>
  );
}
