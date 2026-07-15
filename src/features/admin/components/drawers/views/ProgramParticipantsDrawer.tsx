import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  LuDownload,
  LuFileSpreadsheet,
  LuSearch,
  LuUsers,
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
import { SheetBody, SheetHeader } from "@/components/ui/sheet";
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
import { RegistrationStatusChip } from "@/features/admin/components/registrations/RegistrationDetailPanel";
import { DrawerFormShell } from "@/features/admin/components/shared/DrawerFormShell";
import {
  exportParticipantsExcel,
  exportParticipantsPdf,
} from "@/lib/export/participants";
import { useGetProgramParticipants } from "@/lib/api/registration";
import type { AdminProgram, RegistrationStatus } from "@/types/admin";
import { REGISTRATION_STATUSES } from "@/types/admin";

interface ProgramParticipantsDrawerProps {
  program?: AdminProgram;
  onClose: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

function churchLabel(name: string, chapter?: string) {
  if (chapter && chapter !== name) return `${name} · ${chapter}`;
  return name;
}

export function ProgramParticipantsDrawer({
  program,
}: ProgramParticipantsDrawerProps) {
  const {
    data: rows = [],
    isLoading,
    isError,
    refetch,
  } = useGetProgramParticipants(program?.id ?? null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RegistrationStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (!q) return true;
      return (
        row.participantName.toLowerCase().includes(q) ||
        row.rankName.toLowerCase().includes(q) ||
        row.churchName.toLowerCase().includes(q) ||
        (row.churchChapter?.toLowerCase().includes(q) ?? false) ||
        (row.registrationCode?.toLowerCase().includes(q) ?? false) ||
        row.registrantName.toLowerCase().includes(q) ||
        row.registrantPhone.toLowerCase().includes(q)
      );
    });

    // Newest submissions first
    return matched.sort((a, b) => {
      const aTime = a.submittedAt ? dayjs(a.submittedAt).valueOf() : 0;
      const bTime = b.submittedAt ? dayjs(b.submittedAt).valueOf() : 0;
      return bTime - aTime;
    });
  }, [rows, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, status, pageSize, program?.id]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filtered.length);

  const handleExportExcel = () => {
    if (!program) return;
    try {
      exportParticipantsExcel(program, filtered);
      successToast("Excel export downloaded.");
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "Excel export failed.",
        "Export failed",
      );
    }
  };

  const handleExportPdf = () => {
    if (!program) return;
    try {
      exportParticipantsPdf(program, filtered);
      successToast("PDF export downloaded.");
    } catch (err) {
      errorToast(
        (err as { message?: string })?.message ?? "PDF export failed.",
        "Export failed",
      );
    }
  };

  if (!program) {
    return (
      <DrawerFormShell>
        <SheetHeader className="border-b border-text-dark/6 px-6 py-5">
          <h2 className="text-lg font-semibold text-primary">Participants</h2>
        </SheetHeader>
        <SheetBody className="px-6 py-10">
          <p className="text-center text-sm text-text-muted">
            Program details are unavailable.
          </p>
        </SheetBody>
      </DrawerFormShell>
    );
  }

  return (
    <DrawerFormShell>
      <SheetHeader className="border-b border-text-dark/6 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Registered participants
            </p>
            <h2 className="mt-1 text-lg font-semibold text-primary">
              {program.title}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {program.category}
              {program.registrationDeadline
                ? ` · Deadline ${dayjs(program.registrationDeadline).format("MMM D, YYYY")}`
                : null}
              {program.createdAt
                ? ` · Created ${dayjs(program.createdAt).format("MMM D, YYYY")}`
                : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary">
              {filtered.length} shown
            </Badge>
            <Badge variant="secondary">{rows.length} total</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={filtered.length === 0}
                >
                  <LuDownload size={14} />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <LuFileSpreadsheet size={14} />
                  Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf}>
                  <LuDownload size={14} />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SheetHeader>

      <SheetBody className="flex min-h-0 flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Search by name, code, church, or rank…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<LuSearch size={16} className="text-text-muted" />}
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as RegistrationStatus | "all")}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {REGISTRATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
            <Spinner label="Loading participants…" />
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-rose-600">
              Unable to load participants.
            </p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center text-text-muted">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/6 text-primary">
              <LuUsers size={20} />
            </div>
            <p className="text-sm font-semibold text-text-dark">
              No participants found
            </p>
            <p className="text-xs">
              {rows.length === 0
                ? "No registrations have been submitted for this program yet."
                : "Try adjusting your search or status filter."}
            </p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-text-dark/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PARTICIPANT</TableHead>
                    <TableHead>CODE</TableHead>
                    <TableHead>RANK</TableHead>
                    <TableHead className="w-56!">CHURCH</TableHead>
                    <TableHead>REGISTRANT</TableHead>
                    <TableHead className="text-center">STATUS</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-text-dark w-36">
                          {row.participantName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-primary">
                          {row.registrationCode ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-text-muted">
                          {row.rankName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-48! flex flex-col">
                          <span className="text-sm text-text-muted">
                            {row.churchName}
                          </span>
                          <span className="text-xs text-text-muted">
                            {row.churchChapter}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-text-dark">
                            {row.registrantName}
                          </p>
                          <p className="text-xs text-text-muted">
                            {row.registrantPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <RegistrationStatusChip status={row.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-20">
                          <span className="text-xs text-text-muted">
                            {row.submittedAt
                              ? dayjs(row.submittedAt).format("MMM D, YYYY")
                              : "—"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-text-dark/5 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs text-text-muted">
                  {rangeStart}–{rangeEnd} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Rows</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v))}
                  >
                    <SelectTrigger className="h-8 w-[4.75rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </SheetBody>
    </DrawerFormShell>
  );
}
