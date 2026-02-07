/**
 * Agency Transactions Library
 * Manages financial transactions for agency-owned properties
 * 
 * Handles:
 * - Transaction CRUD operations
 * - localStorage persistence
 * - Data retrieval and filtering
 * - Transaction validation
 */

import {
  AgencyTransaction,
  AgencyTransactionType,
  AgencyTransactionCategory,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'aaraazi_agency_transactions';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all agency transactions from storage
 */
function getAllTransactionsFromStorage(): AgencyTransaction[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error loading agency transactions:', error);
    return [];
  }
}

/**
 * Save transactions to storage
 */
function saveTransactionsToStorage(transactions: AgencyTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving agency transactions:', error);
    throw new Error('Failed to save transactions');
  }
}

/**
 * Create a new transaction
 */
export function createTransaction(data: {
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
  paymentMethod?: 'cash' | 'bank-transfer' | 'cheque' | 'online';
  paymentReference?: string;
  purchaseCycleId?: string;
  sellCycleId?: string;
  dealId?: string;
  recordedBy: string;
  recordedByName: string;
}): AgencyTransaction {
  const transactions = getAllTransactionsFromStorage();
  
  const newTransaction: AgencyTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    propertyId: data.propertyId,
    propertyAddress: data.propertyAddress,
    category: data.category,
    type: data.type,
    amount: data.amount,
    date: data.date,
    description: data.description,
    notes: data.notes,
    receiptNumber: data.receiptNumber,
    receiptUrl: data.receiptUrl,
    paymentMethod: data.paymentMethod,
    paymentReference: data.paymentReference,
    purchaseCycleId: data.purchaseCycleId,
    sellCycleId: data.sellCycleId,
    dealId: data.dealId,
    recordedBy: data.recordedBy,
    recordedByName: data.recordedByName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  transactions.push(newTransaction);
  saveTransactionsToStorage(transactions);
  
  return newTransaction;
}

/**
 * Create multiple transactions (for bulk operations like acquisition costs)
 */
export function createMultipleTransactions(
  transactions: Array<Omit<AgencyTransaction, 'id' | 'createdAt' | 'updatedAt'>>
): AgencyTransaction[] {
  const existingTransactions = getAllTransactionsFromStorage();
  const now = new Date().toISOString();
  
  const newTransactions: AgencyTransaction[] = transactions.map(txn => ({
    ...txn,
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  }));
  
  existingTransactions.push(...newTransactions);
  saveTransactionsToStorage(existingTransactions);
  
  return newTransactions;
}

/**
 * Get a transaction by ID
 */
export function getTransactionById(id: string): AgencyTransaction | undefined {
  const transactions = getAllTransactionsFromStorage();
  return transactions.find(t => t.id === id);
}

/**
 * Get all transactions for a specific property
 */
