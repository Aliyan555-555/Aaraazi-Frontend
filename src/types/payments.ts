export interface PaymentPlan {
  id: string;
  propertyId: string;
  transactionId?: string;
  totalAmount?: number;
  startDate?: string;
  description?: string;
}

export interface ScheduledPayment {
  id: string;
  paymentPlanId: string;
  propertyId: string;
  title: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: "pending" | "partially-paid" | "paid" | "overdue";
  paymentTransactionIds: string[];
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

export interface PaymentTransaction {
  id: string;
  scheduledPaymentId: string;
  propertyId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber?: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyPayment {
  id: string;
  propertyId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "cash" | "check" | "wire" | "financing" | "other";
  description?: string;
  receiptNumber?: string;
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerPayout {
  id: string;
  propertyId: string;
  amount: number;
  payoutDate: string;
  status: "pending" | "completed" | "cancelled";
  notes?: string;
  transactionId?: string;
}
