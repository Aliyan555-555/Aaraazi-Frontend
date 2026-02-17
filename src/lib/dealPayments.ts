import type { Deal } from '@/types/deals';
export type PaymentPlanStatus =
  | 'no-plan'
  | 'plan-draft'
  | 'plan-active'
  | 'plan-modified'
  | 'fully-paid';

export interface PaymentSummary {
  paymentPlanStatus: PaymentPlanStatus;
  percentagePaid: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  overduePayments: Array<{
    id: string;
    description: string;
    amount: number;
    dueDate: string;
  }>;
  nextPaymentDue?: {
    description: string;
    amount: number;
    date: string;
  };
}

const defaultSummary: PaymentSummary = {
  paymentPlanStatus: 'no-plan',
  percentagePaid: 0,
  totalAmount: 0,
  totalPaid: 0,
  totalPending: 0,
  overduePayments: [],
};

export function getPaymentSummary(_dealId: string): PaymentSummary {
  return { ...defaultSummary };
}

// ============================================================================
// Export for PDF
// ============================================================================

export interface ExportPaymentRecordResult {
  dealNumber: string;
  property: { address: string };
  agreedPrice: number;
  seller: { name: string };
  buyer: { name: string };
  agents: {
    primary: { name: string };
    secondary?: { name: string };
  };
  summary: PaymentSummary;
  plan?: {
    installments: Array<{
      sequence: number;
      description: string;
      amount: number;
      dueDate: string;
      paidAmount: number;
      status: string;
    }>;
    modifications: Array<{
      modifiedAt: string;
      modificationType: string;
      reason: string;
      modifiedByName: string;
    }>;
  };
  payments: Array<{
    id: string;
    paidDate: string;
    type: string;
    amount: number;
    paymentMethod: string;
    referenceNumber: string | null;
  }>;
}

export function exportPaymentRecord(dealId: string): ExportPaymentRecordResult | null {
  const summary = getPaymentSummary(dealId);
  return {
    dealNumber: dealId.slice(0, 8),
    property: { address: 'N/A' },
    agreedPrice: 0,
    seller: { name: '' },
    buyer: { name: '' },
    agents: { primary: { name: '' } },
    summary,
    payments: [],
  };
}

// ============================================================================
// Record payments (stubs – no backend yet)
// ============================================================================

export interface RecordAdHocPaymentInput {
  dealId: string;
  amount: number;
  paidDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  receiptNumber?: string;
  notes?: string;
  recordedByUserId: string;
  recordedByName: string;
}

export interface RecordInstallmentPaymentInput {
  dealId: string;
  installmentId: string;
  amount: number;
  paidDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  receiptNumber?: string;
  notes?: string;
  recordedByUserId: string;
  recordedByName: string;
}

export function recordAdHocPayment(
  _input: RecordAdHocPaymentInput
): Promise<Deal | void> {
  return Promise.resolve(undefined);
}

export function recordInstallmentPayment(
  _input: RecordInstallmentPaymentInput
): Promise<Deal | void> {
  return Promise.resolve(undefined);
}

// ============================================================================
// Payment plan & installments (stubs)
// ============================================================================

export interface CreatePaymentPlanInput {
  dealId: string;
  totalAmount: number;
  downPaymentAmount: number;
  downPaymentDate: string;
  numberOfInstallments: number;
  frequency: 'monthly' | 'quarterly';
  firstInstallmentDate: string;
  createdByUserId: string;
  createdByName: string;
}

export interface AddInstallmentInput {
  dealId: string;
  amount: number;
  dueDate: string;
  description: string;
  reason?: string;
  notes?: string;
  addedByUserId: string;
  addedByName: string;
}

export interface ModifyInstallmentInput {
  dealId: string;
  installmentId: string;
  amount?: number;
  dueDate?: string;
  reason: string;
  notes?: string;
  modifiedByUserId: string;
  modifiedByName: string;
}

export function createPaymentPlan(
  _input: CreatePaymentPlanInput
): Promise<Deal | void> {
  return Promise.resolve(undefined);
}

export function addInstallment(_input: AddInstallmentInput): Promise<Deal | void> {
  return Promise.resolve(undefined);
}

export function modifyInstallment(
  _input: ModifyInstallmentInput
): Promise<Deal | void> {
  return Promise.resolve(undefined);
}

export function deleteInstallment(
  _dealId: string,
  _installmentId: string
): Promise<Deal | void> {
  return Promise.resolve(undefined);
}
