/**
 * Accounting Library (Stub)
 * Functions for Trial Balance and Statement of Changes in Equity
 */

import type {
  TrialBalance,
  ChangesInEquity,
  EquityTransaction,
  AccountType,
  NormalBalance,
} from '../types';

// ============================================
// CHART OF ACCOUNTS MAPPING
// ============================================

/**
 * Standard Chart of Accounts for Real Estate Agency
 */
export const CHART_OF_ACCOUNTS: Record<string, { code: string; type: AccountType; normalBalance: NormalBalance }> = {
  // ASSETS (Normal Balance: Debit)
  'Cash & Bank': { code: '1000', type: 'asset' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Accounts Receivable': { code: '1100', type: 'asset' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Property Inventory': { code: '1200', type: 'asset' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Prepaid Expenses': { code: '1300', type: 'asset' as AccountType, normalBalance: 'debit' as NormalBalance },

  // LIABILITIES (Normal Balance: Credit)
  'Accounts Payable': { code: '2000', type: 'liability' as AccountType, normalBalance: 'credit' as NormalBalance },
  'Accrued Expenses': { code: '2100', type: 'liability' as AccountType, normalBalance: 'credit' as NormalBalance },
  'Customer Deposits': { code: '2200', type: 'liability' as AccountType, normalBalance: 'credit' as NormalBalance },

  // EQUITY (Normal Balance: Credit)
  'Owner\'s Capital': { code: '3000', type: 'equity' as AccountType, normalBalance: 'credit' as NormalBalance },
  'Retained Earnings': { code: '3100', type: 'equity' as AccountType, normalBalance: 'credit' as NormalBalance },
  'Current Year Earnings': { code: '3200', type: 'equity' as AccountType, normalBalance: 'credit' as NormalBalance },

  // REVENUE (Normal Balance: Credit)
  'Commission Revenue': { code: '4000', type: 'revenue' as AccountType, normalBalance: 'credit' as NormalBalance },
  'Rental Income': { code: '4100', type: 'revenue' as AccountType, normalBalance: 'credit' as NormalBalance },
  'Consulting Fees': { code: '4200', type: 'revenue' as AccountType, normalBalance: 'credit' as NormalBalance },
  'Other Income': { code: '4900', type: 'revenue' as AccountType, normalBalance: 'credit' as NormalBalance },

  // EXPENSES (Normal Balance: Debit)
  'Salaries & Wages': { code: '5000', type: 'expense' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Marketing & Advertising': { code: '5100', type: 'expense' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Office Expenses': { code: '5200', type: 'expense' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Utilities': { code: '5300', type: 'expense' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Transportation': { code: '5400', type: 'expense' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Professional Fees': { code: '5500', type: 'expense' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Insurance': { code: '5600', type: 'expense' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Depreciation': { code: '5700', type: 'expense' as AccountType, normalBalance: 'debit' as NormalBalance },
  'Other Expenses': { code: '5900', type: 'expense' as AccountType, normalBalance: 'debit' as NormalBalance },
};

/**
 * Get account information from chart of accounts
 */
export function getAccountInfo(accountName: string) {
  return (CHART_OF_ACCOUNTS as any)[accountName] || {
    code: '9999',
    type: 'expense' as AccountType,
    normalBalance: 'debit' as NormalBalance
  };
}

// ============================================
// TRIAL BALANCE GENERATION (STUBS)
// ============================================

export function generateTrialBalance(
  asOfDate: string,
  userId: string,
  userRole: string
): TrialBalance {
  return {
    id: `TB-${Date.now()}`,
    asOfDate,
    accounts: [],
    totalDebits: 0,
    totalCredits: 0,
    isBalanced: true,
    difference: 0,
    generatedAt: new Date().toISOString(),
    generatedBy: userId
  };
}

export function exportTrialBalanceToCSV(_trialBalance: TrialBalance): string {
  return '';
}

// ============================================
// EQUITY TRANSACTIONS (STUBS)
// ============================================

export function getEquityTransactions(_userId?: string, _userRole?: string): EquityTransaction[] {
  return [];
}

export function addEquityTransaction(
  transaction: Omit<EquityTransaction, 'id' | 'createdAt'>
): EquityTransaction {
  return {
    ...transaction,
    id: `EQ-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
}

export function deleteEquityTransaction(_id: string): boolean {
  return false;
}

// ============================================
// STATEMENT OF CHANGES IN EQUITY (STUB)
// ============================================

export function generateChangesInEquity(
  startDate: string,
  endDate: string,
  userId: string,
  _userRole: string,
  _netIncomeFromPL: number
): ChangesInEquity {
  return {
    id: `CE-${Date.now()}`,
    period: { startDate, endDate },
    beginningBalance: 0,
    netIncome: 0,
    contributions: 0,
    withdrawals: 0,
    dividends: 0,
    endingBalance: 0,
    transactions: [],
    generatedAt: new Date().toISOString(),
    generatedBy: userId
  };
}

export function exportChangesInEquityToCSV(_report: ChangesInEquity): string {
  return '';
}

// ============================================
// HELPER FUNCTIONS (STUBS)
// ============================================

export function getNetIncomeForPeriod(
  _startDate: string,
  _endDate: string,
  _userId: string,
  _userRole: string
): number {
  return 0;
}

export function getAccountBalance(
  _accountName: string,
  _asOfDate: string,
  _userId: string,
  _userRole: string
): { debit: number; credit: number; balance: number } {
  return { debit: 0, credit: 0, balance: 0 };
}

// ============================================
// PROFIT & LOSS STATEMENT (STUB)
// ============================================

export interface ProfitAndLoss {
  id: string;
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    commissionRevenue: number;
    rentalIncome: number;
    consultingFees: number;
    otherIncome: number;
    totalRevenue: number;
  };
  expenses: {
    salariesWages: number;
    marketingAdvertising: number;
    officeExpenses: number;
    utilities: number;
    depreciation: number;
    otherExpenses: number;
    totalExpenses: number;
  };
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  generatedAt: string;
  generatedBy: string;
}

export function generateProfitAndLoss(
  startDate: string,
  endDate: string,
  userId: string,
  _userRole: string
): ProfitAndLoss {
  return {
    id: `PL-${Date.now()}`,
    period: { startDate, endDate },
    revenue: {
      commissionRevenue: 0,
      rentalIncome: 0,
      consultingFees: 0,
      otherIncome: 0,
      totalRevenue: 0,
    },
    expenses: {
      salariesWages: 0,
      marketingAdvertising: 0,
      officeExpenses: 0,
      utilities: 0,
      depreciation: 0,
      otherExpenses: 0,
      totalExpenses: 0,
    },
    grossProfit: 0,
    operatingIncome: 0,
    netIncome: 0,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// BALANCE SHEET (STUB)
// ============================================

export interface BalanceSheet {
  id: string;
  asOfDate: string;
  assets: {
    currentAssets: {
      cashAndBank: number;
      accountsReceivable: number;
      prepaidExpenses: number;
      totalCurrentAssets: number;
    };
    nonCurrentAssets: {
      propertyInventory: number;
      fixedAssets: number;
      totalNonCurrentAssets: number;
    };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
      accruedExpenses: number;
      customerDeposits: number;
      totalCurrentLiabilities: number;
    };
    longTermLiabilities: {
      loansPayable: number;
      totalLongTermLiabilities: number;
    };
    totalLiabilities: number;
  };
  equity: {
    ownersCapital: number;
    retainedEarnings: number;
    currentYearEarnings: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  generatedAt: string;
  generatedBy: string;
}

export function generateBalanceSheet(
  asOfDate: string,
  userId: string,
  _userRole: string
): BalanceSheet {
  return {
    id: `BS-${Date.now()}`,
    asOfDate,
    assets: {
      currentAssets: {
        cashAndBank: 0,
        accountsReceivable: 0,
        prepaidExpenses: 0,
        totalCurrentAssets: 0,
      },
      nonCurrentAssets: {
        propertyInventory: 0,
        fixedAssets: 0,
        totalNonCurrentAssets: 0,
      },
      totalAssets: 0,
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: 0,
        accruedExpenses: 0,
        customerDeposits: 0,
        totalCurrentLiabilities: 0,
      },
      longTermLiabilities: {
        loansPayable: 0,
        totalLongTermLiabilities: 0,
      },
      totalLiabilities: 0,
    },
    equity: {
      ownersCapital: 0,
      retainedEarnings: 0,
      currentYearEarnings: 0,
      totalEquity: 0,
    },
    totalLiabilitiesAndEquity: 0,
    isBalanced: true,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// CASH FLOW STATEMENT (STUB)
// ============================================

export interface CashFlowStatement {
  id: string;
  period: {
    startDate: string;
    endDate: string;
  };
  operatingActivities: {
    netIncome: number;
    adjustments: {
      depreciation: number;
      accountsReceivableChange: number;
      accountsPayableChange: number;
      totalAdjustments: number;
    };
    netCashFromOperating: number;
  };
  investingActivities: {
    propertyPurchases: number;
    propertyDisposals: number;
    netCashFromInvesting: number;
  };
  financingActivities: {
    ownerContributions: number;
    ownerWithdrawals: number;
    loanProceeds: number;
    loanRepayments: number;
    netCashFromFinancing: number;
  };
  netCashChange: number;
  beginningCash: number;
  endingCash: number;
  generatedAt: string;
  generatedBy: string;
}

export function generateCashFlowStatement(
  startDate: string,
  endDate: string,
  userId: string,
  _userRole: string
): CashFlowStatement {
  return {
    id: `CF-${Date.now()}`,
    period: { startDate, endDate },
    operatingActivities: {
      netIncome: 0,
      adjustments: {
        depreciation: 0,
        accountsReceivableChange: 0,
        accountsPayableChange: 0,
        totalAdjustments: 0,
      },
      netCashFromOperating: 0,
    },
    investingActivities: {
      propertyPurchases: 0,
      propertyDisposals: 0,
      netCashFromInvesting: 0,
    },
    financingActivities: {
      ownerContributions: 0,
      ownerWithdrawals: 0,
      loanProceeds: 0,
      loanRepayments: 0,
      netCashFromFinancing: 0,
    },
    netCashChange: 0,
    beginningCash: 0,
    endingCash: 0,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// COMMISSION REPORT (STUB)
// ============================================

export interface CommissionReport {
  id: string;
  period: {
    startDate: string;
    endDate: string;
  };
  commissions: Array<{
    propertyId: string;
    propertyTitle: string;
    dealType: 'sale' | 'rental';
    dealValue: number;
    commissionRate: number;
    commissionAmount: number;
    agentId: string;
    agentName: string;
    closedDate: string;
  }>;
  summary: {
    totalDeals: number;
    totalDealValue: number;
    totalCommission: number;
    averageCommissionRate: number;
    salesCommission: number;
    rentalCommission: number;
  };
  byAgent: Array<{
    agentId: string;
    agentName: string;
    dealsCount: number;
    totalCommission: number;
  }>;
  generatedAt: string;
  generatedBy: string;
}

export function generateCommissionReport(
  startDate: string,
  endDate: string,
  userId: string,
  _userRole: string
): CommissionReport {
  return {
    id: `CR-${Date.now()}`,
    period: { startDate, endDate },
    commissions: [],
    summary: {
      totalDeals: 0,
      totalDealValue: 0,
      totalCommission: 0,
      averageCommissionRate: 0,
      salesCommission: 0,
      rentalCommission: 0,
    },
    byAgent: [],
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// EXPENSE SUMMARY REPORT (STUB)
// ============================================

export interface ExpenseSummaryReport {
  id: string;
  period: {
    startDate: string;
    endDate: string;
  };
  expenses: Array<{
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    paymentMethod: string;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    total: number;
    percentage: number;
  }>;
  byMonth: Array<{
    month: string;
    total: number;
  }>;
  summary: {
    totalExpenses: number;
    transactionCount: number;
    averageExpense: number;
    largestCategory: string;
    largestCategoryAmount: number;
  };
  generatedAt: string;
  generatedBy: string;
}

export function generateExpenseSummaryReport(
  startDate: string,
  endDate: string,
  userId: string,
  _userRole: string
): ExpenseSummaryReport {
  return {
    id: `ES-${Date.now()}`,
    period: { startDate, endDate },
    expenses: [],
    byCategory: [],
    byMonth: [],
    summary: {
      totalExpenses: 0,
      transactionCount: 0,
      averageExpense: 0,
      largestCategory: 'N/A',
      largestCategoryAmount: 0,
    },
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// PROPERTY PERFORMANCE REPORT (STUB)
// ============================================

export interface PropertyPerformanceReport {
  id: string;
  period: {
    startDate: string;
    endDate: string;
  };
  properties: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    listingDate: string;
    soldDate?: string;
    daysOnMarket: number;
    listPrice: number;
    soldPrice?: number;
    priceChange: number;
    priceChangePercentage: number;
    commissionEarned: number;
    agentName: string;
  }>;
  summary: {
    totalProperties: number;
    activeListing: number;
    soldProperties: number;
    averageDaysOnMarket: number;
    averagePriceReduction: number;
    totalCommissionEarned: number;
    conversionRate: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  topPerformers: Array<{
    id: string;
    title: string;
    commissionEarned: number;
    daysOnMarket: number;
  }>;
  generatedAt: string;
  generatedBy: string;
}

export function generatePropertyPerformanceReport(
  startDate: string,
  endDate: string,
  userId: string,
  _userRole: string
): PropertyPerformanceReport {
  return {
    id: `PP-${Date.now()}`,
    period: { startDate, endDate },
    properties: [],
    summary: {
      totalProperties: 0,
      activeListing: 0,
      soldProperties: 0,
      averageDaysOnMarket: 0,
      averagePriceReduction: 0,
      totalCommissionEarned: 0,
      conversionRate: 0,
    },
    byStatus: [],
    topPerformers: [],
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// INVESTOR DISTRIBUTION REPORT (STUB)
// ============================================

export interface InvestorDistributionReport {
  id: string;
  period: {
    startDate: string;
    endDate: string;
  };
  distributions: Array<{
    investorId: string;
    investorName: string;
    propertyId: string;
    propertyTitle: string;
    investmentAmount: number;
    ownershipPercentage: number;
    distributionAmount: number;
    distributionDate: string;
    roi: number;
  }>;
  summary: {
    totalInvestors: number;
    totalDistributed: number;
    totalInvestmentCapital: number;
    averageROI: number;
    largestDistribution: number;
  };
  byInvestor: Array<{
    investorId: string;
    investorName: string;
    distributionsCount: number;
    totalDistributed: number;
    totalInvested: number;
    roi: number;
  }>;
  generatedAt: string;
  generatedBy: string;
}

export function generateInvestorDistributionReport(
  startDate: string,
  endDate: string,
  userId: string,
  _userRole: string
): InvestorDistributionReport {
  return {
    id: `ID-${Date.now()}`,
    period: { startDate, endDate },
    distributions: [],
    summary: {
      totalInvestors: 0,
      totalDistributed: 0,
      totalInvestmentCapital: 0,
      averageROI: 0,
      largestDistribution: 0,
    },
    byInvestor: [],
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// REPORT COMPARISON UTILITIES
// ============================================

export interface ReportComparison {
  type: 'YoY' | 'MoM' | 'Custom';
  current: any;
  previous: any;
  changes: {
    [key: string]: {
      current: number;
      previous: number;
      change: number;
      changePercentage: number;
    };
  };
}

export function compareProfitAndLoss(
  current: ProfitAndLoss,
  previous: ProfitAndLoss
): ReportComparison {
  const zero = { current: 0, previous: 0, change: 0, changePercentage: 0 };
  return {
    type: 'YoY',
    current,
    previous,
    changes: {
      totalRevenue: zero,
      totalExpenses: zero,
      netIncome: zero,
      commissionRevenue: zero,
      operatingIncome: zero,
    },
  };
}

export function compareBalanceSheets(
  current: BalanceSheet,
  previous: BalanceSheet
): ReportComparison {
  const zero = { current: 0, previous: 0, change: 0, changePercentage: 0 };
  return {
    type: 'YoY',
    current,
    previous,
    changes: {
      totalAssets: zero,
      totalLiabilities: zero,
      totalEquity: zero,
      cashAndBank: zero,
      currentAssets: zero,
    },
  };
}

export function getYoYDateRanges(currentStart: string, currentEnd: string): {
  current: { start: string; end: string };
  previous: { start: string; end: string };
} {
  const currentStartDate = new Date(currentStart);
  const currentEndDate = new Date(currentEnd);

  const previousStartDate = new Date(currentStartDate);
  previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);

  const previousEndDate = new Date(currentEndDate);
  previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);

  return {
    current: {
      start: currentStart,
      end: currentEnd,
    },
    previous: {
      start: previousStartDate.toISOString().split('T')[0],
      end: previousEndDate.toISOString().split('T')[0],
    },
  };
}

export function getMoMDateRanges(currentStart: string, currentEnd: string): {
  current: { start: string; end: string };
  previous: { start: string; end: string };
} {
  const currentStartDate = new Date(currentStart);
  const currentEndDate = new Date(currentEnd);

  const previousStartDate = new Date(currentStartDate);
  previousStartDate.setMonth(previousStartDate.getMonth() - 1);

  const previousEndDate = new Date(currentEndDate);
  previousEndDate.setMonth(previousEndDate.getMonth() - 1);

  return {
    current: {
      start: currentStart,
      end: currentEnd,
    },
    previous: {
      start: previousStartDate.toISOString().split('T')[0],
      end: previousEndDate.toISOString().split('T')[0],
    },
  };
}

// ============================================
// TAX SUMMARY REPORT (STUB)
// ============================================

export interface TaxSummaryReport {
  period: {
    startDate: string;
    endDate: string;
    fiscalYear: number;
  };
  propertyTax: {
    total: number;
    byProperty: Array<{
      propertyId: string;
      propertyTitle: string;
      assessedValue: number;
      taxRate: number;
      taxAmount: number;
    }>;
  };
  incomeTax: {
    grossIncome: number;
    allowableDeductions: number;
    taxableIncome: number;
    taxRate: number;
    taxOwed: number;
  };
  capitalGainsTax: {
    shortTerm: Array<{
      propertyId: string;
      salePrice: number;
      costBasis: number;
      gain: number;
      taxRate: number;
      tax: number;
    }>;
    longTerm: Array<{
      propertyId: string;
      salePrice: number;
      costBasis: number;
      gain: number;
      taxRate: number;
      tax: number;
    }>;
    totalShortTermTax: number;
    totalLongTermTax: number;
  };
  withholdingTax: {
    salaries: number;
    commissions: number;
    contractorPayments: number;
    total: number;
  };
  totalTaxLiability: number;
  estimatedPayments: number;
  balanceDue: number;
  generatedAt: string;
}

export function generateTaxSummaryReport(
  startDate: string,
  endDate: string,
  _userId: string,
  _userRole: string = 'agent'
): TaxSummaryReport {
  const fiscalYear = new Date(startDate).getFullYear();
  return {
    period: {
      startDate,
      endDate,
      fiscalYear
    },
    propertyTax: {
      total: 0,
      byProperty: []
    },
    incomeTax: {
      grossIncome: 0,
      allowableDeductions: 0,
      taxableIncome: 0,
      taxRate: 0,
      taxOwed: 0
    },
    capitalGainsTax: {
      shortTerm: [],
      longTerm: [],
      totalShortTermTax: 0,
      totalLongTermTax: 0
    },
    withholdingTax: {
      salaries: 0,
      commissions: 0,
      contractorPayments: 0,
      total: 0
    },
    totalTaxLiability: 0,
    estimatedPayments: 0,
    balanceDue: 0,
    generatedAt: new Date().toISOString()
  };
}

// ============================================
// AGED RECEIVABLES & PAYABLES (STUBS)
// ============================================

export interface AgedLine {
  id: string;
  entityType: 'deal' | 'cycle' | 'commission';
  entityId: string;
  description: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  contactId: string;
  contactName: string;
}

export interface AgedReport {
  asOfDate: string;
  type: 'receivables' | 'payables';
  current: {
    items: AgedLine[];
    total: number;
    count: number;
  };
  days1to30: {
    items: AgedLine[];
    total: number;
    count: number;
  };
  days31to60: {
    items: AgedLine[];
    total: number;
    count: number;
  };
  days61to90: {
    items: AgedLine[];
    total: number;
    count: number;
  };
  days90Plus: {
    items: AgedLine[];
    total: number;
    count: number;
  };
  grandTotal: number;
  overdueTotal: number;
  overduePercentage: number;
}

export function generateAgedReceivables(
  asOfDate: string,
  _userId: string,
  _userRole: string = 'agent'
): AgedReport {
  return {
    asOfDate,
    type: 'receivables',
    current: { items: [], total: 0, count: 0 },
    days1to30: { items: [], total: 0, count: 0 },
    days31to60: { items: [], total: 0, count: 0 },
    days61to90: { items: [], total: 0, count: 0 },
    days90Plus: { items: [], total: 0, count: 0 },
    grandTotal: 0,
    overdueTotal: 0,
    overduePercentage: 0
  };
}

export function generateAgedPayables(
  asOfDate: string,
  _userId: string,
  _userRole: string = 'agent'
): AgedReport {
  return {
    asOfDate,
    type: 'payables',
    current: { items: [], total: 0, count: 0 },
    days1to30: { items: [], total: 0, count: 0 },
    days31to60: { items: [], total: 0, count: 0 },
    days61to90: { items: [], total: 0, count: 0 },
    days90Plus: { items: [], total: 0, count: 0 },
    grandTotal: 0,
    overdueTotal: 0,
    overduePercentage: 0
  };
}
