import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ExpenseItem } from './ExpenseList';

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  expense?: ExpenseItem | null;
  onSave: (expense: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  properties?: { id: string; title: string }[];
  mode: 'add' | 'edit';
}

const EXPENSE_CATEGORIES = [
  'Utilities',
  'Maintenance',
  'Repairs',
  'Marketing',
  'Legal Fees',
  'Insurance',
  'Property Tax',
  'Management Fee',
  'Office Expenses',
  'Salaries',
  'Technology',
  'Other',
];

/**
 * ExpenseFormModal Component
 * 
 * Modal for adding or editing expense records.
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
 * - Add new expense
 * - Edit existing expense
 * - Property association (optional)
 * - Category selection
 * - Vendor tracking
 * - Receipt number
 * - Notes field
 * - Form validation
 * 
 * @example
 * <ExpenseFormModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   mode="add"
 *   onSave={handleSaveExpense}
 *   properties={properties}
 * />
 */
export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  open,
  onClose,
  expense,
  onSave,
  properties = [],
  mode,
}) => {
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [propertyId, setPropertyId] = useState<string>('');
  const [vendor, setVendor] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Approved' | 'Paid'>('Pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense && mode === 'edit') {
      setDate(expense.date);
      setCategory(expense.category);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setPropertyId(expense.propertyId || '');
      setVendor(expense.vendor || '');
      setReceiptNumber(expense.receiptNumber || '');
      setNotes(expense.notes || '');
      setStatus(expense.status);
    } else {
      // Reset form for add mode
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setCategory('');
      setDescription('');
      setAmount('');
      setPropertyId('');
      setVendor('');
      setReceiptNumber('');
      setNotes('');
      setStatus('Pending');
    }
  }, [expense, mode, open]);

  const handleSubmit = async () => {
    // Validation
    if (!date || !category || !description || !amount) {
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
      const expenseData: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'> = {
        date,
        category,
        description,
        amount: amountNum,
        status,
        propertyId: propertyId && propertyId !== 'none' ? propertyId : undefined,
        propertyTitle: propertyId && propertyId !== 'none' ? properties.find(p => p.id === propertyId)?.title : undefined,
        vendor: vendor || undefined,
        receiptNumber: receiptNumber || undefined,
        notes: notes || undefined,
      };

      await onSave(expenseData);
      onClose();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Expense' : 'Edit Expense'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Record a new expense for tracking and approval'
              : 'Update expense details'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Monthly electricity bill, Window repair"
              required
            />
          </div>

          {/* Amount and Status */}
          <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Property Association */}
          {properties.length > 0 && (
            <div>
              <Label htmlFor="property">Property (Optional)</Label>
              <Select value={propertyId || 'none'} onValueChange={(val) => setPropertyId(val === 'none' ? '' : val)}>
                <SelectTrigger id="property">
                  <SelectValue placeholder="Select property (if applicable)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Vendor and Receipt */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor">Vendor/Payee</Label>
              <Input
                id="vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g., ACME Services, K-Electric"
              />
            </div>

            <div>
              <Label htmlFor="receipt">Receipt Number</Label>
              <Input
                id="receipt"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g., INV-2024-001"
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
              placeholder="Additional notes or details..."
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
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Expense' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
