import { PaymentPlan, ScheduledPayment, PaymentTransaction, SellerPayout } from '../types';

const PAYMENT_PLANS_KEY = 'crm_payment_plans';
const SCHEDULED_PAYMENTS_KEY = 'crm_scheduled_payments';
const PAYMENT_TRANSACTIONS_KEY = 'crm_payment_transactions';
const SELLER_PAYOUTS_KEY = 'crm_seller_payouts';

// ============================================================================
// PAYMENT PLAN MANAGEMENT
// ============================================================================

export function getPaymentPlans(propertyId?: string): PaymentPlan[] {
  try {
    const stored = localStorage.getItem(PAYMENT_PLANS_KEY);
    if (!stored) return [];
    
    const plans = JSON.parse(stored);
    
    if (!Array.isArray(plans)) {
      console.error('Payment plans data is not an array');
      return [];
    }
    
    if (propertyId) {
      return plans.filter((p: PaymentPlan) => p.propertyId === propertyId);
    }
    
    return plans;
  } catch (error) {
    console.error('Error loading payment plans:', error);
    return [];
  }
}

export function getPaymentPlanById(planId: string): PaymentPlan | null {
  try {
    const stored = localStorage.getItem(PAYMENT_PLANS_KEY);
    if (!stored) return null;
    
    const plans = JSON.parse(stored);
    return plans.find((p: PaymentPlan) => p.id === planId) || null;
  } catch (error) {
    console.error('Error loading payment plan:', error);
    return null;
  }
}

export function getPaymentPlanByTransaction(transactionId: string): PaymentPlan | null {
  try {
    const stored = localStorage.getItem(PAYMENT_PLANS_KEY);
    if (!stored) return null;
    
    const plans = JSON.parse(stored);
    return plans.find((p: PaymentPlan) => p.transactionId === transactionId) || null;
  } catch (error) {
    console.error('Error loading payment plan:', error);
    return null;
  }
}

export function savePaymentPlan(plan: PaymentPlan): void {
  try {
    const stored = localStorage.getItem(PAYMENT_PLANS_KEY);
    const plans = stored ? JSON.parse(stored) : [];
    
    const existingIndex = plans.findIndex((p: PaymentPlan) => p.id === plan.id);
    
    if (existingIndex >= 0) {
      plans[existingIndex] = plan;
    } else {
      plans.push(plan);
    }
    
    localStorage.setItem(PAYMENT_PLANS_KEY, JSON.stringify(plans));
  } catch (error) {
    console.error('Error saving payment plan:', error);
    throw error;
  }
}

