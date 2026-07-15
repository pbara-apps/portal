import dayjs from "dayjs";
import { LuDownload, LuExternalLink } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { useUpdateRegistrationStatus } from "@/lib/api/registration";
import type { AdminRegistration, RegistrationStatus } from "@/types/admin";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const statusStyles: Record<
  RegistrationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 ring-amber-200/60",
  },
  verified: {
    label: "Verified",
    className: "bg-emerald-100 text-emerald-700 ring-emerald-200/60",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 ring-rose-200/60",
  },
};

export function RegistrationStatusChip({
  status,
}: {
  status: RegistrationStatus;
}) {
  const s = statusStyles[status];
  return (
    <Badge
      className={cn(
        "ring-1 px-2 text-[10px] font-bold uppercase tracking-[0.08em]",
        s.className,
      )}
    >
      {s.label}
    </Badge>
  );
}

interface RegistrationDetailPanelProps {
  registration: AdminRegistration | null;
  canManage: boolean;
  onUpdated?: (updated: AdminRegistration) => void;
}

export function RegistrationDetailPanel({
  registration,
  canManage,
  onUpdated,
}: RegistrationDetailPanelProps) {
  const updateStatus = useUpdateRegistrationStatus();
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "verified" | "rejected" | null
  >(null);

  useEffect(() => {
    setNote(registration?.adminNote ?? "");
    setPendingAction(null);
  }, [registration?.id, registration?.adminNote]);

  if (!registration) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center text-center text-text-muted">
        <p className="text-sm">Select a registration to review details.</p>
      </div>
    );
  }

  const handleStatus = async (status: "verified" | "rejected") => {
    if (!canManage) return;
    try {
      setPendingAction(status);
      const updated = await updateStatus.mutateAsync({
        id: registration.id,
        body: {
          status,
          adminNote: note.trim() || null,
        },
      });
      onUpdated?.(updated);
      successToast(
        status === "verified"
          ? "Registration verified."
          : "Registration rejected.",
      );
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Status update failed.",
        "Error",
      );
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">
            {registration.registrantName}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {registration.registrantPhone}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {registration.program?.title ?? "—"} ·{" "}
            {registration.registrationType}
          </p>
          <p className="mt-2 text-[11px] text-text-muted">
            Submitted{" "}
            {registration.createdAt
              ? dayjs(registration.createdAt).format("MMMM D, YYYY h:mm A")
              : "—"}
          </p>
        </div>
        <RegistrationStatusChip status={registration.status} />
      </div>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Proof of payment
        </p>
        <div className="overflow-hidden rounded-xl border border-text-dark/10 bg-background/50">
          <a
            href={registration.proofOfPaymentUrl}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <img
              src={registration.proofOfPaymentUrl}
              alt="Proof of payment"
              className="max-h-56 w-full object-contain bg-background"
            />
          </a>
          <div className="flex flex-wrap gap-2 border-t border-text-dark/[0.06] p-3">
            <Button size="sm" variant="secondary" asChild>
              <a
                href={registration.proofOfPaymentUrl}
                target="_blank"
                rel="noreferrer"
              >
                <LuExternalLink size={14} />
                View
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a
                href={registration.proofOfPaymentUrl}
                download
                target="_blank"
                rel="noreferrer"
              >
                <LuDownload size={14} />
                Download
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Entries ({registration.entries.length})
        </p>
        <div className="overflow-hidden rounded-xl border border-text-dark/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Church</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registration.entries.map((entry, index) => (
                <TableRow key={`${entry.registrationCode ?? entry.name}-${index}`}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {entry.registrationCode ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-text-dark">
                    {entry.name}
                  </TableCell>
                  <TableCell className="text-sm text-text-muted">
                    {entry.rankName}
                  </TableCell>
                  <TableCell className="text-sm text-text-muted">
                    {entry.churchName}
                    {entry.churchChapter ? (
                      <span className="block text-[11px] text-text-muted">
                        {entry.churchChapter}
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {registration.status === "pending" ? (
        <section className="space-y-3 rounded-xl border border-text-dark/10 bg-background/40 p-4">
          <Textarea
            label="Admin note (optional)"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for verify or reject…"
            disabled={!canManage || updateStatus.isPending}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={!canManage || updateStatus.isPending}
              loading={pendingAction === "verified"}
              onClick={() => handleStatus("verified")}
            >
              Verify
            </Button>
            <Button
              variant="outline"
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
              disabled={!canManage || updateStatus.isPending}
              loading={pendingAction === "rejected"}
              onClick={() => handleStatus("rejected")}
            >
              Reject
            </Button>
          </div>
          {!canManage ? (
            <p className="text-xs text-text-muted">
              Your role does not permit status updates.
            </p>
          ) : null}
        </section>
      ) : (
        <section className="rounded-xl border border-text-dark/10 bg-background/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Admin note
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-text-dark">
            {registration.adminNote?.trim() || "—"}
          </p>
        </section>
      )}
    </div>
  );
}
