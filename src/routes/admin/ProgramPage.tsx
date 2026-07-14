import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuClipboardList,
  LuPencil,
  LuPlus,
  LuSearch,
  LuUsers,
  LuPower,
} from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  errorToast,
  successToast,
} from "@/components/shared/toast-notification";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminFilterSearchCx,
  adminFilterSelectCx,
  adminPageCx,
  adminTableFooterCx,
  adminTableMinCx,
  adminTableScrollCx,
  adminTableSectionCx,
} from "@/features/admin/components/shared/adminLayout";
import { ConfirmDialog } from "@/features/admin/components/shared/ConfirmDialog";
import { useDeleteProgram, useGetPrograms } from "@/lib/api/program";
import { useGetParticipantCountsByProgram } from "@/lib/api/registration";
import { countParticipantsByCategory } from "@/lib/registrations/participants";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useDrawer } from "@/store/useDrawer";
import {
  REGISTRATION_MODE_LABELS,
  type AdminProgram,
  type RegistrationMode,
} from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function formatAmount(amount: number) {
  return `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export default function ProgramAdminPage() {
  const openDrawer = useDrawer((s) => s.openDrawer);
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: programs = [], isLoading, isError, refetch } = useGetPrograms();
  const { data: participantCounts = {} } = useGetParticipantCountsByProgram();
  const deleteProgram = useDeleteProgram();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminProgram | null>(
    null,
  );

  const categories = useMemo(() => {
    const set = new Set(programs.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [programs]);

  const categoryTotals = useMemo(
    () => countParticipantsByCategory(programs, participantCounts),
    [programs, participantCounts],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (activeFilter === "active" && !p.isActive) return false;
      if (activeFilter === "inactive" && p.isActive) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [programs, search, categoryFilter, activeFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = programs.filter((p) => p.isActive).length;
  const totalParticipants = useMemo(
    () =>
      Object.values(participantCounts).reduce((sum, count) => sum + count, 0),
    [participantCounts],
  );

  const openParticipants = (program: AdminProgram) => {
    openDrawer("view-program-participants", {
      body: program,
      config: { size: "4xl" },
    });
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deleteProgram.mutateAsync(deactivateTarget.id);
      successToast("Program deactivated.");
      setDeactivateTarget(null);
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Deactivate failed.",
        "Error",
      );
    }
  };

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Programs"
        description="Manage registration categories, fees, and payment details."
        actionLabel="Create Program"
        onAction={() => openDrawer("create-program")}
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit program updates."
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">
              {programs.length} programs
            </Badge>
            <Badge variant="success">{activeCount} active</Badge>
            <Badge variant="secondary">
              {totalParticipants} participants
            </Badge>
          </>
        }
      />

      {categoryTotals.length > 0 ? (
        <section className="flex flex-wrap gap-2">
          {categoryTotals.map((item) => (
            <button
              key={item.category}
              type="button"
              onClick={() => {
                setCategoryFilter(item.category);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-left text-xs transition-colors",
                categoryFilter === item.category
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-text-dark/10 bg-surface text-text-muted hover:border-primary/30 hover:text-primary",
              )}
            >
              <span className="font-semibold">{item.category}</span>
              <span className="mx-1.5 text-text-muted/70">·</span>
              <span>
                {item.participants} participant
                {item.participants === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </section>
      ) : null}

      <section className={adminFilterBarCx}>
        <div className={adminFilterSearchCx}>
          <Input
            placeholder="Search title, slug, category…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            startContent={<LuSearch size={16} className="text-text-muted" />}
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className={adminFilterSelectCx}>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={activeFilter}
          onValueChange={(v) => {
            setActiveFilter(v as typeof activeFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className={adminFilterSelectCx}>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Spinner label="Loading programs…" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-rose-600">Unable to load programs.</p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className={adminTableScrollCx}>
              <Table className={adminTableMinCx}>
                <TableHeader>
                  <TableRow>
                    <TableHead>TITLE</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>AMOUNT</TableHead>
                    <TableHead>MODE</TableHead>
                    <TableHead className="text-center">PARTICIPANTS</TableHead>
                    <TableHead className="text-center">STATUS</TableHead>
                    <TableHead>CREATED</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.06] text-primary">
                            <LuClipboardList size={20} />
                          </div>
                          <p className="text-sm font-semibold text-text-dark">
                            No programs yet
                          </p>
                          <Button
                            size="sm"
                            className="bg-primary text-white"
                            onClick={() => openDrawer("create-program")}
                            disabled={!canManage}
                          >
                            <LuPlus size={14} />
                            Create Program
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((program) => {
                      const count = participantCounts[program.id] ?? 0;
                      return (
                        <TableRow
                          key={program.id}
                          className="cursor-pointer hover:bg-background/60"
                          onClick={() => {
                            if (canManage)
                              openDrawer("edit-program", { body: program });
                          }}
                        >
                          <TableCell>
                            <div>
                              <p className="text-sm font-semibold text-primary">
                                {program.title}
                              </p>
                              <p className="font-mono text-[11px] text-text-muted">
                                {program.slug}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-text-dark">
                              {program.category}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-text-dark">
                              {formatAmount(program.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-text-muted">
                              {
                                REGISTRATION_MODE_LABELS[
                                  program.registrationMode as RegistrationMode
                                ]
                              }
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openParticipants(program);
                                }}
                              >
                                <LuUsers size={13} />
                                {count}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <Badge
                                className={cn(
                                  "ring-1 px-2 text-[10px] font-bold uppercase tracking-[0.08em]",
                                  program.isActive
                                    ? "bg-emerald-100 text-emerald-700 ring-emerald-200/60"
                                    : "bg-rose-100 text-rose-700 ring-rose-200/60",
                                )}
                              >
                                {program.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-text-muted">
                              {program.createdAt
                                ? dayjs(program.createdAt).format("MMM D, YYYY")
                                : "—"}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Open actions"
                                    className="text-text-muted"
                                  >
                                    ⋮
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    disabled={!canManage}
                                    onClick={() =>
                                      openDrawer("edit-program", {
                                        body: program,
                                      })
                                    }
                                  >
                                    <LuPencil size={14} />
                                    Edit program
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openParticipants(program)}
                                  >
                                    <LuUsers size={14} />
                                    View registered participants
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      to={`/admin/registrations?programId=${program.id}`}
                                    >
                                      <LuClipboardList size={14} />
                                      View registrations
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={!canManage || !program.isActive}
                                    className="text-rose-600 focus:text-rose-600"
                                    onClick={() => {
                                      if (!canManage || !program.isActive)
                                        return;
                                      setDeactivateTarget(program);
                                    }}
                                  >
                                    <LuPower size={14} />
                                    Deactivate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className={adminTableFooterCx}>
              <p className="text-xs text-text-muted">
                {filtered.length} program{filtered.length === 1 ? "" : "s"}
              </p>
              <Pagination
                page={page}
                totalPages={pages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        isOpen={!!deactivateTarget}
        title="Deactivate program"
        message={`Deactivate “${deactivateTarget?.title ?? "this program"}”? It will be hidden from public registration.`}
        confirmLabel="Deactivate"
        loading={deleteProgram.isPending}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
