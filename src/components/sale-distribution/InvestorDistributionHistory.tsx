/**
 * Investor Distribution History
 * Displays all profit distributions for a property or investor
 */

import React, { useState, useMemo } from 'react';
import { useConfirmStore } from '@/store/useConfirmStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Property, User, InvestorDistribution } from '../../types';
// [STUBBED] import { 
// [STUBBED]   getPropertyDistributions, 
// [STUBBED]   getPropertyDistributionSummary,
// [STUBBED]   markDistributionPaid,
// [STUBBED]   cancelDistribution
// [STUBBED] } from '../../lib/saleDistribution';
import { formatPKR } from '../../lib/currency';
import {
  Award,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Receipt,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

// ===== STUBS for removed prototype functions =====
const getPropertyDistributions = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getPropertyDistributionSummary = (..._args: any[]): any => { /* stub - prototype function removed */ };
const markDistributionPaid = (..._args: any[]): any => { /* stub - prototype function removed */ };
const cancelDistribution = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface InvestorDistributionHistoryProps {
  propertyId: string;
  user: User;
  onDistributionUpdated?: () => void;
}

export function InvestorDistributionHistory({
  propertyId,
  user,
  onDistributionUpdated,
}: InvestorDistributionHistoryProps) {
  const [expandedDistributionId, setExpandedDistributionId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<InvestorDistribution | null>(null);

  // Load distributions
  const distributions = useMemo(() => {
    return getPropertyDistributions(propertyId);
  }, [propertyId]);

  // Get summary
  const summary = useMemo(() => {
    return getPropertyDistributionSummary(propertyId);
  }, [propertyId]);

  const handleMarkPaid = (distribution: InvestorDistribution) => {
    setSelectedDistribution(distribution);
    setShowPaymentModal(true);
  };

  const handleCancelDistribution = (distributionId: string) => {
    useConfirmStore.getState().ask({
      title: 'Cancel Distribution',
      description: 'Are you sure you want to cancel this distribution? This will revert the investment status back to "active".',
      confirmText: 'Cancel Distribution',
      variant: 'destructive',
      onConfirm: () => {
        const reason = window.prompt('Please enter a reason for cancellation:');
        if (!reason) return;

        try {
          const success = cancelDistribution(distributionId, reason);
          if (success) {
            toast.success('Distribution cancelled successfully');
            onDistributionUpdated?.();
          }
        } catch (error) {
          console.error('Error cancelling distribution:', error);
          toast.error('Failed to cancel distribution');
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (distributions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution History</CardTitle>
          <CardDescription>
            No distributions have been executed for this property yet
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Distribution History
          </CardTitle>
          <CardDescription>
            Profit distributions to investors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Distributed</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatPKR(summary.totalDistributed)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.totalInvestors} investor{summary.totalInvestors !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {formatPKR(summary.pendingAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.pendingCount} distribution{summary.pendingCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatPKR(summary.paidAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.paidCount} distribution{summary.paidCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Distributions List */}
          <div className="space-y-3">
            {distributions.map((distribution) => {
              const isExpanded = expandedDistributionId === distribution.id;

              return (
                <Card key={distribution.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Main Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={getStatusColor(distribution.distributionStatus)}>
                              {getStatusIcon(distribution.distributionStatus)}
                              <span className="ml-1 capitalize">{distribution.distributionStatus}</span>
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Percent className="w-3 h-3 mr-1" />
                              {distribution.sharePercentage.toFixed(2)}%
                            </Badge>
                          </div>
                          <p className="font-medium text-lg">{distribution.investorName}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Sale: {formatDate(distribution.saleDate)}
                            </span>
                            {distribution.distributionDate && (
                              <span className="flex items-center gap-1">
                                <Receipt className="w-3 h-3" />
                                Paid: {formatDate(distribution.distributionDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Return</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatPKR(distribution.totalReturn)}
                            </p>
                            <Badge
                              variant={distribution.roi >= 0 ? 'default' : 'destructive'}
                              className="mt-1"
                            >
                              ROI: {distribution.roi >= 0 ? '+' : ''}{distribution.roi.toFixed(2)}%
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedDistributionId(isExpanded ? null : distribution.id)}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            {distribution.distributionStatus === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkPaid(distribution)}
                                  title="Mark as Paid"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelDistribution(distribution.id)}
                                  title="Cancel Distribution"
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <>
                          <Separator />
                          <div className="space-y-3 pt-2">
                            {/* Profit Breakdown */}
                            <div>
                              <p className="text-sm font-medium mb-2">Profit Breakdown</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">Investment:</span>
                                  <span className="font-medium">{formatPKR(distribution.investmentAmount)}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">Sale Price Share:</span>
                                  <span className="font-medium">{formatPKR(distribution.salePrice)}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">Capital Gain:</span>
                                  <span className={distribution.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatPKR(distribution.capitalGain)}
                                  </span>
                                </div>
                                <div className="flex justify-between p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">Rental Income:</span>
                                  <span className="text-green-600">+{formatPKR(distribution.rentalIncome)}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-muted rounded">
                                  <span className="text-muted-foreground">Expenses:</span>
                                  <span className="text-red-600">-{formatPKR(distribution.totalExpenses)}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-primary/10 rounded">
                                  <span className="font-medium">Net Profit:</span>
                                  <span className={`font-bold ${distribution.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPKR(distribution.netProfit)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Payment Details */}
                            {distribution.distributionStatus === 'paid' && (
                              <div>
                                <p className="text-sm font-medium mb-2">Payment Details</p>
                                <div className="bg-muted rounded p-3 space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment Date:</span>
                                    <span>{formatDate(distribution.distributionDate)}</span>
                                  </div>
                                  {distribution.paymentMethod && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Payment Method:</span>
                                      <span>{distribution.paymentMethod}</span>
                                    </div>
                                  )}
                                  {distribution.paymentReference && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Reference:</span>
                                      <span>{distribution.paymentReference}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {distribution.notes && (
                              <div>
                                <p className="text-sm font-medium mb-1">Notes</p>
                                <p className="text-sm text-muted-foreground bg-muted rounded p-2">
                                  {distribution.notes}
                                </p>
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="text-xs text-muted-foreground">
                              Processed by {distribution.processedByName} on {formatDate(distribution.createdAt)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mark as Paid Modal */}
      {selectedDistribution && (
        <MarkDistributionPaidModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedDistribution(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedDistribution(null);
            onDistributionUpdated?.();
          }}
          distribution={selectedDistribution}
        />
      )}
    </>
  );
}

// Mark Distribution Paid Modal
interface MarkDistributionPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  distribution: InvestorDistribution;
}

function MarkDistributionPaidModal({
  isOpen,
  onClose,
  onSuccess,
  distribution,
}: MarkDistributionPaidModalProps) {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsSubmitting(true);

    try {
      markDistributionPaid(
        distribution.id,
        paymentDate,
        paymentMethod,
        paymentReference || undefined
      );

      toast.success('Distribution marked as paid');
      onSuccess();
    } catch (error) {
      console.error('Error marking distribution as paid:', error);
      toast.error('Failed to mark distribution as paid');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Distribution as Paid</DialogTitle>
          <DialogDescription>
            Record payment details for {distribution.investorName}'s distribution of {formatPKR(distribution.totalReturn)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentDate">
              Payment Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">
              Payment Method <span className="text-destructive">*</span>
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Online Payment">Online Payment</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentReference">Payment Reference</Label>
            <Input
              id="paymentReference"
              placeholder="e.g., Transaction ID, Check Number"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Mark as Paid'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
