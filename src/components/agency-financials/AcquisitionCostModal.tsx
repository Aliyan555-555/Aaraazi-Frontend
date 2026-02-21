/**
 * Acquisition Cost Modal - * Records all costs associated with property purchase
 * Design System Compliant
 * PHASE 4: Auto-population from purchase cycle + Skip option
 */

import { useState, useEffect } from 'react';
import { DollarSign, FileText, AlertCircle, SkipForward } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { createMultipleTransactions } from '../../lib/agencyTransactions';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';

interface AcquisitionCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyAddress: string;
  purchaseDate: string;
  purchaseCycleId?: string;
  userId: string;
  userName: string;
  onSuccess?: () => void;
  // Phase 4: New props
  initialPurchasePrice?: number;
  initialRenovation?: number;
  allowSkip?: boolean;
  onSkip?: () => void;
}

interface AcquisitionCosts {
  purchasePrice: string;
  registrationFee: string;
  stampDuty: string;
  legalFees: string;
  brokerCommission: string;
  renovation: string;
  otherCosts: string;
  notes: string;
}

const initialCosts: AcquisitionCosts = {
  purchasePrice: '',
  registrationFee: '',
  stampDuty: '',
  legalFees: '',
  brokerCommission: '',
  renovation: '',
  otherCosts: '',
  notes: '',
};

