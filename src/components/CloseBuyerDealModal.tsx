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
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, AlertCircle, Building, TrendingUp } from 'lucide-react';
import { Property, Contact } from '../types';
import { BuyerOffer, closeBuyerDeal } from '../lib/buyCycle';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddressShort } from '../lib/utils';
import { toast } from 'sonner';

interface CloseBuyerDealModalProps {
  offer: BuyerOffer;
  property: Property | null;
  requirement: Property;
  buyer: Contact;
  onClose: () => void;
  onSuccess: () => void;
}

export function CloseBuyerDealModal({
  offer,
  property,
  requirement,
  buyer,
  onClose,
  onSuccess,
}: CloseBuyerDealModalProps) {
  const [closingDate, setClosingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInternalMatch = offer.dealSource === 'internal-match';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!closingDate) {
      toast.error('Please select a closing date');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = closeBuyerDeal(offer.id, buyer.name, closingDate);

      if (result.success) {
        toast.success('Deal closed successfully!', {
          description: isInternalMatch
            ? 'Ownership transferred, commissions created for both agents'
            : 'Shadow property created, buyer commission recorded',
        });
        onSuccess();
      } else {
        toast.error('Failed to close deal', {
          description: result.error || 'An error occurred',
        });
      }
    } catch (error) {
      console.error('Error closing deal:', error);
      toast.error('Failed to close deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Close Buyer Deal - Finalize Acquisition</DialogTitle>
          <DialogDescription>
            Review and finalize the details of the buyer deal before closing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Deal Type Alert */}
          <Alert className={isInternalMatch ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'}>
            <Building className="h-4 w-4" />
            <AlertDescription>
              {isInternalMatch ? (
                <div>
                  <strong>Internal Match:</strong> This property is from the agency inventory.
                  Ownership will be transferred to the buyer, and commissions will be split
                  50/50 between the listing agent and buying agent.
                </div>
              ) : (
                <div>
                  <strong>External Market:</strong> This is an external property.
                  A shadow property record will be created for tracking, and the buyer's
                  agent will receive 100% of the commission.
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Offer Summary */}
          <div className="bg-[#f8f9fa] p-4 rounded-lg border-2 border-[#e9ebef]">
            <h3 className="text-[#030213] mb-4">Offer Summary</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#666] text-sm mb-1">Property</p>
                <p className="text-[#030213]">
                  {property?.title || 'External Property'}
                </p>
                {property && (
                  <p className="text-[#666] text-sm">{formatPropertyAddressShort(property.address)}</p>
                )}
              </div>

              <div>
                <p className="text-[#666] text-sm mb-1">Buyer</p>
                <p className="text-[#030213]">{buyer.name}</p>
                <p className="text-[#666] text-sm">{buyer.phone}</p>
              </div>

              <div>
                <p className="text-[#666] text-sm mb-1">Offer Amount</p>
                <p className="text-[#030213]">{formatPKR(offer.offerAmount)}</p>
              </div>

              <div>
                <p className="text-[#666] text-sm mb-1">Token Paid</p>
                <p className="text-[#030213]">{formatPKR(offer.tokenAmount)}</p>
              </div>
            </div>

            {offer.conditions && (
              <div className="mt-4 pt-4 border-t border-[#e9ebef]">
                <p className="text-[#666] text-sm mb-1">Conditions</p>
                <p className="text-[#030213] text-sm">{offer.conditions}</p>
              </div>
            )}
          </div>

          {/* Commission Breakdown */}
          {isInternalMatch && property && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="text-[#030213] mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Commission Breakdown (50/50 Split)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#666]">
                    Listing Agent ({property.agentName}):
                  </span>
                  <span className="text-[#030213]">
                    {formatPKR((offer.offerAmount * (property.commissionRate || 2)) / 100 / 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">
                    Buying Agent (You):
                  </span>
                  <span className="text-[#030213]">
                    {formatPKR((offer.offerAmount * (property.commissionRate || 2)) / 100 / 2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-300">
                  <span className="text-[#030213]">Total Commission:</span>
                  <span className="text-[#030213]">
                    {formatPKR((offer.offerAmount * (property.commissionRate || 2)) / 100)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isInternalMatch && (
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h4 className="text-[#030213] mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Commission (Buyer Agent Only)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#666]">Buying Agent Commission (2%):</span>
                  <span className="text-[#030213]">
                    {formatPKR((offer.offerAmount * 2) / 100)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Closing Date */}
            <div>
              <Label>Closing Date *</Label>
              <Input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="border-[#e9ebef]"
                required
              />
              <p className="text-[#666] text-sm mt-1">
                Date when the property ownership will be transferred
              </p>
            </div>

            {/* What Will Happen */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="text-[#030213] mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                What Will Happen
              </h4>
              <ul className="space-y-2 text-sm text-[#666]">
                {isInternalMatch ? (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Property ownership will be transferred to {buyer.name}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Property status will be updated to "Sold"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Two commission records will be created (50/50 split)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Transaction record will be saved with full history</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Shadow property record will be created for tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Ownership will be assigned to {buyer.name}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Buyer agent commission will be recorded</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Transaction record will be saved</span>
                    </li>
                  </>
                )}
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Buyer requirement will be marked as "Acquired"</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[#e9ebef]">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? 'Closing Deal...' : 'Close Deal & Transfer Ownership'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}