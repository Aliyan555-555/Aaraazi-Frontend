"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sellCyclesService } from '@/services/sell-cycles.service';

interface EditSellCycleModalProps {
  cycleId: string;
  initialValues: {
    askingPrice: number;
    status: string;
    notes?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const EDITABLE_STATUSES = [
  { value: 'LISTED', label: 'Listed' },
  { value: 'OFFER_RECEIVED', label: 'Offer Received' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'UNDER_CONTRACT', label: 'Under Contract' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function EditSellCycleModal({
  cycleId,
  initialValues,
  onClose,
  onSuccess,
}: EditSellCycleModalProps) {
  const [askingPrice, setAskingPrice] = useState<string>(
    String(initialValues.askingPrice || ''),
  );
  const [status, setStatus] = useState<string>(initialValues.status);
  const [notes, setNotes] = useState<string>(initialValues.notes ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const price = parseFloat(askingPrice);
    if (!price || isNaN(price) || price <= 0) {
      toast.error('Please enter a valid asking price');
      return;
    }

    setLoading(true);
    try {
      await sellCyclesService.update(cycleId, {
        askingPrice: price,
        status,
        notes,
      });
      toast.success('Sell cycle updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? 'Failed to update sell cycle',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit Sell Cycle</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="askingPrice">Asking Price (PKR)</Label>
            <Input
              id="askingPrice"
              type="number"
              min="0"
              placeholder="Enter asking price"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {EDITABLE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Add notes about this sell cycle..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