export function AcquisitionCostModal({
  isOpen,
  onClose,
  propertyId,
  propertyAddress,
  purchaseDate,
  purchaseCycleId,
  userId,
  userName,
  onSuccess,
  // Phase 4: New props
  initialPurchasePrice,
  initialRenovation,
  allowSkip = false,
  onSkip,
}: AcquisitionCostModalProps) {
  const [costs, setCosts] = useState<AcquisitionCosts>(initialCosts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens - Phase 4: Auto-populate from purchase cycle
  useEffect(() => {
    if (isOpen) {
      setCosts({
        purchasePrice: initialPurchasePrice ? String(initialPurchasePrice) : '',
        registrationFee: '',
        stampDuty: '',
        legalFees: '',
        brokerCommission: '',
        renovation: initialRenovation ? String(initialRenovation) : '',
        otherCosts: '',
        notes: '',
      });
    }
  }, [isOpen, initialPurchasePrice, initialRenovation]);

  const handleInputChange = (field: keyof AcquisitionCosts, value: string) => {
    // Allow empty string or valid numbers only
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCosts(prev => ({ ...prev, [field]: value }));
    }
  };

  const parseAmount = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const calculateTotal = (): number => {
    return (
      parseAmount(costs.purchasePrice) +
      parseAmount(costs.registrationFee) +
      parseAmount(costs.stampDuty) +
      parseAmount(costs.legalFees) +
      parseAmount(costs.brokerCommission) +
      parseAmount(costs.renovation) +
      parseAmount(costs.otherCosts)
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!costs.purchasePrice || parseAmount(costs.purchasePrice) <= 0) {
      toast.error('Please enter a valid purchase price');
      return;
    }

    const total = calculateTotal();
    if (total <= 0) {
      toast.error('Total acquisition cost must be greater than zero');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create transaction records for each non-zero cost
      const transactions = [];

      // Purchase Price (required)
      transactions.push({
        propertyId,
        propertyAddress,
        category: 'acquisition' as const,
        type: 'purchase_price' as const,
        amount: parseAmount(costs.purchasePrice),
        date: purchaseDate,
        description: 'Property purchase price',
        notes: costs.notes || undefined,
        purchaseCycleId,
        recordedBy: userId,
        recordedByName: userName,
      });

      // Registration Fee
      if (parseAmount(costs.registrationFee) > 0) {
        transactions.push({
          propertyId,
          propertyAddress,
          category: 'acquisition' as const,
          type: 'registration_fee' as const,
          amount: parseAmount(costs.registrationFee),
          date: purchaseDate,
          description: 'Property registration fee',
          purchaseCycleId,
          recordedBy: userId,
          recordedByName: userName,
        });
      }

      // Stamp Duty
      if (parseAmount(costs.stampDuty) > 0) {
        transactions.push({
          propertyId,
          propertyAddress,
          category: 'acquisition' as const,
          type: 'stamp_duty' as const,
          amount: parseAmount(costs.stampDuty),
          date: purchaseDate,
          description: 'Stamp duty payment',
          purchaseCycleId,
          recordedBy: userId,
          recordedByName: userName,
        });
      }

      // Legal Fees
      if (parseAmount(costs.legalFees) > 0) {
        transactions.push({
          propertyId,
          propertyAddress,
          category: 'acquisition' as const,
          type: 'legal_fees' as const,
          amount: parseAmount(costs.legalFees),
          date: purchaseDate,
          description: 'Legal fees',
          purchaseCycleId,
          recordedBy: userId,
          recordedByName: userName,
        });
      }

      // Broker Commission
      if (parseAmount(costs.brokerCommission) > 0) {
        transactions.push({
          propertyId,
          propertyAddress,
          category: 'acquisition' as const,
          type: 'broker_commission' as const,
          amount: parseAmount(costs.brokerCommission),
          date: purchaseDate,
          description: 'Broker commission',
          purchaseCycleId,
          recordedBy: userId,
          recordedByName: userName,
        });
      }

      // Renovation
      if (parseAmount(costs.renovation) > 0) {
        transactions.push({
          propertyId,
          propertyAddress,
          category: 'acquisition' as const,
          type: 'renovation' as const,
          amount: parseAmount(costs.renovation),
          date: purchaseDate,
          description: 'Renovation costs',
          purchaseCycleId,
          recordedBy: userId,
          recordedByName: userName,
        });
      }

      // Other Costs
      if (parseAmount(costs.otherCosts) > 0) {
        transactions.push({
          propertyId,
          propertyAddress,
          category: 'acquisition' as const,
          type: 'other_acquisition' as const,
          amount: parseAmount(costs.otherCosts),
          date: purchaseDate,
          description: 'Other acquisition costs',
          notes: costs.notes || undefined,
          purchaseCycleId,
          recordedBy: userId,
          recordedByName: userName,
        });
      }

      // Save all transactions
      createMultipleTransactions(transactions);

      toast.success(
        `Acquisition costs recorded successfully. Total: ${formatPKR(total)}`,
        {
          description: `${transactions.length} transaction${transactions.length > 1 ? 's' : ''} created`,
        }
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error recording acquisition costs:', error);
      toast.error('Failed to record acquisition costs. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5 text-primary" />
            Record Acquisition Costs
          </DialogTitle>
          <DialogDescription>
            Record all costs associated with purchasing {propertyAddress}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-1">
            <div className="flex items-start gap-2 text-sm">
              <FileText className="size-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{propertyAddress}</p>
                <p className="text-muted-foreground">
                  Purchase Date: {new Date(purchaseDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Purchase Price (Required) */}
          <div className="space-y-2">
            <Label htmlFor="purchasePrice" className="flex items-center gap-1">
              Purchase Price <span className="text-destructive">*</span>
            </Label>
            <Input
              id="purchasePrice"
              type="text"
              placeholder="0"
              value={costs.purchasePrice}
              onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
              className="text-right"
            />
            {costs.purchasePrice && parseAmount(costs.purchasePrice) > 0 && (
              <p className="text-sm text-muted-foreground">
                {formatPKR(parseAmount(costs.purchasePrice))}
              </p>
            )}
          </div>

          {/* Acquisition Expenses */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Acquisition Expenses</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Registration Fee */}
              <div className="space-y-2">
                <Label htmlFor="registrationFee">Registration Fee</Label>
                <Input
                  id="registrationFee"
                  type="text"
                  placeholder="0"
                  value={costs.registrationFee}
                  onChange={(e) => handleInputChange('registrationFee', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Stamp Duty */}
              <div className="space-y-2">
                <Label htmlFor="stampDuty">Stamp Duty</Label>
                <Input
                  id="stampDuty"
                  type="text"
                  placeholder="0"
                  value={costs.stampDuty}
                  onChange={(e) => handleInputChange('stampDuty', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Legal Fees */}
              <div className="space-y-2">
                <Label htmlFor="legalFees">Legal Fees</Label>
                <Input
                  id="legalFees"
                  type="text"
                  placeholder="0"
                  value={costs.legalFees}
                  onChange={(e) => handleInputChange('legalFees', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Broker Commission */}
              <div className="space-y-2">
                <Label htmlFor="brokerCommission">Broker Commission</Label>
                <Input
                  id="brokerCommission"
                  type="text"
                  placeholder="0"
                  value={costs.brokerCommission}
                  onChange={(e) => handleInputChange('brokerCommission', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Renovation */}
              <div className="space-y-2">
                <Label htmlFor="renovation">Renovation</Label>
                <Input
                  id="renovation"
                  type="text"
                  placeholder="0"
                  value={costs.renovation}
                  onChange={(e) => handleInputChange('renovation', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Other Costs */}
              <div className="space-y-2">
                <Label htmlFor="otherCosts">Other Costs</Label>
                <Input
                  id="otherCosts"
                  type="text"
                  placeholder="0"
                  value={costs.otherCosts}
                  onChange={(e) => handleInputChange('otherCosts', e.target.value)}
                  className="text-right"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the acquisition..."
              value={costs.notes}
              onChange={(e) => setCosts(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Total Summary */}
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Acquisition Cost</span>
              <span className="text-xl font-semibold text-primary">
                {formatPKR(total)}
              </span>
            </div>
            {total > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                This amount will be recorded as the total investment for this property.
              </p>
            )}
          </div>

          {/* Validation Warning */}
          {!costs.purchasePrice && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="size-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800">
                Purchase price is required to record acquisition costs.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          {allowSkip && onSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={isSubmitting}
              className="mr-auto"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip for Now
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !costs.purchasePrice || parseAmount(costs.purchasePrice) <= 0}
          >
            {isSubmitting ? 'Recording...' : 'Record Acquisition Costs'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}