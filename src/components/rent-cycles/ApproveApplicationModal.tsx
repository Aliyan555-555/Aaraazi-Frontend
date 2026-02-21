"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rentCyclesService } from '@/services/rent-cycles.service';

interface Application {
  id: string;
  offerNumber: string;
  buyer?: { id: string; name: string; phone?: string | null; email?: string | null } | null;
  status: string;
}

interface ApproveApplicationModalProps {
  rentCycleId: string;
  applications: Application[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ApproveApplicationModal({
  rentCycleId,
  applications,
  onClose,
  onSuccess,
}: ApproveApplicationModalProps) {
  const [selectedId, setSelectedId] = useState<string>(applications[0]?.id ?? '');
  const [loading, setLoading] = useState(false);

  const pendingApps = applications.filter((a) => a.status === 'SUBMITTED');

  const handleApprove = async () => {
    if (!selectedId) {
      toast.error('Please select an application to approve');
      return;
    }

    setLoading(true);
    try {
      await rentCyclesService.approveApplication(rentCycleId, selectedId);
      toast.success('Application approved successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to approve application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approve Application
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {pendingApps.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No pending applications to approve.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Select an application to approve. All other pending applications will be rejected.
              </p>
              {pendingApps.map((app) => (
                <label
                  key={app.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedId === app.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="application"
                    value={app.id}
                    checked={selectedId === app.id}
                    onChange={() => setSelectedId(app.id)}
                    className="accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {app.buyer?.name ?? 'Unknown tenant'} — {app.offerNumber}
                    </p>
                    {app.buyer?.phone && (
                      <p className="text-xs text-gray-500">{app.buyer.phone}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading || pendingApps.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Approving...' : 'Approve Application'}
          </Button>
        </div>
      </div>
    </div>
  );
}
