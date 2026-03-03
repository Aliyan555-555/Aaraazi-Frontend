import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { formatPKR } from '../../../lib/currency';
import { CheckCircle, XCircle, Send, AlertCircle } from 'lucide-react';
import { InvestorDistributionRecord } from './InvestorDistributionList';

interface BulkDistributionActionsProps {
  open: boolean;
  onClose: () => void;
  action: 'approve' | 'reject' | 'mark-paid' | null;
  selectedDistributions: InvestorDistributionRecord[];
  onConfirm: (action: 'approve' | 'reject' | 'mark-paid', reason?: string) => void;
}

/**
 * BulkDistributionActions Component
 * 
 * Modal for bulk actions on selected investor distributions.
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
 * - Lists affected distributions
 * - Optional reason/note for reject
 * - Confirmation step with summary
 * - Admin-only actions
 * 
 * @example
 * <BulkDistributionActions
 *   open={showBulkModal}
 *   onClose={() => setShowBulkModal(false)}
 *   action="approve"
 *   selectedDistributions={selectedDistributions}
 *   onConfirm={handleBulkAction}
 * />
 */
export const BulkDistributionActions: React.FC<BulkDistributionActionsProps> = ({
  open,
  onClose,
  action,
  selectedDistributions,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = selectedDistributions.reduce((sum, d) => sum + d.amount, 0);
  const count = selectedDistributions.length;

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
          title: 'Approve Distributions',
          description: 'Approve the selected distributions. They will move to approved status and be ready for payment.',
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          buttonText: 'Approve All',
          buttonVariant: 'default' as const,
          color: 'green',
          requiresReason: false,
        };
      case 'reject':
        return {
          title: 'Reject Distributions',
          description: 'Reject the selected distributions. Please provide a reason.',
          icon: <XCircle className="h-6 w-6 text-red-600" />,
          buttonText: 'Reject All',
          buttonVariant: 'destructive' as const,
          color: 'red',
          requiresReason: true,
        };
      case 'mark-paid':
        return {
          title: 'Mark as Paid',
          description: 'Mark the selected distributions as paid. This confirms that payments have been processed.',
          icon: <Send className="h-6 w-6 text-blue-600" />,
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
                <p className={`text-${config.color}-700 mb-1`}>Distributions Selected</p>
                <p className={`text-${config.color}-900`}>{count}</p>
              </div>
              <div>
                <p className={`text-${config.color}-700 mb-1`}>Total Amount</p>
                <p className={`text-${config.color}-900`}>{formatPKR(totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Distribution List */}
          <div>
            <Label className="mb-2">Affected Distributions</Label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              <div className="divide-y divide-gray-200">
                {selectedDistributions.map((distribution) => (
                  <div key={distribution.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900">{distribution.investorName}</p>
                        <p className="text-gray-500">
                          {distribution.propertyTitle} • {distribution.ownershipPercentage.toFixed(2)}% ownership
                        </p>
                      </div>
                      <p className="text-gray-900">{formatPKR(distribution.amount)}</p>
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
                placeholder="Enter reason for rejecting these distributions..."
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
                This action will affect {count} distribution{count > 1 ? 's' : ''}.
              </p>
              <p className="text-orange-700">
                {action === 'approve' && 'Approved distributions can be marked as paid by admins.'}
                {action === 'reject' && 'Rejected distributions will remain as scheduled and can be re-approved.'}
                {action === 'mark-paid' && 'Once marked as paid, distributions cannot be reversed.'}
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
