/**
 * Transaction and Task Types
 */

export interface Transaction {
  id: string;
  propertyId: string;
  status: "active" | "completed" | "cancelled";
  type: "sell" | "rent" | "purchase";
  agreedPrice: number;
  commissionAmount?: number;
  agentId: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  buyerName?: string;
  buyerContact?: string;
  buyerEmail?: string;
  buyerContactId?: string;
  acceptedOfferAmount?: number;
  actualClosingDate?: string;
}

export interface TransactionTask {
  id: string;
  propertyId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: "pending" | "in-progress" | "completed" | "skipped";
  isCompleted: boolean;
  category:
    | "legal"
    | "financial"
    | "inspection"
    | "administrative"
    | "closing"
    | "other";
  order: number;
  completedDate?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}
