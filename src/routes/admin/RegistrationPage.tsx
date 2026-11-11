import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuClipboardCheck, LuEye, LuPlus } from "react-icons/lu";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegistrationStatusChip } from "@/features/admin/components/registrations/RegistrationStatusChip";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useGetPrograms } from "@/lib/api/program";
import { useGetPendingRegistrationCount, useGetRegistrations } from "@/lib/api/registration";
import { useDrawer } from "@/store/useDrawer";
import type { AdminRegistration, RegistrationStatus } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

const PAGE_SIZE = 20;

type StatusTab = RegistrationStatus | "all";

const COLUMNS: DataTableColumn<AdminRegistration>[] = [
  {
    id: "registrant",
    header: "Registrant",
    isRowHeader: true,
    cell: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{r.registrantName}</p>
        <p className="truncate text-xs text-muted">{r.registrantPhone}</p>
      </div>
    ),
  },
  { id: "program", header: "Program", cell: (r) => r.program?.title ?? <span className="text-muted">—</span> },
  { id: "type", header: "Type", hideBelow: "lg", cell: (r) => <span className="capitalize text-muted">{r.registrationType}</span> },
  { id: "entries", header: "Entries", align: "end", hideBelow: "lg", cell: (r) => <span className="tabular-nums">{r.entries.length}</span> },
  { id: "status", header: "Status", className: "w-28", cell: (r) => <RegistrationStatusChip status={r.status} /> },
  {
    id: "submitted",
    header: "Submitted",
    hideBelow: "xl",
    cell: (r) => <span className="text-muted">{r.createdAt ? dayjs(r.createdAt).format("MMM D, YYYY") : "—"}</span>,
  },
];

export default function RegistrationAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openDrawer = useDrawer((s) => s.openDrawer);
  const canManage = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: programs = [] } = useGetPrograms();
  const { data: pendingTotal } = useGetPendingRegistrationCount();

  // The program filter lives in the URL so Programs → "View registrations" can link here.
  const programId = searchParams.get("programId") ?? "all";
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => Array.from(new Set(programs.map((p) => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [programs],
  );

  const { data, isLoading, isError, refetch } = useGetRegistrations({
    programId: programId !== "all" ? programId : undefined,
    category: programId === "all" && category !== "all" ? category : undefined,
    status: status !== "all" ? status : undefined,
    page,
    limit: PAGE_SIZE,
  });
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  // The API has no text search, so this narrows the current page only.
  const q = search.trim().toLowerCase();
  const rows = (data?.items ?? []).filter((r) => !q || r.registrantName.toLowerCase().includes(q));
  const filtering = q !== "" || programId !== "all" || category !== "all" || status !== "all";

  const setProgram = (value: string) => {
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("programId");
    else next.set("programId", value);
    setSearchParams(next, { replace: true });
  };
  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setProgram("all");
  };
  const openRegistration = (r: AdminRegistration) => openDrawer("view-registration", { body: r });
  const openCreate = () =>
    openDrawer("create-registration", { body: { programId: programId !== "all" ? programId : null } });

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Registrations"
        description="Review payment proofs, then verify or reject each submission."
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <LuPlus size={16} aria-hidden />
              New registration
            </Button>
          ) : null
        }
      />

      <ViewTabs
        aria-label="Registration status"
        tabs={[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending", count: pendingTotal },
          { id: "verified", label: "Verified" },
          { id: "rejected", label: "Rejected" },
        ]}
        value={status}
        onChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
      />

      <div className="space-y-3">
        <TableToolbar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Find a name on this page…",
            "aria-label": "Find a registrant on this page",
          }}
          filters={
            <>
              <Select value={programId} onValueChange={setProgram}>
                <SelectTrigger aria-label="Program">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {programId === "all" ? (
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger aria-label="Category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </>
          }
        />

        <DataTable
          aria-label="Registrations"
          columns={COLUMNS}
          rows={rows}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load registrations."
          onRetry={() => refetch()}
          onRowAction={openRegistration}
          rowActions={(r) => (
            <RowActions
              actions={[{ label: `Review ${r.registrantName}`, icon: LuEye, onAction: () => openRegistration(r) }]}
            />
          )}
          renderCard={(r) => (
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-medium text-foreground">{r.registrantName}</p>
                <RegistrationStatusChip status={r.status} />
              </div>
              <p className="text-xs text-muted">
                {r.program?.title ?? "—"} · {r.entries.length} entr{r.entries.length === 1 ? "y" : "ies"}
                {r.createdAt ? ` · ${dayjs(r.createdAt).format("MMM D")}` : ""}
              </p>
            </div>
          )}
          emptyState={
            filtering ? (
              <EmptyState
                icon={LuClipboardCheck}
                title="No registrations match"
                description={q ? "Search only covers the page you're on. Try another page or clear filters." : undefined}
                action={
                  <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={LuClipboardCheck}
                title="No registrations yet"
                description="Submissions from the public registration form appear here."
              />
            )
          }
          summary={`${total} registration${total === 1 ? "" : "s"}`}
          pagination={{ page, totalPages, onPageChange: setPage }}
          minWidth={760}
        />
      </div>
    </div>
  );
}
