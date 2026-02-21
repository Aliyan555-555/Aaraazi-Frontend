/**
 * Send Offer From Purchase Cycle Modal
 * Modal for sending offers from a purchase cycle to a sell cycle
 * Bidirectional linking ensures offers appear in both cycles
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { PurchaseCycle, SellCycle, Property } from '../types';
import { toast } from 'sonner';
import { sendOfferToSellCycle } from '../lib/purchaseCycle';
import { DollarSign, AlertCircle, Info, Building2 } from 'lucide-react';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';

interface SendOfferFromPurchaseCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseCycle: PurchaseCycle;
  sellCycle?: SellCycle; // Made optional for safety
  property: Property;
  onSuccess: () => void;
}

export function SendOfferFromPurchaseCycleModal({
  isOpen,
  onClose,
  purchaseCycle,
  sellCycle,
  property,
  onSuccess,
}: SendOfferFromPurchaseCycleModalProps) {
  // Safety check: if no sellCycle provided, return null
  if (!sellCycle) {
    return null;
  }

  // Default offer amount to purchase cycle's offer amount
  const [formData, setFormData] = useState({
    offerAmount: purchaseCycle.offerAmount || sellCycle.askingPrice,
    tokenAmount: Math.round((purchaseCycle.offerAmount || sellCycle.askingPrice) * 0.10), // Default 10% token
    conditions: purchaseCycle.conditions || '',
    notes: purchaseCycle.notes || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrors({});
    
    if (!formData.offerAmount || formData.offerAmount <= 0) {
      setErrors({ offerAmount: 'Offer amount must be greater than 0' });
      toast.error('Please enter a valid offer amount');
      return;
    }
    
    // CRITICAL: Validate token amount doesn't exceed offer amount
    if (formData.tokenAmount > formData.offerAmount) {
      setErrors({ tokenAmount: 'Token money cannot exceed offer amount' });
      toast.error('Token money cannot exceed offer amount');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Send offer to sell cycle with bidirectional linking
      const result = sendOfferToSellCycle(purchaseCycle.id, sellCycle.id, {
        offerAmount: formData.offerAmount,
        tokenAmount: formData.tokenAmount || undefined,
        conditions: formData.conditions || undefined,
        notes: formData.notes || undefined,
      });
      
      if (result.success) {
        toast.success(`Offer sent successfully! The seller will review your offer.`);
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || 'Failed to send offer');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      toast.error('Failed to send offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      offerAmount: purchaseCycle.offerAmount || sellCycle.askingPrice,
      tokenAmount: Math.round((purchaseCycle.offerAmount || sellCycle.askingPrice) * 0.10),
      conditions: purchaseCycle.conditions || '',
      notes: purchaseCycle.notes || '',
    });
    setErrors({});
    onClose();
  };

  // Handle offer amount change - auto-adjust token if it exceeds new offer
  const handleOfferAmountChange = (value: number) => {
    const newOfferAmount = value || 0;
    let newTokenAmount = formData.tokenAmount;
    
    // If token amount exceeds new offer amount, cap it at offer amount
    if (newTokenAmount > newOfferAmount) {
      newTokenAmount = newOfferAmount;
    }
    
    setFormData({
      ...formData,
      offerAmount: newOfferAmount,
      tokenAmount: newTokenAmount,
    });
    
    // Clear errors when user corrects
    if (errors.tokenAmount) {
      setErrors({ ...errors, tokenAmount: '' });
    }
  };

  // Handle token amount change - validate in real-time
  const handleTokenAmountChange = (value: number) => {
    const newTokenAmount = value || 0;
    const newErrors = { ...errors };
    
    // Validate token amount doesn't exceed offer amount
    if (newTokenAmount > formData.offerAmount) {
      newErrors.tokenAmount = 'Token money cannot exceed offer amount';
    } else {
      delete newErrors.tokenAmount;
    }
    
    setFormData({ ...formData, tokenAmount: newTokenAmount });
    setErrors(newErrors);
  };

  const percentageOfAsking = sellCycle.askingPrice > 0 
    ? ((formData.offerAmount / sellCycle.askingPrice) * 100).toFixed(1) 
    : '0.0';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Offer to Seller</DialogTitle>
          <DialogDescription>
            Submit an offer from your purchase cycle to the property's sell cycle.
          </DialogDescription>
        </DialogHeader>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">Bidirectional Linking</h4>
            <p className="text-sm text-blue-700">
              This offer will be linked to both your purchase cycle and the seller's sell cycle. 
              Any updates (acceptance or rejection) will be synchronized automatically.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Purchase Cycle Information */}
          <div className="bg-green-50 p-4 rounded-lg space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Your Purchase Cycle
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Purchaser</p>
                <p className="font-medium">{purchaseCycle.purchaserName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Purchaser Type</p>
                <p className="font-medium capitalize">{purchaseCycle.purchaserType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Financing</p>
                <p className="font-medium capitalize">{purchaseCycle.financingType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{purchaseCycle.status}</p>
              </div>
            </div>
          </div>

          {/* Property & Sell Cycle Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-medium">Property & Sell Cycle Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Property</p>
                <p className="font-medium">{formatPropertyAddress(property.address)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Asking Price</p>
                <p className="font-bold text-lg">{formatPKR(sellCycle.askingPrice)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Seller</p>
                <p className="font-medium">{sellCycle.sellerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Seller Agent</p>
                <p className="font-medium">{sellCycle.agentName}</p>
              </div>
            </div>
          </div>

          {/* Offer Details */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Offer Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offerAmount">
                  Offer Amount (PKR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="offerAmount"
                  type="number"
                  value={formData.offerAmount}
                  onChange={(e) => handleOfferAmountChange(parseFloat(e.target.value) || 0)}
                  required
                  min="0"
                  step="1"
                  className={errors.offerAmount ? 'border-red-500' : ''}
                />
                {errors.offerAmount ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>⚠</span> {errors.offerAmount}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {percentageOfAsking}% of asking price
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenAmount">
                  Token Money (PKR)
                  {formData.offerAmount > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Max: {formData.offerAmount.toLocaleString()})
                    </span>
                  )}
                </Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  value={formData.tokenAmount}
                  onChange={(e) => handleTokenAmountChange(parseFloat(e.target.value) || 0)}
                  min="0"
                  max={formData.offerAmount || undefined}
                  step="1"
                  className={errors.tokenAmount ? 'border-red-500' : ''}
                />
                {errors.tokenAmount ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>⚠</span> {errors.tokenAmount}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {formData.offerAmount > 0 
                      ? `${((formData.tokenAmount / formData.offerAmount) * 100).toFixed(1)}% of offer`
                      : '0.0% of offer'}
                    {formData.offerAmount > 0 && formData.tokenAmount > 0 && formData.tokenAmount <= formData.offerAmount && (
                      <span className="ml-2 text-green-600">✓ Valid</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <Label htmlFor="conditions">Offer Conditions</Label>
              <Textarea
                id="conditions"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                placeholder="e.g., Subject to financing approval, home inspection..."
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes for Seller</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or comments..."
                rows={2}
              />
            </div>
          </div>

          {/* Warning for low offers */}
          {formData.offerAmount < sellCycle.askingPrice * 0.9 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Low Offer Warning</p>
                <p className="text-sm text-yellow-700">
                  Your offer is {(100 - parseFloat(percentageOfAsking)).toFixed(1)}% below the asking price. 
                  Consider if this might be rejected by the seller.
                </p>
              </div>
            </div>
          )}

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
            <Button 
              type="submit" 
              disabled={isSubmitting || Object.keys(errors).length > 0 || formData.tokenAmount > formData.offerAmount}
            >
              {isSubmitting ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}