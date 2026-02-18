import React from 'react';
import { Deal } from '../../types/deals';
import { formatPKR } from '../../lib/currency';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Receipt,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  Download,
  Eye,
  Printer
} from 'lucide-react';
import { viewReceipt } from '@/lib/receiptGeneration';
import { toast } from 'sonner';

interface PaymentHistoryProps {
  deal: Deal;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ deal }) => {
  const payments = deal.financial.payments;

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-2">No Payments Recorded</h3>
        <p className="text-sm text-muted-foreground">
          Payment history will appear here once payments are recorded
        </p>
      </div>
    );
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'cheque':
        return <FileText className="h-4 w-4" />;
      case 'bank-transfer':
      case 'online':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'token':
        return 'Token Money';
      case 'down-payment':
        return 'Down Payment';
      case 'installment':
        return 'Installment';
      case 'final-payment':
        return 'Final Payment';
      case 'ad-hoc':
        return 'Ad-Hoc Payment';
      default:
        return type;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'cheque':
        return 'Cheque';
      case 'bank-transfer':
        return 'Bank Transfer';
      case 'online':
        return 'Online Payment';
      default:
        return method;
    }
  };

  // Sort payments by date (most recent first)
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.paidDate ?? 0).getTime() - new Date(a.paidDate ?? 0).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Payment History</h3>
          <p className="text-sm text-muted-foreground">
            {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Received</p>
          <p className="font-medium text-green-600">{formatPKR(deal.financial.totalPaid)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedPayments.map((payment) => {
          // Find linked installment if exists
          const linkedInstallment = payment.installmentId
            ? deal.financial.paymentPlan?.installments.find(i => i.id === payment.installmentId)
            : undefined;

          return (
            <div
              key={payment.id}
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Receipt className="h-4 w-4 text-green-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{formatPKR(payment.amount)}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getPaymentTypeLabel(payment.type ?? 'ad-hoc')}
                      </Badge>
                    </div>

                    {linkedInstallment && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Against: {linkedInstallment.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(payment.paidDate ?? new Date()).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {getPaymentMethodIcon(payment.paymentMethod ?? 'unknown')}
                        <span>{getPaymentMethodLabel(payment.paymentMethod ?? 'unknown')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Badge className="bg-green-600">Recorded</Badge>
              </div>

              {/* Payment Details */}
              <div className="border-t pt-3 space-y-2 text-sm">
                {payment.receiptNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receipt #</span>
                    <span className="font-mono">{payment.receiptNumber}</span>
                  </div>
                )}

                {payment.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference #</span>
                    <span className="font-mono">{payment.referenceNumber}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recorded By</span>
                  <span>{typeof payment.recordedBy === 'string' ? payment.recordedBy : payment.recordedBy.agentName}</span>
                </div>

                {payment.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{payment.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          await viewReceipt(deal.id, payment.id);
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to view receipt');
                        }
                      }}
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      View Receipt
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          await viewReceipt(deal.id, payment.id);
                          toast.success('Receipt opened in new window');
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to print receipt');
                        }
                      }}
                    >
                      <Printer className="h-3 w-3 mr-2" />
                      Print
                    </Button>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};