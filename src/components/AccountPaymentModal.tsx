import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Property, Contact } from '../types';
import { toast } from 'sonner';
import { formatPropertyAddressShort } from '../lib/utils';

interface AccountPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payment: {
    paymentType: 'receivable' | 'payable';
    accountName: string;
    transactionType: 'payment-received' | 'payment-made';
    amount: number;
    paymentDate: string;
    paymentMethod: 'cash' | 'cheque' | 'bank-transfer' | 'online' | 'other';
    referenceNumber?: string;
    description: string;
    propertyId?: string;
    contactId?: string;
    bankAccount?: string;
    status: 'cleared' | 'pending' | 'bounced' | 'cancelled';
  }) => void;
  properties: Property[];
  contacts: Contact[];
  userId: string;
}

export const AccountPaymentModal: React.FC<AccountPaymentModalProps> = ({
  open,
  onClose,
  onSave,
  properties,
  contacts,
  userId
}) => {
  const [paymentType, setPaymentType] = useState<'receivable' | 'payable'>('receivable');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque' | 'bank-transfer' | 'online' | 'other'>('bank-transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [propertyId, setPropertyId] = useState('none');
  const [contactId, setContactId] = useState('none');
  const [bankAccount, setBankAccount] = useState('');
  const [status, setStatus] = useState<'cleared' | 'pending'>('cleared');

  const transactionType = paymentType === 'receivable' ? 'payment-received' : 'payment-made';
  const accountName = paymentType === 'receivable' ? 'Accounts Receivable' : 'Accounts Payable';

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!description) {
      toast.error('Please enter a description');
      return;
    }

    if (!paymentDate) {
      toast.error('Please select a payment date');
      return;
    }

    onSave({
      paymentType,
      accountName,
      transactionType,
      amount: parseFloat(amount),
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      description,
      propertyId: (propertyId && propertyId !== 'none') ? propertyId : undefined,
      contactId: (contactId && contactId !== 'none') ? contactId : undefined,
      bankAccount: bankAccount || undefined,
      status
    });

    // Reset form
    setAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('bank-transfer');
    setReferenceNumber('');
    setDescription('');
    setPropertyId('none');
    setContactId('none');
    setBankAccount('');
    setStatus('cleared');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Record Account Payment</DialogTitle>
          <DialogDescription>
            Record payment received from customers or payment made to vendors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={paymentType === 'receivable' ? 'default' : 'outline'}
              onClick={() => {
                setPaymentType('receivable');
                setDescription('');
              }}
              className={`h-20 flex flex-col items-center justify-center gap-2 ${paymentType === 'receivable' ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
            >
              <span className="font-medium">Payment Received</span>
              <span className="text-xs opacity-80">Accounts Receivable (A/R)</span>
            </Button>
            <Button
              type="button"
              variant={paymentType === 'payable' ? 'default' : 'outline'}
              onClick={() => {
                setPaymentType('payable');
                setDescription('');
              }}
              className={`h-20 flex flex-col items-center justify-center gap-2 ${paymentType === 'payable' ? 'bg-orange-600 hover:bg-orange-700' : ''
                }`}
            >
              <span className="font-medium">Payment Made</span>
              <span className="text-xs opacity-80">Accounts Payable (A/P)</span>
            </Button>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount (PKR) *</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date *</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-status">Status *</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="reference-number">
              Reference Number {paymentMethod === 'cheque' ? '(Cheque #)' : paymentMethod === 'bank-transfer' ? '(Transaction ID)' : '(Optional)'}
            </Label>
            <Input
              id="reference-number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={
                paymentMethod === 'cheque' ? 'Cheque number' :
                  paymentMethod === 'bank-transfer' ? 'Transaction/Reference ID' :
                    'Reference number'
              }
            />
          </div>

          {/* Bank Account */}
          <div className="space-y-2">
            <Label htmlFor="bank-account">Bank Account (Optional)</Label>
            <Input
              id="bank-account"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="Bank account used for this transaction"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="payment-description">Description *</Label>
            <Textarea
              id="payment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                paymentType === 'receivable'
                  ? 'e.g., Commission payment received from Johnson Family Trust'
                  : 'e.g., Vendor payment to ABC Construction'
              }
              rows={3}
            />
          </div>

          {/* Property Association (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="payment-property">Associate with Property (Optional)</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger id="payment-property">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {formatPropertyAddressShort(property.address)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Association (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="payment-contact">
              Associate with Contact (Optional) - {paymentType === 'receivable' ? 'Payer' : 'Payee'}
            </Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger id="payment-contact">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} - {contact.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info Box */}
          <div className={`border rounded-lg p-4 ${paymentType === 'receivable' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
            }`}>
            <h4 className={`font-medium mb-2 ${paymentType === 'receivable' ? 'text-green-900' : 'text-orange-900'
              }`}>
              Accounting Impact
            </h4>
            <div className={`text-sm space-y-1 ${paymentType === 'receivable' ? 'text-green-800' : 'text-orange-800'
              }`}>
              {paymentType === 'receivable' ? (
                <>
                  <p>• <strong>Debit:</strong> Bank Account (increases assets)</p>
                  <p>• <strong>Credit:</strong> Accounts Receivable (decreases assets)</p>
                  <p>• This records money received from customers/clients</p>
                </>
              ) : (
                <>
                  <p>• <strong>Debit:</strong> Accounts Payable (decreases liabilities)</p>
                  <p>• <strong>Credit:</strong> Bank Account (decreases assets)</p>
                  <p>• This records money paid to vendors/suppliers</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className={paymentType === 'receivable' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
          >
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};