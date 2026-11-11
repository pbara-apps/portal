import { Skeleton } from "@heroui/react";
import { type ReactNode, useState } from "react";
import { LuIdCard, LuPencil, LuShuffle, LuTrendingUp } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { useRetained } from "@/hooks/useRetained";
import { downloadMembershipCard } from "@/lib/members/membership-card";
import { cn } from "@/lib/utils";
import { useMemberAttendance } from "../api/engagement";
import { useMember, useRanks } from "../api/members";
import { ageFrom, ageWarning, canEditMember, formatDate, MEMBER_PLACEHOLDER_PHOTO } from "../lib/member-utils";
import type { PortalMember, PortalRank } from "../types";
import { MemberEditDrawer } from "./MemberEditDrawer";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { RankProgressDrawer } from "./RankProgressDrawer";
import { RankProgressLine } from "./RankProgressLine";
import { TransferDrawer } from "./TransferDrawer";

type Action = "edit" | "progress" | "transfer" | null;
type Attendance = { held: number; attended: number; rate: number | null };
type Tone = "good" | "bad" | "neutral";

/**
 * One member, chapter view: profile card, membership, record checklist and
 * rank progress. Edit, rank progress and transfer open in their own drawer on top.
 */
export function ChapterMemberDrawer({ memberId, onClose }: { memberId: string | null; onClose: () => void }) {
  // Keep showing the member while the drawer slides closed.
  const shownId = useRetained(memberId) ?? undefined;
  const { data: member, isLoading, isError } = useMember(shownId);
  const { data: attendance } = useMemberAttendance(shownId);
  const { data: ranks = [] } = useRanks();
  const [action, setAction] = useState<Action>(null);

  const closeAction = () => setAction(null);

  return (
    <>
      <Sheet open={!!memberId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent size="2xl" aria-label={member ? undefined : "Member"}>
          {isLoading ? (
            <LoadingState />
          ) : isError || !member ? (
            <>
              <SheetHeader>
                <SheetTitle>Member not found</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <p className="text-sm text-text-muted">This member may have been removed or moved to another chapter.</p>
              </SheetBody>
            </>
          ) : (
            <MemberProfile member={member} ranks={ranks} attendance={attendance} onAction={setAction} />
          )}
        </SheetContent>
      </Sheet>

      {member ? (
        <>
          <MemberEditDrawer member={member} open={action === "edit"} onClose={closeAction} />
          <RankProgressDrawer member={member} ranks={ranks} open={action === "progress"} onClose={closeAction} />
          <TransferDrawer member={member} open={action === "transfer"} onClose={closeAction} />
        </>
      ) : null}
    </>
  );
}

function LoadingState() {
  return (
    <div className="h-full space-y-5 bg-background p-5 pt-16 sm:p-6 sm:pt-16 lg:p-8 lg:pt-16" aria-busy="true" aria-label="Loading member">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Skeleton className="h-[26rem] rounded-2xl" />
        <div className="space-y-5">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      </div>
      <Skeleton className="h-44 rounded-2xl" />
    </div>
  );
}

function MemberProfile({
  member,
  ranks,
  attendance,
  onAction,
}: {
  member: PortalMember;
  ranks: PortalRank[];
  attendance?: Attendance;
  onAction: (action: Action) => void;
}) {
  const canEdit = canEditMember(member);
  const isActive = member.status === "active";
  const age = ageFrom(member.dateOfBirth);
  const warning = ageWarning(member.dateOfBirth, ranks.find((r) => r.id === member.rank?.id));
  const rankIndex = ranks.findIndex((r) => r.id === member.rank?.id);
  const hasMeetings = !!attendance && attendance.held > 0;
  const hasGuardian = Boolean(member.guardianName && member.guardianPhone);

  return (
    <SheetBody className="space-y-5 bg-background">
      {/* Sits beside the close button. */}
      <p className="flex h-8 items-center text-sm text-text-muted">
        Members <span className="mx-2 text-text-muted/50">/</span>
        <span className="truncate font-medium text-text-dark">{member.fullName}</span>
      </p>

      {member.reviewNote ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-medium">{member.status === "rejected" ? "Reason for rejection" : "Changes requested"}</p>
          <p className="mt-0.5 leading-relaxed">{member.reviewNote}</p>
        </div>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Profile */}
        <Card className="p-5 sm:p-6">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-mist">
            <img
              src={member.photo || MEMBER_PLACEHOLDER_PHOTO}
              alt={member.photo ? member.fullName : "No photo — association logo"}
              className={member.photo ? "size-full object-cover" : "size-28 object-contain opacity-90"}
            />
          </div>

          <div className="mt-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="break-words text-lg font-semibold tracking-tight text-text-dark">{member.fullName}</SheetTitle>
              <p className="mt-0.5 font-mono text-xs text-text-muted">{member.memberId ?? "ID pending"}</p>
            </div>
            <div className="shrink-0 text-right text-[11px] leading-relaxed text-text-muted">
              <p>Added {formatDate(member.createdAt)}</p>
              {member.submittedBy ? <p className="max-w-[9rem] truncate">by {member.submittedBy.name}</p> : null}
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-5">
            <Field label="Phone">{member.phone}</Field>
            <Field label="Date of birth">{member.dateOfBirth ? formatDate(member.dateOfBirth) : null}</Field>
            <Field label="Parent / guardian">{member.guardianName}</Field>
            <Field label="Guardian phone">{member.guardianPhone}</Field>
          </dl>

          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-sm text-text-muted">Membership status</span>
            <MemberStatusBadge member={member} />
          </div>

          {canEdit ? (
            <div className="mt-6 flex justify-center">
              <Button type="button" className="min-w-40 rounded-full" onClick={() => onAction("edit")}>
                <LuPencil size={14} aria-hidden />
                Edit details
              </Button>
            </div>
          ) : null}
        </Card>

        <div className="space-y-5">
          {/* Membership */}
          <Card>
            <CardHeader
              title="Membership"
              action={
                isActive ? (
                  <PillButton onClick={() => downloadMembershipCard(member)}>
                    <LuIdCard size={13} aria-hidden /> Membership card
                  </PillButton>
                ) : null
              }
            />
            <ul className="divide-y divide-line">
              <Row
                label="Chapter"
                detail={member.chapter?.name ?? "—"}
                end={isActive ? <PillButton onClick={() => onAction("transfer")}><LuShuffle size={13} aria-hidden /> Transfer</PillButton> : null}
              />
              <Row label="Church" detail={member.church?.name ?? "—"} />
              <Row
                label="Current rank"
                detail={member.rank?.name ?? "No rank"}
                end={rankIndex >= 0 ? <Pill tone="neutral">{rankIndex + 1} of {ranks.length}</Pill> : null}
              />
              <Row
                label="Member since"
                detail={member.approvedAt ? formatDate(member.approvedAt) : "Not approved yet"}
              />
            </ul>
          </Card>

          {/* Record checklist */}
          <Card>
            <CardHeader title="Records" />
            <ul className="divide-y divide-line">
              <CheckRow
                label="Approval"
                tone={isActive ? "good" : member.status === "rejected" ? "bad" : "neutral"}
                status={isActive ? "Approved" : member.status === "rejected" ? "Rejected" : member.status === "pending" ? "Pending" : "Not active"}
              />
              <CheckRow
                label="Date of birth"
                tone={member.dateOfBirth ? "good" : "bad"}
                status={member.dateOfBirth ? (age != null ? `${age} years` : "Recorded") : "Missing"}
              />
              <CheckRow label="Guardian contact" tone={hasGuardian ? "good" : "bad"} status={hasGuardian ? "Recorded" : "Missing"} />
              <CheckRow label="Photo" tone={member.photo ? "good" : "bad"} status={member.photo ? "Uploaded" : "Missing"} />
              <CheckRow
                label="Meeting attendance"
                tone={!isActive || !hasMeetings ? "neutral" : (attendance.rate ?? 0) >= 50 ? "good" : "bad"}
                status={isActive && hasMeetings ? `${attendance.rate ?? 0}%` : "No meetings"}
                hint={isActive && hasMeetings ? `${attendance.attended} of ${attendance.held} meetings` : undefined}
              />
            </ul>
          </Card>
        </div>
      </div>

      {/* Rank progress, full width */}
      <Card>
        <CardHeader
          title="Rank progress"
          subtitle={rankIndex >= 0 ? `${rankIndex} of ${ranks.length} ranks completed` : "No rank set"}
          action={
            canEdit ? (
              <PillButton onClick={() => onAction("progress")} disabled={ranks.length === 0}>
                <LuTrendingUp size={13} aria-hidden /> Update progress
              </PillButton>
            ) : null
          }
        />
        <div className="px-4 py-6 sm:px-6">
          {ranks.length === 0 ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <RankProgressLine ranks={ranks} history={member.rankHistory} currentRankId={member.rank?.id} />
          )}
          {warning ? <p className="mt-4 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">{warning}</p> : null}
        </div>
      </Card>
    </SheetBody>
  );
}

