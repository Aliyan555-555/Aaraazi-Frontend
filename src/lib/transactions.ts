/**
 * Transactions - Data Service (stub)
 * UI-only: no localStorage.
 */

import { TransactionTask, Transaction } from '../types';

export function getTransactions(_propertyId?: string): Transaction[] {
  return [];
}

export function getTransactionById(_transactionId: string): Transaction | null {
  return null;
}

export function getActiveTransaction(_propertyId: string): Transaction | null {
  return null;
}

export function saveTransaction(_transaction: Transaction): void {
  // no-op
}

export function deleteTransaction(_transactionId: string): void {
  // no-op
}

export function getTransactionTasks(_propertyId: string): TransactionTask[] {
  return [];
}

export function saveTransactionTask(_task: TransactionTask): void {
  // no-op
}

export function toggleTaskCompletion(_taskId: string, _userId: string): void {
  // no-op
}

export function updateTaskStatus(
  _taskId: string,
  _status: TransactionTask['status']
): void {
  // no-op
}

export function getTaskProgress(_propertyId: string): {
  total: number;
  completed: number;
  percentage: number;
} {
  return { total: 0, completed: 0, percentage: 0 };
}

export function getOverdueTasks(_propertyId: string): TransactionTask[] {
  return [];
}
