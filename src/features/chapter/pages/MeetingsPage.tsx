import { useEffect, useState } from "react";
import { LuCalendarCheck, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { useRetained } from "@/hooks/useRetained";
import { type Meeting, useDeleteMeeting, useMeetings, useSaveMeeting } from "../api/engagement";
import { useChapterMembers } from "../api/members";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { MemberPicker } from "../components/MemberPicker";
import { formatDate } from "../lib/member-utils";
import { useActiveChapterId, useWorkingChapter } from "../store/useChapterSession";

/**
 * Chapter meetings: record each meeting or activity, who attended, and a
 * short report. Attendance feeds each member's attendance rate.
 */
export default function MeetingsPage() {
  const chapterId = useActiveChapterId();
  const { data: meetings = [], isLoading } = useMeetings(chapterId);
  const remove = useDeleteMeeting();
  const [editing, setEditing] = useState<Meeting | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      successToast("Meeting deleted.");
      setDeleteTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to delete.", "Error");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Meetings</h1>
          <p className="mt-1 text-sm text-text-muted">Attendance and a short report for each meeting or activity.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ChapterSwitcher />
          <Button onClick={() => setEditing("new")} className="bg-primary text-white"><LuPlus size={16} /> Record meeting</Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-text-dark/5 bg-surface py-16 text-center">
          <LuCalendarCheck size={20} className="text-primary" />
          <p className="text-sm text-text-muted">No meetings recorded yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {meetings.map((m) => {
            const pct = m.memberCount ? Math.round((m.present.length / m.memberCount) * 100) : 0;
            return (
              <li key={m.id} className="rounded-2xl border border-text-dark/5 bg-surface p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">{m.activity}</p>
                    <p className="text-xs text-text-muted">
                      {formatDate(m.date)}
                      {!chapterId && m.chapter ? ` · ${m.chapter.name}` : ""} · {m.present.length} of {m.memberCount} present ({pct}%)
                      {m.visitors ? ` · ${m.visitors} visitors` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(m)}><LuPencil size={14} /> Edit</Button>
                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(m)}><LuTrash2 size={14} /></Button>
                  </div>
                </div>
                {m.report && <p className="mt-2 whitespace-pre-line text-sm text-text-dark">{m.report}</p>}
              </li>
            );
          })}
        </ul>
      )}

      <MeetingDrawer editing={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete meeting"
        message={`Delete "${deleteTarget?.activity ?? ""}"? Its attendance will be removed too.`}
        loading={remove.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function MeetingDrawer({ editing, onClose }: { editing: Meeting | "new" | null; onClose: () => void }) {
  const working = useWorkingChapter();
  const shown = useRetained(editing);
  const chapterId = shown && shown !== "new" ? (shown.chapter?.id ?? working.chapterId) : working.chapterId;
  const { data: members = [] } = useChapterMembers({ chapterId, view: "active" }, Boolean(editing));
  const save = useSaveMeeting();
  const [date, setDate] = useState("");
  const [activity, setActivity] = useState("");
  const [report, setReport] = useState("");
  const [visitors, setVisitors] = useState("0");
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const m = editing === "new" ? null : editing;
    setDate(m ? m.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setActivity(m?.activity ?? "");
    setReport(m?.report ?? "");
    setVisitors(String(m?.visitors ?? 0));
    setPresent(new Set(m?.present ?? []));
    setShowErrors(false);
  }, [editing]);

  if (!shown) return null;

  const handleSave = async () => {
    setShowErrors(true);
    if (activity.trim().length < 3 || !date) return;
    try {
      await save.mutateAsync({
        id: shown === "new" ? undefined : shown.id,
        chapterId,
        body: { date, activity: activity.trim(), report: report.trim() || null, presentIds: [...present], visitors: Number(visitors) || 0 },
      });
      successToast("Meeting saved.");
      onClose();
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to save.", "Error");
    }
  };

  return (
    <FormDrawer
      open={editing !== null}
      size="lg"
      title={shown === "new" ? "Record meeting" : "Edit meeting"}
      description="Tick everyone who attended."
      onSubmit={handleSave}
      onCancel={onClose}
      submitting={save.isPending}
      submitLabel={shown === "new" ? "Save meeting" : "Save changes"}
      footerStart={<p className="text-sm text-muted">{present.size} of {members.length} present</p>}
    >
      <Input
        label="Meeting / activity"
        required
        placeholder="e.g. Weekly meeting — Bible study"
        value={activity}
        error={showErrors && activity.trim().length < 3 ? "Describe the meeting or activity" : undefined}
        onChange={(e) => setActivity(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          required
          value={date}
          error={showErrors && !date ? "Choose the date" : undefined}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input label="Visitors" type="number" min={0} value={visitors} onChange={(e) => setVisitors(e.target.value)} />
      </div>
      <Textarea label="Short report (optional)" rows={3} value={report} onChange={(e) => setReport(e.target.value)} />
      <div>
        <p className="mb-2 text-sm font-medium">Who attended?</p>
        <MemberPicker members={members} selected={present} onChange={setPresent} maxHeight="20rem" />
      </div>
    </FormDrawer>
  );
}
