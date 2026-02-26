/**
 * Sale & Profit Calculation Modal
 * Records property sale and calculates complete P&L
 * Design System V4.1 Compliant
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Calculator, FileText, AlertCircle } from 'lucide-react';
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
// [STUBBED] import { createMultipleTransactions } from '../../lib/agencyTransactions';
// [STUBBED] import { calculatePropertyFinancials, generatePropertyProfitLoss } from '../../lib/agencyFinancials';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const createMultipleTransactions = (..._args: any[]): any => { /* stub - prototype function removed */ };
const calculatePropertyFinancials = (..._args: any[]): any => { /* stub - prototype function removed */ };
const generatePropertyProfitLoss = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface SaleProfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyAddress: string;
  acquisitionDate: string;
  sellCycleId?: string;
  dealId?: string;
  userId: string;
  userName: string;
  onSuccess?: () => void;
  // Phase 5: Auto-population support
  initialSalePrice?: number;
  initialCommission?: number;
  allowSkip?: boolean;
  onSkip?: () => void;
}

interface SaleFormData {
  salePrice: string;
  saleCommission: string;
  closingCosts: string;
  saleDate: string;
  notes: string;
}

const initialFormData: SaleFormData = {
  salePrice: '',
  saleCommission: '',
  closingCosts: '',
  saleDate: new Date().toISOString().split('T')[0],
  notes: '',
};