// ─── Building blocks ───────────────────────────────────────────────────────

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-surface shadow-[0_1px_2px_rgba(5,6,31,0.04),0_12px_32px_-16px_rgba(5,6,31,0.14)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-text-dark">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Underlined value with a small label, as in the profile card. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  const empty = children == null || children === "";
  return (
    <div className="min-w-0 border-b border-line py-3">
      <dt className="text-[11px] text-text-muted">{label}</dt>
      <dd className={cn("mt-1 truncate text-sm", empty ? "text-text-muted/60" : "text-text-dark")}>
        {empty ? "Not provided" : children}
      </dd>
    </div>
  );
}

function Row({ label, detail, end }: { label: string; detail: string; end?: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
      <div className="min-w-0">
        <p className="text-sm text-text-dark">{label}</p>
        <p className="mt-0.5 truncate text-xs text-text-muted">{detail}</p>
      </div>
      {end}
    </li>
  );
}

const DOT: Record<Tone, string> = {
  good: "bg-success",
  bad: "bg-danger",
  neutral: "bg-text-dark/20",
};

function CheckRow({ label, tone, status, hint }: { label: string; tone: Tone; status: string; hint?: string }) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", DOT[tone])} />
        <div className="min-w-0">
          <p className="text-sm text-text-dark">{label}</p>
          {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
        </div>
      </div>
      <Pill tone={tone}>{status}</Pill>
    </li>
  );
}

const PILL: Record<Tone, string> = {
  good: "bg-success/10 text-success",
  bad: "bg-danger/10 text-danger",
  neutral: "bg-mist text-text-muted",
};

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-medium", PILL[tone])}>{children}</span>
  );
}

function PillButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-xs font-medium text-text-dark transition-colors hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}
