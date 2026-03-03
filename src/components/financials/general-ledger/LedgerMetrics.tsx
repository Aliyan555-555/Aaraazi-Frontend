import React from 'react';
import { MetricCard } from '../../layout/MetricCard';
import { FileText, DollarSign, TrendingUp, TrendingDown, Scale, Calendar } from 'lucide-react';
import { formatPKR } from '../../../lib/currency';

interface LedgerMetricsProps {
  totalEntries: number;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  thisMonthEntries: number;
  lastEntryDate?: string;
}

/**
 * LedgerMetrics Component
 * 
 * Displays key general ledger metrics in a grid of MetricCard components.
 * Shows max 6 metrics (Miller's Law: 7±2).
 * 
 * Design System Compliant:
 * - Uses MetricCard from /components/layout/
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Miller's Law: Max 6 metrics (within 7±2)
 * - Aesthetic-Usability: Consistent card design
 * 
 * @example
 * <LedgerMetrics
 *   totalEntries={450}
 *   totalDebits={15000000}
 *   totalCredits={14500000}
 *   netBalance={500000}
 *   thisMonthEntries={45}
 *   lastEntryDate="2024-12-15"
 * />
 */
export const LedgerMetrics: React.FC<LedgerMetricsProps> = ({
  totalEntries,
  totalDebits,
  totalCredits,
  netBalance,
  thisMonthEntries,
  lastEntryDate,
}) => {
  const isBalanced = Math.abs(totalDebits - totalCredits) < 1; // Within 1 PKR tolerance
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Total Entries */}
      <MetricCard
        label="Total Entries"
        value={totalEntries}
        icon={<FileText className="h-5 w-5" />}
        variant="default"
      />

      {/* Total Debits */}
      <MetricCard
        label="Total Debits"
        value={formatPKR(totalDebits)}
        icon={<TrendingUp className="h-5 w-5" />}
        variant="info"
      />

      {/* Total Credits */}
      <MetricCard
        label="Total Credits"
        value={formatPKR(totalCredits)}
        icon={<TrendingDown className="h-5 w-5" />}
        variant="success"
      />

      {/* Net Balance */}
      <MetricCard
        label="Net Balance"
        value={formatPKR(netBalance)}
        icon={<DollarSign className="h-5 w-5" />}
        variant={netBalance > 0 ? "success" : netBalance < 0 ? "warning" : "default"}
      />

      {/* Balance Status */}
      <MetricCard
        label="Ledger Status"
        value={isBalanced ? "Balanced" : "Unbalanced"}
        icon={<Scale className="h-5 w-5" />}
        variant={isBalanced ? "success" : "danger"}
      />

      {/* This Month */}
      <MetricCard
        label="This Month"
        value={`${thisMonthEntries} entries`}
        icon={<Calendar className="h-5 w-5" />}
        variant="default"
      />
    </div>
  );
};
