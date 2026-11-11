import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuClipboardList, LuPencil, LuPlus, LuPower, LuUsers } from "react-icons/lu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableToolbar } from "@/components/shared/TableToolbar";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientTable } from "@/hooks/useClientTable";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDeleteProgram, useGetPrograms } from "@/lib/api/program";
import { useGetParticipantCountsByProgram } from "@/lib/api/registration";
import { countParticipantsByCategory } from "@/lib/registrations/participants";
import { cn } from "@/lib/utils";
import { useDrawer } from "@/store/useDrawer";
import { REGISTRATION_MODE_LABELS, type AdminProgram, type RegistrationMode } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";

type ActiveFilter = "all" | "active" | "inactive";

const formatAmount = (amount: number) => `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

const ProgramStatus = ({ p }: { p: AdminProgram }) =>
  p.isActive ? <StatusPill tone="success" label="Active" /> : <StatusPill tone="neutral" label="Inactive" />;

const searchText = (p: AdminProgram) => `${p.title} ${p.slug} ${p.category}`;

export default function ProgramAdminPage() {
  const navigate = useNavigate();
  const openDrawer = useDrawer((s) => s.openDrawer);
  const canManage = canWriteAdminContent(useCurrentUser((s) => s.user)?.role);
  const { data: programs = [], isLoading, isError, refetch } = useGetPrograms();
  const { data: participantCounts = {} } = useGetParticipantCountsByProgram();
  const deleteProgram = useDeleteProgram();

  const [category, setCategory] = useState("all");
  const [active, setActive] = useState<ActiveFilter>("all");
  const [deactivateTarget, setDeactivateTarget] = useState<AdminProgram | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(programs.map((p) => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [programs],
  );
  const categoryTotals = useMemo(
    () => countParticipantsByCategory(programs, participantCounts),
    [programs, participantCounts],
  );
  const totalParticipants = Object.values(participantCounts).reduce((sum, n) => sum + n, 0);
  const activeCount = programs.filter((p) => p.isActive).length;

  const table = useClientTable({
    rows: programs.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (active === "all" || (active === "active") === p.isActive),
    ),
    searchText,
    sortValue: (p, column) =>
      ({
        category: p.category,
        amount: p.amount,
        participants: participantCounts[p.id] ?? 0,
        created: p.createdAt ? new Date(p.createdAt).getTime() : null,
      })[column] ?? p.title,
    resetKey: `${category}|${active}`,
  });
  const filtering = table.query.trim() !== "" || category !== "all" || active !== "all";

  const openCreate = () => openDrawer("create-program");
  const openEdit = (p: AdminProgram) => openDrawer("edit-program", { body: p });
  const openParticipants = (p: AdminProgram) => openDrawer("view-program-participants", { body: p });
  const clearFilters = () => {
    table.setQuery("");
    setCategory("all");
    setActive("all");
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deleteProgram.mutateAsync(deactivateTarget.id);
      successToast("Program deactivated.");
      setDeactivateTarget(null);
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Deactivate failed.", "Error");
    }
  };

  const columns: DataTableColumn<AdminProgram>[] = [
    {
      id: "title",
      header: "Program",
      sortable: true,
      isRowHeader: true,
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{p.title}</p>
          <p className="truncate font-mono text-[11px] text-muted">{p.slug}</p>
        </div>
      ),
    },
    { id: "category", header: "Category", sortable: true, hideBelow: "lg", cell: (p) => <span className="whitespace-nowrap">{p.category}</span> },
    {
      id: "amount",
      header: "Fee",
      sortable: true,
      align: "end",
      cell: (p) => <span className="font-medium tabular-nums">{formatAmount(p.amount)}</span>,
    },
    {
      id: "mode",
      header: "Mode",
      hideBelow: "xl",
      cell: (p) => <span className="whitespace-nowrap text-muted">{REGISTRATION_MODE_LABELS[p.registrationMode as RegistrationMode]}</span>,
    },
    {
      id: "participants",
      header: "Participants",
      sortable: true,
      align: "end",
      cell: (p) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => openParticipants(p)}
          aria-label={`${participantCounts[p.id] ?? 0} participants in ${p.title}`}
          className="h-7 gap-1.5 px-2 tabular-nums text-focus hover:bg-focus/[0.08]"
        >
          <LuUsers size={13} aria-hidden />
          {participantCounts[p.id] ?? 0}
        </Button>
      ),
    },
    { id: "status", header: "Status", className: "w-28", cell: (p) => <ProgramStatus p={p} /> },
    {
      id: "created",
      header: "Created",
      sortable: true,
      hideBelow: "xl",
      cell: (p) => <span className="whitespace-nowrap text-muted">{p.createdAt ? dayjs(p.createdAt).format("MMM D, YYYY") : "—"}</span>,
    },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Programs"
        description="Registration categories, fees and payment details."
        meta={
          !isLoading && !isError ? (
            <p className="text-sm text-muted">
              <span className="font-medium tabular-nums text-foreground">{activeCount}</span> of {programs.length} active ·{" "}
              <span className="font-medium tabular-nums text-foreground">{totalParticipants}</span> participants
            </p>
          ) : null
        }
        actions={
          canManage ? (
            <Button type="button" onClick={openCreate}>
              <LuPlus size={16} aria-hidden />
              New program
            </Button>
          ) : null
        }
      />

      {categoryTotals.length > 0 ? (
        <div role="group" aria-label="Participants by category" className="flex flex-wrap gap-2">
          {categoryTotals.map((item) => {
            const selected = category === item.category;
            return (
              <button
                key={item.category}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(selected ? "all" : item.category)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                  selected
                    ? "border-focus/40 bg-focus/[0.08] text-focus"
                    : "border-border bg-surface text-muted hover:border-foreground/20 hover:text-foreground",
                )}
              >
                <span className="font-medium">{item.category}</span>
                <span className="tabular-nums">
                  {item.participants} participant{item.participants === 1 ? "" : "s"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-3">
        <TableToolbar
          search={{ value: table.query, onChange: table.setQuery, placeholder: "Search title, slug, category…" }}
          filters={
            <>
              <Select value={category} onValueChange={setCategory}>
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
              <Select value={active} onValueChange={(v) => setActive(v as ActiveFilter)}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />

        <DataTable
          aria-label="Programs"
          columns={columns}
          rows={table.pageRows}
          getRowId={(p) => p.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="We couldn't load programs."
          onRetry={() => refetch()}
          sort={table.sort}
          onSortChange={table.setSort}
          onRowAction={canManage ? openEdit : openParticipants}
          rowActions={(p) => (
            <RowActions
              label={`Actions for ${p.title}`}
              actions={[
                {
                  label: "View registrations",
                  icon: LuClipboardList,
                  onAction: () => navigate(`/admin/registrations?programId=${p.id}`),
                },
                canManage && { label: "Edit program", icon: LuPencil, tone: "accent", onAction: () => openEdit(p) },
                canManage &&
                  p.isActive && { label: "Deactivate", icon: LuPower, danger: true, onAction: () => setDeactivateTarget(p) },
              ]}
            />
          )}
          renderCard={(p) => (
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-medium text-foreground">{p.title}</p>
                <ProgramStatus p={p} />
              </div>
              <p className="text-xs text-muted">
                {p.category} · <span className="tabular-nums">{formatAmount(p.amount)}</span> ·{" "}
                <span className="tabular-nums">{participantCounts[p.id] ?? 0}</span> participants
              </p>
            </div>
          )}
          emptyState={
            filtering ? (
              <EmptyState
                icon={LuClipboardList}
                title="No programs match your filters"
                action={
                  <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={LuClipboardList}
                title="No programs yet"
                description="Programs set the fee and form for each registration category."
                action={
                  canManage ? (
                    <Button type="button" size="sm" onClick={openCreate}>
                      <LuPlus size={14} aria-hidden />
                      New program
                    </Button>
                  ) : undefined
                }
              />
            )
          }
          summary={`${table.total} program${table.total === 1 ? "" : "s"}`}
          pagination={{ page: table.page, totalPages: table.totalPages, onPageChange: table.setPage }}
          minWidth={820}
        />
      </div>

      <ConfirmDialog
        isOpen={!!deactivateTarget}
        title="Deactivate program?"
        message={`“${deactivateTarget?.title ?? "This program"}” will be hidden from public registration.`}
        confirmLabel="Deactivate"
        loading={deleteProgram.isPending}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
