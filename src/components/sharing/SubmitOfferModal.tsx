/**
 * SubmitOfferModal Component
 * Modal for submitting cross-agent offers through matched properties
 * 
 * Features:
 * - Pre-filled with buyer/requirement data
 * - Property summary display
 * - Match score indicator
 * - Offer amount input with validation
 * - Optional notes field
 * - Coordination scheduling
 * - Success/error handling
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  FileText,
  TrendingUp,
  User,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Home,
  MapPin,
} from 'lucide-react';
import { PropertyMatch, Property, User as UserType } from '../../types';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';

interface SubmitOfferModalProps {
  open: boolean;
  onClose: () => void;
  match: PropertyMatch;
  property: Property;
  user: UserType;
  buyerRequirement?: any; // BuyerRequirement or RentRequirement
  onSubmit: (offerData: any) => void;
}

export const SubmitOfferModal: React.FC<SubmitOfferModalProps> = ({
  open,
  onClose,
  match,
  property,
  user,
  buyerRequirement,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [coordinationRequired, setCoordinationRequired] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setOfferAmount('');
      setBuyerNotes('');
      setAgentNotes('');
      setCoordinationRequired(true);
      setErrors({});
    }
  }, [open]);

  // Validate offer amount
  const validateAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      setErrors({ amount: 'Please enter a valid amount' });
      return false;
    }
    
    if (numAmount <= 0) {
      setErrors({ amount: 'Amount must be greater than 0' });
      return false;
    }

    // Check if amount is reasonable (within 50% of asking price)
    const askingPrice = property.price || 0;
    if (askingPrice > 0) {
      const minReasonable = askingPrice * 0.5;
      const maxReasonable = askingPrice * 1.5;
      
      if (numAmount < minReasonable) {
        setErrors({ 
          amount: `Amount seems too low (listing: ${formatPKR(askingPrice)})` 
        });
        // Don't block, just warn
      } else if (numAmount > maxReasonable) {
        setErrors({ 
          amount: `Amount seems too high (listing: ${formatPKR(askingPrice)})` 
        });
        // Don't block, just warn
      }
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validate
    if (!validateAmount(offerAmount)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const offerData = {
        amount: parseFloat(offerAmount),
        buyerNotes: buyerNotes.trim() || undefined,
        agentNotes: agentNotes.trim() || undefined,
        coordinationRequired,
        matchId: match.matchId,
        matchScore: match.matchScore,
        fromRequirementId: match.requirementId,
        submittedVia: 'match' as const,
      };

      await onSubmit(offerData);
      
      toast.success('Offer submitted successfully!', {
        description: `Your offer of ${formatPKR(parseFloat(offerAmount))} has been sent to ${match.listingAgentName}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error('Failed to submit offer', {
        description: 'Please try again or contact support',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Property display info
  const propertyTitle = property.title || `${property.propertyType} Property`;
  const propertyLocation = property.address
    ? `${property.address.areaName}, ${property.address.cityName}`
    : 'Location not specified';
  const askingPrice = property.price || 0;
  const isRent = match.cycleType === 'rent';

  // Match score color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#2D6A54';
    if (score >= 80) return '#6B9F8A';
    if (score >= 70) return '#C17052';
    return '#8B8B8B';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2D6A54]" />
            Submit Offer
          </DialogTitle>
          <DialogDescription>
            Submit an offer for this matched property on behalf of your buyer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Match Score Banner */}
          <div
            className="rounded-lg p-4 border-2"
            style={{
              backgroundColor: `${getScoreColor(match.matchScore)}15`,
              borderColor: getScoreColor(match.matchScore),
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg text-white font-bold"
                style={{ backgroundColor: getScoreColor(match.matchScore) }}
              >
                {match.matchScore}%
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {match.matchScore >= 90 ? 'Excellent' : match.matchScore >= 80 ? 'Good' : 'Fair'} Match
                </div>
                <div className="text-sm text-gray-600">
                  This property closely matches your buyer's requirements
                </div>
              </div>
            </div>
          </div>

          {/* Property Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Home className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{propertyTitle}</div>
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{propertyLocation}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[#2D6A54] font-semibold">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {isRent ? `${formatPKR(askingPrice)}/month` : formatPKR(askingPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Buyer Info (if available) */}
          {buyerRequirement && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Your Buyer</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                {buyerRequirement.buyerName && (
                  <div>Name: {buyerRequirement.buyerName}</div>
                )}
                {buyerRequirement.buyerContact && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {buyerRequirement.buyerContact}
                  </div>
                )}
                {buyerRequirement.buyerEmail && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {buyerRequirement.buyerEmail}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Offer Amount */}
          <div className="space-y-2">
            <Label htmlFor="offerAmount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Offer Amount (PKR) *
            </Label>
            <Input
              id="offerAmount"
              type="number"
              placeholder="Enter offer amount"
              value={offerAmount}
              onChange={(e) => {
                setOfferAmount(e.target.value);
                setErrors({});
              }}
              onBlur={() => validateAmount(offerAmount)}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.amount}</span>
              </div>
            )}
            {askingPrice > 0 && (
              <div className="text-xs text-gray-600">
                Asking price: {formatPKR(askingPrice)}
              </div>
            )}
          </div>

          {/* Buyer Notes */}
          <div className="space-y-2">
            <Label htmlFor="buyerNotes">
              Notes for Listing Agent (Optional)
            </Label>
            <Textarea
              id="buyerNotes"
              placeholder="Add any notes about the offer, financing, timeline, etc."
              value={buyerNotes}
              onChange={(e) => setBuyerNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="text-xs text-gray-600">
              These notes will be visible to the listing agent
            </div>
          </div>

          {/* Private Agent Notes */}
          <div className="space-y-2">
            <Label htmlFor="agentNotes">
              Private Notes (Optional)
            </Label>
            <Textarea
              id="agentNotes"
              placeholder="Your private notes about this offer (not visible to listing agent)"
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="text-xs text-gray-600">
              Only you can see these notes
            </div>
          </div>

          {/* Coordination Required */}
          <div className="flex items-start space-x-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Checkbox
              id="coordination"
              checked={coordinationRequired}
              onCheckedChange={(checked) => setCoordinationRequired(checked as boolean)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label
                htmlFor="coordination"
                className="text-sm font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span>Request coordination meeting</span>
                </div>
              </Label>
              <p className="text-xs text-amber-700 mt-1">
                The listing agent will be notified that you'd like to coordinate before proceeding
              </p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your offer will be sent to {match.listingAgentName}</li>
                  <li>The listing agent may accept or reject your offer</li>
                  <li>You'll receive a notification when they respond</li>
                  <li>Your buyer's contact details will only be revealed if the offer is accepted</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !offerAmount}
            style={{ backgroundColor: '#2D6A54' }}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit Offer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
