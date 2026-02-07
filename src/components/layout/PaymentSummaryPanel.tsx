/**
 * PaymentSummaryPanel - Reusable payment summary with progress
 * 
 * Features:
 * - Total/Paid/Pending metric cards
 * - Progress bar visualization
 * - Next payment due display
 * - Consistent styling
 * 
 * Usage:
 * <PaymentSummaryPanel
 *   totalAmount={5000000}
 *   paidAmount={3000000}
 *   pendingAmount={2000000}
 *   nextPayment={{ amount: 500000, dueDate: '2024-02-15' }}
 * />
 */

import React from 'react';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';
import { MetricCard } from '../ui/metric-card';
import { formatPKR } from '../../lib/currency';

export interface NextPayment {
  amount: number;
  dueDate: string;
  description?: string;
}

export interface PaymentSummaryPanelProps {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  nextPayment?: NextPayment;
  title?: string;
  className?: string;
}

export function PaymentSummaryPanel({
  totalAmount,
  paidAmount,
  pendingAmount,
  nextPayment,
  title = 'Payment Summary',
  className = '',
}: PaymentSummaryPanelProps) {
  // Calculate payment progress percentage
  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-base mb-4">{title}</h3>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Total Amount"
          value={formatPKR(totalAmount)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="info"
        />
        <MetricCard
          label="Paid"
          value={formatPKR(paidAmount)}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
        <MetricCard
          label="Pending"
          value={formatPKR(pendingAmount)}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Payment Progress</span>
          <span className="font-medium">{Math.round(paymentProgress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${paymentProgress}%` }}
          />
        </div>
      </div>

      {/* Next Payment Due */}
      {nextPayment && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Next Payment Due
          </p>
          <p className="text-lg font-medium text-[#030213]">
            {formatPKR(nextPayment.amount)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Due: {formatDate(nextPayment.dueDate)}
          </p>
          {nextPayment.description && (
            <p className="text-xs text-gray-500 mt-1">{nextPayment.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
