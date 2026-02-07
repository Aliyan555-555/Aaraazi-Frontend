/**
 * Deal Payment Management
 * Flexible payment plan creation and management system
 * WITH AUTOMATED RECEIPT GENERATION ✅
 */

import { Deal, PaymentPlan, PaymentInstallment, PaymentPlanModification, DealPayment } from '../types';
import { getDealById, updateDeal, saveDeals, getDeals } from './deals';
import { autoGenerateReceipt } from './receiptGeneration';

/**
 * Create a payment plan for a deal
 * Called during Sales Agreement stage
 */
export interface CreatePaymentPlanInput {
  downPaymentPercentage: number;
  downPaymentDate: string;
  numberOfInstallments: number;
  frequency: 'monthly' | 'quarterly';
  firstInstallmentDate: string;
}

export const createPaymentPlan = (
  dealId: string,
  agentId: string,
  agentName: string,
  input: CreatePaymentPlanInput
): Deal => {
  const deal = getDealById(dealId);
  
  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }
  
  // Only primary agent can create payment plan
  if (deal.agents.primary.id !== agentId) {
    throw new Error('Only primary agent can create payment plan');
  }
  
  // Check if plan already exists
  if (deal.financial.paymentPlan) {
    throw new Error('Payment plan already exists. Use modify functions to change it.');
  }
  
  const now = new Date().toISOString();
  const totalAmount = deal.financial.agreedPrice;
  
  // Calculate amounts
  const downPaymentAmount = totalAmount * (input.downPaymentPercentage / 100);
  const remainingAmount = totalAmount - downPaymentAmount;
  const installmentAmount = remainingAmount / input.numberOfInstallments;
  
  // Create down payment installment
  const installments: PaymentInstallment[] = [];
  
  installments.push({
    id: `inst_${Date.now()}_0`,
    sequence: 1,
    amount: downPaymentAmount,
    dueDate: input.downPaymentDate,
    description: `Down Payment (${input.downPaymentPercentage}%)`,
    status: 'pending',
    paidAmount: 0,
    paymentIds: [],
    wasModified: false,
  });
  
  // Create remaining installments
  const firstInstDate = new Date(input.firstInstallmentDate);
  const frequencyDays = input.frequency === 'monthly' ? 30 : 90;
  
  for (let i = 0; i < input.numberOfInstallments; i++) {
    const dueDate = new Date(firstInstDate);
    dueDate.setDate(dueDate.getDate() + (i * frequencyDays));
    
    installments.push({
      id: `inst_${Date.now()}_${i + 1}`,
      sequence: i + 2,
      amount: installmentAmount,
      dueDate: dueDate.toISOString(),
      description: i === input.numberOfInstallments - 1 
        ? `Final Payment (Installment ${i + 1} of ${input.numberOfInstallments})`
        : `Installment ${i + 1} of ${input.numberOfInstallments}`,
      status: 'pending',
      paidAmount: 0,
      paymentIds: [],
      wasModified: false,
    });
  }
  
  // Create payment plan
  const paymentPlan: PaymentPlan = {
    createdAt: now,
    createdBy: agentId,
    lastModified: now,
    modifiedBy: agentId,
    totalAmount,
    installments,
    modifications: [],
    status: 'active',
  };
  
  // Update deal
  deal.financial.paymentPlan = paymentPlan;
  deal.financial.paymentState = 'plan-active';
  
  // Update deal in storage
  return updateDeal(dealId, {
    financial: deal.financial,
  });
};

/**
 * Record ad-hoc payment (before plan exists or outside of plan)
 * ✅ WITH AUTOMATED RECEIPT GENERATION
 */
export interface RecordAdHocPaymentInput {
  amount: number;
  paidDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank-transfer' | 'online';
  referenceNumber?: string;
  receiptNumber?: string;
  notes?: string;
}

