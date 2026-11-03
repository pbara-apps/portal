import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuPencil, LuShuffle, LuTrendingUp } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMember, useRanks } from "../api/members";
import { MemberAvatar } from "../components/MemberAvatar";
import { MemberEditDialog } from "../components/MemberEditDialog";
import { MemberStatusBadge } from "../components/MemberStatusBadge";
import { RankProgressDialog } from "../components/RankProgressDialog";
import { RankProgressLine } from "../components/RankProgressLine";
import { TransferDialog } from "../components/TransferDialog";
import { ageFrom, ageWarning, formatDate } from "../lib/member-utils";

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-dark">{value || "—"}</dd>
    </div>
  );
}

/**
 * One member: details, approval status and rank progress line.
 * Chapter officers can edit details and update rank progress here.
 */
export default function MemberDetailPage() {
  const { id } = useParams();
  const { data: member, isLoading, isError } = useMember(id);
  const { data: ranks = [] } = useRanks();
  const [editOpen, setEditOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner label="Loading member…" /></div>;
  if (isError || !member) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-rose-600">Member not found.</p>
        <Button asChild size="sm" variant="outline"><Link to="/chapter/members">Back to members</Link></Button>
      </div>
    );
  }

  const age = ageFrom(member.dateOfBirth);
  const warning = ageWarning(member.dateOfBirth, ranks.find((r) => r.id === member.rank?.id));
  const canEditProgress = ["active", "pending", "rejected"].includes(member.status);

  return (
    <div className="space-y-6">
      <Link to="/chapter/members" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary">
        <LuArrowLeft size={14} /> Members
      </Link>

      <header className="flex flex-col gap-4 rounded-2xl border border-text-dark/5 bg-surface p-5 sm:flex-row sm:items-center">
        <MemberAvatar photo={member.photo} name={member.fullName} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-primary">
            {member.fullName} <MemberStatusBadge member={member} />
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {member.memberId ?? "No member ID yet"} · {member.rank?.name ?? "No rank"} · {member.chapter?.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <LuPencil size={14} /> Edit details
          </Button>
          {member.status === "active" && (
              <Button variant="outline" onClick={() => setTransferOpen(true)}>
                <LuShuffle size={14} /> Transfer
              </Button>
          )}
        </div>
      </header>

      {member.reviewNote && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">{member.status === "rejected" ? "Reason for rejection" : "Changes requested"}</p>
          <p className="mt-1">{member.reviewNote}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-text-dark/5 bg-surface p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-primary">Details</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <Detail label="Date of birth" value={member.dateOfBirth ? formatDate(member.dateOfBirth) : null} />
            <Detail label="Age" value={age} />
            <Detail label="Phone" value={member.phone} />
            <Detail label="Church" value={member.church?.name} />
            <Detail label="Parent / guardian" value={member.guardianName} />
            <Detail label="Guardian phone" value={member.guardianPhone} />
            <Detail label="Added" value={formatDate(member.createdAt)} />
            <Detail label="Approved" value={member.approvedAt ? formatDate(member.approvedAt) : null} />
          </dl>
          {warning && <p className="mt-4 text-xs text-amber-700">{warning}</p>}
        </section>

        <section className="rounded-2xl border border-text-dark/5 bg-surface p-5 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-primary">Rank progress</h2>
            {canEditProgress && (
              <Button size="sm" variant="outline" onClick={() => setProgressOpen(true)} disabled={ranks.length === 0}>
                <LuTrendingUp size={14} /> Update progress
              </Button>
            )}
          </div>
          {ranks.length === 0 ? (
            <Spinner />
          ) : (
            <RankProgressLine ranks={ranks} history={member.rankHistory} currentRankId={member.rank?.id} />
          )}
        </section>
      </div>

      <MemberEditDialog member={editOpen ? member : null} onClose={() => setEditOpen(false)} />
      <RankProgressDialog member={member} ranks={ranks} open={progressOpen} onClose={() => setProgressOpen(false)} />
      <TransferDialog member={member} open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}
