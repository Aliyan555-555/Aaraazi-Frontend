import React from 'react';
import { Deal } from '../../types';
import { formatPKR } from '../../lib/currency';
import { getPaymentSummary } from '../../lib/dealPayments';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Calendar,
  CheckCircle2,
  FileText,
  Clock
} from 'lucide-react';

interface PaymentSummaryCardProps {
  deal: Deal;
  onCreatePlan?: () => void;
  onRecordAdHoc?: () => void;
  onExport?: () => void;
  isPrimaryAgent: boolean;
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  deal,
  onCreatePlan,
  onRecordAdHoc,
  onExport,
  isPrimaryAgent,
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
          icon: FileText,
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

        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <FileText className="h-4 w-4 mr-2" />
            Export
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
              <p className="text-sm text-muted-foreground mb-3">
                Create a flexible payment plan during the Sales Agreement stage, or record ad-hoc payments as they come in.
              </p>
              
              {isPrimaryAgent && (
                <div className="flex gap-2">
                  {onCreatePlan && (
                    <Button onClick={onCreatePlan} size="sm">
                      Create Payment Plan
                    </Button>
                  )}
                  {onRecordAdHoc && (
                    <Button onClick={onRecordAdHoc} size="sm" variant="outline">
                      Record Ad-Hoc Payment
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Show basic totals even without plan */}
          {summary.totalPaid > 0 && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Received</span>
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
                        {new Date(summary.nextPaymentDue.dueDate).toLocaleDateString()}
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
                    {summary.overduePayments.slice(0, 3).map((overdue) => (
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
                    {summary.overduePayments.length > 3 && (
                      <p className="text-xs text-red-600 text-center pt-2">
                        +{summary.overduePayments.length - 3} more overdue
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

          {/* Actions */}
          {isPrimaryAgent && summary.paymentPlanStatus !== 'fully-paid' && onRecordAdHoc && (
            <div className="pt-2 border-t">
              <Button onClick={onRecordAdHoc} size="sm" variant="outline" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Record Ad-Hoc Payment
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
