/**
 * Agency Transactions - Data Service (stub)
 * UI-only: no localStorage.
 */

import {
  AgencyTransaction,
  AgencyTransactionType,
  AgencyTransactionCategory,
} from '../types';

export function createTransaction(_data: {
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
  return {
    id: `txn_${Date.now()}`,
    propertyId: '',
    propertyAddress: '',
    category: 'income',
    type: 'rental_income',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    recordedBy: '',
    recordedByName: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createMultipleTransactions(
  _transactions: Array<Parameters<typeof createTransaction>[0]>
): AgencyTransaction[] {
  return [];
}

export function getTransactionById(_id: string): AgencyTransaction | undefined {
  return undefined;
}

export function getTransactionsByProperty(
  _propertyId: string
): AgencyTransaction[] {
  return [];
}

export function getTransactionsByCategory(
  _propertyId: string,
  _category: AgencyTransactionCategory
): AgencyTransaction[] {
  return [];
}

export function getTransactionsByType(
  _propertyId: string,
  _type: AgencyTransactionType
): AgencyTransaction[] {
  return [];
}

export function getTransactionsByDateRange(
  _propertyId: string,
  _startDate: string,
  _endDate: string
): AgencyTransaction[] {
  return [];
}

export function getAllAgencyTransactions(): AgencyTransaction[] {
  return [];
}

export function getTransactionsByProperties(
  _propertyIds: string[]
): AgencyTransaction[] {
  return [];
}

export function updateTransaction(
  _id: string,
  _updates: Partial<AgencyTransaction>
): boolean {
  return false;
}

export function deleteTransaction(_id: string): boolean {
  return false;
}

export function deleteTransactionsByProperty(_propertyId: string): number {
  return 0;
}

export function getCategoryFromType(
  _type: AgencyTransactionType
): AgencyTransactionCategory {
  return 'income';
}

export function getTransactionTypeLabel(_type: AgencyTransactionType): string {
  return '';
}

export function getCategoryLabel(
  _category: AgencyTransactionCategory
): string {
  return '';
}

export function validateTransactionAmount(_amount: number): boolean {
  return true;
}

export function validateTransactionDate(_date: string): boolean {
  return true;
}

export function getTransactionCount(_propertyId: string): number {
  return 0;
}

export function getTransactionCountByCategory(
  _propertyId: string,
  _category: AgencyTransactionCategory
): number {
  return 0;
}

export function hasTransactions(_propertyId: string): boolean {
  return false;
}

export function getLatestTransaction(
  _propertyId: string
): AgencyTransaction | undefined {
  return undefined;
}

export function getTotalByCategory(
  _propertyId: string,
  _category: AgencyTransactionCategory
): number {
  return 0;
}

export function getTotalByType(
  _propertyId: string,
  _type: AgencyTransactionType
): number {
  return 0;
}

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
