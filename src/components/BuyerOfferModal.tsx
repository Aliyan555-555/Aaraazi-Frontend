import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { AlertCircle, Building } from 'lucide-react';
import { Property, Contact, User } from '../types';
import { createBuyerOffer } from '../lib/buyCycle';
// [STUBBED] import { getProperties, updateProperty } from '../lib/data';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddressShort } from '../lib/utils';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const getProperties = (..._args: any[]): any => { /* stub - prototype function removed */ };
const updateProperty = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface BuyerOfferModalProps {
  property: Property;
  requirement: Property;
  user: User;
  contacts: Contact[];
  onClose: () => void;
}

export function BuyerOfferModal({
  property,
  requirement,
  user,
  contacts,
  onClose,
}: BuyerOfferModalProps) {
  const buyer = contacts.find((c) => c.id === requirement.currentOwnerId);

  // Determine if this is an internal match or external
  const allProperties = getProperties();
  const isInternalMatch = allProperties.some(
    (p) => p.id === property.id && p.listingType === 'for-sale'
  );

  const [formData, setFormData] = useState({
    offerAmount: property.price.toString(),
    tokenAmount: '',
    conditions: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.offerAmount) {
      toast.error('Please enter an offer amount');
      return;
    }

    if (!formData.tokenAmount) {
      toast.error('Please enter a token amount');
      return;
    }

    const offerAmount = parseFloat(formData.offerAmount);
    const tokenAmount = parseFloat(formData.tokenAmount);

    if (isNaN(offerAmount) || isNaN(tokenAmount)) {
      toast.error('Amounts must be valid numbers');
      return;
    }

    if (tokenAmount > offerAmount) {
      toast.error('Token amount cannot exceed offer amount');
      return;
    }

    if (!buyer) {
      toast.error('Buyer contact not found');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the offer
      createBuyerOffer({
        requirementId: requirement.id,
        propertyId: property.id,
        buyerContactId: buyer.id,
        offerAmount,
        tokenAmount,
        conditions: formData.conditions.trim() || undefined,
        status: 'drafted',
        dealSource: isInternalMatch ? 'internal-match' : 'external-market',
        listingAgentId: isInternalMatch ? property.agentId : undefined,
        buyingAgentId: user.id,
      });

      // Update requirement status to negotiation
      updateProperty(requirement.id, {
        status: 'under-offer',
      });

      // If internal match, potentially notify listing agent
      if (isInternalMatch) {
        // Could add notification logic here
        toast.success('Offer drafted and listing agent notified', {
          description: `Offer of ${formatPKR(offerAmount)} submitted for ${property.title}`,
        });
      } else {
        toast.success('Offer drafted successfully', {
          description: `Offer of ${formatPKR(offerAmount)} ready to send to external seller`,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error('Failed to create offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Draft Buyer Offer</DialogTitle>
          <DialogDescription>
            Create a buyer offer for the selected property.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Deal Source Badge */}
          <div className="bg-[#f8f9fa] p-4 rounded-lg border-2 border-[#e9ebef]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#030213]">Deal Source</h3>
              <Badge
                className={
                  isInternalMatch
                    ? 'bg-blue-500 text-white'
                    : 'bg-purple-500 text-white'
                }
              >
                {isInternalMatch ? 'Internal Match' : 'External Market'}
              </Badge>
            </div>
            {isInternalMatch ? (
              <div className="flex items-start gap-2 text-sm text-[#666]">
                <Building className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  This property is in the agency's inventory. The offer will be sent to the listing
                  agent ({property.agentName}). If accepted, this will be a dual-commission deal.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-[#666]">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  This is an external property. You will need to send the offer letter to the
                  seller or their agent directly. Commission will be earned from the buyer only.
                </p>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[#666] text-sm mb-1">Property</p>
              <p className="text-[#030213]">{property.title}</p>
              <p className="text-[#666] text-sm">{formatPropertyAddressShort(property.address)}</p>
            </div>
            <div>
              <p className="text-[#666] text-sm mb-1">Asking Price</p>
              <p className="text-[#030213]">{formatPKR(property.price)}</p>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="bg-[#f8f9fa] p-4 rounded-lg">
            <p className="text-[#666] text-sm mb-2">Buyer Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#030213]">{buyer?.name}</p>
                <p className="text-[#666] text-sm">{buyer?.phone}</p>
              </div>
              <div>
                <p className="text-[#666] text-sm">Budget Range</p>
                <p className="text-[#030213] text-sm">
                  {formatPKR((requirement as any).budgetMin || 0)} - {formatPKR((requirement as any).budgetMax || 0)}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Offer Amount */}
            <div>
              <Label>Offer Amount (PKR) *</Label>
              <Input
                type="number"
                value={formData.offerAmount}
                onChange={(e) =>
                  setFormData({ ...formData, offerAmount: e.target.value })
                }
                placeholder="Enter offer amount"
                className="border-[#e9ebef]"
              />
              <p className="text-[#666] text-sm mt-1">
                Suggested: {formatPKR(property.price * 0.95)} - {formatPKR(property.price)}
              </p>
            </div>

            {/* Token Amount */}
            <div>
              <Label>Token/Advance Amount (PKR) *</Label>
              <Input
                type="number"
                value={formData.tokenAmount}
                onChange={(e) =>
                  setFormData({ ...formData, tokenAmount: e.target.value })
                }
                placeholder="Amount buyer is ready to pay immediately"
                className="border-[#e9ebef]"
              />
              <p className="text-[#666] text-sm mt-1">
                Typically 5-10% of offer amount
              </p>
            </div>

            {/* Conditions */}
            <div>
              <Label>Offer Conditions (Optional)</Label>
              <Textarea
                value={formData.conditions}
                onChange={(e) =>
                  setFormData({ ...formData, conditions: e.target.value })
                }
                placeholder="e.g., Subject to clear title, vacant possession, bank loan approval..."
                className="border-[#e9ebef] min-h-[100px]"
              />
            </div>

            {/* Commission Preview (for internal match) */}
            {isInternalMatch && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="text-[#030213] mb-3">Commission Split Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#666]">Listing Agent ({property.agentName}):</span>
                    <span className="text-[#030213]">
                      {formatPKR((parseFloat(formData.offerAmount) || 0) * (property.commissionRate || 2) / 100 * 0.5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Buying Agent ({user.name}):</span>
                    <span className="text-[#030213]">
                      {formatPKR((parseFloat(formData.offerAmount) || 0) * (property.commissionRate || 2) / 100 * 0.5)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="text-[#030213]">Total Commission:</span>
                    <span className="text-[#030213]">
                      {formatPKR((parseFloat(formData.offerAmount) || 0) * (property.commissionRate || 2) / 100)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[#e9ebef]">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#fb8500] hover:bg-[#fb8500]/90 text-white"
              >
                {isSubmitting ? 'Drafting...' : 'Draft Offer'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}