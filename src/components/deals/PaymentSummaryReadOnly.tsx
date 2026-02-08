import React from 'react';
import { Deal } from '../../types/deals';
import { formatPKR } from '../../lib/currency';
import { getPaymentSummary } from '../../lib/dealPayments';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye
} from 'lucide-react';

interface PaymentSummaryReadOnlyProps {
  deal: Deal;
  onViewFullDetails?: () => void;
  compact?: boolean;
}

export const PaymentSummaryReadOnly: React.FC<PaymentSummaryReadOnlyProps> = ({
  deal,
  onViewFullDetails,
  compact = false,
}) => {
  const summary = getPaymentSummary(deal.id);

  const getPaymentStateInfo = () => {
    switch (summary.paymentPlanStatus) {
      case 'no-plan':
        return {
          label: 'No Payment Plan',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          icon: Clock,
        };
      case 'plan-draft':
        return {
          label: 'Plan Draft',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: DollarSign,
        };
      case 'plan-active':
        return {
          label: 'Plan Active',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: TrendingUp,
        };
      case 'plan-modified':
        return {
          label: 'Plan Modified',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          icon: AlertCircle,
        };
      case 'fully-paid':
        return {
          label: 'Fully Paid',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: CheckCircle2,
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          icon: Clock,
        };
    }
  };

  const stateInfo = getPaymentStateInfo();
  const StateIcon = stateInfo.icon;

  if (compact) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${stateInfo.bgColor}`}>
              <DollarSign className={`h-4 w-4 ${stateInfo.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium">Payment Status</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StateIcon className={`h-3 w-3 ${stateInfo.color}`} />
                <span className={`text-xs ${stateInfo.color}`}>{stateInfo.label}</span>
              </div>
            </div>
          </div>

          {onViewFullDetails && (
            <Button variant="ghost" size="sm" onClick={onViewFullDetails}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>

        {summary.paymentPlanStatus !== 'no-plan' && (
          <>
            <Progress value={summary.percentagePaid} className="h-1.5" />

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-medium">{formatPKR(summary.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-green-700">Received</p>
                <p className="text-sm font-medium text-green-600">{formatPKR(summary.totalPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-orange-700">Pending</p>
                <p className="text-sm font-medium text-orange-600">{formatPKR(summary.totalPending)}</p>
              </div>
            </div>

            {summary.overduePayments.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                <AlertCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                <span className="text-red-900">
                  {summary.overduePayments.length} payment{summary.overduePayments.length !== 1 ? 's' : ''} overdue
                </span>
              </div>
            )}
          </>
        )}

        {summary.paymentPlanStatus === 'no-plan' && summary.totalPaid > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            {formatPKR(summary.totalPaid)} received (ad-hoc)
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${stateInfo.bgColor}`}>
            <DollarSign className={`h-5 w-5 ${stateInfo.color}`} />
          </div>
          <div>
            <h3 className="font-medium">Payment Summary</h3>
            <div className="flex items-center gap-2 mt-1">
              <StateIcon className={`h-4 w-4 ${stateInfo.color}`} />
              <span className={`text-sm ${stateInfo.color}`}>{stateInfo.label}</span>
            </div>
          </div>
        </div>

        {onViewFullDetails && (
          <Button variant="outline" size="sm" onClick={onViewFullDetails}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
      </div>

      {/* No Plan State */}
      {summary.paymentPlanStatus === 'no-plan' && (
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-1">No Payment Plan Created</p>
              <p className="text-sm text-muted-foreground">
                Payment plan will be created during the Sales Agreement stage in the Deal.
              </p>
            </div>
          </div>

          {summary.totalPaid > 0 && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ad-Hoc Payments Received</span>
                <span className="font-medium text-green-600">{formatPKR(summary.totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance Remaining</span>
                <span className="font-medium">{formatPKR(summary.totalPending)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* With Plan State */}
      {summary.paymentPlanStatus !== 'no-plan' && (
        <>
          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-medium">{summary.percentagePaid.toFixed(1)}%</span>
            </div>
            <Progress value={summary.percentagePaid} className="h-2" />
          </div>

          {/* Amount Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
              <p className="font-medium">{formatPKR(summary.totalAmount)}</p>
            </div>

            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-700">Received</p>
              </div>
              <p className="font-medium text-green-600">{formatPKR(summary.totalPaid)}</p>
            </div>

            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="h-3 w-3 text-orange-600" />
                <p className="text-xs text-orange-700">Pending</p>
              </div>
              <p className="font-medium text-orange-600">{formatPKR(summary.totalPending)}</p>
            </div>
          </div>

          {/* Next Payment Due */}
          {summary.nextPaymentDue && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 mb-1">Next Payment Due</p>
                  <p className="text-sm text-blue-700 mb-2">{summary.nextPaymentDue.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600">Amount</p>
                      <p className="font-medium text-blue-900">{formatPKR(summary.nextPaymentDue.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-600">Due Date</p>
                      <p className="font-medium text-blue-900">
                        {new Date(summary.nextPaymentDue.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overdue Payments */}
          {summary.overduePayments.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-red-900">Overdue Payments</p>
                    <Badge className="bg-red-600">{summary.overduePayments.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {summary.overduePayments.slice(0, 2).map((overdue) => (
                      <div key={overdue.id} className="flex items-center justify-between text-sm">
                        <span className="text-red-700">{overdue.description}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-red-900">{formatPKR(overdue.amount)}</span>
                          <span className="text-xs text-red-600">
                            {new Date(overdue.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {summary.overduePayments.length > 2 && (
                      <p className="text-xs text-red-600 text-center pt-2">
                        +{summary.overduePayments.length - 2} more overdue
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fully Paid State */}
          {summary.paymentPlanStatus === 'fully-paid' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Payment Complete</p>
                  <p className="text-sm text-green-700">All payments have been received</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Full Details Link */}
      {onViewFullDetails && (
        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewFullDetails}
            className="w-full"
          >
            View Full Payment Details
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};
