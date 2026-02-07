import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { modifyInstallment, ModifyInstallmentInput } from '../../lib/dealPayments';
import { Deal, PaymentInstallment } from '../../types';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';
import { AlertCircle, Edit, History } from 'lucide-react';

interface ModifyInstallmentModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal;
  installment: PaymentInstallment;
  currentUserId: string;
  currentUserName: string;
  onSuccess: (updatedDeal: Deal) => void;
}

export const ModifyInstallmentModal: React.FC<ModifyInstallmentModalProps> = ({
  open,
  onClose,
  deal,
  installment,
  currentUserId,
  currentUserName,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>(installment.amount.toString());
  const [dueDate, setDueDate] = useState<string>(installment.dueDate.split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges = 
    parseFloat(amount) !== installment.amount || 
    dueDate !== installment.dueDate.split('T')[0];

  const amountDifference = parseFloat(amount) - installment.amount;

  const handleSubmit = async () => {
    // Validation
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!dueDate) {
      toast.error('Please select due date');
      return;
    }

    if (!hasChanges) {
      toast.error('No changes detected');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please enter a reason for this modification');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: ModifyInstallmentInput = {
        installmentId: installment.id,
        amount: numAmount !== installment.amount ? numAmount : undefined,
        dueDate: dueDate !== installment.dueDate.split('T')[0] ? dueDate : undefined,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      };

      const updatedDeal = modifyInstallment(
        deal.id,
        currentUserId,
        currentUserName,
        input
      );

      toast.success('Installment modified successfully');
      onSuccess(updatedDeal);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to modify installment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modify Installment
          </DialogTitle>
          <DialogDescription>
            Modify {installment.description} (Sequence #{installment.sequence})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cannot Modify Paid Installments Warning */}
          {installment.status === 'paid' && (
            <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-medium mb-1">Cannot Modify</p>
                <p>This installment has been paid and is locked. Only unpaid or partially paid installments can be modified.</p>
              </div>
            </div>
          )}

          {/* Current Values */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Current Values</h4>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span>{formatPKR(installment.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due Date</span>
              <span>{new Date(installment.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize">{installment.status}</span>
            </div>
            {installment.paidAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid Amount</span>
                <span className="text-green-600">{formatPKR(installment.paidAmount)}</span>
              </div>
            )}
          </div>

          {/* Modification History (if exists) */}
          {installment.wasModified && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-amber-900 mb-2">Previously Modified</h4>
              <div className="space-y-1 text-xs text-amber-800">
                {installment.originalAmount && (
                  <p>Original Amount: {formatPKR(installment.originalAmount)}</p>
                )}
                {installment.originalDueDate && (
                  <p>Original Due Date: {new Date(installment.originalDueDate).toLocaleDateString()}</p>
                )}
                {installment.modificationReason && (
                  <p className="mt-2">Reason: {installment.modificationReason}</p>
                )}
              </div>
            </div>
          )}

          {/* New Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">New Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={installment.status === 'paid'}
            />
            {amount && parseFloat(amount) !== installment.amount && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {formatPKR(parseFloat(amount) || 0)}
                </p>
                <span className={`text-sm ${amountDifference > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  ({amountDifference > 0 ? '+' : ''}{formatPKR(amountDifference)})
                </span>
              </div>
            )}
          </div>

          {/* New Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">New Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={installment.status === 'paid'}
            />
          </div>

          {/* Reason (Required for Audit Trail) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Modification *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this installment is being modified (required for audit trail)"
              rows={3}
              disabled={installment.status === 'paid'}
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
              disabled={installment.status === 'paid'}
            />
          </div>

          {/* Balance Impact */}
          {hasChanges && amountDifference !== 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Current Balance</span>
                <span>{formatPKR(deal.financial.balanceRemaining)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">After Modification</span>
                <span className={`font-medium ${amountDifference > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatPKR(deal.financial.balanceRemaining + amountDifference)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || installment.status === 'paid' || !hasChanges}
          >
            {isSubmitting ? 'Modifying...' : 'Modify Installment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
