import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { addInstallment, AddInstallmentInput } from '../../lib/dealPayments';
import { Deal } from '../../types';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';
import { Info, Plus } from 'lucide-react';

interface AddInstallmentModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal;
  currentUserId: string;
  currentUserName: string;
  onSuccess: (updatedDeal: Deal) => void;
}

export const AddInstallmentModal: React.FC<AddInstallmentModalProps> = ({
  open,
  onClose,
  deal,
  currentUserId,
  currentUserName,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentInstallmentCount = deal.financial.paymentPlan?.installments.length || 0;

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

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please enter a reason for adding this installment');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: AddInstallmentInput = {
        amount: numAmount,
        dueDate,
        description: description.trim(),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      };

      const updatedDeal = addInstallment(
        deal.id,
        currentUserId,
        currentUserName,
        input
      );

      toast.success('Installment added successfully');
      onSuccess(updatedDeal);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add installment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Installment
          </DialogTitle>
          <DialogDescription>
            Add an additional installment to the payment plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Plan Info */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Current Installments</span>
              <span>{currentInstallmentCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">After Adding</span>
              <span className="font-medium">{currentInstallmentCount + 1}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Installment Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
            {amount && (
              <p className="text-sm text-muted-foreground">
                {formatPKR(parseFloat(amount) || 0)}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Additional Installment, Extension Payment"
            />
          </div>

          {/* Reason (Required for Audit Trail) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adding *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this installment is being added (required for audit trail)"
              rows={3}
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
            />
          </div>

          {/* Info Note */}
          <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Auto-Renumbering</p>
              <p>All installments will be automatically renumbered in sequence after adding this installment. This change will be recorded in the modification history.</p>
            </div>
          </div>

          {/* Updated Balance */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Current Balance</span>
              <span>{formatPKR(deal.financial.balanceRemaining)}</span>
            </div>
            {amount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">After Adding Installment</span>
                <span className="font-medium">
                  {formatPKR(deal.financial.balanceRemaining + (parseFloat(amount) || 0))}
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
            {isSubmitting ? 'Adding...' : 'Add Installment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
