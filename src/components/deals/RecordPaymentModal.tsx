import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { recordAdHocPayment, recordInstallmentPayment, RecordAdHocPaymentInput, RecordInstallmentPaymentInput } from '../../lib/dealPayments';
import { Deal, PaymentInstallment } from '../../types';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';
import { AlertCircle, DollarSign, Receipt } from 'lucide-react';

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal;
  currentUserId: string;
  currentUserName: string;
  selectedInstallment?: PaymentInstallment; // If provided, record against this installment
  onSuccess: (updatedDeal: Deal) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  open,
  onClose,
  deal,
  currentUserId,
  currentUserName,
  selectedInstallment,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paidDate, setPaidDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque' | 'bank-transfer' | 'online'>('bank-transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overpaymentWarning, setOverpaymentWarning] = useState<string | null>(null);

  const isAdHoc = !selectedInstallment;
  const expectedAmount = selectedInstallment ? selectedInstallment.amount - selectedInstallment.paidAmount : 0;

  // Check for overpayment
  useEffect(() => {
    if (selectedInstallment && amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > expectedAmount) {
        const excess = numAmount - expectedAmount;
        setOverpaymentWarning(`Overpayment of ${formatPKR(excess)} detected. You'll be asked how to handle this after recording.`);
      } else {
        setOverpaymentWarning(null);
      }
    }
  }, [amount, selectedInstallment, expectedAmount]);

  // Pre-fill amount with expected amount
  useEffect(() => {
    if (selectedInstallment && !amount) {
      setAmount(expectedAmount.toString());
    }
  }, [selectedInstallment, expectedAmount]);

  const handleSubmit = async () => {
    // Validation
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!paidDate) {
      toast.error('Please select payment date');
      return;
    }

    if (numAmount > deal.financial.balanceRemaining) {
      toast.error('Payment amount cannot exceed remaining balance');
      return;
    }

    setIsSubmitting(true);

    try {
      let updatedDeal: Deal;

      if (isAdHoc) {
        // Record ad-hoc payment
        const input: RecordAdHocPaymentInput = {
          amount: numAmount,
          paidDate,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          receiptNumber: receiptNumber || undefined,
          notes: notes || undefined,
        };

        updatedDeal = recordAdHocPayment(
          deal.id,
          currentUserId,
          currentUserName,
          input
        );

        // Find the newly created payment to get receipt number
        const newPayment = updatedDeal.financial.payments[updatedDeal.financial.payments.length - 1];
        
        toast.success(
          `Payment recorded successfully! Receipt ${newPayment.receiptNumber} generated.`,
          { duration: 5000 }
        );
      } else {
        // Record installment payment
        const input: RecordInstallmentPaymentInput = {
          installmentId: selectedInstallment!.id,
          amount: numAmount,
          paidDate,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          receiptNumber: receiptNumber || undefined,
          notes: notes || undefined,
        };

        updatedDeal = recordInstallmentPayment(
          deal.id,
          currentUserId,
          currentUserName,
          input
        );

        // Check for overpayment
        if (numAmount > expectedAmount) {
          const excess = numAmount - expectedAmount;
          
          // Get updated installment
          const updatedInstallment = updatedDeal.financial.paymentPlan?.installments.find(
            i => i.id === selectedInstallment!.id
          );

          if (updatedInstallment) {
            // Find next pending installment
            const nextPending = updatedDeal.financial.paymentPlan?.installments.find(
              i => i.sequence > updatedInstallment.sequence && (i.status === 'pending' || i.status === 'partial')
            );

            if (nextPending) {
              toast.info(
                `Overpayment of ${formatPKR(excess)} recorded. Next pending: ${nextPending.description}`,
                { duration: 5000 }
              );
            } else {
              toast.info(
                `Overpayment of ${formatPKR(excess)} recorded. No pending installments to credit.`,
                { duration: 5000 }
              );
            }
          }
        }

        toast.success('Payment recorded successfully');
      }

      onSuccess(updatedDeal);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isAdHoc ? 'Record Ad-Hoc Payment' : 'Record Installment Payment'}
          </DialogTitle>
          <DialogDescription>
            {isAdHoc 
              ? 'Record a payment that is not part of a formal payment plan'
              : `Record payment for: ${selectedInstallment?.description}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Installment Info (if not ad-hoc) */}
          {selectedInstallment && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expected Amount</span>
                <span className="text-sm">{formatPKR(expectedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <span className="text-sm">
                  {new Date(selectedInstallment.dueDate).toLocaleDateString()}
                </span>
              </div>
              {selectedInstallment.paidAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Already Paid</span>
                  <span className="text-sm text-green-600">{formatPKR(selectedInstallment.paidAmount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                placeholder="Enter amount"
              />
            </div>
            {amount && (
              <p className="text-sm text-muted-foreground">
                {formatPKR(parseFloat(amount) || 0)}
              </p>
            )}
          </div>

          {/* Overpayment Warning */}
          {overpaymentWarning && (
            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">{overpaymentWarning}</p>
            </div>
          )}

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paidDate">Payment Date *</Label>
            <Input
              id="paidDate"
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Cheque #, Transaction ID, etc."
            />
          </div>

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Receipt Number</Label>
            <div className="relative">
              <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="receiptNumber"
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="pl-9"
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about this payment..."
              rows={3}
            />
          </div>

          {/* Balance Info */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Current Balance</span>
              <span>{formatPKR(deal.financial.balanceRemaining)}</span>
            </div>
            {amount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">After Payment</span>
                <span className="font-medium">
                  {formatPKR(deal.financial.balanceRemaining - (parseFloat(amount) || 0))}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};