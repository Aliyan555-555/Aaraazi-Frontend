/**
 * Record Transaction Modal
 * Records income or expense during property ownership
 * Design System Compliant
 */

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, FileText, Receipt } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { createTransaction } from '../../lib/agencyTransactions';
import { AgencyTransactionType, AgencyTransactionCategory } from '../../types';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';

interface RecordTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyAddress: string;
  userId: string;
  userName: string;
  defaultCategory?: 'income' | 'expense';
  onSuccess?: () => void;
}

interface TransactionFormData {
  category: 'income' | 'expense';
  type: AgencyTransactionType | '';
  amount: string;
  date: string;
  description: string;
  notes: string;
  receiptNumber: string;
  paymentMethod: 'cash' | 'bank-transfer' | 'cheque' | 'online' | '';
}

// Transaction type options
const INCOME_TYPES: { value: AgencyTransactionType; label: string }[] = [
  { value: 'rental_income', label: 'Rental Income' },
  { value: 'parking_fee', label: 'Parking Fee' },
  { value: 'late_fee', label: 'Late Fee' },
  { value: 'other_income', label: 'Other Income' },
];

const EXPENSE_TYPES: { value: AgencyTransactionType; label: string }[] = [
  { value: 'property_tax', label: 'Property Tax' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'management_fee', label: 'Management Fee' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'legal_expense', label: 'Legal Expense' },
  { value: 'other_expense', label: 'Other Expense' },
];

export function RecordTransactionModal({
  isOpen,
  onClose,
  propertyId,
  propertyAddress,
  userId,
  userName,
  defaultCategory = 'income',
  onSuccess,
}: RecordTransactionModalProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    category: defaultCategory,
    type: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
    receiptNumber: '',
    paymentMethod: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or category changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        category: defaultCategory,
        type: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        receiptNumber: '',
        paymentMethod: '',
      });
    }
  }, [isOpen, defaultCategory]);

  // Reset type when category changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, type: '' }));
  }, [formData.category]);

  const handleInputChange = (field: keyof TransactionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const parseAmount = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const handleAmountChange = (value: string) => {
    // Allow empty string or valid numbers only
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleInputChange('amount', value);
    }
  };

  const getTransactionTypes = () => {
    return formData.category === 'income' ? INCOME_TYPES : EXPENSE_TYPES;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.type) {
      toast.error('Please select a transaction type');
      return;
    }

    if (!formData.amount || parseAmount(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsSubmitting(true);

    try {
      createTransaction({
        propertyId,
        propertyAddress,
        category: formData.category,
        type: formData.type as AgencyTransactionType,
        amount: parseAmount(formData.amount),
        date: formData.date,
        description: formData.description.trim(),
        notes: formData.notes.trim() || undefined,
        receiptNumber: formData.receiptNumber.trim() || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        recordedBy: userId,
        recordedByName: userName,
      });

      const typeLabel = getTransactionTypes().find(t => t.value === formData.type)?.label;
      toast.success(
        `${formData.category === 'income' ? 'Income' : 'Expense'} recorded successfully`,
        {
          description: `${typeLabel}: ${formatPKR(parseAmount(formData.amount))}`,
        }
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast.error('Failed to record transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryColor = formData.category === 'income' ? 'text-green-600' : 'text-red-600';
  const CategoryIcon = formData.category === 'income' ? TrendingUp : TrendingDown;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CategoryIcon className={`size-5 ${categoryColor}`} />
            Record {formData.category === 'income' ? 'Income' : 'Expense'}
          </DialogTitle>
          <DialogDescription>
            Record {formData.category === 'income' ? 'income received from' : 'expense paid for'} {propertyAddress}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Selector */}
          <div className="space-y-2">
            <Label>Transaction Category</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={formData.category === 'income' ? 'default' : 'outline'}
                onClick={() => handleInputChange('category', 'income')}
                className="justify-start gap-2"
              >
                <TrendingUp className="size-4" />
                Income
              </Button>
              <Button
                type="button"
                variant={formData.category === 'expense' ? 'default' : 'outline'}
                onClick={() => handleInputChange('category', 'expense')}
                className="justify-start gap-2"
              >
                <TrendingDown className="size-4" />
                Expense
              </Button>
            </div>
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder={`Select ${formData.category} type`} />
              </SelectTrigger>
              <SelectContent>
                {getTransactionTypes().map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (PKR) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="text"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="text-right"
            />
            {formData.amount && parseAmount(formData.amount) > 0 && (
              <p className={`text-sm font-medium ${categoryColor}`}>
                {formatPKR(parseAmount(formData.amount))}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-1">
              <Calendar className="size-4" />
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              type="text"
              placeholder={`Brief description of the ${formData.category}`}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => handleInputChange('paymentMethod', value)}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label htmlFor="receiptNumber" className="flex items-center gap-1">
              <Receipt className="size-4" />
              Receipt/Reference Number
            </Label>
            <Input
              id="receiptNumber"
              type="text"
              placeholder="Optional receipt or reference number"
              value={formData.receiptNumber}
              onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-1">
              <FileText className="size-4" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or details..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary */}
          {formData.amount && formData.type && parseAmount(formData.amount) > 0 && (
            <div className={`rounded-lg border p-3 ${formData.category === 'income'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {getTransactionTypes().find(t => t.value === formData.type)?.label}
                </span>
                <span className={`font-semibold ${categoryColor}`}>
                  {formData.category === 'expense' && '-'}
                  {formatPKR(parseAmount(formData.amount))}
                </span>
              </div>
              {formData.date && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(formData.date).toLocaleDateString('en-PK', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
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
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !formData.type ||
              !formData.amount ||
              parseAmount(formData.amount) <= 0 ||
              !formData.date ||
              !formData.description.trim()
            }
          >
            {isSubmitting ? 'Recording...' : `Record ${formData.category === 'income' ? 'Income' : 'Expense'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
