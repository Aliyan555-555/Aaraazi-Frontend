/**
 * Sale Distribution Modal
 * UI for executing profit distribution when investor-owned property is sold
 */

import React, { useState, useMemo } from 'react';
import { useConfirmStore } from '@/store/useConfirmStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Property, User } from '../../types';
// [STUBBED] import { calculateSaleDistribution, executeSaleDistribution } from '../../lib/saleDistribution';
import { formatPKR } from '../../lib/currency';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Award,
  Percent,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const calculateSaleDistribution = (..._args: any[]): any => { /* stub - prototype function removed */ };
const executeSaleDistribution = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface SaleDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  property: Property;
  user: User;
  dealId?: string;
  defaultSalePrice?: number;
}

export function SaleDistributionModal({
  isOpen,
  onClose,
  onSuccess,
  property,
  user,
  dealId,
  defaultSalePrice,
}: SaleDistributionModalProps) {
  const [salePrice, setSalePrice] = useState(defaultSalePrice?.toString() || '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);

  // Calculate distribution preview
  const calculation = useMemo(() => {
    if (!salePrice || parseFloat(salePrice) <= 0) return null;

    try {
      return calculateSaleDistribution(
        property.id,
        parseFloat(salePrice),
        saleDate,
        dealId
      );
    } catch (error) {
      console.error('Error calculating distribution:', error);
      return null;
    }
  }, [salePrice, saleDate, property.id, dealId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!salePrice || parseFloat(salePrice) <= 0) {
      toast.error('Please enter a valid sale price');
      return;
    }

    if (!calculation) {
      toast.error('Unable to calculate distribution');
      return;
    }

    // Confirmation
    useConfirmStore.getState().ask({
      title: 'Execute Sale Distribution',
      description: `Are you sure you want to execute this distribution?\n\n` +
        `This will:\n` +
        `- Distribute ${formatPKR(calculation.netProfit)} in profits\n` +
        `- Mark ${calculation.investorDistributions.length} investments as "exited"\n` +
        `- Create distribution records for payment processing\n\n` +
        `This action cannot be easily undone.`,
      confirmText: 'Execute Distribution',
      onConfirm: async () => {
        setIsSubmitting(true);

        try {
          // Execute distribution
          const distributions = executeSaleDistribution(
            property.id,
            parseFloat(salePrice),
            saleDate,
            user.id,
            user.name,
            dealId,
            notes || undefined
          );

          toast.success(
            `Distribution executed successfully! Created ${distributions.length} distribution records.`
          );

          onSuccess();
          handleClose();
        } catch (error: any) {
          console.error('Error executing distribution:', error);
          toast.error(error.message || 'Failed to execute distribution');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };



  const handleClose = () => {
    setSalePrice(defaultSalePrice?.toString() || '');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowCalculation(false);
    onClose();
  };

  // Check if property is investor-owned
  if (!property.investorShares || property.investorShares.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Execute Distribution</DialogTitle>
            <DialogDescription>
              This property is not investor-owned. Distribution is only available for properties owned by investors.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Execute Sale Distribution
          </DialogTitle>
          <DialogDescription>
            Calculate and distribute profits to all investors from this property sale
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sale Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sale Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sale Price */}
                <div className="space-y-2">
                  <Label htmlFor="salePrice">
                    Sale Price (PKR) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={salePrice}
                      onChange={(e) => {
                        setSalePrice(e.target.value);
                        setShowCalculation(false);
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Sale Date */}
                <div className="space-y-2">
                  <Label htmlFor="saleDate">
                    Sale Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="saleDate"
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Distribution Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any notes about this distribution..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Calculate Button */}
              {!showCalculation && salePrice && parseFloat(salePrice) > 0 && (
                <Button
                  type="button"
                  onClick={() => setShowCalculation(true)}
                  className="w-full"
                  variant="outline"
                >
                  Calculate Distribution Preview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Calculation Preview */}
          {showCalculation && calculation && (
            <>
              <Separator />

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Purchase Price</p>
                        <p className="text-xl font-bold text-blue-700">
                          {formatPKR(calculation.totalPurchasePrice)}
                        </p>
                      </div>
                      <TrendingDown className="w-6 h-6 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Sale Price</p>
                        <p className="text-xl font-bold text-green-700">
                          {formatPKR(calculation.totalSalePrice)}
                        </p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className={calculation.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Net Profit</p>
                        <p className={`text-xl font-bold ${calculation.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {formatPKR(calculation.netProfit)}
                        </p>
                      </div>
                      <Award className={`w-6 h-6 ${calculation.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profit Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profit Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">Capital Gain (Sale - Purchase)</span>
                    <span className={`font-medium ${calculation.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPKR(calculation.capitalGain)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">Total Rental Income</span>
                    <span className="font-medium text-green-600">+{formatPKR(calculation.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">Total Expenses</span>
                    <span className="font-medium text-red-600">-{formatPKR(calculation.totalExpenses)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
                    <span className="font-medium">Net Profit</span>
                    <span className={`font-bold ${calculation.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPKR(calculation.netProfit)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Investor Distributions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Investor Distributions ({calculation.investorDistributions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {calculation.investorDistributions.map((dist, index) => (
                    <Card key={index} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {/* Investor Header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{dist.investorName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  <Percent className="w-3 h-3 mr-1" />
                                  {dist.sharePercentage.toFixed(2)}%
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Investment: {formatPKR(dist.investmentAmount)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total Return</p>
                              <p className="text-xl font-bold text-green-600">
                                {formatPKR(dist.totalReturn)}
                              </p>
                            </div>
                          </div>

                          {/* Distribution Details */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between p-2 bg-background rounded">
                              <span className="text-muted-foreground">Capital Gain:</span>
                              <span className={dist.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatPKR(dist.capitalGain)}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-background rounded">
                              <span className="text-muted-foreground">Rental Income:</span>
                              <span className="text-green-600">+{formatPKR(dist.rentalIncome)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-background rounded">
                              <span className="text-muted-foreground">Expenses:</span>
                              <span className="text-red-600">-{formatPKR(dist.expenses)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-background rounded">
                              <span className="text-muted-foreground">Net Profit:</span>
                              <span className={`font-medium ${dist.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPKR(dist.totalProfit)}
                              </span>
                            </div>
                          </div>

                          {/* ROI */}
                          <div className="flex items-center justify-between p-2 bg-primary/5 rounded">
                            <span className="text-sm font-medium">ROI</span>
                            <Badge variant={dist.roi >= 0 ? 'default' : 'destructive'} className="text-sm">
                              {dist.roi >= 0 ? '+' : ''}{dist.roi.toFixed(2)}%
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Warning */}
              {calculation.netProfit < 0 && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Net Loss Detected</p>
                        <p className="text-sm text-orange-800 mt-1">
                          This property sale will result in a net loss of {formatPKR(Math.abs(calculation.netProfit))}.
                          Investors will receive less than their initial investment.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !showCalculation || !calculation}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Executing...' : 'Execute Distribution'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