export function SaleProfitModal({
  isOpen,
  onClose,
  propertyId,
  propertyAddress,
  acquisitionDate,
  sellCycleId,
  dealId,
  userId,
  userName,
  onSuccess,
  // Phase 5: Auto-population support
  initialSalePrice,
  initialCommission,
  allowSkip,
  onSkip,
}: SaleProfitModalProps) {
  const [formData, setFormData] = useState<SaleFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialFormData,
        saleDate: new Date().toISOString().split('T')[0],
        salePrice: initialSalePrice ? initialSalePrice.toString() : '',
        saleCommission: initialCommission ? initialCommission.toString() : '',
      });
    }
  }, [isOpen, initialSalePrice, initialCommission]);

  const handleInputChange = (field: keyof SaleFormData, value: string) => {
    // For numeric fields, allow empty string or valid numbers only
    if (field === 'salePrice' || field === 'saleCommission' || field === 'closingCosts') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const parseAmount = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  // Calculate all financial metrics
  const calculations = useMemo(() => {
    // Get current financials (before sale)
    const currentFinancials = calculatePropertyFinancials(
      propertyId,
      propertyAddress,
      acquisitionDate
    );

    const salePrice = parseAmount(formData.salePrice);
    const saleCommission = parseAmount(formData.saleCommission);
    const closingCosts = parseAmount(formData.closingCosts);
    const saleExpenses = saleCommission + closingCosts;
    const netSaleProceeds = salePrice - saleExpenses;

    const capitalGain = netSaleProceeds - currentFinancials.totalAcquisitionCost;
    const totalProfit = capitalGain + currentFinancials.operatingProfit;

    // Calculate holding period
    const acquireDate = new Date(acquisitionDate);
    const sellDate = new Date(formData.saleDate);
    const holdingDays = Math.floor((sellDate.getTime() - acquireDate.getTime()) / (1000 * 60 * 60 * 24));
    const holdingYears = holdingDays / 365;

    // Calculate ROI
    const roi = currentFinancials.totalAcquisitionCost > 0
      ? (totalProfit / currentFinancials.totalAcquisitionCost) * 100
      : 0;
    const annualizedROI = holdingYears > 0 ? roi / holdingYears : roi;

    return {
      currentFinancials,
      salePrice,
      saleCommission,
      closingCosts,
      saleExpenses,
      netSaleProceeds,
      capitalGain,
      totalProfit,
      holdingDays,
      holdingYears,
      roi,
      annualizedROI,
    };
  }, [propertyId, propertyAddress, acquisitionDate, formData.salePrice, formData.saleCommission, formData.closingCosts, formData.saleDate]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.salePrice || parseAmount(formData.salePrice) <= 0) {
      toast.error('Please enter a valid sale price');
      return;
    }

    if (!formData.saleDate) {
      toast.error('Please select a sale date');
      return;
    }

    // Validate sale date is after acquisition date
    if (new Date(formData.saleDate) < new Date(acquisitionDate)) {
      toast.error('Sale date cannot be before acquisition date');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create sale transaction records
      const transactions = [];

      // Sale Price
      transactions.push({
        propertyId,
        propertyAddress,
        category: 'sale' as const,
        type: 'sale_price' as const,
        amount: parseAmount(formData.salePrice),
        date: formData.saleDate,
        description: 'Property sale price',
        notes: formData.notes || undefined,
        sellCycleId,
        dealId,
        recordedBy: userId,
        recordedByName: userName,
      });

      // Sale Commission
      if (parseAmount(formData.saleCommission) > 0) {
        transactions.push({
          propertyId,
          propertyAddress,
          category: 'sale' as const,
          type: 'sale_commission' as const,
          amount: parseAmount(formData.saleCommission),
          date: formData.saleDate,
          description: 'Sale commission',
          sellCycleId,
          dealId,
          recordedBy: userId,
          recordedByName: userName,
        });
      }

      // Closing Costs
      if (parseAmount(formData.closingCosts) > 0) {
        transactions.push({
          propertyId,
          propertyAddress,
          category: 'sale' as const,
          type: 'closing_costs' as const,
          amount: parseAmount(formData.closingCosts),
          date: formData.saleDate,
          description: 'Closing costs',
          sellCycleId,
          dealId,
          recordedBy: userId,
          recordedByName: userName,
        });
      }

      // Save all transactions
      createMultipleTransactions(transactions);

      // Generate P&L statement
      const pnl = generatePropertyProfitLoss(
        propertyId,
        propertyAddress,
        acquisitionDate,
        formData.saleDate,
        userId
      );

      // Success message with profit details
      const profitMessage = calculations.totalProfit >= 0
        ? `Profit: ${formatPKR(calculations.totalProfit)}`
        : `Loss: ${formatPKR(Math.abs(calculations.totalProfit))}`;

      toast.success('Property sale recorded successfully', {
        description: `${profitMessage} | ROI: ${calculations.roi.toFixed(2)}%`,
        duration: 5000,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error('Failed to record sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { currentFinancials, netSaleProceeds, capitalGain, totalProfit, holdingDays, roi, annualizedROI } = calculations;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-5 text-primary" />
            Record Sale & Calculate Profit
          </DialogTitle>
          <DialogDescription>
            Record the sale of {propertyAddress} and view complete profitability analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sale Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Sale Details</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Sale Price */}
              <div className="space-y-2">
                <Label htmlFor="salePrice">
                  Sale Price <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="salePrice"
                  type="text"
                  placeholder="0"
                  value={formData.salePrice}
                  onChange={(e) => handleInputChange('salePrice', e.target.value)}
                  className="text-right"
                />
                {formData.salePrice && parseAmount(formData.salePrice) > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    {formatPKR(parseAmount(formData.salePrice))}
                  </p>
                )}
              </div>

              {/* Sale Date */}
              <div className="space-y-2">
                <Label htmlFor="saleDate">
                  Sale Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => handleInputChange('saleDate', e.target.value)}
                  min={acquisitionDate}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Sale Commission */}
              <div className="space-y-2">
                <Label htmlFor="saleCommission">Sale Commission</Label>
                <Input
                  id="saleCommission"
                  type="text"
                  placeholder="0"
                  value={formData.saleCommission}
                  onChange={(e) => handleInputChange('saleCommission', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Closing Costs */}
              <div className="space-y-2">
                <Label htmlFor="closingCosts">Closing Costs</Label>
                <Input
                  id="closingCosts"
                  type="text"
                  placeholder="0"
                  value={formData.closingCosts}
                  onChange={(e) => handleInputChange('closingCosts', e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the sale..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Profitability Analysis */}
          {formData.salePrice && parseAmount(formData.salePrice) > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="size-4" />
                Profitability Analysis
              </h3>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* Total Acquisition */}
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total Acquisition</p>
                  <p className="font-semibold">{formatPKR(currentFinancials.totalAcquisitionCost)}</p>
                </div>

                {/* Operating Profit */}
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Operating Profit</p>
                  <p className={`font-semibold ${currentFinancials.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPKR(currentFinancials.operatingProfit)}
                  </p>
                </div>

                {/* Net Sale Proceeds */}
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Net Sale Proceeds</p>
                  <p className="font-semibold">{formatPKR(netSaleProceeds)}</p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="rounded-lg border divide-y">
                {/* Operations */}
                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium">Operations (During Ownership)</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Income:</span>
                      <span className="text-green-600">{formatPKR(currentFinancials.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Expenses:</span>
                      <span className="text-red-600">-{formatPKR(currentFinancials.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Net Operations:</span>
                      <span className={currentFinancials.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPKR(currentFinancials.operatingProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sale */}
                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium">Sale Transaction</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sale Price:</span>
                      <span className="text-green-600">{formatPKR(parseAmount(formData.salePrice))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sale Expenses:</span>
                      <span className="text-red-600">
                        -{formatPKR(parseAmount(formData.saleCommission) + parseAmount(formData.closingCosts))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Less: Acquisition Cost:</span>
                      <span className="text-red-600">-{formatPKR(currentFinancials.totalAcquisitionCost)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Capital Gain:</span>
                      <span className={capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPKR(capitalGain)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Profit */}
                <div className={`p-4 ${totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {totalProfit >= 0 ? (
                        <TrendingUp className="size-5 text-green-600" />
                      ) : (
                        <TrendingDown className="size-5 text-red-600" />
                      )}
                      <span className="font-semibold">TOTAL {totalProfit >= 0 ? 'PROFIT' : 'LOSS'}</span>
                    </div>
                    <span className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPKR(Math.abs(totalProfit))}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-current/20">
                    <div>
                      <p className="text-xs text-muted-foreground">ROI</p>
                      <p className={`font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roi.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Annualized ROI</p>
                      <p className={`font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {annualizedROI.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Holding Period</p>
                      <p className="font-semibold">
                        {holdingDays} days ({(holdingDays / 30).toFixed(1)} mo)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Breakdown */}
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-2">Profit Breakdown</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">From Capital Gain:</span>
                    <span className={`font-medium ${capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPKR(capitalGain)} ({((capitalGain / (totalProfit || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">From Operations:</span>
                    <span className={`font-medium ${currentFinancials.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPKR(currentFinancials.operatingProfit)} ({((currentFinancials.operatingProfit / (totalProfit || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning if no sale price */}
          {!formData.salePrice && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="size-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800">
                Enter the sale price to view complete profitability analysis
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {allowSkip && (
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              disabled={isSubmitting}
            >
              Skip
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.salePrice || parseAmount(formData.salePrice) <= 0}
          >
            {isSubmitting ? 'Recording...' : 'Record Sale & Complete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}