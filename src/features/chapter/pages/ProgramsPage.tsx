import { Link } from "react-router-dom";
import { LuCalendar, LuClipboardList } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChapterRegistrations, useOpenPrograms } from "../api/registrations";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { formatDate } from "../lib/member-utils";
import { useActiveChapterId } from "../store/useChapterSession";

const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

const STATUS = {
  pending: <Badge className="bg-sky-100 text-sky-800">Payment being checked</Badge>,
  verified: <Badge variant="success">Confirmed</Badge>,
  rejected: <Badge variant="destructive">Rejected</Badge>,
};

const MEMBERSHIP_NOTE = {
  pending: <span className="text-sky-700">awaiting membership approval</span>,
  non_member: <span className="text-rose-700">not an approved member</span>,
};

/**
 * Programs open for registration, and the chapter's past registrations.
 * Registering picks members from the roster instead of typing names.
 */
export default function ProgramsPage() {
  const chapterId = useActiveChapterId();
  const { data: programs = [], isLoading } = useOpenPrograms();
  const { data: registrations = [], isLoading: loadingRegs } = useChapterRegistrations(chapterId);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Programs</h1>
          <p className="mt-1 text-sm text-text-muted">Register your members for association programs.</p>
        </div>
        <ChapterSwitcher />
      </header>

      <section>
        <h2 className="mb-3 text-base font-semibold text-primary">Open for registration</h2>
        {isLoading ? (
          <Spinner />
        ) : programs.length === 0 ? (
          <p className="rounded-2xl border border-text-dark/5 bg-surface p-6 text-sm text-text-muted">
            No programs are open for registration right now.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {programs.map((p) => (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-text-dark/5 bg-surface">
                {p.flyerImageUrl && <img src={p.flyerImageUrl} alt="" className="h-36 w-full object-cover" />}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-xs uppercase tracking-wider text-text-muted">{p.category}</p>
                  <p className="text-base font-semibold text-primary">{p.title}</p>
                  <p className="text-sm font-semibold">{naira(p.amount)} per person</p>
                  {p.registrationDeadline && (
                    <p className="flex items-center gap-1 text-xs text-text-muted">
                      <LuCalendar size={12} /> Closes {formatDate(p.registrationDeadline)}
                    </p>
                  )}
                  <Button asChild className="mt-auto bg-primary text-white">
                    <Link to={`/chapter/programs/${p.id}/register`}>Register members</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-primary">Our registrations</h2>
        {loadingRegs ? (
          <Spinner />
        ) : registrations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-text-dark/5 bg-surface py-12 text-center">
            <LuClipboardList size={20} className="text-primary" />
            <p className="text-sm text-text-muted">No registrations yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {registrations.map((r) => (
              <li key={r.id} className="rounded-2xl border border-text-dark/5 bg-surface p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">{r.program?.title ?? "Program"}</p>
                    <p className="text-xs text-text-muted">
                      {formatDate(r.createdAt)} · {r.entries.length} person{r.entries.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {STATUS[r.status]}
                </div>
                {r.adminNote && <p className="mt-2 text-xs text-text-muted">Note: {r.adminNote}</p>}
                <ul className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
                  {r.entries.map((e) => (
                    <li key={e.registrationCode} className="truncate">
                      <span className="font-mono text-text-muted">{e.registrationCode}</span> · {e.name}
                      {e.membership && e.membership !== "member" && <> · {MEMBERSHIP_NOTE[e.membership]}</>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
