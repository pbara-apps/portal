import { useState } from "react";
import { LuAward, LuFileText } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import { adminFilterBarCx, adminPageCx } from "@/features/admin/components/shared/adminLayout";
import { useAdminAchievements } from "@/lib/api/chapter-admin";
import { useGetChapters } from "@/lib/api/church";
import { monthYear } from "@/types/achievement";

/** Every chapter's achievements (read only). Chapters add them from their portal. */
export default function AchievementsAdminPage() {
  const [churchId, setChurchId] = useState("all");
  const [year, setYear] = useState("all");
  const { data: churches = [] } = useGetChapters();
  const { data: achievements = [], isLoading } = useAdminAchievements({
    churchId: churchId === "all" ? undefined : churchId,
    year: year === "all" ? undefined : Number(year),
  });
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => String(thisYear - i));

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Achievements"
        description="What chapters have accomplished, added by chapter officers from their portal."
        stats={<Badge className="bg-primary/10 text-primary">{achievements.length} shown</Badge>}
      />
      <section className={adminFilterBarCx}>
        <Select value={churchId} onValueChange={setChurchId}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Church"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All churches</SelectItem>
            {churches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-full sm:w-36" aria-label="Year"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : achievements.length === 0 ? (
        <p className="rounded-2xl border border-text-dark/5 bg-surface py-16 text-center text-sm text-text-muted">No achievements found.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map((a) => (
            <li key={a.id} className="flex gap-4 rounded-2xl border border-text-dark/5 bg-surface p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold"><LuAward size={18} /></div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">{a.name}</p>
                <p className="text-xs text-text-muted">{a.chapter?.name} · {a.church?.name}</p>
                <p className="text-xs text-text-muted">{monthYear(a.month, a.year)}</p>
                {a.description && <p className="mt-2 text-sm">{a.description}</p>}
                <a href={a.proofUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline">
                  <LuFileText size={12} /> View proof
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