export function deletePaymentPlan(planId: string): void {
  try {
    const stored = localStorage.getItem(PAYMENT_PLANS_KEY);
    if (!stored) return;
    
    const plans = JSON.parse(stored);
    const filtered = plans.filter((p: PaymentPlan) => p.id !== planId);
    
    localStorage.setItem(PAYMENT_PLANS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting payment plan:', error);
    throw error;
  }
}

// ============================================================================
// SCHEDULED PAYMENTS MANAGEMENT
// ============================================================================

export function getScheduledPayments(propertyId?: string, planId?: string): ScheduledPayment[] {
  try {
    const stored = localStorage.getItem(SCHEDULED_PAYMENTS_KEY);
    if (!stored) return [];
    
    const payments = JSON.parse(stored);
    
    if (!Array.isArray(payments)) {
      console.error('Scheduled payments data is not an array');
      return [];
    }
    
    let filtered = payments;
    
    if (propertyId) {
      filtered = filtered.filter((p: ScheduledPayment) => p.propertyId === propertyId);
    }
    
    if (planId) {
      filtered = filtered.filter((p: ScheduledPayment) => p.paymentPlanId === planId);
    }
    
    // Sort by due date
    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  } catch (error) {
    console.error('Error loading scheduled payments:', error);
    return [];
  }
}

export function getScheduledPaymentById(paymentId: string): ScheduledPayment | null {
  try {
    const stored = localStorage.getItem(SCHEDULED_PAYMENTS_KEY);
    if (!stored) return null;
    
    const payments = JSON.parse(stored);
    return payments.find((p: ScheduledPayment) => p.id === paymentId) || null;
  } catch (error) {
    console.error('Error loading scheduled payment:', error);
    return null;
  }
}

export function saveScheduledPayment(payment: ScheduledPayment): void {
  try {
    const stored = localStorage.getItem(SCHEDULED_PAYMENTS_KEY);
    const payments = stored ? JSON.parse(stored) : [];
    
    const existingIndex = payments.findIndex((p: ScheduledPayment) => p.id === payment.id);
    
    if (existingIndex >= 0) {
      payments[existingIndex] = payment;
    } else {
      payments.push(payment);
    }
    
    localStorage.setItem(SCHEDULED_PAYMENTS_KEY, JSON.stringify(payments));
  } catch (error) {
    console.error('Error saving scheduled payment:', error);
    throw error;
  }
}

export function saveScheduledPayments(payments: ScheduledPayment[]): void {
  try {
    const stored = localStorage.getItem(SCHEDULED_PAYMENTS_KEY);
    const allPayments = stored ? JSON.parse(stored) : [];
    
    payments.forEach(payment => {
      const existingIndex = allPayments.findIndex((p: ScheduledPayment) => p.id === payment.id);
      if (existingIndex >= 0) {
        allPayments[existingIndex] = payment;
      } else {
        allPayments.push(payment);
      }
    });
    
    localStorage.setItem(SCHEDULED_PAYMENTS_KEY, JSON.stringify(allPayments));
  } catch (error) {
    console.error('Error saving scheduled payments:', error);
    throw error;
  }
}

export function deleteScheduledPayment(paymentId: string): void {
  try {
    const stored = localStorage.getItem(SCHEDULED_PAYMENTS_KEY);
    if (!stored) return;
    
    const payments = JSON.parse(stored);
    const filtered = payments.filter((p: ScheduledPayment) => p.id !== paymentId);
    
    localStorage.setItem(SCHEDULED_PAYMENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting scheduled payment:', error);
    throw error;
  }
}

// ============================================================================
// PAYMENT TRANSACTIONS MANAGEMENT
// ============================================================================

export function getPaymentTransactions(propertyId?: string, scheduledPaymentId?: string): PaymentTransaction[] {
  try {
    const stored = localStorage.getItem(PAYMENT_TRANSACTIONS_KEY);
    if (!stored) return [];
    
    const transactions = JSON.parse(stored);
    
    if (!Array.isArray(transactions)) {
      console.error('Payment transactions data is not an array');
      return [];
    }
    
    let filtered = transactions;
    
    if (propertyId) {
      filtered = filtered.filter((t: PaymentTransaction) => t.propertyId === propertyId);
    }
    
    if (scheduledPaymentId) {
      filtered = filtered.filter((t: PaymentTransaction) => t.scheduledPaymentId === scheduledPaymentId);
    }
    
    // Sort by payment date (most recent first)
    return filtered.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  } catch (error) {
    console.error('Error loading payment transactions:', error);
    return [];
  }
}

export function savePaymentTransaction(transaction: PaymentTransaction): void {
  try {
    const stored = localStorage.getItem(PAYMENT_TRANSACTIONS_KEY);
    const transactions = stored ? JSON.parse(stored) : [];
    
    const existingIndex = transactions.findIndex((t: PaymentTransaction) => t.id === transaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    localStorage.setItem(PAYMENT_TRANSACTIONS_KEY, JSON.stringify(transactions));
    
    // Update the scheduled payment status
    updateScheduledPaymentStatus(transaction.scheduledPaymentId);
    
    // Check if all payments for this property are now complete
    checkAndCompleteTransaction(transaction.propertyId);
  } catch (error) {
    console.error('Error saving payment transaction:', error);
    throw error;
  }
}

// ============================================================================
// PAYMENT ANALYTICS & HELPERS
// ============================================================================

export function getPaymentSummary(propertyId: string): {
  totalAmount: number;
  totalPaid: number;
  amountRemaining: number;
  percentagePaid: number;
} {
  try {
    const scheduledPayments = getScheduledPayments(propertyId);
    
    if (!scheduledPayments || scheduledPayments.length === 0) {
      return {
        totalAmount: 0,
        totalPaid: 0,
        amountRemaining: 0,
        percentagePaid: 0
      };
    }
    
    const totalAmount = scheduledPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);
    const totalPaid = scheduledPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const amountRemaining = totalAmount - totalPaid;
    const percentagePaid = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    
    return {
      totalAmount,
      totalPaid,
      amountRemaining,
      percentagePaid: Math.round(percentagePaid * 10) / 10 // Round to 1 decimal
    };
  } catch (error) {
    console.error('Error calculating payment summary:', error);
    return {
      totalAmount: 0,
      totalPaid: 0,
      amountRemaining: 0,
      percentagePaid: 0
    };
  }
}

export function updateScheduledPaymentStatus(scheduledPaymentId: string): void {
  try {
    const payment = getScheduledPaymentById(scheduledPaymentId);
    if (!payment) return;
    
    const transactions = getPaymentTransactions(undefined, scheduledPaymentId);
    const totalPaid = transactions.reduce((sum, t) => sum + t.amountPaid, 0);
    
    console.log('Updating scheduled payment status:', {
      paymentId: scheduledPaymentId,
      title: payment.title,
      amountDue: payment.amountDue,
      oldAmountPaid: payment.amountPaid,
      newTotalPaid: totalPaid,
      transactionCount: transactions.length
    });
    
    let status: ScheduledPayment['status'];
    if (totalPaid >= payment.amountDue) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partially-paid';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(payment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      status = dueDate < today ? 'overdue' : 'pending';
    }
    
    const updatedPayment: ScheduledPayment = {
      ...payment,
      amountPaid: totalPaid,
      status,
      paymentTransactionIds: transactions.map(t => t.id),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Saving updated payment with status:', status, 'and amountPaid:', totalPaid);
    
    saveScheduledPayment(updatedPayment);
  } catch (error) {
    console.error('Error updating scheduled payment status:', error);
  }
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REC-${timestamp}-${random}`;
}

export function convertNumberToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (amount === 0) return 'Zero Rupees Only';
  
  const crores = Math.floor(amount / 10000000);
  const lakhs = Math.floor((amount % 10000000) / 100000);
  const thousands = Math.floor((amount % 100000) / 1000);
  const hundreds = Math.floor((amount % 1000) / 100);
  const remainder = amount % 100;
  
  let words = '';
  
  if (crores > 0) {
    words += ones[crores] + ' Crore ';
  }
  if (lakhs > 0) {
    if (lakhs < 10) {
      words += ones[lakhs] + ' Lakh ';
    } else if (lakhs < 20) {
      words += teens[lakhs - 10] + ' Lakh ';
    } else {
      words += tens[Math.floor(lakhs / 10)] + ' ' + ones[lakhs % 10] + ' Lakh ';
    }
  }
  if (thousands > 0) {
    if (thousands < 10) {
      words += ones[thousands] + ' Thousand ';
    } else if (thousands < 20) {
      words += teens[thousands - 10] + ' Thousand ';
    } else {
      words += tens[Math.floor(thousands / 10)] + ' ' + ones[thousands % 10] + ' Thousand ';
    }
  }
  if (hundreds > 0) {
    words += ones[hundreds] + ' Hundred ';
  }
  if (remainder > 0) {
    if (remainder < 10) {
      words += ones[remainder];
    } else if (remainder < 20) {
      words += teens[remainder - 10];
    } else {
      words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10];
    }
  }
  
  return words.trim() + ' Rupees Only';
}

// ============================================================================
// SELLER PAYOUT MANAGEMENT (for Standard Client Listings)
// ============================================================================

export function getSellerPayouts(propertyId?: string): SellerPayout[] {
  try {
    const stored = localStorage.getItem(SELLER_PAYOUTS_KEY);
    if (!stored) return [];
    
    const payouts = JSON.parse(stored);
    
    if (!Array.isArray(payouts)) {
      console.error('Seller payouts data is not an array');
      return [];
    }
    
    if (propertyId) {
      return payouts.filter((p: SellerPayout) => p.propertyId === propertyId);
    }
    
    return payouts;
  } catch (error) {
    console.error('Error loading seller payouts:', error);
    return [];
  }
}

export function getSellerPayoutByProperty(propertyId: string): SellerPayout | null {
  try {
    const payouts = getSellerPayouts(propertyId);
    return payouts.length > 0 ? payouts[0] : null;
  } catch (error) {
    console.error('Error loading seller payout:', error);
    return null;
  }
}

export function saveSellerPayout(payout: SellerPayout): void {
  try {
    const stored = localStorage.getItem(SELLER_PAYOUTS_KEY);
    const payouts = stored ? JSON.parse(stored) : [];
    
    const existingIndex = payouts.findIndex((p: SellerPayout) => p.id === payout.id);
    
    if (existingIndex >= 0) {
      payouts[existingIndex] = payout;
    } else {
      payouts.push(payout);
    }
    
    localStorage.setItem(SELLER_PAYOUTS_KEY, JSON.stringify(payouts));
  } catch (error) {
    console.error('Error saving seller payout:', error);
    throw error;
  }
}

export function deleteSellerPayout(payoutId: string): void {
  try {
    const stored = localStorage.getItem(SELLER_PAYOUTS_KEY);
    if (!stored) return;
    
    const payouts = JSON.parse(stored);
    const filtered = payouts.filter((p: SellerPayout) => p.id !== payoutId);
    
    localStorage.setItem(SELLER_PAYOUTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting seller payout:', error);
    throw error;
  }
}

// ============================================================================\n// TRANSACTION COMPLETION & OWNERSHIP TRANSFER
// ============================================================================

/**
 * Check if all payments are complete for a property and trigger ownership transfer
 */
export function checkAndCompleteTransaction(propertyId: string): void {
  try {
    const paymentSummary = getPaymentSummary(propertyId);
    
    // Check if payment plan is fully paid (allowing for small rounding differences)
    const isFullyPaid = paymentSummary.totalAmount > 0 && 
                        paymentSummary.amountRemaining <= 1 && 
                        paymentSummary.percentagePaid >= 99.9;
    
    if (!isFullyPaid) {
      return; // Not yet complete
    }
    
    // Import required modules dynamically to avoid circular dependencies
    import('./data').then(({ getPropertyById, updateProperty }) => {
      import('./transactions').then(({ getActiveTransaction, saveTransaction }) => {
        import('./ownership').then(({ finalizeSale }) => {
          const property = getPropertyById(propertyId);
          if (!property) {
            console.error('Property not found for completion');
            return;
          }
          
          // Only process if property is under-contract
          if (property.status !== 'under-contract') {
            return;
          }
          
          const transaction = getActiveTransaction(propertyId);
          if (!transaction) {
            console.error('No active transaction found');
            return;
          }
          
          // Check if buyer information exists
          if (!transaction.buyerContactId || !transaction.buyerName) {
            console.error('Transaction missing buyer information');
            return;
          }
          
          console.log('All payments completed - finalizing sale and transferring ownership...');
          
          // Finalize the sale and transfer ownership to buyer
          const result = finalizeSale(
            propertyId,
            transaction.id,
            transaction.buyerContactId,
            transaction.buyerName,
            transaction.acceptedOfferAmount
          );
          
          if (result.success) {
            // Mark transaction as completed
            const updatedTransaction = {
              ...transaction,
              status: 'completed' as const,
              actualClosingDate: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            saveTransaction(updatedTransaction);
            
            console.log('✅ Sale finalized - ownership transferred to:', transaction.buyerName);
          } else {
            console.error('Failed to finalize sale:', result.error);
          }
        }).catch(err => console.error('Error importing ownership module:', err));
      }).catch(err => console.error('Error importing transactions module:', err));
    }).catch(err => console.error('Error importing data module:', err));
  } catch (error) {
    console.error('Error checking transaction completion:', error);
  }
}

/**
 * Check if a property's payment plan is fully completed
 */
export function isPaymentPlanComplete(propertyId: string): boolean {
  try {
    const paymentSummary = getPaymentSummary(propertyId);
    return paymentSummary.totalAmount > 0 && 
           paymentSummary.amountRemaining <= 1 && 
           paymentSummary.percentagePaid >= 99.9;
  } catch (error) {
    console.error('Error checking payment plan completion:', error);
    return false;
  }
}