import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { formatPKR } from '../../../lib/currency';
import { InvestorDistributionRecord } from './InvestorDistributionList';

interface DistributionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (distribution: Omit<InvestorDistributionRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  investors?: { id: string; name: string; totalInvested: number }[];
  properties?: { id: string; title: string; investors: { investorId: string; percentage: number }[] }[];
  mode: 'add';
}

/**
 * DistributionFormModal Component
 * 
 * Modal for scheduling new profit distributions to investors.
 * 
 * Design System V4.1 Compliant:
 * - Uses Shadcn Dialog, Input, Select components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Jakob's Law: Standard form layout
 * - Hick's Law: Clear grouped fields
 * - Fitts's Law: Large input fields
 * 
 * Features:
 * - Select property (with investor validation)
 * - Select investor from property investors
 * - Auto-calculate ownership percentage
 * - Distribution type selection
 * - Schedule distribution date
 * - Manual amount entry with validation
 * - Payment method selection
 * - Notes field
 * 
 * @example
 * <DistributionFormModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   mode="add"
 *   onSave={handleSaveDistribution}
 *   investors={investors}
 *   properties={properties}
 * />
 */
export const DistributionFormModal: React.FC<DistributionFormModalProps> = ({
  open,
  onClose,
  onSave,
  investors = [],
  properties = [],
  mode,
}) => {
  const [propertyId, setPropertyId] = useState('');
  const [investorId, setInvestorId] = useState('');
  const [distributionType, setDistributionType] = useState<'rental-income' | 'sale-profit' | 'quarterly-dividend' | 'annual-dividend'>('rental-income');
  const [amount, setAmount] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank-transfer' | 'cheque' | 'cash'>('bank-transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open && mode === 'add') {
      setPropertyId('');
      setInvestorId('');
      setDistributionType('rental-income');
      setAmount('');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
      setPaymentMethod('bank-transfer');
      setReferenceNumber('');
      setNotes('');
    }
  }, [open, mode]);

  // Get investors for selected property
  const availableInvestors = useMemo(() => {
    if (!propertyId) return [];
    
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.investors) return [];
    
    return property.investors
      .map(pi => {
        const investor = investors.find(inv => inv.id === pi.investorId);
        if (!investor) return null;
        return {
          ...investor,
          percentage: pi.percentage,
        };
      })
      .filter(Boolean) as { id: string; name: string; totalInvested: number; percentage: number }[];
  }, [propertyId, properties, investors]);

  // Get selected investor's ownership percentage
  const ownershipPercentage = useMemo(() => {
    if (!investorId || !propertyId) return 0;
    
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.investors) return 0;
    
    const investorShare = property.investors.find(pi => pi.investorId === investorId);
    return investorShare?.percentage || 0;
  }, [investorId, propertyId, properties]);

  const handleSubmit = async () => {
    // Validation
    if (!propertyId || !investorId || !amount || !scheduledDate) {
      alert('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const property = properties.find(p => p.id === propertyId);
      const investor = investors.find(inv => inv.id === investorId);

      const distributionData: Omit<InvestorDistributionRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        investorId,
        investorName: investor?.name || 'Unknown Investor',
        propertyId,
        propertyTitle: property?.title || 'Unknown Property',
        distributionType,
        amount: amountNum,
        ownershipPercentage,
        distributionDate: scheduledDate, // Will be updated when actually paid
        scheduledDate,
        status: 'Scheduled',
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      };

      await onSave(distributionData);
      onClose();
    } catch (error) {
      console.error('Failed to save distribution:', error);
      alert('Failed to save distribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Profit Distribution</DialogTitle>
          <DialogDescription>
            Create a new profit distribution for an investor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Selection */}
          <div>
            <Label htmlFor="property">Property *</Label>
            <Select value={propertyId} onValueChange={(val) => {
              setPropertyId(val);
              setInvestorId(''); // Reset investor when property changes
            }}>
              <SelectTrigger id="property">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties
                  .filter(p => p.investors && p.investors.length > 0)
                  .map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title} ({property.investors?.length || 0} investor{property.investors?.length !== 1 ? 's' : ''})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {properties.filter(p => p.investors && p.investors.length > 0).length === 0 && (
              <p className="text-orange-600 text-sm mt-1">
                No properties with investors found
              </p>
            )}
          </div>

          {/* Investor Selection */}
          <div>
            <Label htmlFor="investor">Investor *</Label>
            <Select value={investorId} onValueChange={setInvestorId} disabled={!propertyId}>
              <SelectTrigger id="investor">
                <SelectValue placeholder={propertyId ? "Select investor" : "Select property first"} />
              </SelectTrigger>
              <SelectContent>
                {availableInvestors.map((investor) => (
                  <SelectItem key={investor.id} value={investor.id}>
                    {investor.name} ({investor.percentage.toFixed(2)}% ownership)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {investorId && (
              <p className="text-gray-600 text-sm mt-1">
                Ownership: {ownershipPercentage.toFixed(2)}%
              </p>
            )}
          </div>

          {/* Distribution Type and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Distribution Type *</Label>
              <Select value={distributionType} onValueChange={(val: any) => setDistributionType(val)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental-income">Rental Income</SelectItem>
                  <SelectItem value="sale-profit">Sale Profit</SelectItem>
                  <SelectItem value="quarterly-dividend">Quarterly Dividend</SelectItem>
                  <SelectItem value="annual-dividend">Annual Dividend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount (PKR) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              {amount && !isNaN(parseFloat(amount)) && (
                <p className="text-gray-600 text-sm mt-1">
                  {formatPKR(parseFloat(amount))}
                </p>
              )}
            </div>
          </div>

          {/* Scheduled Date */}
          <div>
            <Label htmlFor="scheduledDate">Scheduled Date *</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>

          {/* Payment Method and Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g., TXN-2024-001"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or details about this distribution..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Scheduling...' : 'Schedule Distribution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
