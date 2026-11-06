import { useEffect, useMemo, useState } from "react";
import { LuDownload, LuSearch, LuUsers } from "react-icons/lu";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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
import { errorToast } from "@/components/shared/toast-notification";
import { AdminMemberDialog } from "@/features/admin/components/members/AdminMemberDialog";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminPageCx,
  adminTableFooterCx,
  adminTableScrollCx,
  adminTableSectionCx,
} from "@/features/admin/components/shared/adminLayout";
import { MemberAvatar } from "@/features/chapter/components/MemberAvatar";
import { ageFrom, formatDate } from "@/features/chapter/lib/member-utils";
import type { PortalMember } from "@/features/chapter/types";
import useCurrentUser from "@/hooks/useCurrentUser";
import { type AdminMemberQuery, fetchAllMembers, useAdminChapters, useAdminMembers } from "@/lib/api/chapter-admin";
import { useGetChapters } from "@/lib/api/church";
import { useGetRanks } from "@/lib/api/rank";
import { canManageCounsellors } from "@/types/user";

const PAGE_SIZE = 25;
type StatusFilter = NonNullable<AdminMemberQuery["status"]>;

/** Builds and downloads an Excel file of the given members. */
function exportMembers(members: PortalMember[]) {
  const rows = members.map((m) => ({
    "Member ID": m.memberId ?? "",
    "Full Name": m.fullName,
    Type: m.memberType === "counsellor" ? "Counsellor" : "Ambassador",
    Rank: m.rank?.name ?? "",
    Chapter: m.chapter?.name ?? "",
    Church: m.church?.name ?? "",
    "Date of Birth": m.dateOfBirth ? m.dateOfBirth.slice(0, 10) : "",
    Age: ageFrom(m.dateOfBirth) ?? "",
    Phone: m.phone ?? "",
    "Parent/Guardian Name": m.guardianName ?? "",
    "Parent/Guardian Phone": m.guardianPhone ?? "",
    "Approved On": m.approvedAt ? m.approvedAt.slice(0, 10) : "",
    Status: m.status,
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = Object.keys(rows[0] ?? { a: 1 }).map(() => ({ wch: 20 }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Members");
  XLSX.writeFile(book, `pbara-members-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Members — the association's record of every member across all churches
 * and chapters. Filter, search, open a member, and export to Excel.
 */
export default function MembersPage() {
  const { user } = useCurrentUser();
  const canEdit = canManageCounsellors(user?.role);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [churchId, setChurchId] = useState("all");
  const [chapterId, setChapterId] = useState("all");
  const [rankId, setRankId] = useState("all");
  const [memberType, setMemberType] = useState<"all" | "ambassador" | "counsellor">("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Wait until typing pauses before searching the server.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced, churchId, chapterId, rankId, status, memberType]);

  const { data: churches = [] } = useGetChapters();
  const { data: chapters = [] } = useAdminChapters();
  const { data: ranks = [] } = useGetRanks();
  const chapterOptions = useMemo(
    () => chapters.filter((c) => churchId === "all" || c.church?.id === churchId),
    [chapters, churchId],
  );

  const filters: AdminMemberQuery = {
    search: debounced || undefined,
    churchId: churchId === "all" ? undefined : churchId,
    chapterId: chapterId === "all" ? undefined : chapterId,
    rankId: rankId === "all" ? undefined : rankId,
    status,
    memberType: memberType === "all" ? undefined : memberType,
  };
  const { data, isLoading, isError, refetch } = useAdminMembers({ ...filters, page, limit: PAGE_SIZE });
  const members = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleExport = async () => {
    setExporting(true);
    try {
      const all = await fetchAllMembers(filters);
      if (all.length === 0) return errorToast("No members to export.", "Export");
      exportMembers(all);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Export failed.", "Export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Members"
        description="Every approved member of the association (ambassadors and church counsellors), across all churches and chapters."
        stats={<Badge className="bg-primary/10 text-primary">{total} {status} member{total === 1 ? "" : "s"}</Badge>}
      />

      <section className={adminFilterBarCx}>
        <Input
          placeholder="Search name or member ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<LuSearch size={16} />}
          className="w-full sm:max-w-xs"
        />
        <Select value={churchId} onValueChange={(v) => { setChurchId(v); setChapterId("all"); }}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Church"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All churches</SelectItem>
            {churches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={chapterId} onValueChange={setChapterId}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Chapter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All chapters</SelectItem>
            {chapterOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={rankId} onValueChange={setRankId}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Rank"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ranks</SelectItem>
            {ranks.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={memberType} onValueChange={(v) => setMemberType(v as typeof memberType)}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Member type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            <SelectItem value="ambassador">Ambassadors</SelectItem>
            <SelectItem value="counsellor">Counsellors</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-36" aria-label="Status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="transferred">Transferred</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport} loading={exporting} className="sm:ml-auto">
          {!exporting && <LuDownload size={16} />} Export Excel
        </Button>
      </section>

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner label="Loading members…" /></div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm text-rose-600">Unable to load members.</p>
            <Button size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <>
            <div className={adminTableScrollCx}>
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>MEMBER</TableHead>
                    <TableHead>RANK</TableHead>
                    <TableHead>CHAPTER</TableHead>
                    <TableHead>CHURCH</TableHead>
                    <TableHead>AGE</TableHead>
                    <TableHead>APPROVED</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex flex-col items-center gap-2 py-14 text-center">
                          <LuUsers size={20} className="text-primary" />
                          <p className="text-sm text-text-muted">No members match these filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id} className="cursor-pointer hover:bg-background/60" onClick={() => setOpenId(m.id)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <MemberAvatar photo={m.photo} name={m.fullName} size={34} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-primary">{m.fullName}</p>
                              <p className="text-xs text-text-muted">{m.memberId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.memberType === "counsellor" ? (
                            <Badge className="bg-gold/15 text-[#8a6d1d]">Counsellor</Badge>
                          ) : (
                            m.rank?.name ?? "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.chapter?.name ?? (m.memberType === "counsellor" ? "Whole church" : "—")}
                        </TableCell>
                        <TableCell className="text-sm">{m.church?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{ageFrom(m.dateOfBirth) ?? "—"}</TableCell>
                        <TableCell className="text-sm text-text-muted">{m.approvedAt ? formatDate(m.approvedAt) : "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className={adminTableFooterCx}>
              <p className="text-xs text-text-muted">{total} member{total === 1 ? "" : "s"}</p>
              <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>

      <AdminMemberDialog memberId={openId} canEdit={canEdit} onClose={() => setOpenId(null)} />
    </div>
  );
}