export const recordAdHocPayment = (
  dealId: string,
  agentId: string,
  agentName: string,
  input: RecordAdHocPaymentInput
): Deal => {
  const deal = getDealById(dealId);
  
  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }
  
  // Only primary agent can record payments
  if (deal.agents.primary.id !== agentId) {
    throw new Error('Only primary agent can record payments');
  }
  
  const now = new Date().toISOString();
  
  // Create payment record
  const payment: DealPayment = {
    id: `pay_${Date.now()}`,
    dealId,
    type: 'ad-hoc',
    amount: input.amount,
    paidDate: input.paidDate,
    installmentId: undefined, // Not linked to any installment
    status: 'recorded',
    recordedBy: {
      agentId,
      agentName,
      agentRole: 'primary',
    },
    paymentMethod: input.paymentMethod,
    referenceNumber: input.referenceNumber,
    receiptNumber: input.receiptNumber, // Will be auto-generated if not provided
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  
  // ✅ AUTO-GENERATE RECEIPT if not provided
  if (!payment.receiptNumber) {
    payment.receiptNumber = autoGenerateReceipt(payment, deal, agentName);
  }
  
  // Add to payments array
  deal.financial.payments.push(payment);
  
  // Update totals
  deal.financial.totalPaid += input.amount;
  deal.financial.balanceRemaining -= input.amount;
  
  // Check if fully paid
  if (deal.financial.balanceRemaining <= 0) {
    deal.financial.paymentState = 'fully-paid';
  }
  
  // Update deal
  return updateDeal(dealId, {
    financial: deal.financial,
  });
};

/**
 * Record payment against a specific installment
 * ✅ WITH AUTOMATED RECEIPT GENERATION
 */
export interface RecordInstallmentPaymentInput {
  installmentId: string;
  amount: number;
  paidDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank-transfer' | 'online';
  referenceNumber?: string;
  receiptNumber?: string;
  notes?: string;
}

export const recordInstallmentPayment = (
  dealId: string,
  agentId: string,
  agentName: string,
  input: RecordInstallmentPaymentInput
): Deal => {
  const deal = getDealById(dealId);
  
  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }
  
  // Only primary agent can record payments
  if (deal.agents.primary.id !== agentId) {
    throw new Error('Only primary agent can record payments');
  }
  
  // Check if plan exists
  if (!deal.financial.paymentPlan) {
    throw new Error('Payment plan does not exist');
  }
  
  // Find installment
  const installment = deal.financial.paymentPlan.installments.find(
    inst => inst.id === input.installmentId
  );
  
  if (!installment) {
    throw new Error('Installment not found');
  }
  
  const now = new Date().toISOString();
  
  // Determine payment type based on installment description
  let paymentType: DealPayment['type'] = 'installment';
  if (installment.description.toLowerCase().includes('down payment')) {
    paymentType = 'down-payment';
  } else if (installment.description.toLowerCase().includes('token')) {
    paymentType = 'token';
  } else if (installment.description.toLowerCase().includes('final')) {
    paymentType = 'final-payment';
  }
  
  // Create payment record
  const payment: DealPayment = {
    id: `pay_${Date.now()}`,
    dealId,
    type: paymentType,
    amount: input.amount,
    paidDate: input.paidDate,
    installmentId: input.installmentId,
    status: 'recorded',
    recordedBy: {
      agentId,
      agentName,
      agentRole: 'primary',
    },
    paymentMethod: input.paymentMethod,
    referenceNumber: input.referenceNumber,
    receiptNumber: input.receiptNumber, // Will be auto-generated if not provided
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  
  // ✅ AUTO-GENERATE RECEIPT if not provided
  if (!payment.receiptNumber) {
    payment.receiptNumber = autoGenerateReceipt(payment, deal, agentName);
  }
  
  // Add to payments array
  deal.financial.payments.push(payment);
  
  // Update installment status
  installment.paidAmount += input.amount;
  installment.paymentIds.push(payment.id);
  
  if (installment.paidAmount >= installment.amount) {
    installment.status = 'paid';
    installment.paidDate = input.paidDate;
  } else if (installment.paidAmount > 0) {
    installment.status = 'partial';
  }
  
  // Update totals
  deal.financial.totalPaid += input.amount;
  deal.financial.balanceRemaining -= input.amount;
  
  // Check if all installments are paid
  const allPaid = deal.financial.paymentPlan.installments.every(
    inst => inst.status === 'paid'
  );
  
  if (allPaid) {
    deal.financial.paymentState = 'fully-paid';
    deal.financial.paymentPlan.status = 'completed';
  }
  
  // Update deal
  return updateDeal(dealId, {
    financial: deal.financial,
  });
};

