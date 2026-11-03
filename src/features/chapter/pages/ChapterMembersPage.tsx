import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LuDownload, LuSearch, LuTrash2, LuUserPlus, LuUsers } from "react-icons/lu";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { ConfirmDialog } from "@/features/admin/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { type MemberView, useChapterMembers, useRanks, useWithdrawMember } from "../api/members";
import { ChapterSwitcher } from "../components/ChapterSwitcher";
import { MemberAvatar } from "../components/MemberAvatar";
import { MemberStatusBadge } from "../components/MemberStatusBadge";
import { ageFrom } from "../lib/member-utils";
import { useActiveChapterId } from "../store/useChapterSession";
import type { PortalMember } from "../types";

/** Downloads the members currently shown as an Excel file. */
function exportRoster(members: PortalMember[]) {
  const rows = members.map((m) => ({
    "Member ID": m.memberId ?? "Pending",
    "Full Name": m.fullName,
    Rank: m.rank?.name ?? "",
    Chapter: m.chapter?.name ?? "",
    "Date of Birth": m.dateOfBirth ? m.dateOfBirth.slice(0, 10) : "",
    Age: ageFrom(m.dateOfBirth) ?? "",
    Phone: m.phone ?? "",
    "Parent/Guardian Name": m.guardianName ?? "",
    "Parent/Guardian Phone": m.guardianPhone ?? "",
    Status: m.status,
  }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "Members");
  XLSX.writeFile(book, `chapter-members-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

const TABS: { view: MemberView; label: string }[] = [
  { view: "active", label: "Members" },
  { view: "awaiting", label: "Awaiting approval" },
];

/**
 * Chapter members.
 * - "Members" tab: approved (active) ambassadors.
 * - "Awaiting approval" tab: members added by the chapter that the
 *   association hasn't approved yet, plus rejected ones (with the reason).
 * Click a row to open the member (details, edit, rank progress).
 * Unapproved members can be withdrawn.
 */
export default function ChapterMembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: MemberView = searchParams.get("view") === "awaiting" ? "awaiting" : "active";
  const chapterId = useActiveChapterId();
  const [search, setSearch] = useState("");
  const [rankId, setRankId] = useState<string>("all");
  const navigate = useNavigate();
  const [withdrawTarget, setWithdrawTarget] = useState<PortalMember | null>(null);

  const { data: ranks = [] } = useRanks();
  const { data: members = [], isLoading, isError, refetch } = useChapterMembers({
    chapterId,
    view,
    search: search.trim() || undefined,
    rankId: rankId === "all" ? undefined : rankId,
  });
  const withdraw = useWithdrawMember();
  const showChapterColumn = !chapterId;

  const handleWithdraw = async () => {
    if (!withdrawTarget) return;
    try {
      await withdraw.mutateAsync(withdrawTarget.id);
      successToast(`${withdrawTarget.fullName} removed.`);
      setWithdrawTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to remove.", "Error");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary lg:text-3xl">Members</h1>
          <p className="mt-1 text-sm text-text-muted">
            New members count once the association approves them.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ChapterSwitcher />
          <Button variant="outline" onClick={() => exportRoster(members)} disabled={members.length === 0}>
            <LuDownload size={16} /> Export
          </Button>
          <Button asChild className="bg-primary text-white">
            <Link to="/chapter/members/add"><LuUserPlus size={16} /> Add Members</Link>
          </Button>
        </div>
      </header>

      <div className="flex gap-1 rounded-xl bg-surface p-1 ring-1 ring-text-dark/5 sm:w-fit" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.view}
            type="button"
            role="tab"
            aria-selected={view === tab.view}
            onClick={() => setSearchParams(tab.view === "active" ? {} : { view: tab.view })}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
              view === tab.view ? "bg-primary text-white" : "text-text-muted hover:text-primary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-text-dark/5 bg-surface p-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name or member ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<LuSearch size={16} />}
          className="w-full sm:max-w-md"
        />
        <Select value={rankId} onValueChange={setRankId}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by rank"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ranks</SelectItem>
            {ranks.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-text-muted sm:ml-auto">{members.length} shown</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-text-dark/5 bg-surface">
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner label="Loading members…" /></div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm text-rose-600">Unable to load members.</p>
            <Button size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.06] text-primary">
              <LuUsers size={20} />
            </div>
            <p className="text-sm font-semibold">
              {view === "active" ? "No approved members yet" : "Nothing awaiting approval"}
            </p>
            <Button asChild size="sm" className="bg-primary text-white">
              <Link to="/chapter/members/add"><LuUserPlus size={14} /> Add Members</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>MEMBER</TableHead>
                  <TableHead>RANK</TableHead>
                  {showChapterColumn && <TableHead>CHAPTER</TableHead>}
                  <TableHead>AGE</TableHead>
                  <TableHead>STATUS</TableHead>
                  {view === "awaiting" && <TableHead className="text-right">ACTIONS</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-background/60" onClick={() => navigate(`/chapter/members/${m.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <MemberAvatar photo={m.photo} name={m.fullName} size={36} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">{m.fullName}</p>
                          <p className="text-xs text-text-muted">{m.memberId ?? "No ID yet"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{m.rank?.name ?? "—"}</TableCell>
                    {showChapterColumn && <TableCell className="text-sm">{m.chapter?.name ?? "—"}</TableCell>}
                    <TableCell className="text-sm">{ageFrom(m.dateOfBirth) ?? "—"}</TableCell>
                    <TableCell>
                      <MemberStatusBadge member={m} />
                      {m.reviewNote && view === "awaiting" && (
                        <p className="mt-1 line-clamp-1 max-w-[16rem] text-xs text-text-muted">{m.reviewNote}</p>
                      )}
                    </TableCell>
                    {view === "awaiting" && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-rose-600"
                            aria-label={`Remove ${m.fullName}`}
                            onClick={() => setWithdrawTarget(m)}
                          >
                            <LuTrash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>


      <ConfirmDialog
        isOpen={!!withdrawTarget}
        title="Remove member"
        message={`Remove ${withdrawTarget?.fullName ?? "this member"}? They haven't been approved, so nothing else is affected.`}
        loading={withdraw.isPending}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}
