import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LuSearch, LuClipboardCheck } from "react-icons/lu";
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
import { RegistrationStatusChip } from "@/features/admin/components/registrations/RegistrationDetailPanel";
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminFilterSearchCx,
  adminFilterSelectCx,
  adminFilterSelectWideCx,
  adminPageCx,
  adminTableMinCx,
  adminTableScrollCx,
  adminTableSectionCx,
} from "@/features/admin/components/shared/adminLayout";
import { useGetPrograms } from "@/lib/api/program";
import { useGetRegistrations } from "@/lib/api/registration";
import { cn } from "@/lib/utils";
import { useDrawer, useDrawerBody } from "@/store/useDrawer";
import useCurrentUser from "@/hooks/useCurrentUser";
import type {
  AdminRegistration,
  RegistrationStatus,
} from "@/types/admin";
import { REGISTRATION_STATUSES } from "@/types/admin";
import { canWriteAdminContent } from "@/types/user";
import dayjs from "dayjs";

const PAGE_SIZE = 20;

export default function RegistrationAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openDrawer = useDrawer((s) => s.openDrawer);
  const drawerView = useDrawer((s) => s.view);
  const drawerRegistration = useDrawerBody<AdminRegistration>();
  const { user } = useCurrentUser();
  const canManage = canWriteAdminContent(user?.role);
  const { data: programs = [] } = useGetPrograms();

  const [programId, setProgramId] = useState(
    () => searchParams.get("programId") ?? "all",
  );
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<RegistrationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fromUrl = searchParams.get("programId");
    if (fromUrl && fromUrl !== programId) {
      setProgramId(fromUrl);
      setPage(1);
    }
  }, [searchParams, programId]);

  const categories = useMemo(() => {
    const set = new Set(programs.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [programs]);

  const listParams = useMemo(
    () => ({
      programId: programId !== "all" ? programId : undefined,
      category:
        programId === "all" && category !== "all" ? category : undefined,
      status: status !== "all" ? status : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [programId, category, status, page],
  );

  const { data, isLoading, isError, refetch } = useGetRegistrations(listParams);
  const items = data?.items ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const total = data?.total ?? 0;

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      item.registrantName.toLowerCase().includes(q),
    );
  }, [items, search]);

  const pendingCount = useMemo(
    () => items.filter((i) => i.status === "pending").length,
    [items],
  );

  const activeId =
    drawerView === "view-registration" ? drawerRegistration?.id : undefined;

  const openRegistration = (item: AdminRegistration) => {
    openDrawer("view-registration", {
      body: item,
      config: { size: "3xl" },
    });
  };

  const updateProgramFilter = (value: string) => {
    setProgramId(value);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("programId");
    else next.set("programId", value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Registrations"
        description="Review payment proofs and verify or reject registration submissions."
        actionLabel="New Registration"
        onAction={() =>
          openDrawer("create-registration", {
            body: {
              programId: programId !== "all" ? programId : null,
            },
            config: { size: "3xl" },
          })
        }
        actionDisabled={!canManage}
        actionDisabledText="Your role does not permit creating registrations."
        stats={
          <>
            <Badge className="bg-primary/10 text-primary">{total} total</Badge>
            {pendingCount > 0 ? (
              <Badge className="bg-amber-100 text-amber-800">
                {pendingCount} pending on page
              </Badge>
            ) : null}
          </>
        }
      />

      <section className={adminFilterBarCx}>
        <div className={adminFilterSearchCx}>
          <Input
            placeholder="Search by registrant name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<LuSearch size={16} className="text-text-muted" />}
          />
        </div>
        <Select value={programId} onValueChange={updateProgramFilter}>
          <SelectTrigger className={adminFilterSelectWideCx}>
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
          disabled={programId !== "all"}
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
          value={status}
          onValueChange={(v) => {
            setStatus(v as RegistrationStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className={adminFilterSelectCx}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {REGISTRATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Spinner label="Loading registrations…" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-rose-600">
              Unable to load registrations.
            </p>
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
                    <TableHead>REGISTRANT</TableHead>
                    <TableHead>PROGRAM</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead className="text-center">ENTRIES</TableHead>
                    <TableHead className="text-center">STATUS</TableHead>
                    <TableHead>SUBMITTED</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.06] text-primary">
                            <LuClipboardCheck size={20} />
                          </div>
                          <p className="text-sm font-semibold text-text-dark">
                            No registrations found
                          </p>
                          <p className="text-xs text-text-muted">
                            Adjust filters or wait for new submissions.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "cursor-pointer hover:bg-background/60",
                          activeId === item.id && "bg-primary/[0.05]",
                        )}
                        onClick={() => openRegistration(item)}
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-semibold text-primary">
                              {item.registrantName}
                            </p>
                            <p className="text-xs text-text-muted">
                              {item.registrantPhone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-text-dark">
                            {item.program?.title ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize text-text-muted">
                            {item.registrationType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-center text-sm text-text-muted">
                            {item.entries.length}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <RegistrationStatusChip status={item.status} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-text-muted">
                            {item.createdAt
                              ? dayjs(item.createdAt).format("MMM D, YYYY")
                              : "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-text-dark/[0.05] px-4 py-3">
              <p className="text-xs text-text-muted">
                {total} registration{total === 1 ? "" : "s"}
              </p>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