/**
 * Add a new installment to existing payment plan
 */
export interface AddInstallmentInput {
  amount: number;
  dueDate: string;
  description: string;
  reason: string;
}

export const addInstallment = (
  dealId: string,
  agentId: string,
  agentName: string,
  input: AddInstallmentInput
): Deal => {
  const deal = getDealById(dealId);
  
  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }
  
  // Only primary agent can modify payment plan
  if (deal.agents.primary.id !== agentId) {
    throw new Error('Only primary agent can modify payment plan');
  }
  
  // Check if plan exists
  if (!deal.financial.paymentPlan) {
    throw new Error('Payment plan does not exist');
  }
  
  const now = new Date().toISOString();
  
  // Create new installment
  const newInstallment: PaymentInstallment = {
    id: `inst_${Date.now()}`,
    sequence: deal.financial.paymentPlan.installments.length + 1,
    amount: input.amount,
    dueDate: input.dueDate,
    description: input.description,
    status: 'pending',
    paidAmount: 0,
    paymentIds: [],
    wasModified: false,
  };
  
  // Add to plan
  deal.financial.paymentPlan.installments.push(newInstallment);
  
  // Renumber all installments
  deal.financial.paymentPlan.installments.forEach((inst, index) => {
    inst.sequence = index + 1;
  });
  
  // Update plan total
  deal.financial.paymentPlan.totalAmount += input.amount;
  
  // Update deal agreed price if needed
  deal.financial.agreedPrice += input.amount;
  deal.financial.balanceRemaining += input.amount;
  
  // Record modification
  const modification: PaymentPlanModification = {
    id: `mod_${Date.now()}`,
    modifiedAt: now,
    modifiedBy: agentId,
    modifiedByName: agentName,
    modificationType: 'installment-added',
    changes: [
      {
        field: 'installments',
        oldValue: deal.financial.paymentPlan.installments.length - 1,
        newValue: deal.financial.paymentPlan.installments.length,
      },
      {
        field: 'totalAmount',
        oldValue: deal.financial.paymentPlan.totalAmount - input.amount,
        newValue: deal.financial.paymentPlan.totalAmount,
      },
    ],
    reason: input.reason,
  };
  
  deal.financial.paymentPlan.modifications.push(modification);
  deal.financial.paymentPlan.lastModified = now;
  deal.financial.paymentPlan.modifiedBy = agentId;
  deal.financial.paymentState = 'plan-modified';
  
  // Update deal
  return updateDeal(dealId, {
    financial: deal.financial,
  });
};

/**
 * Modify an existing installment
 */
export interface ModifyInstallmentInput {
  installmentId: string;
  newAmount?: number;
  newDueDate?: string;
  reason: string;
}

