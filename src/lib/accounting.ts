/**
 * Accounting Library
 * Functions for Trial Balance and Statement of Changes in Equity
 */

import {
  TrialBalance,
  AccountBalance,
  ChangesInEquity,
  EquityTransaction,
  AccountType,
  NormalBalance,
  JournalEntry,
  Expense
} from '../types';
import { Property } from '../types/properties';
import { getJournalEntries, getAccountPayments, getPropertyById } from './data';
import { getProperties, getExpenses } from './data';
import { getDeals } from './deals';

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

/** General Ledger storage key (same as GeneralLedgerWorkspace) */
const GENERAL_LEDGER_KEY = 'general_ledger_entries';

/** Map General Ledger account names to Balance Sheet account names */
const LEDGER_TO_BS_ACCOUNT: Record<string, string> = {
  'Cash': 'Cash & Bank',
  'Bank Account': 'Cash & Bank',
  'Accounts Receivable': 'Accounts Receivable',
  'Commission Receivable': 'Accounts Receivable',
  'Property Inventory': 'Property Inventory',
  'Accounts Payable': 'Accounts Payable',
  'Commission Payable': 'Accrued Expenses',
  'Expenses Payable': 'Accrued Expenses',
  'Investor Distributions Payable': 'Customer Deposits',
  'Owner Equity': "Owner's Capital",
  'Retained Earnings': 'Retained Earnings',
  'Commission Revenue': 'Current Year Earnings',
  'Property Sales Revenue': 'Current Year Earnings',
  'Rental Revenue': 'Current Year Earnings',
  'Operating Expenses': 'Current Year Earnings',
  'Marketing Expenses': 'Current Year Earnings',
  'Salaries & Wages': 'Current Year Earnings',
  'Utilities': 'Current Year Earnings',
  'Office Rent': 'Current Year Earnings',
};

/** Asset/equity normal debit; liability/revenue normal credit. Expenses reduce equity (debit). */
const LEDGER_ACCOUNT_NORMAL: Record<string, 'debit' | 'credit'> = {
  'Cash': 'debit', 'Bank Account': 'debit', 'Accounts Receivable': 'debit', 'Commission Receivable': 'debit',
  'Property Inventory': 'debit',
  'Accounts Payable': 'credit', 'Commission Payable': 'credit', 'Expenses Payable': 'credit', 'Investor Distributions Payable': 'credit',
  'Owner Equity': 'credit', 'Retained Earnings': 'credit',
  'Commission Revenue': 'credit', 'Property Sales Revenue': 'credit', 'Rental Revenue': 'credit',
  'Operating Expenses': 'debit', 'Marketing Expenses': 'debit', 'Salaries & Wages': 'debit', 'Utilities': 'debit', 'Office Rent': 'debit',
};

/**
 * Get balances from General Ledger (general_ledger_entries) as of date.
 * Maps LedgerEntry account names to Balance Sheet accounts and aggregates.
 */
function getLedgerBalancesAsOf(asOfDate: string): Record<string, number> {
  const result: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(GENERAL_LEDGER_KEY);
    const entries: Array<{ date: string; accountName: string; debit: number; credit: number }> = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(entries)) return result;

    const asOf = new Date(asOfDate);
    const byBsAccount = new Map<string, number>();

    entries
      .filter(e => new Date(e.date) <= asOf)
      .forEach(e => {
        const bs = LEDGER_TO_BS_ACCOUNT[e.accountName];
        if (!bs) return;
        const d = e.debit || 0;
        const c = e.credit || 0;
        const balance = bs === 'Current Year Earnings'
          ? c - d
          : (LEDGER_ACCOUNT_NORMAL[e.accountName] ?? 'debit') === 'debit'
            ? d - c
            : c - d;
        byBsAccount.set(bs, (byBsAccount.get(bs) ?? 0) + balance);
      });

    byBsAccount.forEach((v, k) => { result[k] = v; });
  } catch (_) { /* ignore */ }
  return result;
}

// ============================================
// TRIAL BALANCE GENERATION
// ============================================

/**
 * Generate Trial Balance as of a specific date
 * Shows all accounts with their debit/credit balances
 * Validates that total debits = total credits
 */
export function generateTrialBalance(
  asOfDate: string,
  userId: string,
  userRole: string
): TrialBalance {
  const accountBalances: { [accountName: string]: AccountBalance } = {};

  // Initialize all accounts with zero balances
  Object.keys(CHART_OF_ACCOUNTS).forEach(accountName => {
    const accountInfo = (CHART_OF_ACCOUNTS as any)[accountName];
    accountBalances[accountName] = {
      accountCode: accountInfo.code,
      accountName: accountName,
      accountType: accountInfo.type,
      debitBalance: 0,
      creditBalance: 0,
      normalBalance: accountInfo.normalBalance
    };
  });

  // Get all journal entries up to the as-of date
  const journalEntries = getJournalEntries(userId, userRole)
    .filter(entry =>
      entry.status === 'posted' &&
      new Date(entry.date) <= new Date(asOfDate)
    );

  // Process each journal entry
  journalEntries.forEach(entry => {
    // Debit side
    if (entry.debitAccount) {
      if (!accountBalances[entry.debitAccount]) {
        // Create account if not in chart
        accountBalances[entry.debitAccount] = {
          accountCode: '9999',
          accountName: entry.debitAccount,
          accountType: 'expense',
          debitBalance: 0,
          creditBalance: 0,
          normalBalance: 'debit'
        };
      }
      accountBalances[entry.debitAccount].debitBalance += entry.debitAmount || 0;
    }

    // Credit side
    if (entry.creditAccount) {
      if (!accountBalances[entry.creditAccount]) {
        // Create account if not in chart
        accountBalances[entry.creditAccount] = {
          accountCode: '9999',
          accountName: entry.creditAccount,
          accountType: 'revenue',
          debitBalance: 0,
          creditBalance: 0,
          normalBalance: 'credit'
        };
      }
      accountBalances[entry.creditAccount].creditBalance += entry.creditAmount || 0;
    }
  });

  // Calculate totals
  let totalDebits = 0;
  let totalCredits = 0;

  Object.values(accountBalances).forEach(account => {
    totalDebits += account.debitBalance;
    totalCredits += account.creditBalance;
  });

  // Calculate difference (should be 0 if balanced)
  const difference = totalDebits - totalCredits;
  const isBalanced = Math.abs(difference) < 0.01; // Allow for minor rounding errors

  // Filter out accounts with zero balances
  const accounts = Object.values(accountBalances)
    .filter(account => account.debitBalance > 0 || account.creditBalance > 0)
    .sort((a, b) => {
      // Sort by account code
      return a.accountCode.localeCompare(b.accountCode);
    });

  return {
    id: `TB-${Date.now()}`,
    asOfDate,
    accounts,
    totalDebits,
    totalCredits,
    isBalanced,
    difference,
    generatedAt: new Date().toISOString(),
    generatedBy: userId
  };
}

