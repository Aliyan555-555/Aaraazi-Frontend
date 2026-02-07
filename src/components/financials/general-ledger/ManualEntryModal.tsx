import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { formatPKR } from '../../../lib/currency';
import { LedgerEntry } from './LedgerEntryList';
import { AlertCircle } from 'lucide-react';

interface ManualEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: Omit<LedgerEntry, 'id' | 'entryNumber' | 'balance' | 'createdAt'>) => void;
  userName: string;
  mode: 'add';
}

// Predefined chart of accounts
const CHART_OF_ACCOUNTS = [
  // Assets
  { code: '1000', name: 'Cash', type: 'asset' as const },
  { code: '1010', name: 'Bank Account', type: 'asset' as const },
  { code: '1020', name: 'Accounts Receivable', type: 'asset' as const },
  { code: '1100', name: 'Property Inventory', type: 'asset' as const },
  { code: '1200', name: 'Commission Receivable', type: 'asset' as const },
  
  // Liabilities
  { code: '2000', name: 'Accounts Payable', type: 'liability' as const },
  { code: '2010', name: 'Commission Payable', type: 'liability' as const },
  { code: '2020', name: 'Expenses Payable', type: 'liability' as const },
  { code: '2100', name: 'Investor Distributions Payable', type: 'liability' as const },
  
  // Equity
  { code: '3000', name: 'Owner Equity', type: 'equity' as const },
  { code: '3100', name: 'Retained Earnings', type: 'equity' as const },
  
  // Revenue
  { code: '4000', name: 'Commission Revenue', type: 'revenue' as const },
  { code: '4100', name: 'Property Sales Revenue', type: 'revenue' as const },
  { code: '4200', name: 'Rental Revenue', type: 'revenue' as const },
  
  // Expenses
  { code: '5000', name: 'Operating Expenses', type: 'expense' as const },
  { code: '5100', name: 'Marketing Expenses', type: 'expense' as const },
  { code: '5200', name: 'Salaries & Wages', type: 'expense' as const },
  { code: '5300', name: 'Utilities', type: 'expense' as const },
  { code: '5400', name: 'Office Rent', type: 'expense' as const },
];

/**
 * ManualEntryModal Component
 * 
 * Modal for creating manual journal entries in the general ledger.
 * Supports double-entry bookkeeping with debit/credit validation.
 * 
 * Design System V4.1 Compliant:
 * - Uses Shadcn Dialog, Input, Select components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Jakob's Law: Standard accounting entry form
 * - Hick's Law: Clear grouped fields
 * - Fitts's Law: Large input fields
 * 
 * Features:
 * - Select from chart of accounts
 * - Enter debit OR credit (not both)
 * - Validation for double-entry rules
 * - Auto-populate account type
 * - Description and reference fields
 * - Date picker
 * 
 * @example
 * <ManualEntryModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   mode="add"
 *   onSave={handleSaveEntry}
 *   userName={user.name}
 * />
 */
