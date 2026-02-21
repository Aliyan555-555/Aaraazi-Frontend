"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rentCyclesService } from '@/services/rent-cycles.service';

interface AddApplicationModalProps {
  rentCycleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddApplicationModal({
  rentCycleId,
  onClose,
  onSuccess,
}: AddApplicationModalProps) {
  const [contactId, setContactId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!contactId.trim()) {
      toast.error('Please enter a contact ID');
      return;
    }

    setLoading(true);
    try {
      await rentCyclesService.addApplication(rentCycleId, contactId.trim(), notes || undefined);
      toast.success('Application submitted successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Add Tenant Application
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactId">Contact ID</Label>
            <Input
              id="contactId"
              placeholder="Enter tenant contact ID"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Enter the contact ID from the Contacts module
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Additional notes about the application..."
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </div>
    </div>
  );
}
