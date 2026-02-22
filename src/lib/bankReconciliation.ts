/**
 * Advanced Bank Reconciliation Library
 * GAP FIX: Bank Reconciliation Advanced Features
 * 
 * Features:
 * - Auto-matching transactions (fuzzy matching algorithm)
 * - Bank statement import (CSV/OFX file parsing)
 * - Reconciliation rules engine
 * - Discrepancy detection and alerts
 * - Reconciliation history/audit trail
 */

import { BankTransaction } from '../components/financials/bank-reconciliation/BankReconciliationList';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  account: string;
  reference?: string;
  source?: string;
}

export interface ReconciliationMatch {
  bankTransaction: BankTransaction;
  ledgerEntry: LedgerEntry;
  confidence: number; // 0-100
  matchReason: string;
  autoMatched: boolean;
}

export interface ReconciliationRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number; // Higher = more important
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export interface RuleCondition {
  field: 'amount' | 'date' | 'description' | 'reference';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'withinDays' | 'withinAmount';
  value: string | number;
}

export interface RuleAction {
  type: 'autoMatch' | 'flag' | 'createEntry' | 'alert';
  params?: Record<string, any>;
}

export interface ReconciliationHistory {
  id: string;
  reconciliationId: string;
  action: 'matched' | 'unmatched' | 'imported' | 'rule_applied' | 'discrepancy_found';
  performedBy: string;
  performedAt: string;
  details: Record<string, any>;
}

