/**
 * Installment Management Service - V3.0
 * Manage payment plans, installments, and receipts for property sales
 */

import { InstallmentPlan, Installment, PaymentReceipt } from '../types';

const INSTALLMENT_PLANS_KEY = 'installment_plans_v3';
const RECEIPTS_KEY = 'payment_receipts_v3';

// ============================================
// INSTALLMENT PLAN MANAGEMENT
// ============================================

/**
 * Get all installment plans
 */
export function getInstallmentPlans(): InstallmentPlan[] {
  try {
    const stored = localStorage.getItem(INSTALLMENT_PLANS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading installment plans:', error);
    return [];
  }
}

/**
 * Get installment plan by ID
 */
export function getInstallmentPlanById(id: string): InstallmentPlan | undefined {
  const plans = getInstallmentPlans();
  return plans.find(p => p.id === id);
}

/**
 * Get installment plans by sell cycle
 */
export function getInstallmentPlansBySellCycle(sellCycleId: string): InstallmentPlan[] {
  const plans = getInstallmentPlans();
  return plans.filter(p => p.sellCycleId === sellCycleId);
}

/**
 * Create installment plan
 */
export function createInstallmentPlan(data: {
  sellCycleId: string;
  propertyId: string;
  buyerId: string;
  buyerName: string;
  totalAmount: number;
  downPayment: number;
  numberOfInstallments: number;
  startDate: string;
  frequency: 'monthly' | 'quarterly' | 'bi-annual' | 'annual' | 'custom';
  customDates?: string[]; // For custom frequency
  createdBy: string;
}): InstallmentPlan {
  const remainingAmount = data.totalAmount - data.downPayment;
  const installmentAmount = remainingAmount / data.numberOfInstallments;
  
  // Generate installments
  const installments: Installment[] = [];
  let currentDate = new Date(data.startDate);
  
  for (let i = 0; i < data.numberOfInstallments; i++) {
    let dueDate: Date;
    
    if (data.frequency === 'custom' && data.customDates && data.customDates[i]) {
      dueDate = new Date(data.customDates[i]);
    } else {
      dueDate = new Date(currentDate);
      
      switch (data.frequency) {
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'bi-annual':
          currentDate.setMonth(currentDate.getMonth() + 6);
          break;
        case 'annual':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }
    
    installments.push({
      id: `inst_${Date.now()}_${i}`,
      installmentNumber: i + 1,
      dueDate: dueDate.toISOString(),
      amount: installmentAmount,
      status: 'pending',
      paidAmount: 0,
    });
  }
  
  const newPlan: InstallmentPlan = {
    id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sellCycleId: data.sellCycleId,
    propertyId: data.propertyId,
    buyerId: data.buyerId,
    buyerName: data.buyerName,
    totalAmount: data.totalAmount,
    downPayment: data.downPayment,
    remainingAmount,
    numberOfInstallments: data.numberOfInstallments,
    installmentAmount,
    startDate: data.startDate,
    frequency: data.frequency,
    installments,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: data.createdBy,
  };
  
  const plans = getInstallmentPlans();
  plans.push(newPlan);
  localStorage.setItem(INSTALLMENT_PLANS_KEY, JSON.stringify(plans));
  
  return newPlan;
}

/**
 * Record payment for an installment
 */
export function recordInstallmentPayment(
  planId: string,
  installmentId: string,
  payment: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  }
): void {
  const plans = getInstallmentPlans();
  const planIndex = plans.findIndex(p => p.id === planId);
  
  if (planIndex === -1) {
    throw new Error('Installment plan not found');
  }
  
  const plan = plans[planIndex];
  const installmentIndex = plan.installments.findIndex(i => i.id === installmentId);
  
  if (installmentIndex === -1) {
    throw new Error('Installment not found');
  }
  
  const installment = plan.installments[installmentIndex];
  
  // Update installment
  installment.paidAmount += payment.amount;
  installment.paidDate = payment.paymentDate;
  installment.paymentMethod = payment.paymentMethod;
  installment.notes = payment.notes;
  
  // Update status
  if (installment.paidAmount >= installment.amount) {
    installment.status = 'paid';
  } else if (installment.paidAmount > 0) {
    installment.status = 'partial';
  }
  
  // Check if all installments are paid
  const allPaid = plan.installments.every(i => i.status === 'paid');
  if (allPaid) {
    plan.status = 'completed';
  }
  
  plan.updatedAt = new Date().toISOString();
  
  localStorage.setItem(INSTALLMENT_PLANS_KEY, JSON.stringify(plans));
}

/**
 * Update overdue installments
 */
export function updateOverdueInstallments(): void {
  const plans = getInstallmentPlans();
  const today = new Date();
  let updated = false;
  
  for (const plan of plans) {
    if (plan.status !== 'active') continue;
    
    for (const installment of plan.installments) {
      if (installment.status === 'pending') {
        const dueDate = new Date(installment.dueDate);
        if (dueDate < today) {
          installment.status = 'overdue';
          updated = true;
        }
      }
    }
  }
  
  if (updated) {
    localStorage.setItem(INSTALLMENT_PLANS_KEY, JSON.stringify(plans));
  }
}

/**
 * Get installment plan statistics
 */
export function getInstallmentPlanStats(planId: string) {
  const plan = getInstallmentPlanById(planId);
  if (!plan) return null;
  
  const totalPaid = plan.installments.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalDue = plan.installments.reduce((sum, i) => sum + i.amount, 0);
  const remainingAmount = totalDue - totalPaid;
  
  const paidCount = plan.installments.filter(i => i.status === 'paid').length;
  const overdueCount = plan.installments.filter(i => i.status === 'overdue').length;
  const pendingCount = plan.installments.filter(i => i.status === 'pending').length;
  
  const completionPercentage = (totalPaid / (plan.totalAmount - plan.downPayment)) * 100;
  
  // Find next due installment
  const nextDue = plan.installments
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  
  return {
    totalAmount: plan.totalAmount,
    downPayment: plan.downPayment,
    totalInstallmentAmount: totalDue,
    totalPaid: totalPaid + plan.downPayment,
    remainingAmount,
    completionPercentage,
    installmentCount: plan.installments.length,
    paidCount,
    overdueCount,
    pendingCount,
    nextDue,
  };
}

// ============================================
// PAYMENT RECEIPT MANAGEMENT
// ============================================

/**
 * Get all receipts
 */
export function getPaymentReceipts(): PaymentReceipt[] {
  try {
    const stored = localStorage.getItem(RECEIPTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading receipts:', error);
    return [];
  }
}

/**
 * Get receipt by ID
 */
export function getReceiptById(id: string): PaymentReceipt | undefined {
  const receipts = getPaymentReceipts();
  return receipts.find(r => r.id === id);
}

/**
 * Get receipts by sell cycle
 */
export function getReceiptsBySellCycle(sellCycleId: string): PaymentReceipt[] {
  const receipts = getPaymentReceipts();
  return receipts.filter(r => r.sellCycleId === sellCycleId);
}

/**
 * Generate receipt number
 */
function generateReceiptNumber(): string {
  const receipts = getPaymentReceipts();
  const count = receipts.length + 1;
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `RCP-${year}${month}-${count.toString().padStart(4, '0')}`;
}

/**
 * Create payment receipt
 */
export function createPaymentReceipt(data: {
  sellCycleId: string;
  propertyId: string;
  installmentPlanId?: string;
  installmentId?: string;
  fromName: string;
  fromContact: string;
  toName: string;
  toContact: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank-transfer' | 'cheque' | 'online' | 'other';
  referenceNumber?: string;
  chequeNumber?: string;
  chequeBank?: string;
  chequeDate?: string;
  bankName?: string;
  accountNumber?: string;
  transactionId?: string;
  purpose: 'token' | 'down-payment' | 'installment' | 'final-payment' | 'other';
  description?: string;
  issuedBy: string;
  issuedByName: string;
}): PaymentReceipt {
  const newReceipt: PaymentReceipt = {
    id: `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    receiptNumber: generateReceiptNumber(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  
  const receipts = getPaymentReceipts();
  receipts.push(newReceipt);
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  
  // If this is for an installment, link it
  if (data.installmentPlanId && data.installmentId) {
    linkReceiptToInstallment(data.installmentPlanId, data.installmentId, newReceipt.id);
  }
  
  return newReceipt;
}

/**
 * Link receipt to installment
 */
function linkReceiptToInstallment(
  planId: string,
  installmentId: string,
  receiptId: string
): void {
  const plans = getInstallmentPlans();
  const planIndex = plans.findIndex(p => p.id === planId);
  
  if (planIndex !== -1) {
    const installmentIndex = plans[planIndex].installments.findIndex(
      i => i.id === installmentId
    );
    
    if (installmentIndex !== -1) {
      plans[planIndex].installments[installmentIndex].receiptId = receiptId;
      localStorage.setItem(INSTALLMENT_PLANS_KEY, JSON.stringify(plans));
    }
  }
}

/**
 * Get receipt statistics for a sell cycle
 */
export function getReceiptStats(sellCycleId: string) {
  const receipts = getReceiptsBySellCycle(sellCycleId);
  
  const totalCollected = receipts.reduce((sum, r) => sum + r.amount, 0);
  
  const byPurpose = receipts.reduce((acc, r) => {
    acc[r.purpose] = (acc[r.purpose] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const byPaymentMethod = receipts.reduce((acc, r) => {
    acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalReceipts: receipts.length,
    totalCollected,
    byPurpose,
    byPaymentMethod,
    latestReceipt: receipts[receipts.length - 1],
  };
}

/**
 * Delete receipt
 */
export function deleteReceipt(id: string): void {
  const receipts = getPaymentReceipts();
  const filtered = receipts.filter(r => r.id !== id);
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(filtered));
}
