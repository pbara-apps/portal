import { useQuery } from "@tanstack/react-query";
import { mapAudit } from "@/lib/mappers/admin";
import http from ".";

export const auditKeys = {
  all: ["audit-logs"] as const,
};

export const useGetAuditLogs = (limit = 100) =>
  useQuery({
    queryKey: [...auditKeys.all, limit],
    queryFn: async () => {
      const res = await http.get("/audit/", { params: { limit } });
      const list = (res.data ?? []) as unknown[];
      return list.map((item) =>
        mapAudit(item as Parameters<typeof mapAudit>[0]),
      );
    },
  });
