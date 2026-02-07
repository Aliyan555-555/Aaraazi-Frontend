/**
 * Deal Validation Utilities
 * Comprehensive validation for deal operations
 */

import { Deal, DealStage, DealPayment, DealTask, DealDocument } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate deal creation data
 */
export const validateDealCreation = (data: {
  sellCycleId: string;
  offerId: string;
  primaryAgentId: string;
  agreedPrice: number;
  propertyId: string;
}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.sellCycleId) {
    errors.push('Sell cycle ID is required');
  }
  if (!data.offerId) {
    errors.push('Offer ID is required');
  }
  if (!data.primaryAgentId) {
    errors.push('Primary agent ID is required');
  }
  if (!data.propertyId) {
    errors.push('Property ID is required');
  }

  // Price validation
  if (!data.agreedPrice || data.agreedPrice <= 0) {
    errors.push('Agreed price must be greater than 0');
  }
  if (data.agreedPrice > 0 && data.agreedPrice < 100000) {
    warnings.push('Agreed price seems unusually low (less than PKR 100,000)');
  }
  if (data.agreedPrice > 10000000000) {
    warnings.push('Agreed price seems unusually high (over PKR 10 billion)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate stage progression
 */
export const validateStageProgression = (
  deal: Deal,
  targetStage: DealStage
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if deal is active
  if (deal.lifecycle.status !== 'active') {
    errors.push('Cannot progress a non-active deal');
    return { isValid: false, errors, warnings };
  }
  
  // Validate stage order
  const stageOrder: DealStage[] = [
    'offer-accepted',
    'agreement-signing',
    'documentation',
    'payment-processing',
    'handover-preparation',
    'transfer-registration',
    'final-handover'
  ];
  
  const currentIndex = stageOrder.indexOf(deal.lifecycle.stage);
  const targetIndex = stageOrder.indexOf(targetStage);
  
  if (targetIndex <= currentIndex) {
    errors.push('Cannot move to a previous or same stage');
  }
  if (targetIndex > currentIndex + 1) {
    errors.push('Cannot skip stages - progress sequentially');
  }
  
  // Check stage requirements
  const currentStage = deal.lifecycle.stage;
  const stageTasks = deal.tasks.filter(t => t.stage === currentStage);
  const completedTasks = stageTasks.filter(t => t.status === 'completed');
  const taskCompletionRate = stageTasks.length > 0 
    ? (completedTasks.length / stageTasks.length) * 100 
    : 100;
  
  if (taskCompletionRate < 50) {
    errors.push(`Only ${Math.round(taskCompletionRate)}% of tasks completed - minimum 50% required`);
  } else if (taskCompletionRate < 80) {
    warnings.push(`${Math.round(taskCompletionRate)}% of tasks completed - recommended 80%+`);
  }
  
  // Check documents
  const stageDocuments = deal.documents.filter(d => d.stage === currentStage);
  const verifiedDocuments = stageDocuments.filter(d => d.status === 'verified');
  const docCompletionRate = stageDocuments.length > 0 
    ? (verifiedDocuments.length / stageDocuments.length) * 100 
    : 100;
  
  if (docCompletionRate < 50) {
    errors.push(`Only ${Math.round(docCompletionRate)}% of documents verified - minimum 50% required`);
  } else if (docCompletionRate < 80) {
    warnings.push(`${Math.round(docCompletionRate)}% of documents verified - recommended 80%+`);
  }
  
  // Check payments for specific stages
  const requiredPayments = getRequiredPaymentsByStage(currentStage);
  const completedPayments = requiredPayments.filter(type => {
    const payment = deal.financial.payments.find(p => p.type === type);
    return payment?.status === 'completed';
  });
  
  if (completedPayments.length < requiredPayments.length) {
    warnings.push(`${completedPayments.length}/${requiredPayments.length} required payments completed`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate payment recording
 */
export const validatePaymentRecording = (
  payment: DealPayment,
  deal: Deal
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check payment status
  if (payment.status === 'completed') {
    errors.push('Payment is already marked as completed');
  }
  
  // Check amount
  if (payment.paidAmount && payment.paidAmount > payment.amount) {
    errors.push('Paid amount cannot exceed payment amount');
  }
  
  // Check if overpayment
  const totalPaid = deal.financial.totalPaid;
  const newPaidAmount = payment.paidAmount || 0;
  if (totalPaid + newPaidAmount > deal.financial.agreedPrice) {
    warnings.push('This payment will result in overpayment');
  }
  
  // Check due date
  if (payment.status === 'pending' && new Date(payment.dueDate) < new Date()) {
    warnings.push('This payment is overdue');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate task completion
 */
export const validateTaskCompletion = (
  task: DealTask,
  deal: Deal
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if task is already completed
  if (task.status === 'completed') {
    warnings.push('Task is already marked as completed');
  }
  
  // Check if task is in current or past stage
  const stageOrder: DealStage[] = [
    'offer-accepted',
    'agreement-signing',
    'documentation',
    'payment-processing',
    'handover-preparation',
    'transfer-registration',
    'final-handover'
  ];
  
  const currentIndex = stageOrder.indexOf(deal.lifecycle.stage);
  const taskIndex = stageOrder.indexOf(task.stage);
  
  if (taskIndex > currentIndex) {
    warnings.push('This task belongs to a future stage');
  }
  
  // Check if task is overdue
  if (task.dueDate && new Date(task.dueDate) < new Date()) {
    warnings.push('This task is overdue');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate document upload
 */
export const validateDocumentUpload = (
  document: DealDocument,
  file?: File
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if document is already verified
  if (document.status === 'verified') {
    warnings.push('Document is already verified');
  }
  
  // Check file if provided
  if (file) {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size exceeds 10MB limit');
    }
    
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed. Please upload PDF, DOC, DOCX, JPG, or PNG');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate deal completion
 */
export const validateDealCompletion = (deal: Deal): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if deal is in final stage
  if (deal.lifecycle.stage !== 'final-handover') {
    errors.push('Deal must be in final-handover stage to be completed');
  }
  
  // Check if all payments are completed
  const pendingPayments = deal.financial.payments.filter(p => p.status === 'pending');
  if (pendingPayments.length > 0) {
    errors.push(`${pendingPayments.length} payments are still pending`);
  }
  
  // Check if balance is cleared
  if (deal.financial.balanceRemaining > 0) {
    errors.push(`Outstanding balance of PKR ${deal.financial.balanceRemaining.toLocaleString()}`);
  }
  
  // Check critical tasks
  const incompleteTasks = deal.tasks.filter(t => 
    t.status !== 'completed' && t.priority === 'high'
  );
  if (incompleteTasks.length > 0) {
    warnings.push(`${incompleteTasks.length} high-priority tasks are incomplete`);
  }
  
  // Check critical documents
  const unverifiedDocs = deal.documents.filter(d => 
    d.status !== 'verified' && d.type.includes('Agreement')
  );
  if (unverifiedDocs.length > 0) {
    errors.push(`${unverifiedDocs.length} critical documents are not verified`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate deal cancellation
 */
export const validateDealCancellation = (
  deal: Deal,
  reason: string
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if deal is already completed or cancelled
  if (deal.lifecycle.status === 'completed') {
    errors.push('Cannot cancel a completed deal');
  }
  if (deal.lifecycle.status === 'cancelled') {
    errors.push('Deal is already cancelled');
  }
  
  // Check if reason is provided
  if (!reason || reason.trim().length < 10) {
    errors.push('Cancellation reason must be at least 10 characters');
  }
  
  // Warn about payments
  if (deal.financial.totalPaid > 0) {
    warnings.push(
      `PKR ${deal.financial.totalPaid.toLocaleString()} has been paid. ` +
      'Ensure refund arrangements are made.'
    );
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Helper: Get required payments by stage
 */
const getRequiredPaymentsByStage = (
  stage: DealStage
): Array<'token' | 'downPayment' | 'installment1' | 'installment2' | 'installment3'> => {
  switch (stage) {
    case 'offer-accepted':
      return ['token'];
    case 'agreement-signing':
      return ['token', 'downPayment'];
    case 'documentation':
      return ['token', 'downPayment'];
    case 'payment-processing':
      return ['token', 'downPayment', 'installment1'];
    case 'handover-preparation':
      return ['token', 'downPayment', 'installment1', 'installment2'];
    case 'transfer-registration':
      return ['token', 'downPayment', 'installment1', 'installment2', 'installment3'];
    case 'final-handover':
      return ['token', 'downPayment', 'installment1', 'installment2', 'installment3'];
    default:
      return [];
  }
};

/**
 * Validate bulk operations
 */
export const validateBulkOperation = (
  dealIds: string[],
  operation: 'export' | 'archive' | 'delete'
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (dealIds.length === 0) {
    errors.push('No deals selected');
  }
  
  if (operation === 'delete' && dealIds.length > 10) {
    warnings.push(`You are about to delete ${dealIds.length} deals. This action cannot be undone.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
