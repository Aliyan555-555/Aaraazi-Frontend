import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Commission } from '../types';
import { CheckCircle, XCircle, Edit, AlertCircle, Calendar, TrendingUp, User, Building2 } from 'lucide-react';
import { formatPKR } from '../lib/currency';
import { toast } from 'sonner';

interface CommissionApprovalModalProps {
  open: boolean;
  onClose: () => void;
  commission: Commission | null;
  onApprove: (commissionId: string) => void;
  onReject: (commissionId: string, reason: string) => void;
  onOverride: (commissionId: string, newAmount: number, reason: string) => void;
  userRole: string;
}

export function CommissionApprovalModal({
  open,
  onClose,
  commission,
  onApprove,
  onReject,
  onOverride,
  userRole
}: CommissionApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'override'>('approve');
  const [overrideAmount, setOverrideAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open && commission) {
      setAction('approve');
      setOverrideAmount(commission.amount.toString());
      setReason('');
    }
  }, [open, commission]);

  if (!commission) return null;

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove(commission.id);
      toast.success('Commission approved successfully');
      onClose();
    } else if (action === 'reject') {
      if (!reason.trim()) {
        toast.error('Please provide a rejection reason');
        return;
      }
      onReject(commission.id, reason);
      toast.success('Commission rejected');
      onClose();
    } else if (action === 'override') {
      if (!reason.trim()) {
        toast.error('Please provide an override reason');
        return;
      }
      const amount = Number(overrideAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Override amount must be a valid positive number');
        return;
      }
      onOverride(commission.id, amount, reason);
      toast.success('Commission overridden successfully');
      onClose();
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending-approval':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pending'}</Badge>;
    }
  };

  const getPayoutTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'booking':
        return 'At Booking';
      case '50-percent':
        return 'At 50% Payment';
      case 'possession':
        return 'At Possession';
      case 'full-payment':
        return 'At Full Payment';
      default:
        return trigger;
    }
  };

  const isOverridden = commission.overrideAmount !== undefined;
  const isSplit = commission.isSplit;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Commission Review & Approval
          </DialogTitle>
          <DialogDescription>
            Review commission details and take action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Commission Details Card */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commission ID</p>
                  <p className="font-mono text-sm">{commission.id}</p>
                </div>
                {getStatusBadge(commission.approvalStatus)}
              </div>

              <Separator />

              {/* Agent & Property Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Agent</p>
                    <p className="font-medium">{commission.agentName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Property</p>
                    <p className="font-medium truncate">{commission.propertyTitle}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                  <p className="font-medium">{commission.rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isOverridden ? 'Override Amount' : 'Amount'}
                  </p>
                  <p className="font-medium">{formatPKR(commission.amount)}</p>
                </div>
                {isSplit && commission.totalAmount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Total (Before Split)</p>
                    <p className="font-medium">{formatPKR(commission.totalAmount)}</p>
                  </div>
                )}
              </div>

              {isOverridden && commission.overrideAmount && (
                <>
                  <Separator />
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">Commission Overridden</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Original: {formatPKR(commission.overrideAmount)} →
                          New: {formatPKR(commission.amount)}
                        </p>
                        {commission.overrideReason && (
                          <p className="text-sm text-yellow-700 mt-1">
                            Reason: {commission.overrideReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payout Trigger</p>
                  <Badge variant="outline">{getPayoutTriggerLabel(commission.payoutTrigger || 'full-payment')}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                    {commission.status}
                  </Badge>
                </div>
              </div>

              {commission.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="text-sm font-medium">
                      {new Date(commission.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {isSplit && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Team Commission Split</p>
                    <p className="text-sm text-blue-700">
                      This commission is part of a team deal split among multiple agents
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons (Admin Only & Pending Approval) */}
          {userRole === 'admin' && commission.approvalStatus === 'pending-approval' && (
            <>
              <div>
                <Label>Action</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={action === 'approve' ? 'default' : 'outline'}
                    onClick={() => setAction('approve')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant={action === 'override' ? 'default' : 'outline'}
                    onClick={() => setAction('override')}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Override
                  </Button>
                  <Button
                    variant={action === 'reject' ? 'destructive' : 'outline'}
                    onClick={() => setAction('reject')}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              {/* Override Amount Input */}
              {action === 'override' && (
                <div className="space-y-2">
                  <Label>Override Amount (PKR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(e.target.value)}
                    placeholder="Enter new commission amount"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Original Amount:</span>
                    <span>{formatPKR(commission.amount)}</span>
                  </div>
                  {Number(overrideAmount) !== commission.amount && overrideAmount && (
                    <div className="flex justify-between text-sm">
                      <span>Difference:</span>
                      <span className={Number(overrideAmount) > commission.amount ? 'text-green-600' : 'text-red-600'}>
                        {Number(overrideAmount) > commission.amount ? '+' : ''}
                        {formatPKR(Number(overrideAmount) - commission.amount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Reason Input */}
              {(action === 'reject' || action === 'override') && (
                <div className="space-y-2">
                  <Label>Reason *</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`Enter ${action === 'reject' ? 'rejection' : 'override'} reason...`}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This reason will be visible to the agent and stored for audit purposes
                  </p>
                </div>
              )}

              {/* Warning for Override */}
              {action === 'override' && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Commission Override Warning</p>
                    <p className="mt-1">
                      This action will permanently change the commission amount. The original amount
                      will be preserved for audit purposes. Make sure the reason is well documented.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Already Approved/Rejected Message */}
          {commission.approvalStatus !== 'pending-approval' && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This commission has already been {commission.approvalStatus}.
                {commission.approvedBy && commission.approvedAt && (
                  <span className="block mt-1">
                    By {commission.approvedBy} on {new Date(commission.approvedAt).toLocaleDateString()}
                  </span>
                )}
                {commission.rejectionReason && (
                  <span className="block mt-1">
                    Reason: {commission.rejectionReason}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Agent View (No Actions) */}
          {userRole !== 'admin' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Commission is {commission.approvalStatus || 'pending review'} by administration.
                You will be notified once a decision is made.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {userRole === 'admin' && commission.approvalStatus === 'pending-approval' ? 'Cancel' : 'Close'}
          </Button>
          {userRole === 'admin' && commission.approvalStatus === 'pending-approval' && (
            <Button onClick={handleSubmit}>
              {action === 'approve' && <CheckCircle className="w-4 h-4 mr-2" />}
              {action === 'reject' && <XCircle className="w-4 h-4 mr-2" />}
              {action === 'override' && <Edit className="w-4 h-4 mr-2" />}
              {action === 'approve' ? 'Approve Commission' :
                action === 'reject' ? 'Reject Commission' :
                  'Override Commission'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
