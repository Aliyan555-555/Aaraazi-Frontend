/**
 * Counter Offer Modal
 * Modal for countering a buyer offer
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DollarSign } from 'lucide-react';

interface CounterOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: {
    id: string;
    buyerName: string;
    offerAmount: number;
  } | null;
  askingPrice: number;
  onSubmit: (counterAmount: number) => void;
  isSubmitting?: boolean;
}

export function CounterOfferModal({
  isOpen,
  onClose,
  offer,
  askingPrice,
  onSubmit,
  isSubmitting = false,
}: CounterOfferModalProps) {
  const [counterAmount, setCounterAmount] = useState(askingPrice);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (offer && isOpen) {
      // Default to asking price
      setCounterAmount(askingPrice);
      setError('');
    }
  }, [offer, askingPrice, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!counterAmount || counterAmount <= 0) {
      setError('Counter amount must be greater than 0');
      return;
    }
    
    if (!offer) return;
    
    // Counter amount should typically be between offer and asking
    // But we won't enforce this - agent can counter at any amount
    
    onSubmit(counterAmount);
  };

  const handleClose = () => {
    setCounterAmount(askingPrice);
    setError('');
    onClose();
  };

  if (!offer) return null;

  const percentageOfAsking = ((counterAmount / askingPrice) * 100).toFixed(1);
  const percentageOfOffer = ((counterAmount / offer.offerAmount) * 100).toFixed(1);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Counter Offer</DialogTitle>
          <DialogDescription>
            Propose a counter amount to {offer.buyerName}'s offer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Offer Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Offer:</span>
              <span className="font-medium">PKR {offer.offerAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Asking Price:</span>
              <span className="font-medium">PKR {askingPrice.toLocaleString()}</span>
            </div>
            {counterAmount > 0 && (
              <>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your Counter:</span>
                    <span className="font-semibold text-blue-600">
                      PKR {counterAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentageOfAsking}% of asking</span>
                  <span>{percentageOfOffer}% of offer</span>
                </div>
              </>
            )}
          </div>
          
          {/* Counter Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="counterAmount">
              Counter Amount (PKR) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="counterAmount"
              type="number"
              value={counterAmount}
              onChange={(e) => {
                setCounterAmount(parseFloat(e.target.value) || 0);
                setError('');
              }}
              placeholder="0"
              required
              min="0"
              step="1"
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter your counter offer amount. This will be sent to the buyer for consideration.
            </p>
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
            <Button 
              type="submit" 
              disabled={isSubmitting || !!error || counterAmount <= 0}
            >
              {isSubmitting ? 'Sending...' : 'Send Counter Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
