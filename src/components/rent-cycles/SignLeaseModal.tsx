"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rentCyclesService } from '@/services/rent-cycles.service';

interface Application {
  id: string;
  offerNumber: string;
  buyer?: { name: string } | null;
  status: string;
}

interface SignLeaseModalProps {
  rentCycleId: string;
  leasePeriod: number;
  applications: Application[];
  onClose: () => void;
  onSuccess: () => void;
}

export function SignLeaseModal({
  rentCycleId,
  leasePeriod,
  applications,
  onClose,
  onSuccess,
}: SignLeaseModalProps) {
  const approvedApp = applications.find((a) => a.status === 'ACCEPTED');
  const [applicationId, setApplicationId] = useState(approvedApp?.id ?? '');
  const [leaseStartDate, setLeaseStartDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [loading, setLoading] = useState(false);

  // Auto-compute end date based on lease period
  const computedEndDate = leaseStartDate
    ? (() => {
        const d = new Date(leaseStartDate);
        d.setMonth(d.getMonth() + leasePeriod);
        return d.toISOString().split('T')[0];
      })()
    : '';

  const [leaseEndDate, setLeaseEndDate] = useState(computedEndDate);

  const handleSign = async () => {
    if (!applicationId) {
      toast.error('No approved application found');
      return;
    }
    if (!leaseStartDate || !leaseEndDate) {
      toast.error('Please set lease start and end dates');
      return;
    }
    if (new Date(leaseEndDate) <= new Date(leaseStartDate)) {
      toast.error('Lease end date must be after start date');
      return;
    }

    setLoading(true);
    try {
      await rentCyclesService.signLease(rentCycleId, {
        applicationId,
        leaseStartDate,
        leaseEndDate,
      });
      toast.success('Lease signed successfully! Property is now leased.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to sign lease');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            Sign Lease
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {approvedApp ? (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-sm font-medium text-green-800">Approved Tenant</p>
              <p className="text-sm text-green-700 mt-0.5">
                {approvedApp.buyer?.name ?? 'Unknown'} — {approvedApp.offerNumber}
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-sm text-yellow-800">No approved application found. Please approve an application first.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="leaseStartDate">Lease Start Date</Label>
            <Input
              id="leaseStartDate"
              type="date"
              value={leaseStartDate}
              onChange={(e) => {
                setLeaseStartDate(e.target.value);
                const d = new Date(e.target.value);
                d.setMonth(d.getMonth() + leasePeriod);
                setLeaseEndDate(d.toISOString().split('T')[0]);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaseEndDate">Lease End Date</Label>
            <Input
              id="leaseEndDate"
              type="date"
              value={leaseEndDate}
              onChange={(e) => setLeaseEndDate(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Auto-calculated as {leasePeriod} months from start date
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSign}
            disabled={loading || !approvedApp}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {loading ? 'Signing...' : 'Sign Lease'}
          </Button>
        </div>
      </div>
    </div>
  );
}