export function getTransactionsByProperty(propertyId: string): AgencyTransaction[] {
  const transactions = getAllTransactionsFromStorage();
  return transactions
    .filter(t => t.propertyId === propertyId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get transactions by category
 */
export function getTransactionsByCategory(
  propertyId: string,
  category: AgencyTransactionCategory
): AgencyTransaction[] {
  const transactions = getTransactionsByProperty(propertyId);
  return transactions.filter(t => t.category === category);
}

/**
 * Get transactions by type
 */
export function getTransactionsByType(
  propertyId: string,
  type: AgencyTransactionType
): AgencyTransaction[] {
  const transactions = getTransactionsByProperty(propertyId);
  return transactions.filter(t => t.type === type);
}

/**
 * Get transactions within a date range
 */
export function getTransactionsByDateRange(
  propertyId: string,
  startDate: string,
  endDate: string
): AgencyTransaction[] {
  const transactions = getTransactionsByProperty(propertyId);
  return transactions.filter(t => t.date >= startDate && t.date <= endDate);
}

/**
 * Get all transactions (across all properties)
 */
export function getAllAgencyTransactions(): AgencyTransaction[] {
  return getAllTransactionsFromStorage().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get transactions for multiple properties
 */
export function getTransactionsByProperties(propertyIds: string[]): AgencyTransaction[] {
  const transactions = getAllTransactionsFromStorage();
  return transactions
    .filter(t => propertyIds.includes(t.propertyId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Update a transaction
 */
export function updateTransaction(
  id: string,
  updates: Partial<Omit<AgencyTransaction, 'id' | 'createdAt' | 'propertyId'>>
): AgencyTransaction {
  const transactions = getAllTransactionsFromStorage();
  const index = transactions.findIndex(t => t.id === id);
  
  if (index === -1) {
    throw new Error(`Transaction with ID ${id} not found`);
  }
  
  transactions[index] = {
    ...transactions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveTransactionsToStorage(transactions);
  return transactions[index];
}

/**
 * Delete a transaction
 */
export function deleteTransaction(id: string): boolean {
  const transactions = getAllTransactionsFromStorage();
  const filteredTransactions = transactions.filter(t => t.id !== id);
  
  if (transactions.length === filteredTransactions.length) {
    return false; // Transaction not found
  }
  
  saveTransactionsToStorage(filteredTransactions);
  return true;
}

/**
 * Delete all transactions for a property
 */
export function deleteTransactionsByProperty(propertyId: string): number {
  const transactions = getAllTransactionsFromStorage();
  const filteredTransactions = transactions.filter(t => t.propertyId !== propertyId);
  const deletedCount = transactions.length - filteredTransactions.length;
  
  if (deletedCount > 0) {
    saveTransactionsToStorage(filteredTransactions);
  }
  
  return deletedCount;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category from transaction type
 */
export function getCategoryFromType(type: AgencyTransactionType): AgencyTransactionCategory {
  const acquisitionTypes: AgencyTransactionType[] = [
    'purchase_price',
    'registration_fee',
    'stamp_duty',
    'legal_fees',
    'broker_commission',
    'renovation',
    'other_acquisition',
  ];
  
  const incomeTypes: AgencyTransactionType[] = [
    'rental_income',
    'parking_fee',
    'late_fee',
    'other_income',
  ];
  
  const expenseTypes: AgencyTransactionType[] = [
    'property_tax',
    'maintenance',
    'repairs',
    'utilities',
    'insurance',
    'management_fee',
    'marketing',
    'legal_expense',
    'other_expense',
  ];
  
  const saleTypes: AgencyTransactionType[] = [
    'sale_price',
    'sale_commission',
    'closing_costs',
  ];
  
  if (acquisitionTypes.includes(type)) return 'acquisition';
  if (incomeTypes.includes(type)) return 'income';
  if (expenseTypes.includes(type)) return 'expense';
  if (saleTypes.includes(type)) return 'sale';
  
  throw new Error(`Unknown transaction type: ${type}`);
}

/**
 * Get human-readable label for transaction type
 */
export function getTransactionTypeLabel(type: AgencyTransactionType): string {
  const labels: Record<AgencyTransactionType, string> = {
    // Acquisition
    purchase_price: 'Purchase Price',
    registration_fee: 'Registration Fee',
    stamp_duty: 'Stamp Duty',
    legal_fees: 'Legal Fees',
    broker_commission: 'Broker Commission',
    renovation: 'Renovation',
    other_acquisition: 'Other Acquisition Cost',
    
    // Income
    rental_income: 'Rental Income',
    parking_fee: 'Parking Fee',
    late_fee: 'Late Fee',
    other_income: 'Other Income',
    
    // Expenses
    property_tax: 'Property Tax',
    maintenance: 'Maintenance',
    repairs: 'Repairs',
    utilities: 'Utilities',
    insurance: 'Insurance',
    management_fee: 'Management Fee',
    marketing: 'Marketing',
    legal_expense: 'Legal Expense',
    other_expense: 'Other Expense',
    
    // Sale
    sale_price: 'Sale Price',
    sale_commission: 'Sale Commission',
    closing_costs: 'Closing Costs',
  };
  
  return labels[type] || type;
}

/**
 * Get category label
 */
export function getCategoryLabel(category: AgencyTransactionCategory): string {
  const labels: Record<AgencyTransactionCategory, string> = {
    acquisition: 'Acquisition',
    income: 'Income',
    expense: 'Expense',
    sale: 'Sale',
  };
  
  return labels[category];
}

/**
 * Validate transaction amount
 */
export function validateTransactionAmount(amount: number): boolean {
  return amount > 0 && isFinite(amount);
}

/**
 * Validate transaction date
 */
export function validateTransactionDate(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime()) && parsedDate <= new Date();
}

/**
 * Get transaction count for a property
 */
export function getTransactionCount(propertyId: string): number {
  const transactions = getTransactionsByProperty(propertyId);
  return transactions.length;
}

/**
 * Get transaction count by category
 */
export function getTransactionCountByCategory(
  propertyId: string,
  category: AgencyTransactionCategory
): number {
  const transactions = getTransactionsByCategory(propertyId, category);
  return transactions.length;
}

/**
 * Check if property has any transactions
 */
export function hasTransactions(propertyId: string): boolean {
  return getTransactionCount(propertyId) > 0;
}

/**
 * Get latest transaction for a property
 */
export function getLatestTransaction(propertyId: string): AgencyTransaction | undefined {
  const transactions = getTransactionsByProperty(propertyId);
  return transactions[0]; // Already sorted by date descending
}

/**
 * Get total amount by category
 */
export function getTotalByCategory(
  propertyId: string,
  category: AgencyTransactionCategory
): number {
  const transactions = getTransactionsByCategory(propertyId, category);
  return transactions.reduce((total, t) => total + t.amount, 0);
}

/**
 * Get total amount by type
 */
export function getTotalByType(
  propertyId: string,
  type: AgencyTransactionType
): number {
  const transactions = getTransactionsByType(propertyId, type);
  return transactions.reduce((total, t) => total + t.amount, 0);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createTransaction,
  createMultipleTransactions,
  getTransactionById,
  getTransactionsByProperty,
  getTransactionsByCategory,
  getTransactionsByType,
  getTransactionsByDateRange,
  getAllAgencyTransactions,
  getTransactionsByProperties,
  updateTransaction,
  deleteTransaction,
  deleteTransactionsByProperty,
  getCategoryFromType,
  getTransactionTypeLabel,
  getCategoryLabel,
  validateTransactionAmount,
  validateTransactionDate,
  getTransactionCount,
  getTransactionCountByCategory,
  hasTransactions,
  getLatestTransaction,
  getTotalByCategory,
  getTotalByType,
};