/**
 * Export Trial Balance to CSV format
 */
export function exportTrialBalanceToCSV(trialBalance: TrialBalance): string {
  let csv = 'Account Code,Account Name,Account Type,Debit Balance,Credit Balance\n';

  trialBalance.accounts.forEach(account => {
    csv += `${account.accountCode},"${account.accountName}",${account.accountType},`;
    csv += `${account.debitBalance.toFixed(2)},${account.creditBalance.toFixed(2)}\n`;
  });

  csv += '\n';
  csv += `Total,,,${trialBalance.totalDebits.toFixed(2)},${trialBalance.totalCredits.toFixed(2)}\n`;
  csv += `Difference,,,${trialBalance.difference.toFixed(2)},\n`;
  csv += `Balanced?,,,${trialBalance.isBalanced ? 'Yes' : 'No'},\n`;

  return csv;
}

// ============================================
// EQUITY TRANSACTIONS
// ============================================

const EQUITY_TRANSACTIONS_KEY = 'equity_transactions';

/**
 * Get all equity transactions
 */
export function getEquityTransactions(userId?: string, userRole?: string): EquityTransaction[] {
  try {
    const stored = localStorage.getItem(EQUITY_TRANSACTIONS_KEY);
    const transactions = stored ? JSON.parse(stored) : [];

    if (!Array.isArray(transactions)) {
      return [];
    }

    // Admin sees all, others see only their own
    if (userRole === 'admin') {
      return transactions;
    }

    if (userId) {
      return transactions.filter(t => t.createdBy === userId);
    }

    return transactions;
  } catch (error) {
    console.error('Error getting equity transactions:', error);
    return [];
  }
}

/**
 * Add equity transaction
 */
