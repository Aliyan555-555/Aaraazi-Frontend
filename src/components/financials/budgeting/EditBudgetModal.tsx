/**
 * EditBudgetModal Component
 * 
 * Modal for editing existing budget entries.
 * 
 * Features:
 * - Pre-filled form with current values
 * - All fields editable
 * - Change tracking and summary
 * - Validation
 * - Version creation on save
 * 
 * Design System Compliant
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../../types';
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
  Edit2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPKR } from '../../../lib/currency';
import {
  saveBudgetVersion,
  compareSnapshots,
  createSnapshotFromBudget,
  BudgetSnapshot,
  BudgetChange,
} from '../../../lib/budget-versioning';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: string;
  spent?: number;
  notes?: string;
  isActive?: boolean;
  createdAt: string;
  createdBy: string;
}

interface EditBudgetModalProps {
  open: boolean;
  onClose: () => void;
  budget: Budget;
  user: User;
  onSave: (budgetId: string, updates: Partial<Budget>) => void;
}

const EXPENSE_CATEGORIES = [
  'Marketing & Advertising',
  'Salaries & Wages',
  'Office Rent',
  'Utilities',
  'Technology & Software',
  'Professional Services',
  'Travel & Transportation',
  'Office Supplies',
  'Insurance',
  'Maintenance & Repairs',
  'Training & Development',
  'Entertainment & Events',
  'Other',
];

const PERIODS = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Yearly', label: 'Yearly' },
];

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  open,
  onClose,
  budget,
  user,
  onSave,
}) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when budget changes
  useEffect(() => {
    if (open && budget) {
      setCategory(budget.category);
      setAmount(budget.amount.toString());

      // Normalize period to capitalized format
      const normalizedPeriod = budget.period.charAt(0).toUpperCase() + budget.period.slice(1).toLowerCase();
      setPeriod(normalizedPeriod as 'Monthly' | 'Quarterly' | 'Yearly');

      setNotes(budget.notes || '');
      setIsActive(budget.isActive ?? true);
    }
  }, [open, budget]);

  // Calculate changes - handles null budget
  const changes = useMemo(() => {
    if (!budget) return [];

    const oldSnapshot: BudgetSnapshot = {
      category: budget.category,
      amount: budget.amount,
      period: budget.period,
      notes: budget.notes,
      isActive: budget.isActive ?? true,
    };

    const newSnapshot: BudgetSnapshot = {
      category,
      amount: parseFloat(amount) || 0,
      period,
      notes,
      isActive,
    };

    return compareSnapshots(oldSnapshot, newSnapshot);
  }, [budget, category, amount, period, notes, isActive]);

  // Calculate amount difference
  const amountDiff = useMemo(() => {
    if (!budget) return 0;
    const newAmount = parseFloat(amount) || 0;
    return newAmount - budget.amount;
  }, [amount, budget]);

  // Validation
  const errors = useMemo(() => {
    const errs: string[] = [];

    if (!category) {
      errs.push('Category is required');
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      errs.push('Amount must be greater than 0');
    }

    if (!period) {
      errs.push('Period is required');
    }

    return errs;
  }, [category, amount, period]);

  const hasChanges = changes.length > 0;
  const isValid = errors.length === 0;

  // Handle save
  const handleSave = async () => {
    if (!isValid || !hasChanges) return;

    setIsSaving(true);

    try {
      const updates: Partial<Budget> = {
        category,
        amount: parseFloat(amount),
        period,
        notes,
        isActive,
      };

      // Save version
      const newSnapshot: BudgetSnapshot = {
        category,
        amount: parseFloat(amount),
        period,
        notes,
        isActive,
      };

      saveBudgetVersion(
        budget.id,
        user.id,
        user.name,
        'edited',
        changes,
        newSnapshot
      );

      // Save budget
      onSave(budget.id, updates);

      toast.success('Budget updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update budget:', error);
      toast.error('Failed to update budget');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-blue-600" />
            Edit Budget
          </DialogTitle>
          <DialogDescription>
            Modify budget details. All changes are tracked in version history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Change Summary */}
          {hasChanges && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm text-blue-900 mb-2">
                    {changes.length} change{changes.length !== 1 ? 's' : ''} detected
                  </h3>
                  <div className="space-y-1">
                    {changes.map((change, idx) => (
                      <div key={idx} className="text-sm text-blue-800">
                        <span className="font-medium">{change.fieldLabel}:</span>{' '}
                        {change.field === 'amount' ? (
                          <>
                            {formatPKR(Number(change.oldValue))} → {formatPKR(Number(change.newValue))}
                            <span className="ml-2">
                              {amountDiff > 0 ? (
                                <Badge variant="success" className="text-xs">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  +{formatPKR(amountDiff)}
                                </Badge>
                              ) : amountDiff < 0 ? (
                                <Badge variant="destructive" className="text-xs">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  {formatPKR(amountDiff)}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  <Minus className="h-3 w-3 mr-1" />
                                  No change
                                </Badge>
                              )}
                            </span>
                          </>
                        ) : (
                          <>
                            {String(change.oldValue)} → {String(change.newValue)}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="col-span-2 space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Budget Amount (PKR) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="1000"
              />
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label>Period *</Label>
              <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period..." />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="col-span-2 space-y-2">
              <Label>Status</Label>
              <Select
                value={isActive ? 'active' : 'inactive'}
                onValueChange={(val) => setIsActive(val === 'active')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Current vs New Comparison */}
          {budget && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600 mb-2">Current Budget</div>
                <div className="text-gray-900">
                  {formatPKR(budget.amount)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {budget.period}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">New Budget</div>
                <div className="text-gray-900">
                  {formatPKR(parseFloat(amount) || 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {period}
                </div>
              </div>
            </div>
          )}

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

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-300">
          <div className="text-sm text-gray-600">
            {hasChanges ? (
              <span className="text-blue-600">Unsaved changes</span>
            ) : (
              <span>No changes made</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || !hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