export const modifyInstallment = (
  dealId: string,
  agentId: string,
  agentName: string,
  input: ModifyInstallmentInput
): Deal => {
  const deal = getDealById(dealId);
  
  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }
  
  // Only primary agent can modify payment plan
  if (deal.agents.primary.id !== agentId) {
    throw new Error('Only primary agent can modify payment plan');
  }
  
  // Check if plan exists
  if (!deal.financial.paymentPlan) {
    throw new Error('Payment plan does not exist');
  }
  
  // Find installment
  const installment = deal.financial.paymentPlan.installments.find(
    inst => inst.id === input.installmentId
  );
  
  if (!installment) {
    throw new Error('Installment not found');
  }
  
  const now = new Date().toISOString();
  const changes: PaymentPlanModification['changes'] = [];
  
  // Store original values if first modification
  if (!installment.wasModified) {
    installment.originalAmount = installment.amount;
    installment.originalDueDate = installment.dueDate;
  }
  
  // Modify amount
  if (input.newAmount !== undefined && input.newAmount !== installment.amount) {
    const oldAmount = installment.amount;
    const amountDiff = input.newAmount - oldAmount;
    
    installment.amount = input.newAmount;
    deal.financial.paymentPlan.totalAmount += amountDiff;
    deal.financial.agreedPrice += amountDiff;
    deal.financial.balanceRemaining += amountDiff;
    
    changes.push({
      field: 'amount',
      oldValue: oldAmount,
      newValue: input.newAmount,
    });
  }
  
  // Modify due date
  if (input.newDueDate && input.newDueDate !== installment.dueDate) {
    const oldDate = installment.dueDate;
    installment.dueDate = input.newDueDate;
    
    changes.push({
      field: 'dueDate',
      oldValue: oldDate,
      newValue: input.newDueDate,
    });
  }
  
  // Mark as modified
  installment.wasModified = true;
  installment.modifiedAt = now;
  installment.modificationReason = input.reason;
  
  // Record modification
  if (changes.length > 0) {
    const modification: PaymentPlanModification = {
      id: `mod_${Date.now()}`,
      modifiedAt: now,
      modifiedBy: agentId,
      modifiedByName: agentName,
      modificationType: input.newAmount ? 'amount-changed' : 'date-changed',
      changes,
      reason: input.reason,
    };
    
    deal.financial.paymentPlan.modifications.push(modification);
    deal.financial.paymentPlan.lastModified = now;
    deal.financial.paymentPlan.modifiedBy = agentId;
    deal.financial.paymentState = 'plan-modified';
  }
  
  // Update deal
  return updateDeal(dealId, {
    financial: deal.financial,
  });
};

/**
 * Delete an unpaid installment
 * Only allowed for pending installments with no payments
 */
export const deleteInstallment = (
  dealId: string,
  agentId: string,
  agentName: string,
  installmentId: string,
  reason: string
): Deal => {
  const deal = getDealById(dealId);
  
  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }
  
  // Only primary agent can delete installments
  if (deal.agents.primary.id !== agentId) {
    throw new Error('Only primary agent can delete installments');
  }
  
  // Check if plan exists
  if (!deal.financial.paymentPlan) {
    throw new Error('Payment plan does not exist');
  }
  
  // Find installment
  const installmentIndex = deal.financial.paymentPlan.installments.findIndex(
    inst => inst.id === installmentId
  );
  
  if (installmentIndex === -1) {
    throw new Error('Installment not found');
  }
  
  const installment = deal.financial.paymentPlan.installments[installmentIndex];
  
  // Cannot delete if any payment has been made
  if (installment.paidAmount > 0) {
    throw new Error('Cannot delete installment with payments. Only pending installments can be deleted.');
  }
  
  const now = new Date().toISOString();
  
  // Remove installment
  deal.financial.paymentPlan.installments.splice(installmentIndex, 1);
  
  // Renumber remaining installments
  deal.financial.paymentPlan.installments.forEach((inst, index) => {
    inst.sequence = index + 1;
  });
  
  // Update totals
  deal.financial.paymentPlan.totalAmount -= installment.amount;
  deal.financial.agreedPrice -= installment.amount;
  deal.financial.balanceRemaining -= installment.amount;
  
  // Record modification
  const modification: PaymentPlanModification = {
    id: `mod_${Date.now()}`,
    modifiedAt: now,
    modifiedBy: agentId,
    modifiedByName: agentName,
    modificationType: 'installment-removed',
    changes: [
      {
        field: 'installments',
        oldValue: deal.financial.paymentPlan.installments.length + 1,
        newValue: deal.financial.paymentPlan.installments.length,
      },
      {
        field: 'deletedInstallment',
        oldValue: installment.description,
        newValue: null,
      },
    ],
    reason,
  };
  
  deal.financial.paymentPlan.modifications.push(modification);
  deal.financial.paymentPlan.lastModified = now;
  deal.financial.paymentPlan.modifiedBy = agentId;
  deal.financial.paymentState = 'plan-modified';
  
  // Update deal
  return updateDeal(dealId, {
    financial: deal.financial,
  });
};

