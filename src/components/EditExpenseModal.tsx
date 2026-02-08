import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Expense, Property } from '../types';
import { formatCurrencyShort } from '../lib/currency';
import { formatPropertyAddressShort } from '../lib/utils';
import { toast } from 'sonner';

interface EditExpenseModalProps {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSave: (id: string, updates: Partial<Omit<Expense, 'id'>>) => void;
  properties: Property[];
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  open,
  onClose,
  expense,
  onSave,
  properties
}) => {
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [propertyId, setPropertyId] = useState('none');

  useEffect(() => {
    if (expense) {
      setDate(expense.date);
      setCategory(expense.category);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setPropertyId(expense.propertyId || 'none');
    }
  }, [expense]);

  const handleSave = () => {
    if (!expense) return;

    if (!description || !amount || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    onSave(expense.id, {
      date,
      category: category as any,
      description,
      amount: amountNum,
      propertyId: (propertyId && propertyId !== 'none') ? propertyId : undefined
    });
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update expense details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-expense-date">Date *</Label>
            <Input
              id="edit-expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expense-category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-expense-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Office">Office Supplies</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Travel">Travel & Transport</SelectItem>
                <SelectItem value="Professional Fees">Professional Fees</SelectItem>
                <SelectItem value="Rent">Rent & Lease</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Technology">Technology & Software</SelectItem>
                <SelectItem value="Maintenance">Maintenance & Repairs</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expense-description">Description *</Label>
            <Input
              id="edit-expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the expense"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expense-amount">Amount (PKR) *</Label>
            <Input
              id="edit-expense-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expense-property">Associate with Property (Optional)</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger id="edit-expense-property">
                <SelectValue placeholder="Select a property (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None - General Expense</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {formatPropertyAddressShort(property.address)} ({formatCurrencyShort(property.price || property.rentAmount || 0)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};