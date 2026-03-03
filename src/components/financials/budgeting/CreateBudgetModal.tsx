import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { formatPKR } from '../../../lib/currency';
import { BudgetCategory } from './BudgetCategoryCard';

interface CreateBudgetModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (budget: Omit<BudgetCategory, 'id' | 'actualSpend' | 'variance' | 'variancePercentage' | 'status'>) => void;
  mode: 'add';
}

const BUDGET_CATEGORIES = [
  'Marketing & Advertising',
  'Salaries & Wages',
  'Office Rent',
  'Utilities',
  'Technology & Software',
  'Travel & Entertainment',
  'Professional Services',
  'Maintenance & Repairs',
  'Insurance',
  'Other Operating Expenses',
];

/**
 * CreateBudgetModal Component
 * 
 * Modal for creating new budget categories.
 * 
 * Design System Compliant:
 * - Uses Shadcn Dialog, Input, Select components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Jakob's Law: Standard budget creation form
 * - Hick's Law: Clear grouped fields
 * - Fitts's Law: Large input fields
 * 
 * Features:
 * - Category selection (predefined list)
 * - Budget amount input
 * - Period selection (monthly, quarterly, yearly)
 * - Real-time PKR formatting
 * - Validation
 * 
 * @example
 * <CreateBudgetModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   mode="add"
 *   onSave={handleSaveBudget}
 * />
 */
export const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({
  open,
  onClose,
  onSave,
  mode,
}) => {
  const [name, setName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [period, setPeriod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open && mode === 'add') {
      setName('');
      setBudgetAmount('');
      setPeriod('');
    }
  }, [open, mode]);

  const handleSubmit = async () => {
    // Validation
    if (!name || !budgetAmount || !period) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const budgetData: Omit<BudgetCategory, 'id' | 'actualSpend' | 'variance' | 'variancePercentage' | 'status'> = {
        name,
        budgetAmount: amount,
        period,
      };

      await onSave(budgetData);
      onClose();
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Failed to save budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Budget</DialogTitle>
          <DialogDescription>
            Set up a new budget category to track your spending against targets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <div>
            <Label htmlFor="name">Budget Category *</Label>
            <Select value={name} onValueChange={setName}>
              <SelectTrigger id="name">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Amount */}
          <div>
            <Label htmlFor="budgetAmount">Budget Amount (PKR) *</Label>
            <Input
              id="budgetAmount"
              type="number"
              step="1000"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="e.g., 500000"
              required
            />
            {budgetAmount && !isNaN(parseFloat(budgetAmount)) && (
              <p className="text-gray-600 text-sm mt-1">
                {formatPKR(parseFloat(budgetAmount))}
              </p>
            )}
          </div>

          {/* Period Selection */}
          <div>
            <Label htmlFor="period">Budget Period *</Label>
            <Select value={period} onValueChange={(val) => setPeriod(val)}>
              <SelectTrigger id="period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={`Jan ${new Date().getFullYear()}`}>January {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Feb ${new Date().getFullYear()}`}>February {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Mar ${new Date().getFullYear()}`}>March {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Apr ${new Date().getFullYear()}`}>April {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`May ${new Date().getFullYear()}`}>May {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Jun ${new Date().getFullYear()}`}>June {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Jul ${new Date().getFullYear()}`}>July {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Aug ${new Date().getFullYear()}`}>August {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Sep ${new Date().getFullYear()}`}>September {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Oct ${new Date().getFullYear()}`}>October {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Nov ${new Date().getFullYear()}`}>November {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Dec ${new Date().getFullYear()}`}>December {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Q1 ${new Date().getFullYear()}`}>Q1 {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Q2 ${new Date().getFullYear()}`}>Q2 {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Q3 ${new Date().getFullYear()}`}>Q3 {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`Q4 ${new Date().getFullYear()}`}>Q4 {new Date().getFullYear()}</SelectItem>
                <SelectItem value={`FY ${new Date().getFullYear()}`}>FY {new Date().getFullYear()}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Amount Presets */}
          <div>
            <Label>Quick Amount Presets</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBudgetAmount('250000')}
                type="button"
              >
                250K
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBudgetAmount('500000')}
                type="button"
              >
                500K
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBudgetAmount('1000000')}
                type="button"
              >
                1M
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBudgetAmount('2500000')}
                type="button"
              >
                2.5M
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBudgetAmount('5000000')}
                type="button"
              >
                5M
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Budget'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
