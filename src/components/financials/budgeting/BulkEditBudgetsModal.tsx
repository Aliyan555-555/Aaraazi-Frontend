/**
 * BulkEditBudgetsModal Component
 * 
 * Edit multiple budgets simultaneously.
 * 
 * Features:
 * - Apply percentage increase/decrease to all
 * - Change period for all
 * - Change status (active/inactive)
 * - Add notes to all
 * - Preview changes before applying
 * 
 * Design System Compliant
 */

import React, { useState, useMemo } from 'react';
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
import { Checkbox } from '../../ui/checkbox';
import {
  Edit3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPKR } from '../../../lib/currency';
import {
  saveBudgetVersion,
  createSnapshotFromBudget,
  compareSnapshots,
} from '../../../lib/budget-versioning';

interface BulkEditBudgetsModalProps {
  open: boolean;
  onClose: () => void;
  selectedBudgets: Budget[];
  user: User;
  onSave: (updates: Array<{ budgetId: string; changes: Partial<Budget> }>) => void;
}

const PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const BulkEditBudgetsModal: React.FC<BulkEditBudgetsModalProps> = ({
  open,
  onClose,
  selectedBudgets,
  user,
  onSave,
}) => {
  const [adjustPercentage, setAdjustPercentage] = useState('');
  const [changePeriod, setChangePeriod] = useState(false);
  const [newPeriod, setNewPeriod] = useState('monthly');
  const [changeStatus, setChangeStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(true);
  const [addNotes, setAddNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate previews
  const previews = useMemo(() => {
    return selectedBudgets.map(budget => {
      const percentage = parseFloat(adjustPercentage) || 0;
      const newAmount = percentage !== 0
        ? Math.round(budget.amount * (1 + percentage / 100))
        : budget.amount;

      return {
        budget,
        newAmount,
        amountDiff: newAmount - budget.amount,
        newPeriod: changePeriod ? newPeriod : budget.period,
        newStatus: changeStatus ? newStatus : (budget.isActive ?? true),
        willAddNotes: addNotes,
      };
    });
  }, [selectedBudgets, adjustPercentage, changePeriod, newPeriod, changeStatus, newStatus, addNotes]);

  // Calculate totals
  const totals = useMemo(() => {
    const currentTotal = selectedBudgets.reduce((sum, b) => sum + b.amount, 0);
    const newTotal = previews.reduce((sum, p) => sum + p.newAmount, 0);
    const difference = newTotal - currentTotal;

    return {
      currentTotal,
      newTotal,
      difference,
      percentChange: currentTotal > 0 ? (difference / currentTotal) * 100 : 0,
    };
  }, [selectedBudgets, previews]);

  // Check if any changes are selected
  const hasChanges = useMemo(() => {
    return (adjustPercentage && parseFloat(adjustPercentage) !== 0) ||
      changePeriod ||
      changeStatus ||
      addNotes;
  }, [adjustPercentage, changePeriod, changeStatus, addNotes]);

  // Handle save
  const handleSave = async () => {
    if (!hasChanges) {
      toast.error('No changes to apply');
      return;
    }

    setIsSaving(true);

    try {
      const updates = previews.map(preview => {
        const changes: Partial<Budget> = {};

        // Amount adjustment
        if (adjustPercentage && parseFloat(adjustPercentage) !== 0) {
          changes.amount = preview.newAmount;
        }

        // Period change
        if (changePeriod) {
          changes.period = newPeriod;
        }

        // Status change
        if (changeStatus) {
          changes.isActive = newStatus;
        }

        // Notes
        if (addNotes && notes) {
          changes.notes = notes;
        }

        // Save version
        const oldSnapshot = createSnapshotFromBudget(preview.budget);
        const newSnapshot = createSnapshotFromBudget({
          ...preview.budget,
          ...changes,
        });

        const changesList = compareSnapshots(oldSnapshot, newSnapshot);

        if (changesList.length > 0) {
          saveBudgetVersion(
            preview.budget.id,
            user.id,
            user.name,
            'bulk_edited',
            changesList,
            newSnapshot
          );
        }

        return {
          budgetId: preview.budget.id,
          changes,
        };
      });

      onSave(updates);
      toast.success(`Successfully updated ${selectedBudgets.length} budget${selectedBudgets.length !== 1 ? 's' : ''}`);
      onClose();
    } catch (error) {
      console.error('Failed to bulk edit budgets:', error);
      toast.error('Failed to update budgets');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setAdjustPercentage('');
      setChangePeriod(false);
      setNewPeriod('monthly');
      setChangeStatus(false);
      setNewStatus(true);
      setAddNotes(false);
      setNotes('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-purple-600" />
            Bulk Edit Budgets
          </DialogTitle>
          <DialogDescription>
            Apply changes to {selectedBudgets.length} selected budget{selectedBudgets.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-purple-900">Selected Budgets</div>
                <div className="text-2xl text-purple-900 mt-1">
                  {selectedBudgets.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-purple-900">Current Total</div>
                <div className="text-2xl text-purple-900 mt-1">
                  {formatPKR(totals.currentTotal)}
                </div>
              </div>
              <div>
                <div className="text-sm text-purple-900">New Total</div>
                <div className="text-2xl text-purple-900 mt-1">
                  {formatPKR(totals.newTotal)}
                </div>
              </div>
            </div>

            {totals.difference !== 0 && (
              <div className="mt-3 pt-3 border-t border-purple-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">Total Difference:</span>
                  <div className="flex items-center gap-2">
                    {totals.difference > 0 ? (
                      <Badge variant="success">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{formatPKR(totals.difference)}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {formatPKR(totals.difference)}
                      </Badge>
                    )}
                    <span className="text-sm text-purple-700">
                      ({totals.percentChange > 0 ? '+' : ''}{totals.percentChange.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          <div className="space-y-4">
            <h3 className="text-gray-900">Bulk Actions</h3>

            {/* Adjust Amounts */}
            <div className="p-4 border border-gray-300 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label>Adjust Budget Amounts</Label>
                <Badge variant="secondary">Optional</Badge>
              </div>

              <div className="space-y-2">
                <Label>Percentage Adjustment (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={adjustPercentage}
                    onChange={(e) => setAdjustPercentage(e.target.value)}
                    step="1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Use positive values to increase (e.g., 10 for +10%), negative to decrease (e.g., -5 for -5%)
                </p>
              </div>
            </div>

            {/* Change Period */}
            <div className="p-4 border border-gray-300 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={changePeriod}
                  onCheckedChange={(checked) => setChangePeriod(!!checked)}
                />
                <Label>Change Period for All</Label>
              </div>

              {changePeriod && (
                <Select value={newPeriod} onValueChange={setNewPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Change Status */}
            <div className="p-4 border border-gray-300 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={changeStatus}
                  onCheckedChange={(checked) => setChangeStatus(!!checked)}
                />
                <Label>Change Status for All</Label>
              </div>

              {changeStatus && (
                <Select
                  value={newStatus ? 'active' : 'inactive'}
                  onValueChange={(val) => setNewStatus(val === 'active')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Add Notes */}
            <div className="p-4 border border-gray-300 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={addNotes}
                  onCheckedChange={(checked) => setAddNotes(!!checked)}
                />
                <Label>Add/Update Notes for All</Label>
              </div>

              {addNotes && (
                <Textarea
                  placeholder="Enter notes to add to all selected budgets..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <h3 className="text-gray-900">Preview Changes</h3>

            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-900">Category</th>
                      <th className="px-4 py-2 text-right text-xs text-gray-900">Current</th>
                      <th className="px-4 py-2 text-right text-xs text-gray-900">New</th>
                      <th className="px-4 py-2 text-right text-xs text-gray-900">Change</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-900">Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previews.map((preview, idx) => (
                      <tr key={preview.budget.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {preview.budget.category}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">
                          {formatPKR(preview.budget.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatPKR(preview.newAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {preview.amountDiff !== 0 ? (
                            <Badge variant={preview.amountDiff > 0 ? 'success' : 'destructive'}>
                              {preview.amountDiff > 0 ? '+' : ''}
                              {formatPKR(preview.amountDiff)}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                          {preview.newPeriod}
                          {changePeriod && preview.budget.period !== preview.newPeriod && (
                            <Badge variant="info" className="ml-2">Changed</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Warning if no changes */}
          {!hasChanges && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900">
                  No changes selected. Please select at least one action to apply.
                </div>
              </div>
            </div>
          )}

          {/* Success message if has changes */}
          {hasChanges && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  Ready to apply changes to {selectedBudgets.length} budget{selectedBudgets.length !== 1 ? 's' : ''}.
                  All changes will be tracked in version history.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-300">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {isSaving ? 'Applying...' : `Apply to ${selectedBudgets.length} Budget${selectedBudgets.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
