import { useEffect, useMemo, useState } from "react";
import { LuDownload, LuUserPlus, LuUsers } from "react-icons/lu";
import * as XLSX from "xlsx";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { errorToast } from "@/components/shared/toast-notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminAddMembersDrawer } from "@/features/admin/components/members/AdminAddMembersDrawer";
import { AdminMemberDrawer } from "@/features/admin/components/members/AdminMemberDrawer";
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
type MemberType = "all" | "ambassador" | "counsellor";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "transferred", label: "Transferred" },
];

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

function MemberName({ member }: { member: PortalMember }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <MemberAvatar photo={member.photo} name={member.fullName} size={34} />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{member.fullName}</p>
        <p className="truncate text-xs text-muted">{member.memberId ?? "No member ID"}</p>
      </div>
    </div>
  );
}

const rankCell = (m: PortalMember) =>
  m.memberType === "counsellor" ? <Badge variant="warning">Counsellor</Badge> : (m.rank?.name ?? "—");

const COLUMNS: DataTableColumn<PortalMember>[] = [
  { id: "name", header: "Member", isRowHeader: true, cell: (m) => <MemberName member={m} /> },
  { id: "rank", header: "Rank", cell: rankCell },
  {
    id: "chapter",
    header: "Chapter",
    cell: (m) => m.chapter?.name ?? (m.memberType === "counsellor" ? "Whole church" : "—"),
  },
  { id: "church", header: "Church", hideBelow: "lg", cell: (m) => m.church?.name ?? "—" },
  { id: "age", header: "Age", align: "end", className: "w-16", cell: (m) => <span className="tabular-nums">{ageFrom(m.dateOfBirth) ?? "—"}</span> },
  {
    id: "approved",
    header: "Approved",
    hideBelow: "xl",
    cell: (m) => <span className="text-muted">{m.approvedAt ? formatDate(m.approvedAt) : "—"}</span>,
  },
];

/**
 * Members: the association's record of every member across all churches
 * and chapters. Filter, search, open a member, and export to Excel.
 * Paging and filtering happen on the server.
 */
export default function MembersPage() {
  const canEdit = canManageCounsellors(useCurrentUser((s) => s.user)?.role);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [churchId, setChurchId] = useState("all");
  const [chapterId, setChapterId] = useState("all");
  const [rankId, setRankId] = useState("all");
  const [memberType, setMemberType] = useState<MemberType>("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Wait until typing pauses before searching the server.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  // Any filter change goes back to page 1.
  const filterKey = [debounced, churchId, chapterId, rankId, status, memberType].join("|");
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

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
  const filtering = Boolean(debounced) || churchId !== "all" || chapterId !== "all" || rankId !== "all" || memberType !== "all";

  const clearFilters = () => {
    setSearch("");
    setChurchId("all");
    setChapterId("all");
    setRankId("all");
    setMemberType("all");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const all = await fetchAllMembers(filters);
      if (all.length === 0) return errorToast("No members to export with these filters.", "Export");
      exportMembers(all);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Export failed.", "Export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Members"
        description="Every approved member of the association (ambassadors and church counsellors), across all churches and chapters."
        actions={
          <>
            <Button type="button" variant="outline" onClick={handleExport} loading={exporting}>
              {!exporting ? <LuDownload size={16} aria-hidden /> : null}
              Export to Excel
            </Button>
            {canEdit ? (
              <Button
                type="button"
                className="bg-primary text-white"
                onClick={() => setAdding(true)}
              >
                <LuUserPlus size={16} aria-hidden />
                Add members
              </Button>
            ) : null}
          </>
        }
      />

      <ViewTabs aria-label="Member status" tabs={STATUS_TABS} value={status} onChange={setStatus} />

      <div className="space-y-3">
        <TableToolbar
          search={{ value: search, onChange: setSearch, placeholder: "Search name or member ID…" }}
          filters={
            <>
              <Select
                value={churchId}
                onValueChange={(v) => {
                  setChurchId(v);
                  setChapterId("all");
                }}
              >
                <SelectTrigger aria-label="Church">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All churches</SelectItem>
                  {churches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={chapterId} onValueChange={setChapterId}>
                <SelectTrigger aria-label="Chapter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All chapters</SelectItem>
                  {chapterOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={rankId} onValueChange={setRankId}>
                <SelectTrigger aria-label="Rank">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ranks</SelectItem>
                  {ranks.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={memberType} onValueChange={(v) => setMemberType(v as MemberType)}>
                <SelectTrigger aria-label="Member type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  <SelectItem value="ambassador">Ambassadors</SelectItem>
                  <SelectItem value="counsellor">Counsellors</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />

        <DataTable
          aria-label={`${status} members`}
          columns={COLUMNS}
          rows={members}
          getRowId={(m) => m.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load members."
          onRetry={() => refetch()}
          onRowAction={(m) => setOpenId(m.id)}
          renderCard={(m) => (
            <div className="space-y-1.5">
              <MemberName member={m} />
              <p className="pl-[46px] text-xs text-muted">
                {[m.memberType === "counsellor" ? "Counsellor" : m.rank?.name, m.chapter?.name, m.church?.name]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          )}
          emptyState={
            <EmptyState
              icon={LuUsers}
              title={filtering ? "No members match these filters" : `No ${status} members`}
              action={
                filtering ? (
                  <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          }
          summary={`${total.toLocaleString()} ${status} member${total === 1 ? "" : "s"}`}
          pagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), onPageChange: setPage }}
          skeletonRows={8}
          minWidth={820}
        />
      </div>

      <AdminMemberDrawer memberId={openId} canEdit={canEdit} onClose={() => setOpenId(null)} />
      {canEdit ? (
        <AdminAddMembersDrawer
          open={adding}
          defaultChapterId={chapterId === "all" ? undefined : chapterId}
          onClose={() => setAdding(false)}
        />
      ) : null}
    </div>
  );
}
