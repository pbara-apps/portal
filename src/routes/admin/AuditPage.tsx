import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useState } from "react";
import { LuFileText, LuSearch } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { AdminPageHeader } from "@/features/admin/components/shared/AdminPageHeader";
import {
  adminFilterBarCx,
  adminFilterSearchCx,
  adminFilterSelectExtraWideCx,
  adminPageCx,
  adminTableMinCx,
  adminTableScrollCx,
  adminTableSectionCx,
} from "@/features/admin/components/shared/adminLayout";
import { useGetAuditLogs } from "@/lib/api/audit";

dayjs.extend(relativeTime);

const PAGE_SIZE = 12;

const actionColors: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  updated: "bg-blue-100 text-blue-700 border border-blue-200",
  deleted: "bg-rose-100 text-rose-700 border border-rose-200",
};

export default function AuditAdminPage() {
  const { data: logs = [], isLoading, isError } = useGetAuditLogs(200);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const entityTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.entityType))).sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (entityFilter !== "all" && log.entityType !== entityFilter) return false;
      if (!q) return true;
      return (
        log.entityTitle.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    });
  }, [logs, search, entityFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={adminPageCx}>
      <AdminPageHeader
        title="Audit Log"
        description="Track administrative actions across news, events, gallery, and leadership records."
        stats={
          <Badge className="bg-primary/10 text-primary">{logs.length} entries</Badge>
        }
      />

      <Card className="border border-text-dark/[0.05] bg-surface shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <CardContent className={`${adminFilterBarCx} border-0 bg-transparent p-3 shadow-none`}>
          <Input
            placeholder="Search by title, actor, action…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            startContent={<LuSearch size={16} className="text-text-muted" />}
            className={adminFilterSearchCx}
          />
          <Select
            value={entityFilter}
            onValueChange={(v) => {
              setEntityFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={adminFilterSelectExtraWideCx}>
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <section className={adminTableSectionCx}>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner label="" />
          </div>
        ) : isError ? (
          <p className="py-20 text-center text-sm text-rose-600">
            Unable to load audit logs.
          </p>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <LuFileText size={28} className="text-primary/40" />
            <p className="text-sm text-text-muted">
              Audit entries will appear here as content is created or modified.
            </p>
          </div>
        ) : (
          <>
            <div className={adminTableScrollCx}>
              <Table className={adminTableMinCx}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((log) => (
                    <TableRow key={log.id} className="hover:bg-background/40">
                      <TableCell>
                        <Badge className={actionColors[log.action] ?? ""}>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="capitalize text-text-muted">{log.entityType}</TableCell>
                      <TableCell className="font-medium text-text-dark">{log.entityTitle}</TableCell>
                      <TableCell className="text-text-muted">{log.actorName}</TableCell>
                      <TableCell className="text-text-muted">
                        {log.timestamp ? dayjs(log.timestamp).fromNow() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-center border-t border-text-dark/[0.05] px-4 py-3 sm:px-5">
              <Pagination page={page} totalPages={pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
