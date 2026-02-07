/**
 * Investor Transaction Management
 * Handles income and expense tracking for investor-owned properties
 * Automatically attributes transactions to investors by ownership percentage
 */

import { InvestorTransaction, InvestorTransactionType, Property, InvestorInvestment } from '../types';
import { getPropertyById } from './data';
import { getInvestorById, getInvestorInvestments } from './investors';
import { formatPropertyAddress } from './utils';

const TRANSACTIONS_KEY = 'investor_transactions';

/**
 * Get all investor transactions
 */
export function getAllInvestorTransactions(): InvestorTransaction[] {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save investor transactions to localStorage
 */
function saveInvestorTransactions(transactions: InvestorTransaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

/**
 * Get all transactions for a specific property
 */
export function getPropertyInvestorTransactions(propertyId: string): InvestorTransaction[] {
  const transactions = getAllInvestorTransactions();
  return transactions.filter(t => t.propertyId === propertyId);
}

/**
 * Get all transactions for a specific investor
 */
export function getInvestorTransactionsByInvestorId(investorId: string): InvestorTransaction[] {
  const allTransactions = getAllInvestorTransactions();
  return allTransactions.filter(t =>
    t.investorAttributions.some(attr => attr.investorId === investorId)
  );
}

/**
 * Get transaction by ID
 */
export function getInvestorTransactionById(id: string): InvestorTransaction | undefined {
  const transactions = getAllInvestorTransactions();
  return transactions.find(t => t.id === id);
}

/**
 * Record income or expense for investor-owned property
 * Automatically attributes to all investors by their ownership percentage
 */
export function recordInvestorTransaction(
  propertyId: string,
  type: InvestorTransactionType,
  amount: number,
  description: string,
  userId: string,
  userName: string,
  additionalData?: {
    date?: string;
    category?: string;
    paymentMethod?: string;
    reference?: string;
    receiptUrl?: string;
    notes?: string;
  }
): InvestorTransaction {
  const property = getPropertyById(propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  if (property.currentOwnerType !== 'investor' || !property.investorShares || property.investorShares.length === 0) {
    throw new Error('Property is not investor-owned or has no investor shares');
  }

  // Calculate attribution for each investor
  const investorAttributions = property.investorShares.map(share => ({
    investorId: share.investorId,
    investorName: share.investorName,
    percentage: share.sharePercentage,
    amount: (amount * share.sharePercentage) / 100,
  }));

  const transaction: InvestorTransaction = {
    id: `inv-txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    propertyId,
    transactionType: type,
    amount,
    date: additionalData?.date || new Date().toISOString(),
    investorAttributions,
    description,
    category: additionalData?.category,
    paymentMethod: additionalData?.paymentMethod,
    reference: additionalData?.reference,
    receiptUrl: additionalData?.receiptUrl,
    recordedBy: userId,
    recordedByName: userName,
    notes: additionalData?.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save transaction
  const transactions = getAllInvestorTransactions();
  transactions.push(transaction);
  saveInvestorTransactions(transactions);

  // Update InvestorInvestment records
  updateInvestorInvestmentFromTransaction(transaction);

  console.log(`✅ Transaction recorded: ${type} - ${amount} for property ${propertyId}`);

  return transaction;
}

/**
 * Update InvestorInvestment records when income/expense is recorded
 * CRITICAL: Updates each investor's investment metrics
 */
function updateInvestorInvestmentFromTransaction(transaction: InvestorTransaction): void {
  transaction.investorAttributions.forEach(attribution => {
    // Get all investments for this investor
    const investments = getInvestorInvestments(attribution.investorId);
    
    // Find the active investment for this property
    const investment = investments.find(inv => 
      inv.propertyId === transaction.propertyId && inv.status === 'active'
    );

    if (!investment) {
      console.warn(`No active investment found for investor ${attribution.investorId} on property ${transaction.propertyId}`);
      return;
    }

    // Update investment based on transaction type
    if (transaction.transactionType === 'rental-income') {
      // Add to rental income
      investment.rentalIncome = (investment.rentalIncome || 0) + attribution.amount;
      
      // Update unrealized profit (income increases profit)
      investment.unrealizedProfit = (investment.unrealizedProfit || 0) + attribution.amount;
    } else if (transaction.transactionType.startsWith('expense-')) {
      // Add to expenses
      investment.totalExpenses = (investment.totalExpenses || 0) + attribution.amount;
      
      // Update unrealized profit (expense reduces profit)
      investment.unrealizedProfit = (investment.unrealizedProfit || 0) - attribution.amount;
    }

    // Add transaction to linked transactions
    if (!investment.linkedTransactionIds) {
      investment.linkedTransactionIds = [];
    }
    investment.linkedTransactionIds.push(transaction.id);

    // Recalculate ROI
    const currentValue = investment.currentValue || investment.investmentAmount;
    const totalReturns = (investment.rentalIncome || 0) + (investment.appreciationValue || 0) - (investment.totalExpenses || 0);
    investment.roi = ((totalReturns) / investment.investmentAmount) * 100;

    // Update timestamp
    investment.updatedAt = new Date().toISOString();

    // Save updated investment
    updateInvestorInvestmentInStorage(investment);
  });
}

/**
 * Helper to update InvestorInvestment in localStorage
 */
function updateInvestorInvestmentInStorage(investment: InvestorInvestment): void {
  const stored = localStorage.getItem('investor_investments');
  const investments: InvestorInvestment[] = stored ? JSON.parse(stored) : [];
  
  const index = investments.findIndex(inv => inv.id === investment.id);
  if (index !== -1) {
    investments[index] = investment;
    localStorage.setItem('investor_investments', JSON.stringify(investments));
  }
}

/**
 * Update an existing transaction
 */
export function updateInvestorTransaction(
  transactionId: string,
  updates: Partial<InvestorTransaction>
): InvestorTransaction | null {
  const transactions = getAllInvestorTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1) {
    console.error('Transaction not found:', transactionId);
    return null;
  }

  const oldTransaction = transactions[index];
  
  // If amount or type changed, we need to reverse old attribution and apply new
  const amountChanged = updates.amount && updates.amount !== oldTransaction.amount;
  const typeChanged = updates.transactionType && updates.transactionType !== oldTransaction.transactionType;
  
  if (amountChanged || typeChanged) {
    // Reverse the old transaction impact
    reverseTransactionImpact(oldTransaction);
  }

  // Update transaction
  transactions[index] = {
    ...oldTransaction,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveInvestorTransactions(transactions);

  // Apply new transaction impact
  if (amountChanged || typeChanged) {
    updateInvestorInvestmentFromTransaction(transactions[index]);
  }

  return transactions[index];
}

/**
 * Reverse the impact of a transaction (for updates or deletes)
 */
function reverseTransactionImpact(transaction: InvestorTransaction): void {
  transaction.investorAttributions.forEach(attribution => {
    const investments = getInvestorInvestments(attribution.investorId);
    const investment = investments.find(inv => 
      inv.propertyId === transaction.propertyId && inv.status === 'active'
    );

    if (!investment) return;

    // Reverse the transaction
    if (transaction.transactionType === 'rental-income') {
      investment.rentalIncome = (investment.rentalIncome || 0) - attribution.amount;
      investment.unrealizedProfit = (investment.unrealizedProfit || 0) - attribution.amount;
    } else if (transaction.transactionType.startsWith('expense-')) {
      investment.totalExpenses = (investment.totalExpenses || 0) - attribution.amount;
      investment.unrealizedProfit = (investment.unrealizedProfit || 0) + attribution.amount;
    }

    // Remove transaction from linked transactions
    if (investment.linkedTransactionIds) {
      investment.linkedTransactionIds = investment.linkedTransactionIds.filter(
        id => id !== transaction.id
      );
    }

    // Recalculate ROI
    const totalReturns = (investment.rentalIncome || 0) + (investment.appreciationValue || 0) - (investment.totalExpenses || 0);
    investment.roi = ((totalReturns) / investment.investmentAmount) * 100;

    investment.updatedAt = new Date().toISOString();
    updateInvestorInvestmentInStorage(investment);
  });
}

/**
 * Delete a transaction
 */
export function deleteInvestorTransaction(transactionId: string): boolean {
  const transactions = getAllInvestorTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1) {
    console.error('Transaction not found:', transactionId);
    return false;
  }

  const transaction = transactions[index];

  // Reverse the transaction impact
  reverseTransactionImpact(transaction);

  // Remove transaction
  transactions.splice(index, 1);
  saveInvestorTransactions(transactions);

  console.log(`✅ Transaction deleted: ${transactionId}`);
  return true;
}

/**
 * Calculate total income for a property
 */
export function calculatePropertyIncome(propertyId: string): number {
  const transactions = getPropertyInvestorTransactions(propertyId);
  return transactions
    .filter(t => t.transactionType === 'rental-income')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total expenses for a property
 */
export function calculatePropertyExpenses(propertyId: string): number {
  const transactions = getPropertyInvestorTransactions(propertyId);
  return transactions
    .filter(t => t.transactionType.startsWith('expense-'))
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate net cash flow for a property
 */
export function calculatePropertyNetCashFlow(propertyId: string): number {
  const income = calculatePropertyIncome(propertyId);
  const expenses = calculatePropertyExpenses(propertyId);
  return income - expenses;
}

/**
 * Get transaction summary for a property
 */
export function getPropertyTransactionSummary(propertyId: string): {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
} {
  const transactions = getPropertyInvestorTransactions(propertyId);
  
  const incomeTransactions = transactions.filter(t => t.transactionType === 'rental-income');
  const expenseTransactions = transactions.filter(t => t.transactionType.startsWith('expense-'));
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
  };
}

/**
 * Get transaction summary for an investor
 */
export function getInvestorTransactionSummary(investorId: string): {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
} {
  const transactions = getInvestorTransactionsByInvestorId(investorId);
  
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(t => {
    const attribution = t.investorAttributions.find(attr => attr.investorId === investorId);
    if (attribution) {
      if (t.transactionType === 'rental-income') {
        totalIncome += attribution.amount;
      } else if (t.transactionType.startsWith('expense-')) {
        totalExpenses += attribution.amount;
      }
    }
  });

  return {
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
    transactionCount: transactions.length,
  };
}

/**
 * Get expense breakdown by category
 */
export function getExpenseBreakdown(propertyId: string): Record<InvestorTransactionType, number> {
  const transactions = getPropertyInvestorTransactions(propertyId);
  const expenseTransactions = transactions.filter(t => t.transactionType.startsWith('expense-'));

  const breakdown: Record<string, number> = {};
  
  expenseTransactions.forEach(t => {
    if (!breakdown[t.transactionType]) {
      breakdown[t.transactionType] = 0;
    }
    breakdown[t.transactionType] += t.amount;
  });

  return breakdown as Record<InvestorTransactionType, number>;
}
