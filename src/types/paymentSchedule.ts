/**
 * Payment Schedule System
 * Unified payment/instalment tracking across all transaction entities
 */

export interface Instalment {
  id: string;
  instalmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount?: number;
  paidDate?: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  paymentMethod?: string;
  receiptNumber?: string;
}

export interface PaymentSchedule {
  id: string;
  
  // Entity Reference
  entityId: string; // sellCycleId, purchaseCycleId, dealId, buyerRequirementId
  entityType: 'sell-cycle' | 'purchase-cycle' | 'deal' | 'buyer-requirement';
  propertyId?: string;
  
  // Configuration
  totalAmount: number;
  numberOfInstalments: number;
  paymentCompletionDays: number;
  startDate: string;
  
  // Instalments
  instalments: Instalment[];
  
  // Progress
  totalPaid: number;
  totalPending: number;
  percentageComplete: number;
  
  // Meta
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  
  // Notes
  description?: string;
  terms?: string;
}

export type PaymentScheduleCreateInput = {
  entityId: string;
  entityType: 'sell-cycle' | 'purchase-cycle' | 'deal' | 'buyer-requirement';
  totalAmount: number;
  numberOfInstalments: number;
  paymentCompletionDays: number;
  startDate: string;
  description?: string;
  terms?: string;
  propertyId?: string;
};

export type PaymentScheduleUpdateInput = {
  instalments?: Instalment[];
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  description?: string;
  terms?: string;
};

export type InstalmentPaymentInput = {
  instalmentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
};
