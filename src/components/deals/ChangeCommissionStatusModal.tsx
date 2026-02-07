/**
 * ChangeCommissionStatusModal Component
 * 
 * Modal for changing commission status with reason/notes
 * Admin-only functionality
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CommissionStatusBadge, CommissionStatus } from './CommissionStatusBadge';
import { AlertCircle } from 'lucide-react';

interface ChangeCommissionStatusModalProps {
  open: boolean;
  onClose: () => void;
  currentStatus: CommissionStatus;
  agentName: string;
  splitType: 'primary' | 'secondary' | 'agency';
  onConfirm: (newStatus: CommissionStatus, reason: string) => void;
}

export function ChangeCommissionStatusModal({
  open,
  onClose,
  currentStatus,
  agentName,
  splitType,
  onConfirm
}: ChangeCommissionStatusModalProps) {
  const [newStatus, setNewStatus] = useState<CommissionStatus>(currentStatus);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (newStatus !== currentStatus && !reason.trim()) {
      return; // Require reason for status change
    }
    onConfirm(newStatus, reason);
    setReason('');
    onClose();
  };

  const handleCancel = () => {
    setNewStatus(currentStatus);
    setReason('');
    onClose();
  };

  const getAvailableStatuses = (): CommissionStatus[] => {
    // Define valid status transitions
    switch (currentStatus) {
      case 'pending':
        return ['pending', 'pending-approval', 'cancelled'];
      case 'pending-approval':
        return ['pending-approval', 'approved', 'cancelled'];
      case 'approved':
        return ['approved', 'paid', 'on-hold', 'cancelled'];
      case 'paid':
        return ['paid']; // Cannot change from paid
      case 'cancelled':
        return ['cancelled']; // Cannot change from cancelled
      case 'on-hold':
        return ['on-hold', 'approved', 'cancelled'];
      default:
        return ['pending', 'pending-approval', 'approved', 'paid', 'cancelled', 'on-hold'];
    }
  };

  const availableStatuses = getAvailableStatuses();
  const isStatusChanged = newStatus !== currentStatus;
  const requiresReason = isStatusChanged;

  const getTypeLabel = () => {
    switch (splitType) {
      case 'primary':
        return 'Primary Agent';
      case 'secondary':
        return 'Secondary Agent';
      case 'agency':
        return 'Agency';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Commission Status</DialogTitle>
          <DialogDescription>
            Update the commission status for {getTypeLabel()}: {agentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div>
            <Label className="text-sm text-gray-600 mb-2">Current Status</Label>
            <div className="mt-2">
              <CommissionStatusBadge status={currentStatus} />
            </div>
          </div>

          {/* New Status */}
          <div>
            <Label htmlFor="new-status">New Status</Label>
            <Select value={newStatus} onValueChange={(value: CommissionStatus) => setNewStatus(value)}>
              <SelectTrigger id="new-status" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <CommissionStatusBadge status={status} showIcon={false} size="sm" />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason/Notes */}
          <div>
            <Label htmlFor="reason">
              Reason {requiresReason && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for status change..."
              className="mt-2 min-h-[100px]"
              required={requiresReason}
            />
            {requiresReason && !reason.trim() && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Reason is required when changing status
              </p>
            )}
          </div>

          {/* Warning Messages */}
          {newStatus === 'paid' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Once marked as paid, the status cannot be changed.
              </p>
            </div>
          )}

          {newStatus === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Cancelled commissions cannot be reinstated.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={requiresReason && !reason.trim()}
          >
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
