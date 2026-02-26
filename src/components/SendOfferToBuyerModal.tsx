/**
 * Send Offer To Buyer Modal - V3.0
 * Modal for sending offers from buyer requirements to matching properties
 * CORRECTED: Purchase Cycle created WHEN OFFER IS ACCEPTED, not when sent
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { BuyerRequirement, User } from '../types';
// [STUBBED] import { PropertyMatch } from '../lib/propertyMatching';
import { toast } from 'sonner';
// [STUBBED] import { addOffer } from '../lib/sellCycle';
import { DollarSign, User as UserIcon, FileText, Info } from 'lucide-react';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';
import { logger } from "../lib/logger";

// ===== STUBS for removed prototype functions =====
type PropertyMatch = any;
const addOffer = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====

interface SendOfferToBuyerModalProps {
  match: PropertyMatch;
  buyerRequirement: BuyerRequirement;
  user: User; // Refactored: Pass user from parent
  onClose: () => void;
  onSuccess: () => void;
}

export function SendOfferToBuyerModal({
  match,
  buyerRequirement,
  user,
  onClose,
  onSuccess,
}: SendOfferToBuyerModalProps) {
  const property = match.property;
  const sellCycleId = match.sellCycleId;
  const askingPrice = match.askingPrice;

  logger.log('🔵 SendOfferToBuyerModal rendered with:', {
    user: user?.name,
    property: property?.id,
    sellCycleId,
    askingPrice,
    match
  });

  // Safety check - property and sell cycle required
  if (!user) {
    logger.error('❌ No user - returning null');
    return null;
  }

  if (!property) {
    logger.error('❌ No property - returning null');
    // We can't call onClose in render, but we return null and parent manages it
    return null;
  }

  if (!sellCycleId) {
    logger.error('❌ No sellCycleId - returning null');
    return null;
  }

  logger.log('✅ All validations passed in modal');

  // V3.0: Use asking price from sell cycle, fallback to property price
  const effectiveAskingPrice = askingPrice || property.price || 0;

  const [formData, setFormData] = useState({
    offerAmount: effectiveAskingPrice,
    tokenAmount: Math.round(effectiveAskingPrice * 0.10), // Default 10% token
    conditions: '',
    notes: '',
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
      // Send offer to the sell cycle
      // Purchase Cycle will be created automatically when seller accepts
      const offerNotes = formData.conditions
        ? `CONDITIONS: ${formData.conditions}${formData.notes ? `\n\nNOTES: ${formData.notes}` : ''}`
        : formData.notes;

      await addOffer(sellCycleId, {
        buyerId: buyerRequirement.id,
        buyerName: buyerRequirement.buyerName,
        buyerContact: buyerRequirement.buyerContact,
        offerAmount: formData.offerAmount,
        tokenAmount: formData.tokenAmount || undefined,
        notes: offerNotes || undefined,
        agentNotes: `Offer sent from buyer requirement match (ID: ${buyerRequirement.id}). Buyer Agent: ${user.name}` as any,
        buyerRequirementId: buyerRequirement.id, // V3.0: Link to buyer requirement
        buyerAgentId: user.id, // V3.0: Track buyer agent for later Purchase Cycle creation
        buyerAgentName: user.name,
        sourceType: 'buyer-requirement' as any, // V3.0: Track source
      });

      toast.success(`Offer sent successfully! The seller will review your offer.`);
      onSuccess();
      handleClose();
    } catch (error) {
      logger.error('Error sending offer:', error);
      toast.error('Failed to send offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      offerAmount: effectiveAskingPrice,
      tokenAmount: Math.round(effectiveAskingPrice * 0.10),
      conditions: '',
      notes: '',
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

  const percentageOfAsking = effectiveAskingPrice > 0
    ? ((formData.offerAmount / effectiveAskingPrice) * 100).toFixed(1)
    : '0.0';

  return (
    <Dialog open={true} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Offer - {formatPropertyAddress(property.address)}</DialogTitle>
          <DialogDescription>
            Create and send an offer from {buyerRequirement.buyerName} to this property listing.
          </DialogDescription>
        </DialogHeader>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">Explore Freely</h4>
            <p className="text-sm text-blue-700">
              Send as many offers as you need to explore options. If the seller accepts this offer, a Purchase Cycle and Deal will be automatically created for proper tracking.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Buyer Information */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Buyer Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{buyerRequirement.buyerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contact</p>
                <p className="font-medium">{buyerRequirement.buyerContact || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Budget</p>
                <p className="font-medium">{formatPKR(buyerRequirement.budgetMin || 0)} - {formatPKR(buyerRequirement.budgetMax)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Property Type</p>
                <p className="font-medium capitalize">{Array.isArray(buyerRequirement.propertyType) ? buyerRequirement.propertyType.join(', ') : buyerRequirement.propertyType}</p>
              </div>
            </div>
          </div>

          {/* Property Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-medium">Property Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Asking Price</p>
                <p className="font-bold text-lg">{formatPKR(effectiveAskingPrice)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Property Type</p>
                <p className="font-medium capitalize">{property.propertyType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bedrooms</p>
                <p className="font-medium">{property.bedrooms || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Area</p>
                <p className="font-medium">{property.area} {property.areaUnit}</p>
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
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Additional Information
            </h3>

            <div className="space-y-4">
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
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
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