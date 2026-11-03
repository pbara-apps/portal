import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapBill } from "@/types/finance";
import type { PaymentAccount } from "@/types/admin";
import chapterHttp from "./http";

const key = ["chapter-portal", "dues"] as const;

/** Bills for the chapter(s) — and church bills for a counsellor — plus the account to pay into. */
export const useChapterBills = (chapterId?: string) =>
  useQuery({
    queryKey: [...key, chapterId ?? "all"],
    queryFn: async () => {
      const data = (await chapterHttp.get("/dues", { params: { chapterId } })).data as {
        bills: unknown[];
        paymentAccount: PaymentAccount | null;
      };
      return { bills: data.bills.map(mapBill), paymentAccount: data.paymentAccount };
    },
  });

export const useSubmitPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      billId: string;
      amount: number;
      paidOn: string;
      reference?: string | null;
      proofUrl: string;
    }) => {
      await chapterHttp.post("/dues/payments", body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
};
