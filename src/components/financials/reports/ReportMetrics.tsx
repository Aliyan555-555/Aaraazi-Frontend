import React from 'react';
import { MetricCard } from '../../layout/MetricCard';
import { FileText, Calendar, Download, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface ReportMetricsProps {
  totalReports: number;
  thisMonthReports: number;
  lastGeneratedDate?: string;
  favoriteReports: number;
  scheduledReports: number;
  exportCount: number;
}

/**
 * ReportMetrics Component
 * 
 * Displays key financial report metrics in a grid of MetricCard components.
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
 * <ReportMetrics
 *   totalReports={45}
 *   thisMonthReports={12}
 *   lastGeneratedDate="2024-12-15"
 *   favoriteReports={5}
 *   scheduledReports={3}
 *   exportCount={28}
 * />
 */
export const ReportMetrics: React.FC<ReportMetricsProps> = ({
  totalReports,
  thisMonthReports,
  lastGeneratedDate,
  favoriteReports,
  scheduledReports,
  exportCount,
}) => {
  const lastGeneratedText = lastGeneratedDate
    ? new Date(lastGeneratedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Never';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Total Reports */}
      <MetricCard
        label="Total Reports"
        value={totalReports}
        icon={<FileText className="h-5 w-5" />}
        variant="default"
      />

      {/* This Month */}
      <MetricCard
        label="This Month"
        value={thisMonthReports}
        icon={<Calendar className="h-5 w-5" />}
        variant="info"
      />

      {/* Last Generated */}
      <MetricCard
        label="Last Generated"
        value={lastGeneratedText}
        icon={<Clock className="h-5 w-5" />}
        variant="default"
      />

      {/* Favorites */}
      <MetricCard
        label="Favorite Reports"
        value={favoriteReports}
        icon={<CheckCircle className="h-5 w-5" />}
        variant="success"
      />

      {/* Scheduled */}
      <MetricCard
        label="Scheduled Reports"
        value={scheduledReports}
        icon={<TrendingUp className="h-5 w-5" />}
        variant="info"
      />

      {/* Exports */}
      <MetricCard
        label="Total Exports"
        value={exportCount}
        icon={<Download className="h-5 w-5" />}
        variant="default"
      />
    </div>
  );
};