export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  open,
  onClose,
  onSave,
  userName,
  mode,
}) => {
  const [accountCode, setAccountCode] = useState('');
  const [date, setDate] = useState('');
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');
  const [description, setDescription] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open && mode === 'add') {
      setAccountCode('');
      setDate(new Date().toISOString().split('T')[0]);
      setDebit('');
      setCredit('');
      setDescription('');
      setReferenceNumber('');
    }
  }, [open, mode]);

  const selectedAccount = CHART_OF_ACCOUNTS.find(acc => acc.code === accountCode);

  const handleSubmit = async () => {
    // Validation
    if (!accountCode || !date || !description) {
      alert('Please fill in all required fields');
      return;
    }

    const debitNum = parseFloat(debit) || 0;
    const creditNum = parseFloat(credit) || 0;

    if (debitNum === 0 && creditNum === 0) {
      alert('Please enter either a debit or credit amount');
      return;
    }

    if (debitNum > 0 && creditNum > 0) {
      alert('An entry cannot have both debit and credit. Please enter only one.');
      return;
    }

    if (!selectedAccount) {
      alert('Please select a valid account');
      return;
    }

    setIsSubmitting(true);

    try {
      const entryData: Omit<LedgerEntry, 'id' | 'entryNumber' | 'balance' | 'createdAt'> = {
        date,
        accountCode: selectedAccount.code,
        accountName: selectedAccount.name,
        accountType: selectedAccount.type,
        debit: debitNum,
        credit: creditNum,
        description,
        source: 'manual',
        referenceNumber: referenceNumber || undefined,
        createdBy: userName,
      };

      await onSave(entryData);
      onClose();
    } catch (error) {
      console.error('Failed to save ledger entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manual Journal Entry</DialogTitle>
          <DialogDescription>
            Create a manual entry in the general ledger. Enter either debit or credit (not both).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Double-Entry Warning */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-900">Double-Entry Bookkeeping</p>
              <p className="text-blue-700 text-sm">
                Remember: Every debit must have a corresponding credit entry (and vice versa). 
                You may need to create multiple entries to balance the transaction.
              </p>
            </div>
          </div>

          {/* Date */}
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

          {/* Account Selection */}
          <div>
            <Label htmlFor="account">Account *</Label>
            <Select value={accountCode} onValueChange={setAccountCode}>
              <SelectTrigger id="account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 bg-gray-100">
                  <p className="text-gray-700">Assets</p>
                </div>
                {CHART_OF_ACCOUNTS.filter(acc => acc.type === 'asset').map((account) => (
                  <SelectItem key={account.code} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
                
                <div className="p-2 bg-gray-100 mt-2">
                  <p className="text-gray-700">Liabilities</p>
                </div>
                {CHART_OF_ACCOUNTS.filter(acc => acc.type === 'liability').map((account) => (
                  <SelectItem key={account.code} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
                
                <div className="p-2 bg-gray-100 mt-2">
                  <p className="text-gray-700">Equity</p>
                </div>
                {CHART_OF_ACCOUNTS.filter(acc => acc.type === 'equity').map((account) => (
                  <SelectItem key={account.code} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
                
                <div className="p-2 bg-gray-100 mt-2">
                  <p className="text-gray-700">Revenue</p>
                </div>
                {CHART_OF_ACCOUNTS.filter(acc => acc.type === 'revenue').map((account) => (
                  <SelectItem key={account.code} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
                
                <div className="p-2 bg-gray-100 mt-2">
                  <p className="text-gray-700">Expenses</p>
                </div>
                {CHART_OF_ACCOUNTS.filter(acc => acc.type === 'expense').map((account) => (
                  <SelectItem key={account.code} value={account.code}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p className="text-gray-600 text-sm mt-1">
                Type: {selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)}
              </p>
            )}
          </div>

          {/* Debit and Credit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="debit">Debit (PKR)</Label>
              <Input
                id="debit"
                type="number"
                step="0.01"
                value={debit}
                onChange={(e) => {
                  setDebit(e.target.value);
                  if (e.target.value) setCredit('');
                }}
                placeholder="0.00"
                disabled={!!credit}
              />
              {debit && !isNaN(parseFloat(debit)) && (
                <p className="text-gray-600 text-sm mt-1">
                  {formatPKR(parseFloat(debit))}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="credit">Credit (PKR)</Label>
              <Input
                id="credit"
                type="number"
                step="0.01"
                value={credit}
                onChange={(e) => {
                  setCredit(e.target.value);
                  if (e.target.value) setDebit('');
                }}
                placeholder="0.00"
                disabled={!!debit}
              />
              {credit && !isNaN(parseFloat(credit)) && (
                <p className="text-gray-600 text-sm mt-1">
                  {formatPKR(parseFloat(credit))}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description of this entry..."
              rows={3}
              className="resize-none"
              required
            />
          </div>

          {/* Reference Number */}
          <div>
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., JE-2024-001"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
