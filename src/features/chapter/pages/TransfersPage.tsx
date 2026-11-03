import { LuArrowRight, LuShuffle } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useTransfers } from "../api/transfers";
import { MemberAvatar } from "../components/MemberAvatar";
import { formatDate } from "../lib/member-utils";

const STATUS = {
  pending: <Badge className="bg-sky-100 text-sky-800">Awaiting approval</Badge>,
  approved: <Badge variant="success">Approved</Badge>,
  rejected: <Badge variant="destructive">Not approved</Badge>,
};

/**
 * Transfers in and out of the user's chapters. To start one, open a
 * member and choose "Transfer".
 */
export default function TransfersPage() {
  const { data: transfers = [], isLoading } = useTransfers();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Transfers</h1>
        <p className="mt-1 text-sm text-text-muted">To move a member, open them from Members and choose "Transfer".</p>
      </header>
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : transfers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-text-dark/5 bg-surface py-16 text-center">
          <LuShuffle size={20} className="text-primary" />
          <p className="text-sm text-text-muted">No transfers yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {transfers.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 rounded-2xl border border-text-dark/5 bg-surface p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <MemberAvatar photo={t.member?.photo} name={t.member?.fullName ?? ""} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">{t.member?.fullName}</p>
                  <p className="flex flex-wrap items-center gap-1 text-xs text-text-muted">
                    {t.fromChapter?.name} <LuArrowRight size={12} /> {t.toChapter?.name}
                    {t.toChapter?.churchName ? ` (${t.toChapter.churchName})` : ""}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDate(t.createdAt)}
                    {t.reason ? ` · ${t.reason}` : ""}
                    {t.reviewNote ? ` · Reason: ${t.reviewNote}` : ""}
                  </p>
                </div>
              </div>
              {STATUS[t.status]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
