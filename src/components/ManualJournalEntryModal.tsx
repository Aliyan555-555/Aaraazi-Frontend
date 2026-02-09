import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import { JournalEntryLine } from '../types';
import { toast } from 'sonner';

interface ManualJournalEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: {
    date: string;
    description: string;
    reference?: string;
    entries: JournalEntryLine[];
    totalDebit: number;
    totalCredit: number;
    status: 'draft' | 'posted';
  }) => void;
  userId: string;
}

export const ManualJournalEntryModal: React.FC<ManualJournalEntryModalProps> = ({
  open,
  onClose,
  onSave,
  userId
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [entries, setEntries] = useState<JournalEntryLine[]>([
    {
      accountName: '',
      accountType: 'assets',
      description: '',
      debit: 0,
      credit: 0
    }
  ]);

  const accountOptions = {
    assets: ['Cash', 'Bank Account', 'Accounts Receivable', 'Prepaid Expenses', 'Fixed Assets', 'Other Assets'],
    liabilities: ['Accounts Payable', 'Accrued Expenses', 'Loans Payable', 'Other Liabilities'],
    equity: ['Owner\'s Equity', 'Retained Earnings', 'Drawings'],
    revenue: ['Commission Revenue', 'Rental Income', 'Other Revenue'],
    expenses: ['Marketing', 'Office Rent', 'Utilities', 'Salaries', 'Transportation', 'Professional Fees', 'Office Supplies', 'Technology', 'Maintenance', 'Other Expenses']
  };

  const addLine = () => {
    setEntries([
      ...entries,
      {
        accountName: '',
        accountType: 'assets',
        description: '',
        debit: 0,
        credit: 0
      }
    ]);
  };

  const removeLine = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof JournalEntryLine, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: value
    };
    setEntries(newEntries);
  };

  const totalDebit = entries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSave = (status: 'draft' | 'posted') => {
    if (!date || !description) {
      toast.error('Please fill in date and description');
      return;
    }

    if (entries.some(e => !e.accountName || !e.description)) {
      toast.error('Please fill in all journal entry lines');
      return;
    }

    if (!isBalanced) {
      toast.error('Journal entry must be balanced (debits = credits)');
      return;
    }

    onSave({
      date,
      description,
      reference: reference || undefined,
      entries,
      totalDebit,
      totalCredit,
      status
    });

    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setReference('');
    setEntries([
      {
        accountName: '',
        accountType: 'assets',
        description: '',
        debit: 0,
        credit: 0
      }
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Manual Journal Entry</DialogTitle>
          <DialogDescription>
            Create manual accounting adjustments using double-entry bookkeeping
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="je-date">Date *</Label>
              <Input
                id="je-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="je-reference">Reference (Optional)</Label>
              <Input
                id="je-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., ADJ-2024-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="je-description">Description *</Label>
            <Textarea
              id="je-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the adjustment"
              rows={2}
            />
          </div>

          {/* Journal Entry Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Journal Entry Lines</Label>
              <Button onClick={addLine} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Line
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[180px]">Account Type</TableHead>
                    <TableHead className="w-[200px]">Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[140px] text-right">Debit</TableHead>
                    <TableHead className="w-[140px] text-right">Credit</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={entry.accountType}
                          onValueChange={(value: any) => updateLine(index, 'accountType', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assets">Assets</SelectItem>
                            <SelectItem value="liabilities">Liabilities</SelectItem>
                            <SelectItem value="equity">Equity</SelectItem>
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="expenses">Expenses</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={entry.accountName}
                          onValueChange={(value) => updateLine(index, 'accountName', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accountOptions[entry.accountType].map((acc) => (
                              <SelectItem key={acc} value={acc}>
                                {acc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={entry.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="Line description"
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.debit || ''}
                          onChange={(e) => {
                            updateLine(index, 'debit', parseFloat(e.target.value) || 0);
                            if (parseFloat(e.target.value) > 0) {
                              updateLine(index, 'credit', 0);
                            }
                          }}
                          placeholder="0.00"
                          className="h-9 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.credit || ''}
                          onChange={(e) => {
                            updateLine(index, 'credit', parseFloat(e.target.value) || 0);
                            if (parseFloat(e.target.value) > 0) {
                              updateLine(index, 'debit', 0);
                            }
                          }}
                          placeholder="0.00"
                          className="h-9 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                          disabled={entries.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Totals Row */}
                  <TableRow className="bg-gray-100 font-medium">
                    <TableCell colSpan={3} className="text-right">
                      Totals:
                    </TableCell>
                    <TableCell className={`text-right ${totalDebit !== totalCredit ? 'text-red-600' : 'text-green-700'}`}>
                      {formatCurrency(totalDebit)}
                    </TableCell>
                    <TableCell className={`text-right ${totalDebit !== totalCredit ? 'text-red-600' : 'text-green-700'}`}>
                      {formatCurrency(totalCredit)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Balance Status */}
            {totalDebit > 0 && totalCredit > 0 && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${isBalanced ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                <AlertCircle className={`h-5 w-5 ${isBalanced ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className={`font-medium ${isBalanced ? 'text-green-900' : 'text-red-900'}`}>
                    {isBalanced ? 'Entry is Balanced' : 'Entry is Out of Balance'}
                  </p>
                  {!isBalanced && (
                    <p className="text-sm text-red-700">
                      Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Double-Entry Bookkeeping Rules</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Debit</strong>: Increases Assets & Expenses | Decreases Liabilities, Equity & Revenue</li>
              <li>• <strong>Credit</strong>: Increases Liabilities, Equity & Revenue | Decreases Assets & Expenses</li>
              <li>• Total Debits must equal Total Credits for the entry to be valid</li>
              <li>• Each line can have either a debit OR a credit, not both</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={!isBalanced || totalDebit === 0}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave('posted')}
            disabled={!isBalanced || totalDebit === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Post Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
