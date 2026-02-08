import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createPaymentPlan, CreatePaymentPlanInput } from '../../lib/dealPayments';
import { Deal } from '../../types/deals';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';
import { AlertCircle, Calculator, Calendar } from 'lucide-react';

interface CreatePaymentPlanModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal;
  currentUserId: string;
  currentUserName: string;
  onSuccess: (updatedDeal: Deal) => void;
}

export const CreatePaymentPlanModal: React.FC<CreatePaymentPlanModalProps> = ({
  open,
  onClose,
  deal,
  currentUserId,
  currentUserName,
  onSuccess,
}) => {
  const [downPaymentPercentage, setDownPaymentPercentage] = useState<number>(30);
  const [downPaymentDate, setDownPaymentDate] = useState<string>('');
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(4);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly'>('monthly');
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = deal.financial.agreedPrice;
  const downPaymentAmount = totalAmount * (downPaymentPercentage / 100);
  const remainingAmount = totalAmount - downPaymentAmount;
  const installmentAmount = remainingAmount / numberOfInstallments;

  const handleSubmit = async () => {
    // Validation
    if (!downPaymentDate) {
      toast.error('Please select down payment date');
      return;
    }

    if (!firstInstallmentDate) {
      toast.error('Please select first installment date');
      return;
    }

    if (downPaymentPercentage < 10 || downPaymentPercentage > 90) {
      toast.error('Down payment must be between 10% and 90%');
      return;
    }

    if (numberOfInstallments < 1 || numberOfInstallments > 24) {
      toast.error('Number of installments must be between 1 and 24');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreatePaymentPlanInput = {
        downPaymentPercentage,
        downPaymentDate,
        numberOfInstallments,
        frequency,
        firstInstallmentDate,
      };

      const updatedDeal = createPaymentPlan(
        deal.id,
        currentUserId,
        currentUserName,
        input
      );

      toast.success('Payment plan created successfully');
      onSuccess(updatedDeal);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payment Plan</DialogTitle>
          <DialogDescription>
            Design a flexible payment schedule for {deal.dealNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Deal Amount Summary */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Deal Amount</h3>
            </div>
            <p className="text-2xl">{formatPKR(totalAmount)}</p>
          </div>

          {/* Down Payment Configuration */}
          <div className="space-y-4">
            <Label>Down Payment</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="downPaymentPercentage">Percentage</Label>
                <div className="flex gap-2">
                  <Input
                    id="downPaymentPercentage"
                    type="number"
                    min="10"
                    max="90"
                    value={downPaymentPercentage}
                    onChange={(e) => setDownPaymentPercentage(Number(e.target.value))}
                  />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="downPaymentDate">Due Date</Label>
                <Input
                  id="downPaymentDate"
                  type="date"
                  value={downPaymentDate}
                  onChange={(e) => setDownPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Down Payment Amount</p>
              <p className="text-xl">{formatPKR(downPaymentAmount)}</p>
            </div>
          </div>

          {/* Installments Configuration */}
          <div className="space-y-4">
            <Label>Installment Plan</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfInstallments">Number of Installments</Label>
                <Input
                  id="numberOfInstallments"
                  type="number"
                  min="1"
                  max="24"
                  value={numberOfInstallments}
                  onChange={(e) => setNumberOfInstallments(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequency} onValueChange={(v: 'monthly' | 'quarterly') => setFrequency(v)}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstInstallmentDate">First Installment Date</Label>
              <Input
                id="firstInstallmentDate"
                type="date"
                value={firstInstallmentDate}
                onChange={(e) => setFirstInstallmentDate(e.target.value)}
              />
            </div>

            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Remaining Amount</p>
                <p className="text-sm">{formatPKR(remainingAmount)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Each Installment</p>
                <p className="text-sm">{formatPKR(installmentAmount)}</p>
              </div>
            </div>
          </div>

          {/* Preview Summary */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Payment Schedule Preview</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="text-sm">Down Payment</p>
                  <p className="text-xs text-muted-foreground">
                    {downPaymentDate ? new Date(downPaymentDate).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                <p className="text-sm">{formatPKR(downPaymentAmount)}</p>
              </div>

              {Array.from({ length: numberOfInstallments }).map((_, i) => {
                const dueDate = firstInstallmentDate
                  ? new Date(new Date(firstInstallmentDate).getTime() + i * (frequency === 'monthly' ? 30 : 90) * 24 * 60 * 60 * 1000)
                  : null;

                return (
                  <div key={i} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="text-sm">
                        {i === numberOfInstallments - 1 ? 'Final Payment' : `Installment ${i + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dueDate ? dueDate.toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <p className="text-sm">{formatPKR(installmentAmount)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">Important</p>
              <p>Once created, the payment plan can be modified by adding/removing installments or changing amounts and dates. Only unpaid installments can be deleted.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Payment Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