/**
 * Get payment summary for a deal
 */
export interface PaymentSummary {
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  percentagePaid: number;
  paymentPlanStatus: Deal['financial']['paymentState'];
  installmentCount: number;
  paidInstallmentCount: number;
  pendingInstallmentCount: number;
  nextPaymentDue: {
    date: string;
    amount: number;
    description: string;
  } | null;
  overduePayments: PaymentInstallment[];
}

export const getPaymentSummary = (dealId: string): PaymentSummary => {
  const deal = getDealById(dealId);
  
  if (!deal) {
    throw new Error(`Deal ${dealId} not found`);
  }
  
  const plan = deal.financial.paymentPlan;
  const now = new Date();
  
  let installmentCount = 0;
  let paidInstallmentCount = 0;
  let pendingInstallmentCount = 0;
  let nextPaymentDue: PaymentSummary['nextPaymentDue'] = null;
  const overduePayments: PaymentInstallment[] = [];
  
  if (plan) {
    installmentCount = plan.installments.length;
    paidInstallmentCount = plan.installments.filter(inst => inst.status === 'paid').length;
    pendingInstallmentCount = plan.installments.filter(inst => inst.status === 'pending' || inst.status === 'partial').length;
    
    // Find next payment due
    const upcomingInstallments = plan.installments
      .filter(inst => inst.status !== 'paid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    if (upcomingInstallments.length > 0) {
      const next = upcomingInstallments[0];
      nextPaymentDue = {
        date: next.dueDate,
        amount: next.amount - next.paidAmount,
        description: next.description,
      };
    }
    
    // Find overdue payments
    plan.installments.forEach(inst => {
      if ((inst.status === 'pending' || inst.status === 'partial') && new Date(inst.dueDate) < now) {
        inst.status = 'overdue';
        overduePayments.push(inst);
      }
    });
  }
  
  return {
    totalAmount: deal.financial.agreedPrice,
    totalPaid: deal.financial.totalPaid,
    totalPending: deal.financial.balanceRemaining,
    percentagePaid: (deal.financial.totalPaid / deal.financial.agreedPrice) * 100,
    paymentPlanStatus: deal.financial.paymentState,
    installmentCount,
    paidInstallmentCount,
    pendingInstallmentCount,
    nextPaymentDue,
    overduePayments,
  };
};

/**
 * Export payment record for PDF generation
 */
export const exportPaymentRecord = (dealId: string) => {
  const deal = getDealById(dealId);
  
  if (!deal) {
    return null;
  }
  
  const summary = getPaymentSummary(dealId);
  
  return {
    dealNumber: deal.dealNumber,
    agreedPrice: deal.financial.agreedPrice,
    property: {
      id: deal.cycles.sellCycle.propertyId,
      address: `Property ${deal.cycles.sellCycle.propertyId}`,
    },
    seller: deal.parties.seller,
    buyer: deal.parties.buyer,
    agents: deal.agents,
    plan: deal.financial.paymentPlan,
    payments: deal.financial.payments,
    summary,
  };
};

// ============================================
// OVERDUE PAYMENT DETECTION (GAP FIX #4)
// ============================================

export interface OverduePayment {
  dealId: string;
  dealNumber: string;
  installmentId: string;
  propertyId: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  severity: 'warning' | 'critical' | 'severe';
  description: string;
}

