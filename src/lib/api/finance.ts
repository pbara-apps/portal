import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapBill, mapDue, mapPayment, type PaymentStatus, type QueuedPayment } from "@/types/finance";
import http from ".";

/** Admin-side hooks for dues, levies and payment verification. */
const root = ["finance"] as const;

export type CreateDuePayload = {
  title: string;
  description?: string | null;
  type: "due" | "levy";
  billTo: "chapter" | "church";
  chargeBasis: "flat" | "per_member";
  amount: number;
  period?: string | null;
  dueDate: string;
  appliesTo: "all" | "selected";
  churchIds?: string[];
  chapterIds?: string[];
};

export const useDues = () =>
  useQuery({
    queryKey: [...root, "dues"],
    queryFn: async () => ((await http.get("/finance/dues")).data as unknown[]).map(mapDue),
  });

export const useDueDetail = (id: string | null) =>
  useQuery({
    queryKey: [...root, "due", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const data = (await http.get(`/finance/dues/${id}`)).data as { due: unknown; bills: unknown[] };
      return { due: mapDue(data.due), bills: data.bills.map(mapBill) };
    },
  });

export const usePayments = (status: PaymentStatus) =>
  useQuery({
    queryKey: [...root, "payments", status],
    queryFn: async () =>
      ((await http.get("/finance/payments", { params: { status } })).data as { bill?: unknown }[]).map(
        (raw): QueuedPayment => ({ ...mapPayment(raw), bill: raw.bill ? mapBill(raw.bill) : null }),
      ),
  });

export const useStatement = (filter: { chapterId?: string; churchId?: string }) =>
  useQuery({
    queryKey: [...root, "statement", filter],
    enabled: Boolean(filter.chapterId || filter.churchId),
    queryFn: async () => {
      const data = (await http.get("/finance/statement", { params: filter })).data as {
        bills: unknown[];
        totals: { billed: number; paid: number; outstanding: number };
      };
      return { bills: data.bills.map(mapBill), totals: data.totals };
    },
  });

function useFinanceMutation<T>(fn: (vars: T) => Promise<{ data?: unknown }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: T) => (await fn(vars)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: root }),
  });
}

export const useCreateDue = () => useFinanceMutation((body: CreateDuePayload) => http.post("/finance/dues", body));
export const useDeleteDue = () => useFinanceMutation((id: string) => http.delete(`/finance/dues/${id}`));
export const useRemindDue = () => useFinanceMutation((id: string) => http.post(`/finance/dues/${id}/remind`));
export const useAdjustBill = () =>
  useFinanceMutation(({ id, ...body }: { id: string; waived?: boolean; amountDue?: number; note: string }) =>
    http.patch(`/finance/bills/${id}`, body),
  );
export const useVerifyPayment = () =>
  useFinanceMutation((id: string) => http.post(`/finance/payments/${id}/verify`));
export const useRejectPayment = () =>
  useFinanceMutation(({ id, note }: { id: string; note: string }) => http.post(`/finance/payments/${id}/reject`, { note }));