export function addEquityTransaction(
  transaction: Omit<EquityTransaction, 'id' | 'createdAt'>
): EquityTransaction {
  const transactions = getEquityTransactions();

  const newTransaction: EquityTransaction = {
    ...transaction,
    id: `EQ-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  transactions.push(newTransaction);
  localStorage.setItem(EQUITY_TRANSACTIONS_KEY, JSON.stringify(transactions));

  return newTransaction;
}

/**
 * Delete equity transaction
 */
export function deleteEquityTransaction(id: string): boolean {
  try {
    const transactions = getEquityTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    localStorage.setItem(EQUITY_TRANSACTIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting equity transaction:', error);
    return false;
  }
}

// ============================================
// STATEMENT OF CHANGES IN EQUITY
// ============================================

/**
 * Generate Statement of Changes in Equity
 * Shows how owner's equity changed during a period
 */
export function generateChangesInEquity(
  startDate: string,
  endDate: string,
  userId: string,
  userRole: string,
  netIncomeFromPL: number
): ChangesInEquity {
  // Get equity transactions for the period
  const allTransactions = getEquityTransactions(userId, userRole);
  const periodTransactions = allTransactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= new Date(startDate) && txDate <= new Date(endDate);
  });

  // Calculate beginning balance (all transactions before start date)
  const beginningTransactions = allTransactions.filter(t =>
    new Date(t.date) < new Date(startDate)
  );

  let beginningBalance = 0;
  beginningTransactions.forEach(t => {
    if (t.type === 'owner-contribution' || t.type === 'net-income') {
      beginningBalance += t.amount;
    } else if (t.type === 'owner-withdrawal' || t.type === 'dividend' || t.type === 'net-loss') {
      beginningBalance -= t.amount;
    }
  });

  // Calculate changes during period
  let contributions = 0;
  let withdrawals = 0;
  let dividends = 0;

  periodTransactions.forEach(t => {
    switch (t.type) {
      case 'owner-contribution':
        contributions += t.amount;
        break;
      case 'owner-withdrawal':
        withdrawals += t.amount;
        break;
      case 'dividend':
        dividends += t.amount;
        break;
    }
  });

  // Calculate ending balance
  const endingBalance = beginningBalance + netIncomeFromPL + contributions - withdrawals - dividends;

  return {
    id: `CE-${Date.now()}`,
    period: {
      startDate,
      endDate
    },
    beginningBalance,
    netIncome: netIncomeFromPL,
    contributions,
    withdrawals,
    dividends,
    endingBalance,
    transactions: periodTransactions.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
    generatedAt: new Date().toISOString(),
    generatedBy: userId
  };
}

/**
 * Export Changes in Equity to CSV
 */
export function exportChangesInEquityToCSV(report: ChangesInEquity): string {
  let csv = 'Statement of Changes in Equity\n';
  csv += `Period: ${new Date(report.period.startDate).toLocaleDateString()} to ${new Date(report.period.endDate).toLocaleDateString()}\n\n`;

  csv += 'Description,Amount\n';
  csv += `Beginning Balance,${report.beginningBalance.toFixed(2)}\n`;
  csv += `Net Income for Period,${report.netIncome.toFixed(2)}\n`;
  csv += `Owner Contributions,${report.contributions.toFixed(2)}\n`;
  csv += `Owner Withdrawals,(${report.withdrawals.toFixed(2)})\n`;
  csv += `Dividends Paid,(${report.dividends.toFixed(2)})\n`;
  csv += `Ending Balance,${report.endingBalance.toFixed(2)}\n\n`;

  csv += '\nDetailed Transactions\n';
  csv += 'Date,Type,Description,Amount\n';

  report.transactions.forEach(t => {
    const sign = (t.type === 'owner-contribution' || t.type === 'net-income') ? '' : '-';
    csv += `${new Date(t.date).toLocaleDateString()},"${t.type}","${t.description}",${sign}${t.amount.toFixed(2)}\n`;
  });

  return csv;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get net income from P&L for a period
 * This would typically come from the P&L report generation
 */
export function getNetIncomeForPeriod(
  startDate: string,
  endDate: string,
  userId: string,
  userRole: string
): number {
  // Get properties and calculate commission revenue
  const properties = getProperties(userId, userRole);
  const commissionRevenue = properties
    .filter(p =>
      p.status === 'sold' &&
      p.soldDate &&
      new Date(p.soldDate) >= new Date(startDate) &&
      new Date(p.soldDate) <= new Date(endDate)
    )
    .reduce((sum, p) => sum + (p.commissionEarned || 0), 0);

  // Get expenses for the period
  const expenses = getExpenses(userId, userRole);
  const totalExpenses = expenses
    .filter(e =>
      new Date(e.date) >= new Date(startDate) &&
      new Date(e.date) <= new Date(endDate)
    )
    .reduce((sum, e) => sum + e.amount, 0);

  // Net Income = Revenue - Expenses
  return commissionRevenue - totalExpenses;
}

/**
 * Get account balance for a specific account.
 * Uses both journal_entries (double-entry) and general_ledger_entries (General Ledger manual entries).
 */
export function getAccountBalance(
  accountName: string,
  asOfDate: string,
  userId: string,
  userRole: string
): { debit: number; credit: number; balance: number } {
  const journalEntries = getJournalEntries(userId, userRole)
    .filter(entry =>
      entry.status === 'posted' &&
      new Date(entry.date) <= new Date(asOfDate)
    );

  let debit = 0;
  let credit = 0;

  journalEntries.forEach(entry => {
    if (entry.debitAccount === accountName) {
      debit += entry.debitAmount || 0;
    }
    if (entry.creditAccount === accountName) {
      credit += entry.creditAmount || 0;
    }
  });

  const accountInfo = getAccountInfo(accountName);
  let balance = accountInfo.normalBalance === 'debit'
    ? (debit - credit)
    : (credit - debit);

  const ledgerBalances = getLedgerBalancesAsOf(asOfDate);
  const ledgerBalance = ledgerBalances[accountName] ?? 0;
  balance += ledgerBalance;

  return { debit, credit, balance };
}

// ============================================
// PROFIT & LOSS STATEMENT (INCOME STATEMENT)
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
  userRole: string
): ProfitAndLoss {
  // Get all revenue and expense accounts
  const journalEntries = getJournalEntries(userId, userRole)
    .filter(entry =>
      entry.status === 'posted' &&
      new Date(entry.date) >= new Date(startDate) &&
      new Date(entry.date) <= new Date(endDate)
    );

  // Initialize revenue
  let commissionRevenue = 0;
  let rentalIncome = 0;
  let consultingFees = 0;
  let otherIncome = 0;

  // Initialize expenses
  let salariesWages = 0;
  let marketingAdvertising = 0;
  let officeExpenses = 0;
  let utilities = 0;
  let depreciation = 0;
  let otherExpenses = 0;

  // Process journal entries
  journalEntries.forEach(entry => {
    // Revenue accounts (credit increases revenue)
    if (entry.creditAccount === 'Commission Revenue') {
      commissionRevenue += entry.creditAmount || 0;
    } else if (entry.creditAccount === 'Rental Income') {
      rentalIncome += entry.creditAmount || 0;
    } else if (entry.creditAccount === 'Consulting Fees') {
      consultingFees += entry.creditAmount || 0;
    } else if (entry.creditAccount === 'Other Income') {
      otherIncome += entry.creditAmount || 0;
    }

    // Expense accounts (debit increases expenses)
    if (entry.debitAccount === 'Salaries & Wages') {
      salariesWages += entry.debitAmount || 0;
    } else if (entry.debitAccount === 'Marketing & Advertising') {
      marketingAdvertising += entry.debitAmount || 0;
    } else if (entry.debitAccount === 'Office Expenses') {
      officeExpenses += entry.debitAmount || 0;
    } else if (entry.debitAccount === 'Utilities & Communication') {
      utilities += entry.debitAmount || 0;
    } else if (entry.debitAccount === 'Depreciation') {
      depreciation += entry.debitAmount || 0;
    } else if (entry.debitAccount && CHART_OF_ACCOUNTS[entry.debitAccount]?.type === 'expense') {
      // Any other expense account
      otherExpenses += entry.debitAmount || 0;
    }
  });

  const totalRevenue = commissionRevenue + rentalIncome + consultingFees + otherIncome;
  const totalExpenses = salariesWages + marketingAdvertising + officeExpenses + utilities + depreciation + otherExpenses;
  const grossProfit = totalRevenue; // For service business, gross profit = total revenue
  const operatingIncome = grossProfit - totalExpenses;
  const netIncome = operatingIncome; // Simplified (no other income/expenses)

  return {
    id: `PL-${Date.now()}`,
    period: { startDate, endDate },
    revenue: {
      commissionRevenue,
      rentalIncome,
      consultingFees,
      otherIncome,
      totalRevenue,
    },
    expenses: {
      salariesWages,
      marketingAdvertising,
      officeExpenses,
      utilities,
      depreciation,
      otherExpenses,
      totalExpenses,
    },
    grossProfit,
    operatingIncome,
    netIncome,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// BALANCE SHEET
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
  userRole: string
): BalanceSheet {
  // Get balances for all accounts as of the date
  const cashAndBank = getAccountBalance('Cash & Bank', asOfDate, userId, userRole).balance;
  const accountsReceivable = getAccountBalance('Accounts Receivable', asOfDate, userId, userRole).balance;
  const prepaidExpenses = getAccountBalance('Prepaid Expenses', asOfDate, userId, userRole).balance;
  const propertyInventory = getAccountBalance('Property Inventory', asOfDate, userId, userRole).balance;
  const fixedAssets = 0; // Placeholder for fixed assets

  const accountsPayable = getAccountBalance('Accounts Payable', asOfDate, userId, userRole).balance;
  const accruedExpenses = getAccountBalance('Accrued Expenses', asOfDate, userId, userRole).balance;
  const customerDeposits = getAccountBalance('Customer Deposits', asOfDate, userId, userRole).balance;
  const loansPayable = 0; // Placeholder for loans

  const ownersCapital = getAccountBalance("Owner's Capital", asOfDate, userId, userRole).balance;
  const retainedEarnings = getAccountBalance('Retained Earnings', asOfDate, userId, userRole).balance;
  const currentYearEarnings = getAccountBalance('Current Year Earnings', asOfDate, userId, userRole).balance;

  // Calculate totals
  const totalCurrentAssets = cashAndBank + accountsReceivable + prepaidExpenses;
  const totalNonCurrentAssets = propertyInventory + fixedAssets;
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = accountsPayable + accruedExpenses + customerDeposits;
  const totalLongTermLiabilities = loansPayable;
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalEquity = ownersCapital + retainedEarnings + currentYearEarnings;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return {
    id: `BS-${Date.now()}`,
    asOfDate,
    assets: {
      currentAssets: {
        cashAndBank,
        accountsReceivable,
        prepaidExpenses,
        totalCurrentAssets,
      },
      nonCurrentAssets: {
        propertyInventory,
        fixedAssets,
        totalNonCurrentAssets,
      },
      totalAssets,
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable,
        accruedExpenses,
        customerDeposits,
        totalCurrentLiabilities,
      },
      longTermLiabilities: {
        loansPayable,
        totalLongTermLiabilities,
      },
      totalLiabilities,
    },
    equity: {
      ownersCapital,
      retainedEarnings,
      currentYearEarnings,
      totalEquity,
    },
    totalLiabilitiesAndEquity,
    isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// CASH FLOW STATEMENT
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
  userRole: string
): CashFlowStatement {
  // Get net income from P&L
  const plReport = generateProfitAndLoss(startDate, endDate, userId, userRole);
  const netIncome = plReport.netIncome;

  // Get depreciation from expenses
  const depreciation = plReport.expenses.depreciation;

  // Calculate changes in working capital
  // This is simplified - in reality you'd compare beginning and ending balances
  const accountsReceivableChange = 0; // Placeholder
  const accountsPayableChange = 0; // Placeholder

  const totalAdjustments = depreciation + accountsReceivableChange + accountsPayableChange;
  const netCashFromOperating = netIncome + totalAdjustments;

  // Investing activities (property transactions)
  const properties = getProperties(userId, userRole);
  const propertyPurchases = properties
    .filter(p =>
      p.createdAt &&
      new Date(p.createdAt) >= new Date(startDate) &&
      new Date(p.createdAt) <= new Date(endDate)
    )
    .reduce((sum, p) => sum + (p.price || 0), 0);

  const propertyDisposals = properties
    .filter(p =>
      p.soldDate &&
      new Date(p.soldDate) >= new Date(startDate) &&
      new Date(p.soldDate) <= new Date(endDate)
    )
    .reduce((sum, p) => sum + (p.price || 0), 0);

  const netCashFromInvesting = propertyDisposals - propertyPurchases;

  // Financing activities
  const equityTransactions = getEquityTransactions(userId, userRole)
    .filter(t =>
      new Date(t.date) >= new Date(startDate) &&
      new Date(t.date) <= new Date(endDate)
    );

  const ownerContributions = equityTransactions
    .filter(t => t.type === 'owner-contribution')
    .reduce((sum, t) => sum + t.amount, 0);

  const ownerWithdrawals = equityTransactions
    .filter(t => t.type === 'owner-withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const loanProceeds = 0; // Placeholder
  const loanRepayments = 0; // Placeholder

  const netCashFromFinancing = ownerContributions - ownerWithdrawals + loanProceeds - loanRepayments;

  // Calculate net change in cash
  const netCashChange = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;

  // Get beginning and ending cash balances
  const beginningCash = getAccountBalance('Cash & Bank', startDate, userId, userRole).balance;
  const endingCash = getAccountBalance('Cash & Bank', endDate, userId, userRole).balance;

  return {
    id: `CF-${Date.now()}`,
    period: { startDate, endDate },
    operatingActivities: {
      netIncome,
      adjustments: {
        depreciation,
        accountsReceivableChange,
        accountsPayableChange,
        totalAdjustments,
      },
      netCashFromOperating,
    },
    investingActivities: {
      propertyPurchases,
      propertyDisposals,
      netCashFromInvesting,
    },
    financingActivities: {
      ownerContributions,
      ownerWithdrawals,
      loanProceeds,
      loanRepayments,
      netCashFromFinancing,
    },
    netCashChange,
    beginningCash,
    endingCash,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// COMMISSION REPORT
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
  userRole: string
): CommissionReport {
  const deals = getDeals(userId, userRole);
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Use completedAt (set on deal completion) or timeline.actualClosingDate
  const completedInRange = deals.filter(d => {
    if (d.lifecycle.status !== 'completed') return false;
    const closed = (d.metadata as { completedAt?: string })?.completedAt ?? d.lifecycle.timeline?.actualClosingDate ?? d.lifecycle.timeline?.expectedClosingDate ?? d.lifecycle.timeline?.offerAcceptedDate;
    if (!closed) return false;
    const dte = new Date(closed);
    return dte >= start && dte <= end;
  });

  const commissions: CommissionReport['commissions'] = [];
  const dealIdsReported = new Set<string>();
  const agentToDealIds = new Map<string, Set<string>>();

  for (const deal of completedInRange) {
    const propertyId = deal.cycles?.sellCycle?.propertyId ?? (deal.cycles?.purchaseCycle as { propertyId?: string } | undefined)?.propertyId ?? '';
    const prop = propertyId ? getPropertyById(propertyId) : null;
    const propertyTitle = prop?.title ?? (propertyId ? `Property ${propertyId}` : `Deal ${deal.dealNumber}`);
    const dealValue = deal.financial.agreedPrice;
    const rate = deal.financial.commission?.rate ?? 0;
    const closedAt = (deal.metadata as { completedAt?: string })?.completedAt ?? deal.lifecycle.timeline?.actualClosingDate ?? deal.lifecycle.timeline?.expectedClosingDate ?? deal.lifecycle.timeline?.offerAcceptedDate ?? '';

    let addedForDeal = false;
    const prim = deal.financial.commission?.split?.primaryAgent;
    const sec = deal.financial.commission?.split?.secondaryAgent;

    if (prim && deal.agents?.primary && (prim.amount ?? 0) > 0) {
      dealIdsReported.add(deal.id);
      addedForDeal = true;
      if (!agentToDealIds.has(deal.agents.primary.id)) agentToDealIds.set(deal.agents.primary.id, new Set());
      agentToDealIds.get(deal.agents.primary.id)!.add(deal.id);
      commissions.push({
        propertyId,
        propertyTitle,
        dealType: 'sale',
        dealValue,
        commissionRate: rate,
        commissionAmount: prim.amount,
        agentId: deal.agents.primary.id,
        agentName: deal.agents.primary.name || 'Unknown Agent',
        closedDate: closedAt,
      });
    }

    if (sec && deal.agents?.secondary && (sec.amount ?? 0) > 0) {
      if (!dealIdsReported.has(deal.id)) dealIdsReported.add(deal.id);
      addedForDeal = true;
      if (!agentToDealIds.has(deal.agents.secondary.id)) agentToDealIds.set(deal.agents.secondary.id, new Set());
      agentToDealIds.get(deal.agents.secondary.id)!.add(deal.id);
      commissions.push({
        propertyId,
        propertyTitle,
        dealType: 'sale',
        dealValue,
        commissionRate: rate,
        commissionAmount: sec.amount,
        agentId: deal.agents.secondary.id,
        agentName: deal.agents.secondary.name || 'Unknown Agent',
        closedDate: closedAt,
      });
    }

    if (!addedForDeal) {
      const agentsArr = (deal.financial.commission as { agents?: Array<{ id: string; name?: string; amount?: number }> })?.agents;
      if (agentsArr && agentsArr.length > 0) {
        dealIdsReported.add(deal.id);
        for (const a of agentsArr) {
          const amt = a.amount ?? 0;
          if (amt <= 0) continue;
          if (!agentToDealIds.has(a.id)) agentToDealIds.set(a.id, new Set());
          agentToDealIds.get(a.id)!.add(deal.id);
          commissions.push({
            propertyId,
            propertyTitle,
            dealType: 'sale',
            dealValue,
            commissionRate: rate,
            commissionAmount: amt,
            agentId: a.id,
            agentName: a.name ?? 'Unknown Agent',
            closedDate: closedAt,
          });
        }
      } else {
        const total = deal.financial.commission?.total ?? 0;
        if (total > 0 && deal.agents?.primary) {
          dealIdsReported.add(deal.id);
          if (!agentToDealIds.has(deal.agents.primary.id)) agentToDealIds.set(deal.agents.primary.id, new Set());
          agentToDealIds.get(deal.agents.primary.id)!.add(deal.id);
          commissions.push({
            propertyId,
            propertyTitle,
            dealType: 'sale',
            dealValue,
            commissionRate: rate,
            commissionAmount: total,
            agentId: deal.agents.primary.id,
            agentName: deal.agents.primary.name || 'Unknown Agent',
            closedDate: closedAt,
          });
        }
      }
    }
  }

  const totalDeals = dealIdsReported.size;
  const totalDealValue = Array.from(dealIdsReported).reduce((sum, id) => {
    const d = completedInRange.find(x => x.id === id);
    return sum + (d?.financial.agreedPrice ?? 0);
  }, 0);
  const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const averageCommissionRate = totalDeals > 0 && totalDealValue > 0 ? (totalCommission / totalDealValue) * 100 : 0;
  const salesCommission = totalCommission; // all deal-based commission is sales
  const rentalCommission = 0;

  const byAgent = Array.from(agentToDealIds.entries()).map(([agentId, dealIds]) => {
    const rows = commissions.filter(c => c.agentId === agentId);
    const agentName = rows[0]?.agentName ?? 'Unknown Agent';
    const totalCommission = rows.reduce((s, c) => s + c.commissionAmount, 0);
    return { agentId, agentName, dealsCount: dealIds.size, totalCommission };
  }).sort((a, b) => b.totalCommission - a.totalCommission);

  return {
    id: `CR-${Date.now()}`,
    period: { startDate, endDate },
    commissions,
    summary: {
      totalDeals,
      totalDealValue,
      totalCommission,
      averageCommissionRate,
      salesCommission,
      rentalCommission,
    },
    byAgent,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// EXPENSE SUMMARY REPORT
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
  userRole: string
): ExpenseSummaryReport {
  const allExpenses = getExpenses(userId, userRole);

  // Filter expenses in the period
  const expenses = allExpenses
    .filter(e =>
      new Date(e.date) >= new Date(startDate) &&
      new Date(e.date) <= new Date(endDate)
    )
    .map(e => ({
      id: e.id,
      date: e.date,
      category: e.category,
      description: e.description || '',
      amount: e.amount,
      paymentMethod: e.paymentMethod || 'Unknown',
    }));

  // Group by category
  const categoryMap = new Map<string, { count: number; total: number }>();
  expenses.forEach(e => {
    if (!categoryMap.has(e.category)) {
      categoryMap.set(e.category, { count: 0, total: 0 });
    }
    const cat = categoryMap.get(e.category)!;
    cat.count++;
    cat.total += e.amount;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Group by month
  const monthMap = new Map<string, number>();
  expenses.forEach(e => {
    const month = new Date(e.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    monthMap.set(month, (monthMap.get(month) || 0) + e.amount);
  });

  const byMonth = Array.from(monthMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Summary
  const transactionCount = expenses.length;
  const averageExpense = transactionCount > 0 ? totalExpenses / transactionCount : 0;
  const largestCategory = byCategory[0]?.category || 'N/A';
  const largestCategoryAmount = byCategory[0]?.total || 0;

  return {
    id: `ES-${Date.now()}`,
    period: { startDate, endDate },
    expenses,
    byCategory,
    byMonth,
    summary: {
      totalExpenses,
      transactionCount,
      averageExpense,
      largestCategory,
      largestCategoryAmount,
    },
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// PROPERTY PERFORMANCE REPORT
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
  userRole: string
): PropertyPerformanceReport {
  const allProperties = getProperties(userId, userRole);

  // Filter properties listed in the period
  const properties = allProperties
    .filter(p =>
      p.createdAt &&
      new Date(p.createdAt) >= new Date(startDate) &&
      new Date(p.createdAt) <= new Date(endDate)
    )
    .map(p => {
      const listingDate = new Date(p.createdAt || '');
      const soldDate = p.soldDate ? new Date(p.soldDate) : null;
      const daysOnMarket = soldDate
        ? Math.floor((soldDate.getTime() - listingDate.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((new Date().getTime() - listingDate.getTime()) / (1000 * 60 * 60 * 24));

      const listPrice = p.price || 0;
      const soldPrice = p.status === 'sold' ? (p.price || 0) : undefined;
      const priceChange = soldPrice ? soldPrice - listPrice : 0;
      const priceChangePercentage = listPrice > 0 ? (priceChange / listPrice) * 100 : 0;

      return {
        id: p.id,
        title: p.title,
        type: p.type || p.propertyType || 'Property',
        status: p.status,
        listingDate: p.createdAt || '',
        soldDate: p.soldDate,
        daysOnMarket,
        listPrice,
        soldPrice,
        priceChange,
        priceChangePercentage,
        commissionEarned: p.commissionEarned || 0,
        agentName: p.agentName || 'Unknown',
      };
    });

  // Summary
  const totalProperties = properties.length;
  const activeListing = properties.filter(p => p.status === 'available').length;
  const soldProperties = properties.filter(p => p.status === 'sold').length;
  const averageDaysOnMarket = totalProperties > 0
    ? properties.reduce((sum, p) => sum + p.daysOnMarket, 0) / totalProperties
    : 0;
  const averagePriceReduction = totalProperties > 0
    ? properties.reduce((sum, p) => sum + p.priceChange, 0) / totalProperties
    : 0;
  const totalCommissionEarned = properties.reduce((sum, p) => sum + p.commissionEarned, 0);
  const conversionRate = totalProperties > 0 ? (soldProperties / totalProperties) * 100 : 0;

  // By status
  const statusMap = new Map<string, number>();
  properties.forEach(p => {
    statusMap.set(p.status, (statusMap.get(p.status) || 0) + 1);
  });

  const byStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: totalProperties > 0 ? (count / totalProperties) * 100 : 0,
    }));

  // Top performers
  const topPerformers = properties
    .filter(p => p.commissionEarned > 0)
    .sort((a, b) => b.commissionEarned - a.commissionEarned)
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      title: p.title,
      commissionEarned: p.commissionEarned,
      daysOnMarket: p.daysOnMarket,
    }));

  return {
    id: `PP-${Date.now()}`,
    period: { startDate, endDate },
    properties,
    summary: {
      totalProperties,
      activeListing,
      soldProperties,
      averageDaysOnMarket,
      averagePriceReduction,
      totalCommissionEarned,
      conversionRate,
    },
    byStatus,
    topPerformers,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
  };
}

// ============================================
// INVESTOR DISTRIBUTION REPORT
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
  // This is a placeholder implementation
  // In a real system, you'd have investor and distribution data

  const distributions: any[] = [];

  // Placeholder summary
  const summary = {
    totalInvestors: 0,
    totalDistributed: 0,
    totalInvestmentCapital: 0,
    averageROI: 0,
    largestDistribution: 0,
  };

  const byInvestor: any[] = [];

  return {
    id: `ID-${Date.now()}`,
    period: { startDate, endDate },
    distributions,
    summary,
    byInvestor,
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

/**
 * Compare two P&L reports (YoY or MoM)
 */
export function compareProfitAndLoss(
  current: ProfitAndLoss,
  previous: ProfitAndLoss
): ReportComparison {
  const calculateChange = (currentVal: number, previousVal: number) => ({
    current: currentVal,
    previous: previousVal,
    change: currentVal - previousVal,
    changePercentage: previousVal !== 0 ? ((currentVal - previousVal) / previousVal) * 100 : 0,
  });

  return {
    type: 'YoY', // Can be determined based on date ranges
    current,
    previous,
    changes: {
      totalRevenue: calculateChange(current.revenue.totalRevenue, previous.revenue.totalRevenue),
      totalExpenses: calculateChange(current.expenses.totalExpenses, previous.expenses.totalExpenses),
      netIncome: calculateChange(current.netIncome, previous.netIncome),
      commissionRevenue: calculateChange(current.revenue.commissionRevenue, previous.revenue.commissionRevenue),
      operatingIncome: calculateChange(current.operatingIncome, previous.operatingIncome),
    },
  };
}

/**
 * Compare two Balance Sheets
 */
export function compareBalanceSheets(
  current: BalanceSheet,
  previous: BalanceSheet
): ReportComparison {
  const calculateChange = (currentVal: number, previousVal: number) => ({
    current: currentVal,
    previous: previousVal,
    change: currentVal - previousVal,
    changePercentage: previousVal !== 0 ? ((currentVal - previousVal) / previousVal) * 100 : 0,
  });

  return {
    type: 'YoY',
    current,
    previous,
    changes: {
      totalAssets: calculateChange(current.assets.totalAssets, previous.assets.totalAssets),
      totalLiabilities: calculateChange(current.liabilities.totalLiabilities, previous.liabilities.totalLiabilities),
      totalEquity: calculateChange(current.equity.totalEquity, previous.equity.totalEquity),
      cashAndBank: calculateChange(current.assets.currentAssets.cashAndBank, previous.assets.currentAssets.cashAndBank),
      currentAssets: calculateChange(current.assets.currentAssets.totalCurrentAssets, previous.assets.currentAssets.totalCurrentAssets),
    },
  };
}

/**
 * Generate date ranges for YoY comparison
 */
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

/**
 * Generate date ranges for MoM comparison
 */
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
// TAX SUMMARY REPORT (GAP FIX #1)
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

/**
 * Generate Tax Summary Report
 * IMPLEMENTATION: Gap Fix #1 - Tax reports were documented but not implemented
 */
export function generateTaxSummaryReport(
  startDate: string,
  endDate: string,
  userId: string,
  userRole: string = 'agent'
): TaxSummaryReport {
  const fiscalYear = new Date(startDate).getFullYear();

  // 1. Get all relevant data
  const properties = getProperties(userId, userRole);
  const expenses = getExpenses(userId, userRole);
  const journalEntries = getJournalEntries(userId, userRole);

  // 2. Calculate Property Tax (1% of property value - Pakistan rate)
  const propertyTax = calculatePropertyTaxReport(properties);

  // 3. Calculate Income Tax
  const income = calculateGrossIncome(journalEntries, startDate, endDate);
  const deductions = calculateTaxDeductions(expenses, startDate, endDate);
  const taxableIncome = Math.max(0, income - deductions);
  const incomeTaxRate = 0.30; // 30% for Pakistan
  const incomeTaxOwed = taxableIncome * incomeTaxRate;

  // 4. Calculate Capital Gains Tax (from property sales)
  const capitalGains = calculateCapitalGainsTax(journalEntries, properties, startDate, endDate);

  // 5. Calculate Withholding Tax
  const withholding = calculateWithholdingTaxReport(expenses, startDate, endDate);

  // 6. Calculate totals
  const totalTax =
    propertyTax.total +
    incomeTaxOwed +
    capitalGains.totalShortTermTax +
    capitalGains.totalLongTermTax;

  return {
    period: {
      startDate,
      endDate,
      fiscalYear
    },
    propertyTax,
    incomeTax: {
      grossIncome: income,
      allowableDeductions: deductions,
      taxableIncome,
      taxRate: incomeTaxRate,
      taxOwed: incomeTaxOwed
    },
    capitalGainsTax: capitalGains,
    withholdingTax: withholding,
    totalTaxLiability: totalTax,
    estimatedPayments: 0, // Track separately in future
    balanceDue: totalTax,
    generatedAt: new Date().toISOString()
  };
}

function calculatePropertyTaxReport(properties: Property[]) {
  const taxRate = 0.01; // 1% property tax for Pakistan

  const byProperty = properties
    .filter(p => p.status !== 'sold') // Only active properties
    .map(p => ({
      propertyId: p.id,
      propertyTitle: p.title,
      assessedValue: p.price || 0,
      taxRate,
      taxAmount: (p.price || 0) * taxRate
    }));

  return {
    total: byProperty.reduce((sum: number, p: any) => sum + p.taxAmount, 0),
    byProperty
  };
}

function calculateGrossIncome(entries: JournalEntry[], startDate: string, endDate: string): number {
  return entries
    .filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    })
    .flatMap((e: JournalEntry) => e.entries)
    .filter((entry: any) => entry.accountType === 'revenue' && entry.credit > 0)
    .reduce((sum: number, entry: any) => sum + entry.credit, 0);
}

function calculateTaxDeductions(expenses: Expense[], startDate: string, endDate: string): number {
  return expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= new Date(startDate) &&
        expenseDate <= new Date(endDate) &&
        e.deductible !== false; // Allow deductions unless explicitly marked false
    })
    .reduce((sum: number, e: Expense) => sum + e.amount, 0);
}

function calculateCapitalGainsTax(
  entries: JournalEntry[],
  _properties: Property[],
  startDate: string,
  endDate: string
) {
  const shortTerm: any[] = [];
  const longTerm: any[] = [];

  // Find property sale transactions
  entries.forEach(entry => {
    const entryDate = new Date(entry.date);
    if (entryDate < new Date(startDate) || entryDate > new Date(endDate)) return;

    // Look for revenue from property sales
    (entry.entries || []).forEach((line: any) => {
      if (line.accountName === 'Commission Revenue' && line.credit > 0) {
        // Simplified: treat commission as indicator of sale
        // In real implementation, track actual property sales
        const estimatedSaleValue = line.credit / 0.02; // Assuming 2% commission
        const estimatedCost = estimatedSaleValue * 0.7; // Assuming 30% gain
        const gain = estimatedSaleValue - estimatedCost;

        // Simplified holding period (in real app, track from ownership history)
        const holdingPeriod = 400; // days
        const taxRate = holdingPeriod > 365 ? 0.15 : 0.30; // Long vs short term

        const gainRecord = {
          propertyId: 'estimated',
          salePrice: estimatedSaleValue,
          costBasis: estimatedCost,
          gain,
          taxRate,
          tax: gain * taxRate
        };

        if (holdingPeriod > 365) {
          longTerm.push(gainRecord);
        } else {
          shortTerm.push(gainRecord);
        }
      }
    });
  });

  return {
    shortTerm,
    longTerm,
    totalShortTermTax: shortTerm.reduce((sum: number, g: any) => sum + g.tax, 0),
    totalLongTermTax: longTerm.reduce((sum: number, g: any) => sum + g.tax, 0)
  };
}

function calculateWithholdingTaxReport(expenses: Expense[], startDate: string, endDate: string) {
  const filteredExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
  });

  const salaries = filteredExpenses
    .filter(e => e.category === 'Salaries & Wages')
    .reduce((sum, e) => sum + e.amount * 0.10, 0); // 10% withholding

  const commissions = filteredExpenses
    .filter(e => e.category === 'Commission Revenue')
    .reduce((sum, e) => sum + e.amount * 0.05, 0); // 5% withholding

  const contractors = filteredExpenses
    .filter((e: Expense) => e.category === 'Professional Fees')
    .reduce((sum: number, e: Expense) => sum + e.amount * 0.15, 0); // 15% withholding

  return {
    salaries,
    commissions,
    contractorPayments: contractors,
    total: salaries + commissions + contractors
  };
}

// ============================================
// AGED RECEIVABLES & PAYABLES (GAP FIX #2)
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

/**
 * Generate Aged Receivables Report
 * IMPLEMENTATION: Gap Fix #2 - Aged reports were documented but not implemented
 */
export function generateAgedReceivables(
  asOfDate: string,
  userId: string,
  userRole: string = 'agent'
): AgedReport {
  const receivables: AgedLine[] = [];
  const asOf = new Date(asOfDate);

  // Get account payments (these track receivables)
  const payments = getAccountPayments(userId, userRole);

  // Find pending receivables
  payments.forEach(payment => {
    if (payment.status === 'pending' && payment.type === 'receivable') {
      const dueDate = new Date(payment.dueDate || payment.date);
      const daysOverdue = Math.floor((asOf.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      receivables.push({
        id: payment.id,
        entityType: 'commission',
        entityId: payment.id,
        description: payment.description || `Payment - ${payment.category}`,
        amount: payment.amount,
        dueDate: payment.dueDate || payment.date,
        daysOverdue,
        contactId: payment.payee || 'unknown',
        contactName: payment.payee || 'Unknown'
      });
    }
  });

  return categorizeAgedItems(receivables, asOfDate, 'receivables');
}

/**
 * Generate Aged Payables Report
 * IMPLEMENTATION: Gap Fix #2 - Aged reports were documented but not implemented
 */
export function generateAgedPayables(
  asOfDate: string,
  userId: string,
  userRole: string = 'agent'
): AgedReport {
  const payables: AgedLine[] = [];
  const asOf = new Date(asOfDate);

  // Get expenses (these are payables)
  const expenses = getExpenses(userId, userRole);

  // Find unpaid expenses
  expenses.forEach(expense => {
    if (expense.status === 'pending') {
      const dueDate = new Date(expense.dueDate || expense.date);
      const daysOverdue = Math.floor((asOf.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      payables.push({
        id: expense.id,
        entityType: 'commission',
        entityId: expense.id,
        description: expense.description || expense.category,
        amount: expense.amount,
        dueDate: expense.dueDate || expense.date,
        daysOverdue,
        contactId: expense.vendor || 'unknown',
        contactName: expense.vendor || 'Unknown Vendor'
      });
    }
  });

  return categorizeAgedItems(payables, asOfDate, 'payables');
}

function categorizeAgedItems(items: AgedLine[], asOfDate: string, type: 'receivables' | 'payables'): AgedReport {
  const asOf = new Date(asOfDate);

  const aged = {
    current: [] as AgedLine[],
    days30: [] as AgedLine[],
    days60: [] as AgedLine[],
    days90: [] as AgedLine[],
    days90Plus: [] as AgedLine[]
  };

  // Categorize each item
  items.forEach(item => {
    const dueDate = new Date(item.dueDate);
    const daysOverdue = Math.floor((asOf.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Update days overdue
    item.daysOverdue = daysOverdue;

    // Categorize
    if (daysOverdue <= 0) {
      aged.current.push(item);
    } else if (daysOverdue <= 30) {
      aged.days30.push(item);
    } else if (daysOverdue <= 60) {
      aged.days60.push(item);
    } else if (daysOverdue <= 90) {
      aged.days90.push(item);
    } else {
      aged.days90Plus.push(item);
    }
  });

  // Calculate totals
  const sumItems = (items: AgedLine[]) => items.reduce((sum, item) => sum + item.amount, 0);

  const currentTotal = sumItems(aged.current);
  const days30Total = sumItems(aged.days30);
  const days60Total = sumItems(aged.days60);
  const days90Total = sumItems(aged.days90);
  const days90PlusTotal = sumItems(aged.days90Plus);
  const grandTotal = currentTotal + days30Total + days60Total + days90Total + days90PlusTotal;
  const overdueTotal = days30Total + days60Total + days90Total + days90PlusTotal;

  return {
    asOfDate,
    type,
    current: {
      items: aged.current,
      total: currentTotal,
      count: aged.current.length
    },
    days1to30: {
      items: aged.days30,
      total: days30Total,
      count: aged.days30.length
    },
    days31to60: {
      items: aged.days60,
      total: days60Total,
      count: aged.days60.length
    },
    days61to90: {
      items: aged.days90,
      total: days90Total,
      count: aged.days90.length
    },
    days90Plus: {
      items: aged.days90Plus,
      total: days90PlusTotal,
      count: aged.days90Plus.length
    },
    grandTotal,
    overdueTotal,
    overduePercentage: grandTotal > 0 ? (overdueTotal / grandTotal) * 100 : 0
  };
}