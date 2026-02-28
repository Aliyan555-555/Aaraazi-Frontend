/**
 * Payment Schedule Recording Modal
 * Standalone modal for recording payments against payment schedule instalments
 * Can be used across all contexts: Purchase Cycles, Sell Cycles, Deals, etc.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { formatPKR } from '../lib/currency';
import { Instalment } from '../types/paymentSchedule';
// [STUBBED] import { recordInstalmentPayment } from '../lib/paymentSchedule';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const recordInstalmentPayment = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface PaymentScheduleRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  instalment: Instalment | null;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export default function PaymentScheduleRecordingModal({
  isOpen,
  onClose,
  scheduleId,
  instalment,
  onSuccess,
  title = 'Record Payment',
  description = 'Record a payment for this instalment with transaction details',
}: PaymentScheduleRecordingModalProps) {
  // Form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Reset form when instalment changes
  useEffect(() => {
    if (instalment && isOpen) {
      const remaining = instalment.amount - (instalment.paidAmount || 0);
      setPaymentAmount(remaining.toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('');
      setReceiptNumber('');
      setNotes('');
      setValidationError('');
    }
  }, [instalment, isOpen]);

  // Validation
  const validatePayment = (): string | null => {
    if (!instalment) return 'No instalment selected';

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      return 'Please enter a valid payment amount greater than 0';
    }

    const remaining = instalment.amount - (instalment.paidAmount || 0);
    if (amount > remaining) {
      return `Payment amount cannot exceed remaining amount of ${formatPKR(remaining)}`;
    }

    if (!paymentDate) {
      return 'Please select a payment date';
    }

    const selectedDate = new Date(paymentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      return 'Payment date cannot be in the future';
    }

    return null;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instalment) {
      toast.error('No instalment selected');
      return;
    }

    // Validate
    const error = validatePayment();
    if (error) {
      setValidationError(error);
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const amount = parseFloat(paymentAmount);

      // Record payment
      const updatedSchedule = recordInstalmentPayment(scheduleId, {
        instalmentId: instalment.id,
        amount: amount,
        paymentDate: paymentDate,
        paymentMethod: paymentMethod.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!updatedSchedule) {
        throw new Error('Failed to record payment');
      }

      // Success
      toast.success(
        `Payment of ${formatPKR(amount)} recorded successfully`,
        {
          description: `Instalment #${instalment.instalmentNumber} updated`,
        }
      );

      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('paymentScheduleUpdated', {
        detail: { scheduleId, instalmentId: instalment.id }
      }));

      // Callback and close
      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      setValidationError('');
      onClose();
    }
  };

  if (!instalment) return null;

  const remaining = instalment.amount - (instalment.paidAmount || 0);
  const isPaid = instalment.status === 'paid';
  const isPartial = instalment.status === 'partial';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Instalment Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">
                  Instalment #{instalment.instalmentNumber}
                </h4>
                <Badge
                  className={
                    isPaid ? 'bg-green-100 text-green-800' :
                      isPartial ? 'bg-yellow-100 text-yellow-800' :
                        instalment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                  }
                >
                  {instalment.status.charAt(0).toUpperCase() + instalment.status.slice(1)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatPKR(instalment.amount)}</span>
                </div>

                {(instalment.paidAmount || 0) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Already Paid:</span>
                    <span className="font-medium text-green-600">
                      {formatPKR(instalment.paidAmount || 0)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Remaining:</span>
                  <span className="font-semibold text-orange-600">
                    {formatPKR(remaining)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500 pt-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Due: {new Date(instalment.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Error */}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Payment Amount (PKR) *
              </Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0"
                max={remaining}
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setValidationError('');
                }}
                placeholder="Enter payment amount"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Maximum: {formatPKR(remaining)}
              </p>
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Payment Date *
              </Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setPaymentDate(e.target.value);
                  setValidationError('');
                }}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                disabled={isSubmitting}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="online-payment">Online Payment</SelectItem>
                  <SelectItem value="mobile-wallet">Mobile Wallet (JazzCash/Easypaisa)</SelectItem>
                  <SelectItem value="pay-order">Pay Order</SelectItem>
                  <SelectItem value="demand-draft">Demand Draft</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Receipt/Transaction Number */}
            <div className="space-y-2">
              <Label htmlFor="receiptNumber" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Receipt/Transaction Number
              </Label>
              <Input
                id="receiptNumber"
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g., TXN123456, CHQ-001, etc."
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Enter transaction ID, cheque number, or receipt number for record keeping
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about this payment..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Info Alert */}
            {isPartial && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This instalment has been partially paid. You can record additional payments
                  until the full amount is settled.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !paymentAmount || !paymentDate}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
