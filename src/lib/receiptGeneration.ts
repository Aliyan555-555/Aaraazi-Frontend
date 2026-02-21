/**
 * Receipt – backend-side process.
 * This module only calls the documents API to generate and open the payment receipt PDF.
 * No client-side HTML/PDF generation; all receipt generation is done in the backend
 * (see Aaraazi-Backend documents module: GET /documents/receipt/deal/:dealId/payment/:paymentId).
 */

import type { DealPayment } from "@/types/deals";
import { apiClient } from "@/lib/api/client";

/**
 * Whether a receipt is available for this payment.
 * Backend can store receiptUrl on DealPayment; until then we consider any recorded payment as viewable.
 */
export function hasReceipt(payment: DealPayment | string): boolean {
  if (typeof payment === "string") return true;
  return !!payment.receiptNumber || true; // Always allow "view receipt" – backend generates on demand
}

/**
 * Open payment receipt PDF in a new tab.
 * Calls backend GET /documents/receipt/deal/:dealId/payment/:paymentId and opens the returned PDF.
 */
export async function viewReceipt(
  dealId: string,
  paymentId: string,
): Promise<void> {
  const response = await apiClient.get<Blob>(
    `/documents/receipt/deal/${encodeURIComponent(dealId)}/payment/${encodeURIComponent(paymentId)}`,
    { responseType: "blob" },
  );

  const blob = response.data;
  if (!blob || blob.size === 0) {
    throw new Error("Receipt not found or unable to generate");
  }

  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Please allow popups to view receipt");
  }
  // Revoke after a delay so the new window can load the blob
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