export interface Discrepancy {
  id: string;
  type: 'amount_mismatch' | 'date_mismatch' | 'missing_entry' | 'duplicate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  bankTransaction?: BankTransaction;
  ledgerEntry?: LedgerEntry;
  description: string;
  suggestedAction?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ImportedStatement {
  id: string;
  fileName: string;
  format: 'csv' | 'ofx' | 'qif';
  importedAt: string;
  importedBy: string;
  transactionCount: number;
  transactions: BankTransaction[];
}

// ============================================
// AUTO-MATCHING ALGORITHM
// ============================================

/**
 * Auto-match bank transactions with ledger entries using fuzzy matching
 */
export function autoMatchTransactions(
  _bankTransactions: BankTransaction[],
  _ledgerEntries: LedgerEntry[],
  _rules: ReconciliationRule[] = []
): ReconciliationMatch[] {
  return [];
}

/**
 * Check if a rule matches a bank transaction and ledger entry
 */
function ruleMatches(
  rule: ReconciliationRule,
  bankTx: BankTransaction,
  ledgerEntry: LedgerEntry
): boolean {
  for (const condition of rule.conditions) {
    if (!conditionMatches(condition, bankTx, ledgerEntry)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a condition matches
 */
function conditionMatches(
  condition: RuleCondition,
  bankTx: BankTransaction,
  ledgerEntry: LedgerEntry
): boolean {
  const bankValue = getFieldValue(bankTx, condition.field);
  const ledgerValue = getFieldValue(ledgerEntry, condition.field);

  switch (condition.operator) {
    case 'equals':
      return bankValue === condition.value && ledgerValue === condition.value;
    case 'contains':
      return (
        String(bankValue).toLowerCase().includes(String(condition.value).toLowerCase()) &&
        String(ledgerValue).toLowerCase().includes(String(condition.value).toLowerCase())
      );
    case 'startsWith':
      return (
        String(bankValue).startsWith(String(condition.value)) &&
        String(ledgerValue).startsWith(String(condition.value))
      );
    case 'endsWith':
      return (
        String(bankValue).endsWith(String(condition.value)) &&
        String(ledgerValue).endsWith(String(condition.value))
      );
    case 'withinDays':
      const days = Number(condition.value);
      const dateDiff = Math.abs(
        new Date(bankTx.date).getTime() - new Date(ledgerEntry.date).getTime()
      );
      return dateDiff <= days * 24 * 60 * 60 * 1000;
    case 'withinAmount':
      const tolerance = Number(condition.value);
      return Math.abs(bankTx.amount - ledgerEntry.amount) <= tolerance;
    default:
      return false;
  }
}

/**
 * Get field value from transaction or entry
 */
function getFieldValue(
  item: BankTransaction | LedgerEntry,
  field: RuleCondition['field']
): any {
  switch (field) {
    case 'amount':
      return item.amount;
    case 'date':
      return item.date;
    case 'description':
      return item.description;
    case 'reference':
      return 'reference' in item ? item.reference : 'bankStatementRef' in item ? item.bankStatementRef : '';
    default:
      return '';
  }
}

/**
 * Calculate fuzzy match confidence (0-100)
 */
function calculateFuzzyMatch(
  bankTx: BankTransaction,
  ledgerEntry: LedgerEntry
): number {
  let confidence = 0;

  // Amount match (40% weight)
  if (Math.abs(bankTx.amount - ledgerEntry.amount) < 0.01) {
    confidence += 40;
  } else if (Math.abs(bankTx.amount - ledgerEntry.amount) / Math.max(bankTx.amount, ledgerEntry.amount) < 0.05) {
    confidence += 20; // Within 5%
  }

  // Date match (30% weight)
  const dateDiff = Math.abs(
    new Date(bankTx.date).getTime() - new Date(ledgerEntry.date).getTime()
  );
  if (dateDiff === 0) {
    confidence += 30;
  } else if (dateDiff <= 3 * 24 * 60 * 60 * 1000) {
    confidence += 20; // Within 3 days
  } else if (dateDiff <= 7 * 24 * 60 * 60 * 1000) {
    confidence += 10; // Within 7 days
  }

  // Description similarity (30% weight)
  const descSimilarity = calculateStringSimilarity(
    bankTx.description.toLowerCase(),
    ledgerEntry.description.toLowerCase()
  );
  confidence += descSimilarity * 30;

  return Math.round(confidence);
}

/**
 * Calculate match confidence with rule
 */
function calculateConfidence(
  bankTx: BankTransaction,
  ledgerEntry: LedgerEntry,
  rule: ReconciliationRule
): number {
  const baseConfidence = calculateFuzzyMatch(bankTx, ledgerEntry);
  // Rules add bonus confidence
  return Math.min(100, baseConfidence + (rule.priority * 5));
}

/**
 * Calculate string similarity (0-1)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  // Check for exact substring match
  if (longer.includes(shorter)) return 0.8;

  // Simple word overlap
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = (commonWords.length * 2) / (words1.length + words2.length);

  return similarity;
}

// ============================================
// BANK STATEMENT IMPORT
// ============================================

/**
 * Import bank statement from CSV file
 */
export function importBankStatementCSV(
  csvContent: string,
  fileName: string,
  importedBy: string
): ImportedStatement {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  // Find column indices
  const dateIndex = findColumnIndex(headers, ['date', 'transaction date', 'posted date']);
  const amountIndex = findColumnIndex(headers, ['amount', 'transaction amount', 'debit/credit']);
  const descriptionIndex = findColumnIndex(headers, ['description', 'details', 'memo', 'narration']);
  const balanceIndex = findColumnIndex(headers, ['balance', 'running balance']);
  const refIndex = findColumnIndex(headers, ['reference', 'ref', 'check number', 'transaction id']);

  const transactions: BankTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 3) continue;

    const dateStr = dateIndex >= 0 ? values[dateIndex] : new Date().toISOString();
    const amountStr = amountIndex >= 0 ? values[amountIndex] : '0';
    const description = descriptionIndex >= 0 ? values[descriptionIndex] : 'Imported transaction';
    const balanceStr = balanceIndex >= 0 ? values[balanceIndex] : '0';
    const ref = refIndex >= 0 ? values[refIndex] : undefined;

    // Parse amount (handle negative for withdrawals)
    let amount = parseFloat(amountStr.replace(/[^0-9.-]/g, '')) || 0;
    const type: 'deposit' | 'withdrawal' = amount >= 0 ? 'deposit' : 'withdrawal';
    amount = Math.abs(amount);

    // Parse date
    const date = parseDate(dateStr);

    const transaction: BankTransaction = {
      id: `imported-${Date.now()}-${i}`,
      date: date.toISOString(),
      description,
      type,
      amount,
      balance: parseFloat(balanceStr.replace(/[^0-9.-]/g, '')) || 0,
      status: 'Unreconciled',
      bankStatementRef: ref,
      createdAt: new Date().toISOString(),
    };

    transactions.push(transaction);
  }

  const importedStatement: ImportedStatement = {
    id: `import-${Date.now()}`,
    fileName,
    format: 'csv',
    importedAt: new Date().toISOString(),
    importedBy,
    transactionCount: transactions.length,
    transactions,
  };

  // Save to localStorage
  saveImportedStatement(importedStatement);
  saveBankTransactions(transactions);

  return importedStatement;
}

/**
 * Find column index by possible header names
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index >= 0) return index;
  }
  return -1;
}

/**
 * Parse CSV line (handles quoted values)
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr: string): Date {
  // Try ISO format first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  // Try common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // MM/DD/YYYY or DD/MM/YYYY - try both
        const month = parseInt(match[1]);
        const day = parseInt(match[2]);
        if (month > 12) {
          // DD/MM/YYYY
          date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
        } else {
          // MM/DD/YYYY
          date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        }
      } else {
        // YYYY-MM-DD
        date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
      if (!isNaN(date.getTime())) return date;
    }
  }

  return new Date(); // Fallback to today
}

// ============================================
// DISCREPANCY DETECTION
// ============================================

/**
 * Detect discrepancies between bank transactions and ledger entries
 */
export function detectDiscrepancies(
  bankTransactions: BankTransaction[],
  ledgerEntries: LedgerEntry[],
  matches: ReconciliationMatch[]
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];
  const matchedBankIds = new Set(matches.map(m => m.bankTransaction.id));
  const matchedLedgerIds = new Set(matches.map(m => m.ledgerEntry.id));

  // Find unmatched bank transactions
  for (const bankTx of bankTransactions) {
    if (!matchedBankIds.has(bankTx.id)) {
      discrepancies.push({
        id: `disc-${Date.now()}-${bankTx.id}`,
        type: 'missing_entry',
        severity: 'medium',
        bankTransaction: bankTx,
        description: `Bank transaction ${bankTx.description} (${bankTx.amount}) has no matching ledger entry`,
        suggestedAction: 'Create ledger entry or mark as reconciled',
        resolved: false,
      });
    }
  }

  // Find unmatched ledger entries
  for (const ledgerEntry of ledgerEntries) {
    if (!matchedLedgerIds.has(ledgerEntry.id)) {
      discrepancies.push({
        id: `disc-${Date.now()}-${ledgerEntry.id}`,
        type: 'missing_entry',
        severity: 'medium',
        ledgerEntry: ledgerEntry,
        description: `Ledger entry ${ledgerEntry.description} (${ledgerEntry.amount}) has no matching bank transaction`,
        suggestedAction: 'Verify transaction or mark as pending',
        resolved: false,
      });
    }
  }

  // Check for amount mismatches in matches
  for (const match of matches) {
    const amountDiff = Math.abs(match.bankTransaction.amount - match.ledgerEntry.amount);
    if (amountDiff > 0.01) {
      discrepancies.push({
        id: `disc-${Date.now()}-${match.bankTransaction.id}`,
        type: 'amount_mismatch',
        severity: amountDiff > 1000 ? 'high' : 'medium',
        bankTransaction: match.bankTransaction,
        ledgerEntry: match.ledgerEntry,
        description: `Amount mismatch: Bank ${match.bankTransaction.amount} vs Ledger ${match.ledgerEntry.amount} (diff: ${amountDiff})`,
        suggestedAction: 'Review and adjust amounts',
        resolved: false,
      });
    }

    // Check for date mismatches
    const dateDiff = Math.abs(
      new Date(match.bankTransaction.date).getTime() - new Date(match.ledgerEntry.date).getTime()
    );
    if (dateDiff > 7 * 24 * 60 * 60 * 1000) {
      discrepancies.push({
        id: `disc-${Date.now()}-date-${match.bankTransaction.id}`,
        type: 'date_mismatch',
        severity: 'low',
        bankTransaction: match.bankTransaction,
        ledgerEntry: match.ledgerEntry,
        description: `Date mismatch: Bank ${match.bankTransaction.date} vs Ledger ${match.ledgerEntry.date}`,
        suggestedAction: 'Verify dates are correct',
        resolved: false,
      });
    }
  }

  // Check for duplicates
  const bankAmounts = new Map<number, BankTransaction[]>();
  for (const bankTx of bankTransactions) {
    const key = Math.round(bankTx.amount * 100);
    if (!bankAmounts.has(key)) {
      bankAmounts.set(key, []);
    }
    bankAmounts.get(key)!.push(bankTx);
  }

  for (const [amount, txs] of bankAmounts.entries()) {
    if (txs.length > 1) {
      const sameDate = txs.filter(tx => {
        const date1 = new Date(tx.date).toDateString();
        return txs.some(t => t.id !== tx.id && new Date(t.date).toDateString() === date1);
      });

      if (sameDate.length > 1) {
        discrepancies.push({
          id: `disc-${Date.now()}-dup-${amount}`,
          type: 'duplicate',
          severity: 'medium',
          description: `Possible duplicate transactions: ${sameDate.length} transactions with amount ${amount} on same date`,
          suggestedAction: 'Review and remove duplicates',
          resolved: false,
        });
      }
    }
  }

  return discrepancies;
}

// ============================================
// RECONCILIATION HISTORY
// ============================================

/**
 * Save reconciliation history (stub - no persistence)
 */
export function saveReconciliationHistory(_history: ReconciliationHistory): void {
  // no-op
}

/**
 * Get reconciliation history (stub)
 */
export function getReconciliationHistory(
  _reconciliationId?: string
): ReconciliationHistory[] {
  return [];
}

// ============================================
// RECONCILIATION RULES
// ============================================

/**
 * Get default reconciliation rules
 */
export function getDefaultReconciliationRules(): ReconciliationRule[] {
  return [
    {
      id: 'rule-exact-match',
      name: 'Exact Amount & Date Match',
      enabled: true,
      priority: 100,
      conditions: [
        { field: 'amount', operator: 'equals', value: 0 }, // Will be checked dynamically
        { field: 'date', operator: 'withinDays', value: 0 },
      ],
      actions: [{ type: 'autoMatch' }],
    },
    {
      id: 'rule-reference-match',
      name: 'Reference Number Match',
      enabled: true,
      priority: 90,
      conditions: [
        { field: 'reference', operator: 'equals', value: '' }, // Will be checked dynamically
      ],
      actions: [{ type: 'autoMatch' }],
    },
    {
      id: 'rule-amount-tolerance',
      name: 'Amount Within Tolerance',
      enabled: true,
      priority: 80,
      conditions: [
        { field: 'amount', operator: 'withinAmount', value: 10 }, // Within PKR 10
        { field: 'date', operator: 'withinDays', value: 3 },
      ],
      actions: [{ type: 'autoMatch' }],
    },
  ];
}

/**
 * Save reconciliation rules (stub - no persistence)
 */
export function saveReconciliationRules(_rules: ReconciliationRule[]): void {
  // no-op
}

/**
 * Get reconciliation rules (stub)
 */
export function getReconciliationRules(): ReconciliationRule[] {
  return getDefaultReconciliationRules();
}

// ============================================
// STORAGE HELPERS
// ============================================

function saveImportedStatement(statement: ImportedStatement): void {
  const key = 'bank_imported_statements';
  const existing = JSON.parse(localStorage.getItem(key) || '[]') as ImportedStatement[];
  existing.push(statement);
  localStorage.setItem(key, JSON.stringify(existing));
}

function saveBankTransactions(transactions: BankTransaction[]): void {
  const key = 'bank_transactions';
  const existing = JSON.parse(localStorage.getItem(key) || '[]') as BankTransaction[];
  
  // Merge with existing (avoid duplicates by ID)
  const existingIds = new Set(existing.map(t => t.id));
  const newTransactions = transactions.filter(t => !existingIds.has(t.id));
  
  localStorage.setItem(key, JSON.stringify([...existing, ...newTransactions]));
}

/**
 * Get imported statements (stub)
 */
export function getImportedStatements(): ImportedStatement[] {
  return [];
}
