/**
 * Financial Management Types (Commissions, Expenses, Projects)
 */

export interface Commission {
  id: string;
  transactionId: string;
  propertyId?: string;
  agentId: string;
  amount: number;
  rate?: number;
  status: "pending" | "partial" | "paid" | "cancelled";
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;

  // Display fields
  agentName?: string;
  propertyTitle?: string;

  // Approval workflow
  approvalStatus?: "pending-approval" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // Override fields
  overrideAmount?: number;
  overrideReason?: string;

  // Payout configuration
  payoutTrigger?: "booking" | "50-percent" | "possession" | "full-payment";
  dueDate?: string;

  // Split commission fields
  isSplit?: boolean;
  totalAmount?: number;
}

export type ExpenseCategory =
  | "office"
  | "marketing"
  | "salary"
  | "utilities"
  | "travel"
  | "maintenance"
  | "other"
  | "Salaries & Wages"
  | "Commission Revenue"
  | "Professional Fees"
  | "Marketing & Advertising"
  | "Office Expenses"
  | "Utilities"
  | "Transportation"
  | "Depreciation";

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description: string;
  propertyId?: string;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  updatedAt: string;
  agentId?: string;

  // Additional fields expected by complex accounting logic
  deductible?: boolean;
  vendor?: string;
  dueDate?: string;
  paymentMethod?: "cash" | "bank-transfer" | "cheque" | "online";
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: "cash" | "bank-transfer" | "cheque" | "online" | "financing";
  paymentMethod?: "cash" | "bank-transfer" | "cheque" | "online" | "financing";
  status: "pending" | "completed" | "cancelled";
  propertyId?: string;
  transactionId?: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  location: string;
  developerId: string;
  status: "planned" | "in-progress" | "completed" | "cancelled";
  totalUnits?: number;
  soldUnits?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LandParcel {
  id: string;
  title: string;
  location: string;
  size: number;
  sizeUnit: string;
  status: "available" | "sold" | "development";
  price: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// AGENCY TRANSACTIONS
// ============================================

export type AgencyTransactionType =
  // Acquisition
  | "purchase_price"
  | "registration_fee"
  | "stamp_duty"
  | "legal_fees"
  | "broker_commission"
  | "renovation"
  | "other_acquisition"
  // Income
  | "rental_income"
  | "parking_fee"
  | "late_fee"
  | "other_income"
  // Expenses
  | "property_tax"
  | "maintenance"
  | "repairs"
  | "utilities"
  | "insurance"
  | "management_fee"
  | "marketing"
  | "legal_expense"
  | "other_expense"
  // Sale
  | "sale_price"
  | "sale_commission"
  | "closing_costs";

export type AgencyTransactionCategory =
  | "acquisition"
  | "income"
  | "expense"
  | "sale";

export interface AgencyTransaction {
  id: string;
  propertyId: string;
  propertyAddress: string;
  category: AgencyTransactionCategory;
  type: AgencyTransactionType;
  amount: number;
  date: string;
  description: string;
  notes?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  paymentMethod?: "cash" | "bank-transfer" | "cheque" | "online";
  paymentReference?: string;
  purchaseCycleId?: string;
  sellCycleId?: string;
  dealId?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
}
