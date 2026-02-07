/**
 * Record Payment Modal - V3.0
 * Modal for recording installment payments and generating receipts
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { User, Installment, InstallmentPlan } from '../types';
import { toast } from 'sonner';
import { recordInstallmentPayment } from '../lib/installments';
import { createPaymentReceipt } from '../lib/installments';
import { DollarSign, Calendar, FileText, Receipt, CreditCard } from 'lucide-react';
import { formatPKR } from '../lib/currency';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installmentPlan: InstallmentPlan;
  installment: Installment;
  sellCycleId: string;
  sellerName: string;
  user: User;
  onSuccess: () => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  installmentPlan,
  installment,
  sellCycleId,
  sellerName,
  user,
  onSuccess,
}: RecordPaymentModalProps) {
  const outstandingAmount = installment.amount - installment.paidAmount;
  
  const [formData, setFormData] = useState({
    amount: outstandingAmount,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'bank-transfer' | 'cheque' | 'online' | 'other',
    referenceNumber: '',
    
    // Cheque details
    chequeNumber: '',
    chequeBank: '',
    chequeDate: '',
    
    // Bank transfer details
    bankName: '',
    accountNumber: '',
    transactionId: '',
    
    notes: '',
    generateReceipt: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    if (formData.amount > outstandingAmount) {
      toast.error(`Payment amount cannot exceed outstanding amount of ${formatPKR(outstandingAmount)}`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Record the payment
      recordInstallmentPayment(
        installmentPlan.id,
        installment.id,
        {
          amount: formData.amount,
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }
      );
      
      // Generate receipt if requested
      if (formData.generateReceipt) {
        const receipt = createPaymentReceipt({
          sellCycleId,
          propertyId: installmentPlan.propertyId,
          installmentPlanId: installmentPlan.id,
          installmentId: installment.id,
          fromName: installmentPlan.buyerName,
          fromContact: '', // You might want to add this to installment plan
          toName: sellerName,
          toContact: '', // You might want to add this
          amount: formData.amount,
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          referenceNumber: formData.referenceNumber,
          chequeNumber: formData.chequeNumber || undefined,
          chequeBank: formData.chequeBank || undefined,
          chequeDate: formData.chequeDate || undefined,
          bankName: formData.bankName || undefined,
          accountNumber: formData.accountNumber || undefined,
          transactionId: formData.transactionId || undefined,
          purpose: 'installment',
          description: `Payment for Installment #${installment.installmentNumber}`,
          issuedBy: user.id,
          issuedByName: user.name,
        });
        
        toast.success(`Payment recorded successfully! Receipt #${receipt.receiptNumber}`);
      } else {
        toast.success('Payment recorded successfully!');
      }
      
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment - Installment #{installment.installmentNumber}</DialogTitle>
          <DialogDescription>
            Record a payment for this installment and optionally generate a receipt
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Installment Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Installment Amount:</span>
              <span className="font-bold">{formatPKR(installment.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="text-green-600 font-medium">{formatPKR(installment.paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Outstanding:</span>
              <span className="font-bold text-lg text-red-600">{formatPKR(outstandingAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due Date:</span>
              <span className={`font-medium ${new Date(installment.dueDate) < new Date() ? 'text-red-600' : ''}`}>
                {new Date(installment.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Payment Amount (PKR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  max={outstandingAmount}
                  step="100"
                />
                <p className="text-xs text-muted-foreground">
                  Max: {formatPKR(outstandingAmount)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="paymentMethod">
                  <CreditCard className="inline h-3 w-3 mr-1" />
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Method-Specific Details */}
          {formData.paymentMethod === 'cheque' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-sm">Cheque Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chequeNumber">Cheque Number</Label>
                  <Input
                    id="chequeNumber"
                    value={formData.chequeNumber}
                    onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                    placeholder="123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chequeBank">Bank Name</Label>
                  <Input
                    id="chequeBank"
                    value={formData.chequeBank}
                    onChange={(e) => setFormData({ ...formData, chequeBank: e.target.value })}
                    placeholder="Bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chequeDate">Cheque Date</Label>
                  <Input
                    id="chequeDate"
                    type="date"
                    value={formData.chequeDate}
                    onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {formData.paymentMethod === 'bank-transfer' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-sm">Bank Transfer Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    placeholder="TXN123456"
                  />
                </div>
              </div>
            </div>
          )}

          {(formData.paymentMethod === 'online' || formData.paymentMethod === 'other') && (
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="Transaction reference"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              <FileText className="inline h-3 w-3 mr-1" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this payment..."
              rows={3}
            />
          </div>

          {/* Receipt Generation */}
          <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
            <input
              type="checkbox"
              id="generateReceipt"
              checked={formData.generateReceipt}
              onChange={(e) => setFormData({ ...formData, generateReceipt: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="generateReceipt" className="cursor-pointer flex items-center gap-2">
              <Receipt className="h-4 w-4 text-green-600" />
              <span>Generate payment receipt automatically</span>
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}