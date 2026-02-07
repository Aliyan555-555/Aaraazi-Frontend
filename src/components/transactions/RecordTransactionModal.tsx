/**
 * Record Transaction Modal
 * UI for recording income or expenses for investor-owned properties
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Property, User, InvestorTransactionType } from '../../types';
import { recordInvestorTransaction } from '../../lib/investorTransactions';
import { formatPKR } from '../../lib/currency';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText,
  CreditCard,
  Receipt,
  Users,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface RecordTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  property: Property;
  user: User;
}

const TRANSACTION_TYPES: { value: InvestorTransactionType; label: string; icon: any; color: string }[] = [
  { value: 'rental-income', label: 'Rental Income', icon: TrendingUp, color: 'text-green-600' },
  { value: 'expense-maintenance', label: 'Maintenance Expense', icon: TrendingDown, color: 'text-red-600' },
  { value: 'expense-tax', label: 'Tax Expense', icon: TrendingDown, color: 'text-red-600' },
  { value: 'expense-insurance', label: 'Insurance Expense', icon: TrendingDown, color: 'text-red-600' },
  { value: 'expense-utility', label: 'Utility Expense', icon: TrendingDown, color: 'text-red-600' },
  { value: 'expense-renovation', label: 'Renovation Expense', icon: TrendingDown, color: 'text-red-600' },
  { value: 'expense-legal', label: 'Legal Expense', icon: TrendingDown, color: 'text-red-600' },
  { value: 'expense-other', label: 'Other Expense', icon: TrendingDown, color: 'text-red-600' },
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Check', 'Online Payment', 'Credit Card', 'Other'];

export function RecordTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  property,
  user,
}: RecordTransactionModalProps) {
  const [formData, setFormData] = useState({
    transactionType: '' as InvestorTransactionType | '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    paymentMethod: '',
    reference: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isIncome = formData.transactionType === 'rental-income';
  const isExpense = formData.transactionType.startsWith('expense-');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.transactionType) {
      toast.error('Please select a transaction type');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsSubmitting(true);

    try {
      // Record transaction
      recordInvestorTransaction(
        property.id,
        formData.transactionType,
        parseFloat(formData.amount),
        formData.description,
        user.id,
        user.name,
        {
          date: formData.date,
          category: formData.category || undefined,
          paymentMethod: formData.paymentMethod || undefined,
          reference: formData.reference || undefined,
          notes: formData.notes || undefined,
        }
      );

      const typeLabel = TRANSACTION_TYPES.find(t => t.value === formData.transactionType)?.label || 'Transaction';
      toast.success(`${typeLabel} recorded successfully!`);
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error recording transaction:', error);
      toast.error(error.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      transactionType: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      paymentMethod: '',
      reference: '',
      notes: '',
    });
    onClose();
  };

  // Check if property is investor-owned
  if (!property.investorShares || property.investorShares.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Record Transaction</DialogTitle>
            <DialogDescription>
              This property is not investor-owned. Transactions can only be recorded for properties owned by investors.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Record Transaction
          </DialogTitle>
          <DialogDescription>
            Record income or expense for this investor-owned property. It will be automatically attributed to all investors.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Investor Info Alert */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    {property.investorShares.length} Investor{property.investorShares.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1">
                    {property.investorShares.map(share => (
                      <div key={share.investorId} className="flex items-center justify-between text-sm">
                        <span className="text-blue-800">{share.investorName}</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {share.sharePercentage.toFixed(2)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    This transaction will be split among investors according to their ownership percentages.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="transactionType">
              Transaction Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.transactionType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, transactionType: value as InvestorTransactionType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${type.color}`} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (PKR) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="pl-9"
              />
            </div>
            {formData.amount && parseFloat(formData.amount) > 0 && property.investorShares && (
              <div className="text-xs text-muted-foreground space-y-1 mt-2 p-2 bg-muted rounded">
                <p className="font-medium">Attribution:</p>
                {property.investorShares.map(share => {
                  const attributedAmount = (parseFloat(formData.amount) * share.sharePercentage) / 100;
                  return (
                    <div key={share.investorId} className="flex justify-between">
                      <span>{share.investorName}:</span>
                      <span className="font-medium">{formatPKR(attributedAmount)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter transaction description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              Date <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="category"
                  placeholder="e.g., Monthly Rent, Plumbing"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Reference / Receipt Number</Label>
            <div className="relative">
              <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="reference"
                placeholder="e.g., Invoice #12345, Check #67890"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
