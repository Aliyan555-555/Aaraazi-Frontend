import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { formatPKR } from '../../../lib/currency';
import { CheckCircle, XCircle, Wallet, AlertCircle } from 'lucide-react';
import { CommissionAgent } from './CommissionList';

interface BulkCommissionActionsProps {
  open: boolean;
  onClose: () => void;
  action: 'approve' | 'reject' | 'pay' | null;
  selectedCommissions: CommissionAgent[];
  onConfirm: (action: 'approve' | 'reject' | 'pay', reason?: string) => void;
}

/**
 * BulkCommissionActions Component
 * 
 * Modal for bulk actions on selected commissions.
 * Supports: Bulk Approve, Bulk Reject, Bulk Mark as Paid.
 * 
 * Design System Compliant:
 * - Uses Shadcn Dialog components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Hick's Law: Clear confirmation step
 * - Jakob's Law: Standard dialog pattern
 * - Aesthetic-Usability: Color-coded actions
 * 
 * Features:
 * - Shows count and total amount
 * - Lists affected commissions
 * - Optional reason/note for reject
 * - Confirmation step with summary
 * - Admin-only actions
 * 
 * @example
 * <BulkCommissionActions
 *   open={showBulkModal}
 *   onClose={() => setShowBulkModal(false)}
 *   action="approve"
 *   selectedCommissions={selectedCommissions}
 *   onConfirm={handleBulkAction}
 * />
 */
export const BulkCommissionActions: React.FC<BulkCommissionActionsProps> = ({
  open,
  onClose,
  action,
  selectedCommissions,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = selectedCommissions.reduce((sum, c) => sum + c.amount, 0);
  const count = selectedCommissions.length;

  const handleConfirm = async () => {
    if (!action) return;

    setIsProcessing(true);
    try {
      await onConfirm(action, reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionConfig = () => {
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Commissions',
          description: 'Approve the selected commissions. They will move to approved status.',
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          buttonText: 'Approve All',
          buttonVariant: 'default' as const,
          color: 'green',
          requiresReason: false,
        };
      case 'reject':
        return {
          title: 'Reject Commissions',
          description: 'Reject the selected commissions. Please provide a reason.',
          icon: <XCircle className="h-6 w-6 text-red-600" />,
          buttonText: 'Reject All',
          buttonVariant: 'destructive' as const,
          color: 'red',
          requiresReason: true,
        };
      case 'pay':
        return {
          title: 'Mark Commissions as Paid',
          description: 'Mark the selected commissions as paid. This action cannot be undone.',
          icon: <Wallet className="h-6 w-6 text-blue-600" />,
          buttonText: 'Mark All as Paid',
          buttonVariant: 'default' as const,
          color: 'blue',
          requiresReason: false,
        };
      default:
        return null;
    }
  };

  const config = getActionConfig();

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {config.icon}
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className={`p-4 rounded-lg border bg-${config.color}-50 border-${config.color}-200`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-${config.color}-700 mb-1`}>Commissions Selected</p>
                <p className={`text-${config.color}-900`}>{count}</p>
              </div>
              <div>
                <p className={`text-${config.color}-700 mb-1`}>Total Amount</p>
                <p className={`text-${config.color}-900`}>{formatPKR(totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Commission List */}
          <div>
            <Label className="mb-2">Affected Commissions</Label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              <div className="divide-y divide-gray-200">
                {selectedCommissions.map((commission) => (
                  <div key={commission.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900">{commission.name}</p>
                        <p className="text-gray-500">
                          {commission.dealNumber} - {commission.propertyTitle}
                        </p>
                      </div>
                      <p className="text-gray-900">{formatPKR(commission.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reason/Note (for reject) */}
          {config.requiresReason && (
            <div>
              <Label htmlFor="reason" className="mb-2">
                Reason for Rejection *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for rejecting these commissions..."
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-orange-900">
                This action will affect {count} commission{count > 1 ? 's' : ''}.
              </p>
              <p className="text-orange-700">
                {action === 'pay' && 'Once marked as paid, this cannot be undone.'}
                {action === 'approve' && 'Approved commissions can be marked as paid by admins.'}
                {action === 'reject' && 'Rejected commissions will require re-approval.'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={isProcessing || (config.requiresReason && !reason.trim())}
          >
            {isProcessing ? 'Processing...' : config.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
