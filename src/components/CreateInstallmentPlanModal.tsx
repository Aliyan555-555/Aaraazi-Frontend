/**
 * Create Installment Plan Modal - V3.0
 * Modal for creating payment/installment plans for property sales
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User, SellCycle, Offer } from '../types';
import { toast } from 'sonner';
import { createInstallmentPlan } from '../lib/installments';
import { DollarSign, Calendar, FileText } from 'lucide-react';
import { formatPKR } from '../lib/currency';

interface CreateInstallmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellCycle: SellCycle;
  acceptedOffer: Offer;
  user: User;
  onSuccess: () => void;
}

export function CreateInstallmentPlanModal({
  isOpen,
  onClose,
  sellCycle,
  acceptedOffer,
  user,
  onSuccess,
}: CreateInstallmentPlanModalProps) {
  const [formData, setFormData] = useState({
    totalAmount: acceptedOffer.offerAmount,
    downPayment: acceptedOffer.tokenAmount || 0,
    numberOfInstallments: 12,
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'bi-annual' | 'annual' | 'custom',
    startDate: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [installmentAmount, setInstallmentAmount] = useState(0);

  // Calculate remaining amount and installment amount
  useEffect(() => {
    const remaining = formData.totalAmount - formData.downPayment;
    setRemainingAmount(remaining);
    
    if (formData.numberOfInstallments > 0) {
      setInstallmentAmount(remaining / formData.numberOfInstallments);
    }
  }, [formData.totalAmount, formData.downPayment, formData.numberOfInstallments]);

  // Set default start date to next month
  useEffect(() => {
    if (!formData.startDate) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      setFormData(prev => ({ ...prev, startDate: nextMonth.toISOString().split('T')[0] }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || formData.numberOfInstallments < 1) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.downPayment >= formData.totalAmount) {
      toast.error('Down payment cannot be equal to or greater than total amount');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      createInstallmentPlan({
        sellCycleId: sellCycle.id,
        propertyId: sellCycle.propertyId,
        buyerId: acceptedOffer.buyerId,
        buyerName: acceptedOffer.buyerName,
        totalAmount: formData.totalAmount,
        downPayment: formData.downPayment,
        numberOfInstallments: formData.numberOfInstallments,
        startDate: formData.startDate,
        frequency: formData.frequency,
        createdBy: user.id,
      });
      
      toast.success('Installment plan created successfully');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating installment plan:', error);
      toast.error('Failed to create installment plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      'monthly': 'Monthly',
      'quarterly': 'Quarterly (Every 3 months)',
      'bi-annual': 'Bi-Annual (Every 6 months)',
      'annual': 'Annual (Yearly)',
      'custom': 'Custom Dates',
    };
    return labels[freq] || freq;
  };

  const calculateEndDate = () => {
    if (!formData.startDate) return '';
    
    const start = new Date(formData.startDate);
    let months = 0;
    
    switch (formData.frequency) {
      case 'monthly':
        months = formData.numberOfInstallments;
        break;
      case 'quarterly':
        months = formData.numberOfInstallments * 3;
        break;
      case 'bi-annual':
        months = formData.numberOfInstallments * 6;
        break;
      case 'annual':
        months = formData.numberOfInstallments * 12;
        break;
      default:
        months = formData.numberOfInstallments;
    }
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    
    return end.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Installment Plan</DialogTitle>
          <DialogDescription>Set up a payment plan for the buyer</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Buyer</span>
              <span className="font-medium">{acceptedOffer.buyerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Accepted Offer</span>
              <span className="font-bold text-lg">{formatPKR(acceptedOffer.offerAmount)}</span>
            </div>
            {acceptedOffer.tokenAmount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Token Money Received</span>
                <span className="text-green-600 font-medium">{formatPKR(acceptedOffer.tokenAmount)}</span>
              </div>
            )}
          </div>

          {/* Payment Structure */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Structure
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">
                  Total Sale Amount (PKR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  step="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="downPayment">Down Payment (PKR)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={formData.downPayment}
                  onChange={(e) => setFormData({ ...formData, downPayment: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground">
                  {((formData.downPayment / formData.totalAmount) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Remaining Amount:</span>
                <span className="font-bold">{formatPKR(remainingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Installment Schedule */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Installment Schedule
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfInstallments">
                  Number of Installments <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numberOfInstallments"
                  type="number"
                  value={formData.numberOfInstallments}
                  onChange={(e) => setFormData({ ...formData, numberOfInstallments: parseInt(e.target.value) || 0 })}
                  required
                  min="1"
                  max="120"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">
                  Payment Frequency <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                    <SelectItem value="bi-annual">Bi-Annual (Every 6 months)</SelectItem>
                    <SelectItem value="annual">Annual (Yearly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">
                  First Installment Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm mb-2">Payment Plan Summary</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Each Installment:</span>
                    <span className="font-bold">{formatPKR(installmentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Installments:</span>
                    <span className="font-medium">{formData.numberOfInstallments}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium">{getFrequencyLabel(formData.frequency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Completion:</span>
                    <span className="font-medium">{calculateEndDate()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-green-200">
                <div className="flex justify-between font-bold">
                  <span>Total Collection:</span>
                  <span className="text-green-700">{formatPKR(formData.totalAmount)}</span>
                </div>
              </div>
            </div>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Installment Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
