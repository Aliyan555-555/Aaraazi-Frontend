// ============================================
// ACCOUNTING TYPES
// ============================================

/**
 * Account types for classification in Chart of Accounts
 */
export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

/**
 * Normal balance for each account type (for double-entry validation)
 */
export type NormalBalance = "debit" | "credit";

/**
 * Individual account balance in Trial Balance
 */
export interface AccountBalance {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
  normalBalance: NormalBalance;
}

/**
 * Trial Balance Report
 * Shows all accounts with their debit/credit balances
 * Validates that total debits = total credits
 */
export interface TrialBalance {
  id: string;
  asOfDate: string;
  accounts: AccountBalance[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  difference: number;
  generatedAt: string;
  generatedBy: string;
}

/**
 * Equity transaction types
 */
export type EquityTransactionType =
  | "owner-contribution" // Owner invests cash/assets
  | "owner-withdrawal" // Owner withdraws cash/assets
  | "dividend" // Profit distribution to owners
  | "net-income" // Profit from operations (from P&L)
  | "net-loss"; // Loss from operations (from P&L)

/**
 * Equity transaction record
 * Tracks changes in owner's equity
 */
export interface EquityTransaction {
  id: string;
  date: string;
  type: EquityTransactionType;
  amount: number;
  description: string;
  notes?: string;

  // Optional owner tracking (for multi-owner businesses)
  ownerId?: string;
  ownerName?: string;

  // Payment details
  paymentMethod?:
    | "cash"
    | "bank-transfer"
    | "cheque"
    | "online"
    | "asset-transfer";
  referenceNumber?: string;

  // Link to related transactions
  journalEntryId?: string;
  plReportId?: string; // If from net income/loss

  // Audit trail
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Statement of Changes in Equity
 * Shows how equity changed during a period
 */
export interface ChangesInEquity {
  id: string;
  period: {
    startDate: string;
    endDate: string;
  };

  // Beginning balance
  beginningBalance: number;

  // Changes during period
  netIncome: number; // From P&L Statement (positive = profit)
  contributions: number; // Owner investments
  withdrawals: number; // Owner withdrawals
  dividends: number; // Profit distributions

  // Ending balance
  endingBalance: number; // Beginning + netIncome + contributions - withdrawals - dividends

  // Detailed transactions
  transactions: EquityTransaction[];

  // Metadata
  generatedAt: string;
  generatedBy: string;
}

/**
 * Individual line in a journal entry
 */
export interface JournalEntryLine {
  accountName: string;
  accountType: "assets" | "liabilities" | "equity" | "revenue" | "expenses";
  description: string;
  debit: number;
  credit: number;
  propertyId?: string;
}

/**
 * Journal Entry (if not already defined elsewhere)
 * For double-entry bookkeeping
 */
export interface JournalEntry {
  id: string;
  date: string;
  description: string;

  // SUPPORT BOTH FORMATS (Flat and Nested)
  // Double-entry accounts (Flat format used in data.ts)
  debitAccount?: string;
  debitAmount?: number;
  creditAccount?: string;
  creditAmount?: number;
  amount?: number; // Total amount for flat entry
  reference?: string;

  // Nested format (used in accounting.ts library for complex reports)
  entries?: JournalEntryLine[];

  // Common details
  referenceNumber?: string;
  notes?: string;

  // Status
  status: "draft" | "posted" | "reversed";
  reversalOfEntryId?: string; // If this reverses another entry
  reversedByEntryId?: string; // If this was reversed by another entry

  // Source tracking
  sourceType?:
    | "manual"
    | "property-sale"
    | "commission"
    | "expense"
    | "payment"
    | "equity"
    | "other";
  sourceId?: string; // ID of the originating transaction

  // Audit trail
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  postedAt?: string;
  postedBy?: string;
}

/**
 * Account Payment (if not already defined elsewhere)
 * For tracking receivables and payables
 */
export interface AccountPayment {
  id: string;
  date: string;
  dueDate?: string; // Expected by aged reports

  // Transaction classification
  transactionType: "payment-received" | "payment-made";
  type?: "payment-received" | "payment-made" | "receivable" | "payable"; // Enhanced for compatibility
  category:
    | "commission"
    | "expense"
    | "rent"
    | "sale-proceed"
    | "purchase-payment"
    | "other";

