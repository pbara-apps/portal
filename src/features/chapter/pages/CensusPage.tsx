import { useMemo, useState } from "react";
import { LuClipboardCheck } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { useCensus, useSubmitCensus } from "../api/engagement";
import { useChapterMembers } from "../api/members";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { MemberAvatar } from "../components/MemberAvatar";
import { formatDate } from "../lib/member-utils";
import { useChapterSession, useWorkingChapter } from "../store/useChapterSession";

/**
 * Annual census: confirm which members are still active this year.
 * Untick anyone who has left and give a short reason; they're set
 * inactive when you submit. One census per chapter per year.
 */
export default function CensusPage() {
  const year = new Date().getFullYear();
  const isCounsellor = useChapterSession((s) => s.profile?.role === "counsellor");
  const { chapterId, chapterName } = useWorkingChapter();
  const { data: census, isLoading } = useCensus(chapterId, year);
  const { data: members = [], isLoading: loadingMembers } = useChapterMembers({ chapterId, view: "active" });
  const submit = useSubmitCensus();
  const [leaving, setLeaving] = useState<Record<string, string>>({}); // memberId → reason

  const leavingIds = useMemo(() => Object.keys(leaving), [leaving]);

  const toggle = (id: string, stillActive: boolean) =>
    setLeaving((prev) => {
      const next = { ...prev };
      if (stillActive) delete next[id];
      else next[id] = "";
      return next;
    });

  const handleSubmit = async () => {
    const missingReason = leavingIds.some((id) => leaving[id].trim().length < 3);
    if (missingReason) return errorToast("Give a short reason for each member who is no longer active.", "Reasons needed");
    try {
      await submit.mutateAsync({
        chapterId,
        year,
        removed: leavingIds.map((memberId) => ({ memberId, reason: leaving[memberId].trim() })),
      });
      successToast(`${year} census submitted.`);
      setLeaving({});
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to submit.", "Error");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">{year} Census</h1>
          <p className="mt-1 text-sm text-text-muted">Confirm who is still an active member of {chapterName}.</p>
        </div>
        {isCounsellor && <ChapterSwitcher allowAll={false} />}
      </header>

      {isLoading || loadingMembers ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : census ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 py-12 text-center">
          <LuClipboardCheck size={22} className="text-emerald-700" />
          <p className="text-sm font-semibold text-emerald-900">The {year} census was submitted on {formatDate(census.createdAt)}.</p>
          <p className="text-xs text-emerald-800">
            {census.confirmedCount} confirmed active · {census.removed.length} set inactive
          </p>
        </div>
      ) : (
        <>
          <p className="rounded-xl border border-text-dark/5 bg-surface p-4 text-sm text-text-muted">
            Everyone is ticked as still active. Untick anyone who has left, moved away or stopped attending, and
            give a short reason. ({members.length - leavingIds.length} of {members.length} will be confirmed.)
          </p>
          <ul className="divide-y divide-text-dark/5 rounded-2xl border border-text-dark/5 bg-surface">
            {members.map((m) => {
              const isLeaving = m.id in leaving;
              return (
                <li key={m.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <Checkbox checked={!isLeaving} onCheckedChange={(v) => toggle(m.id, v === true)} />
                    <MemberAvatar photo={m.photo} name={m.fullName} size={32} />
                    <span className="text-sm">
                      {m.fullName} <span className="text-xs text-text-muted">{m.memberId}</span>
                    </span>
                  </label>
                  {isLeaving && (
                    <Input
                      placeholder="Reason, e.g. relocated"
                      value={leaving[m.id]}
                      onChange={(e) => setLeaving((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      className="sm:w-72"
                    />
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} loading={submit.isPending} disabled={members.length === 0} className="bg-primary text-white">
              Submit {year} census
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
