/**
 * CloneBudgetModal Component
 * 
 * Clone an existing budget to a new period or category.
 * 
 * Features:
 * - Select source budget
 * - Choose new period
 * - Adjust amount (percentage or fixed)
 * - Preview new budget
 * - Create cloned budget
 * 
 * Design System V4.1 Compliant
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../../types';
import { Budget } from './EditBudgetModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Badge } from '../../ui/badge';
import {
  Copy,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPKR } from '../../../lib/currency';
// [STUBBED] import { createInitialVersion } from '../../../lib/budget-versioning';

// ===== STUBS for removed prototype functions =====
const createInitialVersion = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface CloneBudgetModalProps {
  open: boolean;
  onClose: () => void;
  sourceBudget: Budget;
  user: User;
  onCreate: (budget: Omit<Budget, 'id' | 'createdAt' | 'createdBy'>) => void;
}

const PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const ADJUSTMENT_TYPES = [
  { value: 'none', label: 'No Adjustment' },
  { value: 'percentage', label: 'Percentage Increase/Decrease' },
  { value: 'fixed', label: 'Fixed Amount Increase/Decrease' },
];

export const CloneBudgetModal: React.FC<CloneBudgetModalProps> = ({
  open,
  onClose,
  sourceBudget,
  user,
  onCreate,
}) => {
  const [period, setPeriod] = useState<string>('Monthly');
  const [adjustmentType, setAdjustmentType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [adjustmentValue, setAdjustmentValue] = useState('0');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open && sourceBudget) {
      setPeriod(sourceBudget.period);
      setAdjustmentType('none');
      setAdjustmentValue('0');
      setNotes(`Cloned from ${sourceBudget.category} budget`);
    }
  }, [open, sourceBudget]);

  // Calculate new amount
  const newAmount = useMemo(() => {
    if (!sourceBudget) return 0;
    const baseAmount = sourceBudget.amount;
    const adjustment = parseFloat(adjustmentValue) || 0;

    switch (adjustmentType) {
      case 'percentage':
        return baseAmount * (1 + adjustment / 100);
      case 'fixed':
        return baseAmount + adjustment;
      default:
        return baseAmount;
    }
  }, [sourceBudget, adjustmentType, adjustmentValue]);

  // Calculate difference
  const difference = useMemo(() => {
    if (!sourceBudget) return 0;
    return newAmount - sourceBudget.amount;
  }, [newAmount, sourceBudget]);

  const differencePercent = useMemo(() => {
    if (!sourceBudget || sourceBudget.amount === 0) return 0;
    return (difference / sourceBudget.amount) * 100;
  }, [difference, sourceBudget]);

  // Validation
  const errors = useMemo(() => {
    const errs: string[] = [];

    if (!period) {
      errs.push('Period is required');
    }

    if (newAmount <= 0) {
      errs.push('Budget amount must be greater than 0');
    }

    return errs;
  }, [period, newAmount]);

  const isValid = errors.length === 0;

  // Handle create
  const handleCreate = async () => {
    if (!isValid) return;

    setIsCreating(true);

    try {
      const newBudget: Omit<Budget, 'id' | 'createdAt' | 'createdBy'> = {
        category: sourceBudget.category,
        amount: Math.round(newAmount),
        period,
        spent: 0,
        notes,
        isActive: true,
      };

      onCreate(newBudget);

      toast.success('Budget cloned successfully');
      onClose();
    } catch (error) {
      console.error('Failed to clone budget:', error);
      toast.error('Failed to clone budget');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-blue-600" />
            Clone Budget
          </DialogTitle>
          <DialogDescription>
            {sourceBudget ? `Create a new budget based on "${sourceBudget.category}"` : 'Clone a budget'}
          </DialogDescription>
        </DialogHeader>

        {sourceBudget && (
          <div className="space-y-6 py-4">
            {/* Source Budget Summary */}
            <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-900">Source Budget</h3>
                <Badge variant="secondary">Original</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="text-gray-900 mt-1">{sourceBudget.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Amount</div>
                  <div className="text-gray-900 mt-1">{formatPKR(sourceBudget.amount)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Period</div>
                  <div className="text-gray-900 mt-1 capitalize">{sourceBudget.period}</div>
                </div>
              </div>
            </div>

            {/* Clone Configuration */}
            <div className="space-y-4">
              <h3 className="text-gray-900">Clone Configuration</h3>

              {/* Period */}
              <div className="space-y-2">
                <Label>New Period *</Label>
                <Select value={period} onValueChange={(val) => setPeriod(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Adjustment Type */}
              <div className="space-y-2">
                <Label>Amount Adjustment</Label>
                <Select
                  value={adjustmentType}
                  onValueChange={(val: any) => setAdjustmentType(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADJUSTMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Adjustment Value */}
              {adjustmentType !== 'none' && (
                <div className="space-y-2">
                  <Label>
                    {adjustmentType === 'percentage'
                      ? 'Percentage (%)'
                      : 'Amount (PKR)'}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={adjustmentValue}
                      onChange={(e) => setAdjustmentValue(e.target.value)}
                      step={adjustmentType === 'percentage' ? '1' : '1000'}
                    />
                    {adjustmentType === 'percentage' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Use positive values to increase, negative to decrease
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h3 className="text-blue-900">New Budget Preview</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-blue-800">Original Amount</div>
                  <div className="text-2xl text-blue-900 mt-1">
                    {formatPKR(sourceBudget.amount)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-blue-800">New Amount</div>
                  <div className="text-2xl text-blue-900 mt-1">
                    {formatPKR(Math.round(newAmount))}
                  </div>
                </div>
              </div>

              {adjustmentType !== 'none' && (
                <div className="mt-4 pt-4 border-t border-blue-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">Difference:</span>
                    <div className="flex items-center gap-2">
                      {difference > 0 ? (
                        <>
                          <Badge variant="success">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{formatPKR(Math.round(difference))}
                          </Badge>
                          <span className="text-sm text-green-700">
                            (+{differencePercent.toFixed(1)}%)
                          </span>
                        </>
                      ) : difference < 0 ? (
                        <>
                          <Badge variant="destructive">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {formatPKR(Math.round(difference))}
                          </Badge>
                          <span className="text-sm text-red-700">
                            ({differencePercent.toFixed(1)}%)
                          </span>
                        </>
                      ) : (
                        <Badge variant="secondary">No change</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-red-900">Please fix the following errors:</div>
                    <ul className="mt-1 text-sm text-red-800 list-disc list-inside">
                      {errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-300">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isValid || isCreating}
          >
            <Copy className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Clone'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