  // Financial details
  amount: number;
  description: string;

  // Party information
  partyType:
    | "contact"
    | "vendor"
    | "buyer"
    | "seller"
    | "tenant"
    | "landlord"
    | "other";
  partyId?: string;
  partyName: string;
  payee?: string; // Alias for compatibility

  // Payment details
  paymentMethod: "cash" | "bank-transfer" | "cheque" | "online";
  paymentDate: string;
  referenceNumber?: string;
  bankAccount?: string;
  chequeNumber?: string;

  // Linked entities
  propertyId?: string;
  propertyAddress?: string;
  dealId?: string;
  commissionId?: string;
  expenseId?: string;

  // Reconciliation
  status: "pending" | "cleared" | "reconciled" | "cancelled";
  reconciledAt?: string;
  reconciledBy?: string;

  // Receipt/proof
  receiptUrl?: string;
  receiptNumber?: string;

  // Audit trail
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  agentId?: string;
}

/**
 * Chart of Accounts
 * Standard account structure for the real estate agency
 */
export interface ChartOfAccounts {
  assets: {
    code: string;
    name: string;
    subAccounts: {
      cashAndBank: { code: string; name: string };
      accountsReceivable: { code: string; name: string };
      propertyInventory: { code: string; name: string };
      prepaidExpenses: { code: string; name: string };
      otherAssets: { code: string; name: string };
    };
  };
  liabilities: {
    code: string;
    name: string;
    subAccounts: {
      accountsPayable: { code: string; name: string };
      accruedExpenses: { code: string; name: string };
      deposits: { code: string; name: string };
      otherLiabilities: { code: string; name: string };
    };
  };
  equity: {
    code: string;
    name: string;
    subAccounts: {
      ownerCapital: { code: string; name: string };
      retainedEarnings: { code: string; name: string };
      currentYearEarnings: { code: string; name: string };
    };
  };
  revenue: {
    code: string;
    name: string;
    subAccounts: {
      commissionIncome: { code: string; name: string };
      rentalIncome: { code: string; name: string };
      consultingFees: { code: string; name: string };
      otherIncome: { code: string; name: string };
    };
  };
  expenses: {
    code: string;
    name: string;
    subAccounts: {
      salaries: { code: string; name: string };
      marketing: { code: string; name: string };
      officeExpenses: { code: string; name: string };
      utilities: { code: string; name: string };
      transportation: { code: string; name: string };
      professionalFees: { code: string; name: string };
      depreciation: { code: string; name: string };
      otherExpenses: { code: string; name: string };
    };
  };
}

/**
 * Accounting Period
 * For closing books and generating period-end reports
 */
export interface AccountingPeriod {
  id: string;
  name: string; // e.g., "Q1 2024", "December 2024"
  startDate: string;
  endDate: string;
  fiscalYear: number;
  quarter?: 1 | 2 | 3 | 4;
  month?: number; // 1-12

  // Period status
  status: "open" | "closed" | "locked";
  closedAt?: string;
  closedBy?: string;

  // Period summaries (cached for performance)
  totalRevenue?: number;
  totalExpenses?: number;
  netIncome?: number;

  // Metadata
  createdAt: string;
  createdBy: string;
}

/**
 * Accounting Settings
 * Configuration for the accounting system
 */
export interface AccountingSettings {
  // Chart of Accounts
  useStandardChartOfAccounts: boolean;
  customChartOfAccounts?: ChartOfAccounts;

  // Fiscal period
  fiscalYearStart: number; // Month (1-12), e.g., 1 = January, 7 = July

  // Currency and formatting
  baseCurrency: string; // e.g., "PKR"
  decimalPlaces: number; // Usually 2 for PKR

  // Accounting method
  accountingMethod: "cash" | "accrual";

  // Auto-generation settings
  autoGenerateJournalEntries: boolean;
  requireJournalEntryApproval: boolean;

  // Tax settings
  taxEnabled: boolean;
  defaultTaxRate?: number;

  // Audit trail
  requireApprovalForReversal: boolean;
  lockPeriodAfterDays: number; // Auto-lock periods after N days
}