/**
 * Check for overdue payments across all deals
 * IMPLEMENTATION: Gap Fix #4 - Overdue payment detection for dashboard
 * 
 * This function identifies all overdue installments and calculates
 * how many days each payment is overdue, categorized by severity.
 */
export function checkOverduePayments(userId: string, userRole: string = 'agent'): OverduePayment[] {
  const deals = getDeals(userId, userRole);
  const overdue: OverduePayment[] = [];
  const today = new Date();
  
  deals.forEach(deal => {
    // Skip if deal doesn't have a payment plan
    if (!deal.financial.paymentPlan) return;
    
    const plan = deal.financial.paymentPlan;
    
    // Check each installment for overdue status
    plan.installments.forEach(installment => {
      if (installment.status === 'pending' || installment.status === 'partial' || installment.status === 'overdue') {
        const dueDate = new Date(installment.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only include if actually overdue (positive days)
        if (daysOverdue > 0) {
          overdue.push({
            dealId: deal.id,
            dealNumber: deal.dealNumber,
            installmentId: installment.id,
            propertyId: deal.cycles.sellCycle.propertyId,
            buyerId: deal.parties.buyer.id,
            buyerName: deal.parties.buyer.name,
            amount: installment.amount - installment.paidAmount,
            dueDate: installment.dueDate,
            daysOverdue,
            severity: calculatePaymentSeverity(daysOverdue),
            description: installment.description
          });
        }
      }
    });
  });
  
  // Sort by days overdue (most overdue first)
  return overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/**
 * Calculate payment severity based on days overdue
 */
function calculatePaymentSeverity(daysOverdue: number): 'warning' | 'critical' | 'severe' {
  if (daysOverdue > 60) return 'severe';      // 60+ days: Severe
  if (daysOverdue > 30) return 'critical';    // 31-60 days: Critical
  return 'warning';                            // 1-30 days: Warning
}

/**
 * Get overdue payments by severity
 */
export function getOverduePaymentsBySeverity(userId: string, userRole: string = 'agent') {
  const allOverdue = checkOverduePayments(userId, userRole);
  
  return {
    severe: allOverdue.filter(p => p.severity === 'severe'),
    critical: allOverdue.filter(p => p.severity === 'critical'),
    warning: allOverdue.filter(p => p.severity === 'warning'),
    total: allOverdue.length,
    totalAmount: allOverdue.reduce((sum, p) => sum + p.amount, 0)
  };
}

/**
 * Get overdue summary for a specific deal
 */
export function getDealOverdueSummary(dealId: string) {
  const deal = getDealById(dealId);
  
  if (!deal || !deal.financial.paymentPlan) {
    return {
      hasOverdue: false,
      count: 0,
      totalAmount: 0,
      payments: []
    };
  }
  
  const today = new Date();
  const overdueInstallments: OverduePayment[] = [];
  
  deal.financial.paymentPlan.installments.forEach(installment => {
    if (installment.status === 'pending' || installment.status === 'partial' || installment.status === 'overdue') {
      const dueDate = new Date(installment.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue > 0) {
        overdueInstallments.push({
          dealId: deal.id,
          dealNumber: deal.dealNumber,
          installmentId: installment.id,
          propertyId: deal.cycles.sellCycle.propertyId,
          buyerId: deal.parties.buyer.id,
          buyerName: deal.parties.buyer.name,
          amount: installment.amount - installment.paidAmount,
          dueDate: installment.dueDate,
          daysOverdue,
          severity: calculatePaymentSeverity(daysOverdue),
          description: installment.description
        });
      }
    }
  });
  
  return {
    hasOverdue: overdueInstallments.length > 0,
    count: overdueInstallments.length,
    totalAmount: overdueInstallments.reduce((sum, p) => sum + p.amount, 0),
    payments: overdueInstallments
  };
}
