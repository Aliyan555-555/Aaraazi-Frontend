import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatPKR } from '../lib/currency';

interface FinancialTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  subcategory: string;
  paymentMethod: 'cash' | 'cheque' | 'bank-transfer' | 'card';
  vendor?: string;
  receiptNumber?: string;
  approvedBy: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  tags: string[];
  attachments: string[];
}

interface FinancialTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<FinancialTransaction, 'id'>) => void;
  projectId: string;
  editingTransaction?: FinancialTransaction | null;
}

export const FinancialTransactionForm: React.FC<FinancialTransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  projectId,
  editingTransaction
}) => {
  const [formData, setFormData] = useState({
    date: editingTransaction?.date || format(new Date(), 'yyyy-MM-dd'),
    description: editingTransaction?.description || '',
    amount: editingTransaction?.amount || 0,
    type: editingTransaction?.type || 'expense',
    category: editingTransaction?.category || '',
    subcategory: editingTransaction?.subcategory || '',
    paymentMethod: editingTransaction?.paymentMethod || 'bank-transfer',
    vendor: editingTransaction?.vendor || '',
    receiptNumber: editingTransaction?.receiptNumber || '',
    approvedBy: editingTransaction?.approvedBy || '',
    status: editingTransaction?.status || 'pending',
    tags: editingTransaction?.tags || []
  });

  const [dateOpen, setDateOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  const categories = {
    expense: [
      'Construction Materials',
      'Labor & Workforce',
      'Equipment & Machinery',
      'Professional Services',
      'Legal & Documentation',
      'Marketing & Sales',
      'Utilities',
      'Insurance',
      'Permits & Approvals',
      'Transportation',
      'Miscellaneous'
    ],
    income: [
      'Unit Sales',
      'Advance Payments',
      'Booking Amounts',
      'Rental Income',
      'Parking Sales',
      'Commercial Leasing',
      'Interest Income',
      'Other Income'
    ]
  };

  const subcategories = {
    'Construction Materials': ['Cement', 'Steel', 'Bricks', 'Tiles', 'Paint', 'Electrical', 'Plumbing', 'Fixtures'],
    'Labor & Workforce': ['Mason', 'Electrician', 'Plumber', 'Painter', 'Helper', 'Supervisor', 'Security'],
    'Equipment & Machinery': ['Crane', 'Excavator', 'Mixer', 'Tools', 'Rental Equipment'],
    'Professional Services': ['Architect', 'Engineer', 'Consultant', 'Legal', 'Accounting'],
    'Legal & Documentation': ['NOC Fees', 'Registration', 'Stamps', 'Legal Fees'],
    'Marketing & Sales': ['Advertising', 'Brochures', 'Website', 'Sales Commission'],
    'Unit Sales': ['2-Bedroom', '3-Bedroom', 'Penthouse', 'Commercial Space'],
    'Advance Payments': ['Token Money', 'Down Payment', 'Installments']
  };

  const handleSave = () => {
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (!formData.category) {
      toast.error('Category is required');
      return;
    }

    if (!formData.approvedBy.trim()) {
      toast.error('Approved by is required');
      return;
    }

    const transactionData: Omit<FinancialTransaction, 'id'> = {
      date: formData.date,
      description: formData.description.trim(),
      amount: formData.amount,
      type: formData.type as FinancialTransaction['type'],
      category: formData.category,
      subcategory: formData.subcategory,
      paymentMethod: formData.paymentMethod as FinancialTransaction['paymentMethod'],
      vendor: formData.vendor || undefined,
      receiptNumber: formData.receiptNumber || undefined,
      approvedBy: formData.approvedBy.trim(),
      status: formData.status as FinancialTransaction['status'],
      tags: formData.tags,
      attachments: []
    };

    onSave(transactionData);
    onClose();
    toast.success(`Transaction ${editingTransaction ? 'updated' : 'created'} successfully`);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? 'Edit Transaction' : 'Add Financial Transaction'}
          </DialogTitle>
          <DialogDescription>
            {editingTransaction ? 'Update the transaction details' : 'Record a new financial transaction for this project'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Transaction Type and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, category: '', subcategory: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transaction Date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(new Date(formData.date), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
                        setDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter transaction description"
              rows={2}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PKR)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="w-full"
            />
            {formData.amount > 0 && (
              <p className="text-sm text-muted-foreground">
                {formatPKR(formData.amount)}
              </p>
            )}
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories[formData.type as keyof typeof categories].map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                disabled={!formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {(subcategories[formData.category as keyof typeof subcategories] || []).map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Method and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendor and Receipt */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor/Party (Optional)</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                placeholder="Vendor or party name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt/Reference Number</Label>
              <Input
                id="receiptNumber"
                value={formData.receiptNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                placeholder="Receipt or reference number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approvedBy">Approved By</Label>
            <Input
              id="approvedBy"
              value={formData.approvedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, approvedBy: e.target.value }))}
              placeholder="Name of person who approved this transaction"
              className="w-full"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  <span>{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(tag)}
                    className="h-auto p-0 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {editingTransaction ? 'Update Transaction' : 'Create Transaction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};