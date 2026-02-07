/**
 * Payment Schedule Service
 * Manages payment schedules and instalments across all transaction entities
 */

import { 
  PaymentSchedule, 
  Instalment, 
  PaymentScheduleCreateInput,
  PaymentScheduleUpdateInput,
  InstalmentPaymentInput
} from '../types/paymentSchedule';

const PAYMENT_SCHEDULES_KEY = 'estatemanager_payment_schedules';

// Storage helpers
export function getPaymentSchedules(): PaymentSchedule[] {
  try {
    const data = localStorage.getItem(PAYMENT_SCHEDULES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading payment schedules:', error);
    return [];
  }
}

function savePaymentSchedules(schedules: PaymentSchedule[]): void {
  try {
    localStorage.setItem(PAYMENT_SCHEDULES_KEY, JSON.stringify(schedules));
  } catch (error) {
    console.error('Error saving payment schedules:', error);
  }
}

/**
 * Generate smart default instalments based on agent inputs
 */
function generateDefaultInstalments(
  totalAmount: number,
  numberOfInstalments: number,
  startDate: string,
  paymentCompletionDays: number
): Instalment[] {
  const instalments: Instalment[] = [];
  const baseAmount = Math.floor(totalAmount / numberOfInstalments);
  const remainder = totalAmount - (baseAmount * numberOfInstalments);
  const daysBetweenInstalments = Math.floor(paymentCompletionDays / numberOfInstalments);
  
  const start = new Date(startDate);
  
  for (let i = 0; i < numberOfInstalments; i++) {
    const instalmentDate = new Date(start);
    instalmentDate.setDate(start.getDate() + (i * daysBetweenInstalments));
    
    // Add remainder to last instalment
    const amount = i === numberOfInstalments - 1 ? baseAmount + remainder : baseAmount;
    
    instalments.push({
      id: `instalment-${Date.now()}-${i}`,
      instalmentNumber: i + 1,
      amount: amount,
      dueDate: instalmentDate.toISOString().split('T')[0],
      paidAmount: 0,
      status: 'pending',
    });
  }
  
  return instalments;
}

/**
 * Calculate payment schedule progress
 */
function calculateProgress(instalments: Instalment[]): {
  totalPaid: number;
  totalPending: number;
  percentageComplete: number;
} {
  const totalPaid = instalments.reduce((sum, inst) => sum + (inst.paidAmount || 0), 0);
  const totalAmount = instalments.reduce((sum, inst) => sum + inst.amount, 0);
  const totalPending = totalAmount - totalPaid;
  const percentageComplete = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;
  
  return { totalPaid, totalPending, percentageComplete };
}

/**
 * Update instalment statuses based on payment and dates
 */
function updateInstalmentStatuses(instalments: Instalment[]): Instalment[] {
  const today = new Date().toISOString().split('T')[0];
  
  return instalments.map(inst => {
    if (!inst.paidAmount || inst.paidAmount === 0) {
      // No payment made
      if (inst.dueDate < today) {
        return { ...inst, status: 'overdue' as const };
      }
      return { ...inst, status: 'pending' as const };
    } else if (inst.paidAmount >= inst.amount) {
      // Fully paid
      return { ...inst, status: 'paid' as const };
    } else {
      // Partially paid
      return { ...inst, status: 'partial' as const };
    }
  });
}

/**
 * Create a new payment schedule
 */
export function createPaymentSchedule(
  input: PaymentScheduleCreateInput,
  userId: string,
  userName: string
): PaymentSchedule {
  const instalments = generateDefaultInstalments(
    input.totalAmount,
    input.numberOfInstalments,
    input.startDate,
    input.paymentCompletionDays
  );
  
  const progress = calculateProgress(instalments);
  
  const schedule: PaymentSchedule = {
    id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityId: input.entityId,
    entityType: input.entityType,
    propertyId: input.propertyId,
    totalAmount: input.totalAmount,
    numberOfInstalments: input.numberOfInstalments,
    paymentCompletionDays: input.paymentCompletionDays,
    startDate: input.startDate,
    instalments: instalments,
    totalPaid: progress.totalPaid,
    totalPending: progress.totalPending,
    percentageComplete: progress.percentageComplete,
    createdBy: userId,
    createdByName: userName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    description: input.description,
    terms: input.terms,
  };
  
  const schedules = getPaymentSchedules();
  schedules.push(schedule);
  savePaymentSchedules(schedules);
  
  return schedule;
}

/**
 * Get payment schedule by ID
 */
export function getPaymentScheduleById(scheduleId: string): PaymentSchedule | null {
  const schedules = getPaymentSchedules();
  return schedules.find(s => s.id === scheduleId) || null;
}

/**
 * Get payment schedules by entity
 */
export function getPaymentSchedulesByEntity(
  entityId: string,
  entityType: 'sell-cycle' | 'purchase-cycle' | 'deal' | 'buyer-requirement'
): PaymentSchedule[] {
  const schedules = getPaymentSchedules();
  return schedules.filter(s => s.entityId === entityId && s.entityType === entityType);
}

/**
 * Get active payment schedule for entity
 */
export function getActivePaymentSchedule(
  entityId: string,
  entityType: 'sell-cycle' | 'purchase-cycle' | 'deal' | 'buyer-requirement'
): PaymentSchedule | null {
  const schedules = getPaymentSchedulesByEntity(entityId, entityType);
  return schedules.find(s => s.status === 'active') || null;
}

/**
 * Get instalments from a payment schedule
 */
export function getPaymentScheduleInstalments(scheduleId: string): Instalment[] {
  const schedule = getPaymentScheduleById(scheduleId);
  return schedule ? schedule.instalments : [];
}

/**
 * Update payment schedule
 */
export function updatePaymentSchedule(
  scheduleId: string,
  updates: PaymentScheduleUpdateInput
): PaymentSchedule | null {
  const schedules = getPaymentSchedules();
  const index = schedules.findIndex(s => s.id === scheduleId);
  
  if (index === -1) return null;
  
  const schedule = schedules[index];
  
  // Update instalments if provided
  let updatedInstalments = updates.instalments || schedule.instalments;
  updatedInstalments = updateInstalmentStatuses(updatedInstalments);
  
  // Recalculate progress
  const progress = calculateProgress(updatedInstalments);
  
  // Check if should auto-complete
  let status = updates.status || schedule.status;
  if (progress.percentageComplete === 100 && status === 'active') {
    status = 'completed';
  }
  
  const updatedSchedule: PaymentSchedule = {
    ...schedule,
    instalments: updatedInstalments,
    totalPaid: progress.totalPaid,
    totalPending: progress.totalPending,
    percentageComplete: progress.percentageComplete,
    status: status,
    description: updates.description !== undefined ? updates.description : schedule.description,
    terms: updates.terms !== undefined ? updates.terms : schedule.terms,
    updatedAt: new Date().toISOString(),
  };
  
  schedules[index] = updatedSchedule;
  savePaymentSchedules(schedules);
  
  return updatedSchedule;
}

/**
 * Record instalment payment
 */
export function recordInstalmentPayment(
  scheduleId: string,
  payment: InstalmentPaymentInput
): PaymentSchedule | null {
  const schedule = getPaymentScheduleById(scheduleId);
  if (!schedule) return null;
  
  const updatedInstalments = schedule.instalments.map(inst => {
    if (inst.id === payment.instalmentId) {
      const newPaidAmount = (inst.paidAmount || 0) + payment.amount;
      return {
        ...inst,
        paidAmount: newPaidAmount,
        paidDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        receiptNumber: payment.receiptNumber,
        notes: payment.notes,
      };
    }
    return inst;
  });
  
  return updatePaymentSchedule(scheduleId, { instalments: updatedInstalments });
}

/**
 * Activate payment schedule
 */
export function activatePaymentSchedule(scheduleId: string): PaymentSchedule | null {
  return updatePaymentSchedule(scheduleId, { status: 'active' });
}

/**
 * Cancel payment schedule
 */
export function cancelPaymentSchedule(scheduleId: string): PaymentSchedule | null {
  return updatePaymentSchedule(scheduleId, { status: 'cancelled' });
}

/**
 * Delete payment schedule
 */
export function deletePaymentSchedule(scheduleId: string): boolean {
  const schedules = getPaymentSchedules();
  const filtered = schedules.filter(s => s.id !== scheduleId);
  
  if (filtered.length === schedules.length) return false;
  
  savePaymentSchedules(filtered);
  return true;
}

/**
 * Get all payment schedules for a property
 */
export function getPaymentSchedulesByProperty(propertyId: string): PaymentSchedule[] {
  const schedules = getPaymentSchedules();
  return schedules.filter(s => s.propertyId === propertyId);
}

/**
 * Get payment statistics
 */
export function getPaymentStatistics(scheduleId: string): {
  totalInstalments: number;
  paidInstalments: number;
  pendingInstalments: number;
  overdueInstalments: number;
  nextDueDate: string | null;
  nextDueAmount: number;
} | null {
  const schedule = getPaymentScheduleById(scheduleId);
  if (!schedule) return null;
  
  const today = new Date().toISOString().split('T')[0];
  
  const paidInstalments = schedule.instalments.filter(i => i.status === 'paid').length;
  const pendingInstalments = schedule.instalments.filter(i => i.status === 'pending').length;
  const overdueInstalments = schedule.instalments.filter(i => i.status === 'overdue').length;
  
  const nextDue = schedule.instalments
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  
  return {
    totalInstalments: schedule.instalments.length,
    paidInstalments,
    pendingInstalments,
    overdueInstalments,
    nextDueDate: nextDue?.dueDate || null,
    nextDueAmount: nextDue?.amount || 0,
  };
}

/**
 * Initialize payment schedules storage
 */
export function initializePaymentSchedules(): void {
  if (!localStorage.getItem(PAYMENT_SCHEDULES_KEY)) {
    localStorage.setItem(PAYMENT_SCHEDULES_KEY, JSON.stringify([]));
  }
}