"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rentCyclesService } from '@/services/rent-cycles.service';

interface RecordRentPaymentModalProps {
  rentCycleId: string;
  monthlyRent: string | number;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordRentPaymentModal({
  rentCycleId,
  monthlyRent,
  onClose,
  onSuccess,
}: RecordRentPaymentModalProps) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [month, setMonth] = useState(currentMonth);
  const [amountPaid, setAmountPaid] = useState(String(monthlyRent));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecord = async () => {
    const amount = parseFloat(amountPaid);
    if (!month) {
      toast.error('Please select the payment month');
      return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await rentCyclesService.recordPayment(rentCycleId, {
        month,
        amountPaid: amount,
        paymentDate,
        notes: notes || undefined,
      });
      toast.success('Rent payment recorded successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Record Rent Payment
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month">Payment Month</Label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountPaid">Amount Paid (PKR)</Label>
            <Input
              id="amountPaid"
              type="number"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="e.g. Cash payment, reference number..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleRecord}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
