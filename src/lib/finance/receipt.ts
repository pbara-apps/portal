import { jsPDF } from "jspdf";
import { type Bill, type Payment, billPlace } from "@/types/finance";

/** Plain-text naira for the PDF (the ₦ sign isn't in jsPDF's built-in fonts). */
const ngn = (n: number) => `NGN ${n.toLocaleString("en-NG")}`;

/**
 * Builds and downloads a simple A5 receipt for a verified payment.
 */
export function downloadReceipt(bill: Bill, payment: Payment) {
  const doc = new jsPDF({ format: "a5" });
  const left = 14;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Royal Ambassadors — Pentecost Baptist Association", left, y);
  y += 8;
  doc.setFontSize(12);
  doc.text("PAYMENT RECEIPT", left, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const rows: [string, string][] = [
    ["Receipt number", payment.receiptNumber ?? "—"],
    ["Received from", billPlace(bill)],
    ["For", `${bill.due?.title ?? "Due"}${bill.due?.period ? ` (${bill.due.period})` : ""}`],
    ["Amount", ngn(payment.amount)],
    ["Payment date", new Date(payment.paidOn).toLocaleDateString("en-GB")],
    ["Bank reference", payment.reference ?? "—"],
    ["Bill total", ngn(bill.amountDue)],
    ["Total paid to date", ngn(bill.amountPaid)],
    ["Balance", ngn(bill.balance)],
  ];
  for (const [label, value] of rows) {
    doc.setTextColor(100);
    doc.text(label, left, y);
    doc.setTextColor(0);
    doc.text(value, left + 48, y);
    y += 7;
  }

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString("en-GB")}. This receipt confirms a verified payment.`, left, y);

  doc.save(`${payment.receiptNumber ?? "receipt"}.pdf`);
}
