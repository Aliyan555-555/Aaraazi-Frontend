/**
 * CommissionCalculator - Display commission breakdown
 * 
 * Features:
 * - Commission calculation display
 * - Percentage vs fixed amount
 * - Net amount calculation
 * - Tax/deduction breakdown
 * - Split commission (if applicable)
 * 
 * Usage:
 * <CommissionCalculator
 *   totalAmount={5000000}
 *   commissionType="percentage"
 *   commissionRate={2}
 *   splitPercentage={50}
 *   agentName="John Doe"
 *   taxRate={5}
 * />
 */

import React from 'react';
import { InfoPanel } from '../ui/info-panel';
import {
  DollarSign,
  Percent,
  TrendingUp,
  Users,
  Calculator,
  Receipt,
} from 'lucide-react';
import { formatPKR } from '../../lib/currency';

export interface CommissionCalculatorProps {
  totalAmount: number;
  commissionType: 'percentage' | 'fixed';
  commissionRate: number; // Percentage or fixed amount
  splitPercentage?: number; // If commission is split between agents (0-100)
  agentName?: string;
  coAgentName?: string;
  taxRate?: number; // Tax percentage (e.g., 5 for 5%)
  otherDeductions?: number; // Other deductions amount
  title?: string;
  className?: string;
}

export function CommissionCalculator({
  totalAmount,
  commissionType,
  commissionRate,
  splitPercentage,
  agentName = 'Agent',
  coAgentName = 'Co-Agent',
  taxRate = 0,
  otherDeductions = 0,
  title = 'Commission Breakdown',
  className = '',
}: CommissionCalculatorProps) {
  // Calculate gross commission
  const grossCommission =
    commissionType === 'percentage'
      ? (totalAmount * commissionRate) / 100
      : commissionRate;

  // Calculate tax
  const taxAmount = (grossCommission * taxRate) / 100;

  // Calculate net commission (after tax and deductions)
  const netCommission = grossCommission - taxAmount - otherDeductions;

  // Calculate split amounts
  const agent1Amount = splitPercentage
    ? (netCommission * splitPercentage) / 100
    : netCommission;
  const agent2Amount = splitPercentage
    ? (netCommission * (100 - splitPercentage)) / 100
    : 0;

  // Format percentage display
  const commissionDisplay =
    commissionType === 'percentage'
      ? `${commissionRate}%`
      : formatPKR(commissionRate);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Commission Panel */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-green-600" />
          <h3 className="text-base font-medium text-[#030213]">{title}</h3>
        </div>

        <div className="space-y-4">
          {/* Total Amount */}
          <div className="flex items-center justify-between pb-3 border-b border-green-200">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Transaction Amount</span>
            </div>
            <span className="text-lg font-semibold text-[#030213]">
              {formatPKR(totalAmount)}
            </span>
          </div>

          {/* Commission Rate */}
          <div className="flex items-center justify-between pb-3 border-b border-green-200">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Commission Rate</span>
            </div>
            <span className="font-medium text-[#030213]">{commissionDisplay}</span>
          </div>

          {/* Gross Commission */}
          <div className="flex items-center justify-between pb-3 border-b border-green-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Gross Commission</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {formatPKR(grossCommission)}
            </span>
          </div>

          {/* Tax (if applicable) */}
          {taxRate > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Tax ({taxRate}%)</span>
              </div>
              <span className="text-red-600">- {formatPKR(taxAmount)}</span>
            </div>
          )}

          {/* Other Deductions */}
          {otherDeductions > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Other Deductions</span>
              </div>
              <span className="text-red-600">- {formatPKR(otherDeductions)}</span>
            </div>
          )}

          {/* Net Commission */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-green-300">
            <span className="text-sm font-semibold text-gray-900">
              Net Commission
            </span>
            <span className="text-2xl font-bold text-green-700">
              {formatPKR(netCommission)}
            </span>
          </div>
        </div>
      </div>

      {/* Split Commission (if applicable) */}
      {splitPercentage && splitPercentage > 0 && splitPercentage < 100 && (
        <InfoPanel
          title="Commission Split"
          data={[
            {
              label: agentName,
              value: formatPKR(agent1Amount),
              icon: <Users className="h-4 w-4" />,
              description: `${splitPercentage}% of net commission`,
            },
            {
              label: coAgentName,
              value: formatPKR(agent2Amount),
              icon: <Users className="h-4 w-4" />,
              description: `${100 - splitPercentage}% of net commission`,
            },
          ]}
          columns={2}
          density="comfortable"
        />
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Commission Rate</p>
          <p className="text-lg font-bold text-[#030213]">
            {commissionType === 'percentage' ? `${commissionRate}%` : 'Fixed'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Gross Amount</p>
          <p className="text-lg font-bold text-green-600">
            {formatPKR(grossCommission)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Net Amount</p>
          <p className="text-lg font-bold text-blue-600">
            {formatPKR(netCommission)}
          </p>
        </div>
      </div>
    </div>
  );
}
