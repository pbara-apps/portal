import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuBellRing } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import { adminFilterBarCx, adminPageCx } from "@/features/admin/components/shared/adminLayout";
import { formatDate } from "@/features/chapter/lib/member-utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetChapters } from "@/lib/api/church";
import { useCensusProgress, useCensusRemind, useMeetingReports } from "@/lib/api/engagement";
import { cn } from "@/lib/utils";
import { canWriteAdminContent } from "@/types/user";

type Tab = "meetings" | "census";

/**
 * Chapter activity: meeting reports from every chapter, and progress of
 * this year's census (which chapters have confirmed their members).
 */
export default function ActivityPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "census" ? "census" : "meetings";
  return (
    <div className={adminPageCx}>
      <AdminPageHeader title="Chapter Activity" description="Meeting reports and the yearly census of active members." />
      <div className="flex w-fit gap-1 rounded-xl bg-surface p-1 ring-1 ring-text-dark/5">
        {(["meetings", "census"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setParams(t === "meetings" ? {} : { tab: t })}
            className={cn("rounded-lg px-4 py-2 text-sm font-medium", tab === t ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
          >
            {t === "meetings" ? "Meeting reports" : `${new Date().getFullYear()} census`}
          </button>
        ))}
      </div>
      {tab === "meetings" ? <MeetingReports /> : <CensusProgress />}
    </div>
  );
}

function MeetingReports() {
  const [churchId, setChurchId] = useState("all");
  const { data: churches = [] } = useGetChapters();
  const { data: meetings = [], isLoading } = useMeetingReports(churchId === "all" ? undefined : churchId);

  return (
    <>
      <section className={adminFilterBarCx}>
        <Select value={churchId} onValueChange={setChurchId}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Church"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All churches</SelectItem>
            {churches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </section>
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : meetings.length === 0 ? (
        <p className="rounded-2xl border border-text-dark/5 bg-surface py-16 text-center text-sm text-text-muted">No meetings recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {meetings.map((m) => (
            <li key={m.id} className="rounded-2xl border border-text-dark/5 bg-surface p-4">
              <p className="text-sm font-semibold text-primary">{m.activity}</p>
              <p className="text-xs text-text-muted">
                {formatDate(m.date)} · {m.chapterName} · {m.churchName} · {m.attended} of {m.memberCount} present
                {m.visitors ? ` · ${m.visitors} visitors` : ""}
              </p>
              {m.report && <p className="mt-2 whitespace-pre-line text-sm">{m.report}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CensusProgress() {
  const { user } = useCurrentUser();
  const year = new Date().getFullYear();
  const { data: rows = [], isLoading } = useCensusProgress(year);
  const remind = useCensusRemind();
  const done = rows.filter((r) => r.done).length;

  const handleRemind = async () => {
    try {
      const result = (await remind.mutateAsync()) as { reminded: number };
      successToast(`Reminded ${result.reminded} chapter(s).`);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to send.", "Error");
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  return (
    <>
      <section className={adminFilterBarCx}>
        <Badge className="bg-primary/10 text-primary">{done} of {rows.length} chapters done</Badge>
        {canWriteAdminContent(user?.role) && done < rows.length && (
          <Button variant="outline" size="sm" onClick={handleRemind} loading={remind.isPending} className="sm:ml-auto">
            {!remind.isPending && <LuBellRing size={14} />} Remind chapters not done
          </Button>
        )}
      </section>
      <ul className="grid gap-3 md:grid-cols-2">
        {rows.map((r) => (
          <li key={r.chapterId} className="flex items-center justify-between gap-3 rounded-2xl border border-text-dark/5 bg-surface p-4">
            <div>
              <p className="text-sm font-semibold text-primary">{r.chapterName}</p>
              <p className="text-xs text-text-muted">{r.churchName}</p>
            </div>
            {r.done ? (
              <div className="text-right text-xs">
                <Badge variant="success">Done</Badge>
                <p className="mt-1 text-text-muted">{r.confirmedCount} confirmed · {r.removedCount} inactive</p>
                <p className="text-text-muted">{r.submittedAt ? formatDate(r.submittedAt) : ""}</p>
              </div>
            ) : (
              <Badge variant="outline">Not yet</Badge>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
