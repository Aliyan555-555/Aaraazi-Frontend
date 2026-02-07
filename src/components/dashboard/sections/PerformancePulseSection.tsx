/**
 * PerformancePulseSection Component
 * 
 * Displays performance metrics with charts and trends.
 * 
 * FEATURES:
 * - 8 performance metric cards
 * - Mini charts (sparklines/bars)
 * - Trend indicators
 * - Responsive grid layout
 * - Loading states
 * 
 * DESIGN:
 * - Follows Design System V4.1
 * - Brand colors (Forest Green, Terracotta)
 * - NO Tailwind typography classes
 * 
 * UX LAWS:
 * - Miller's Law: Show 8 metrics (7±2)
 * - Aesthetic-Usability: Clean charts
 */

import React from 'react';
import { User } from '../../../types';
import { PerformanceCard } from '../components/PerformanceCard';
import { usePerformanceData } from '../hooks/usePerformanceData';
import { Activity } from 'lucide-react';

interface PerformancePulseSectionProps {
  user: User;
}

/**
 * Loading state
 */
const LoadingState: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div
          key={i}
          className="bg-gray-100 rounded-lg h-48 animate-pulse"
        />
      ))}
    </div>
  );
};

/**
 * Error state
 */
const ErrorState: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="bg-destructive-bg border border-destructive-border rounded-lg p-6 text-center">
      <p className="text-destructive-foreground">
        {message}
      </p>
    </div>
  );
};

/**
 * PerformancePulseSection Component
 */
export const PerformancePulseSection: React.FC<PerformancePulseSectionProps> = ({
  user,
}) => {
  const { metrics, loading, error } = usePerformanceData(user);

  return (
    <section aria-labelledby="performance-pulse-title" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#2D6A54]/10">
            <Activity className="h-5 w-5 text-[#2D6A54]" />
          </div>
          <div>
            <h2 id="performance-pulse-title" className="text-[#1A1D1F]">
              Performance Pulse
            </h2>
            <p className="text-[#363F47]">
              Key metrics and trends for your business
            </p>
          </div>
        </div>

        {/* Optional: Time period selector */}
        <div className="hidden md:flex items-center gap-2 text-[#6B7280]">
          <span>Last 30 days</span>
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(metric => (
            <PerformanceCard
              key={metric.id}
              metric={metric}
              size="default"
            />
          ))}
        </div>
      )}

      {/* Insight */}
      {!loading && !error && metrics.length > 0 && (
        <div className="bg-[#2D6A54]/5 rounded-lg p-4 border border-[#2D6A54]/20">
          <p className="text-[#363F47]">
            <strong className="text-[#2D6A54]">💡 Insight:</strong> Your conversion rate is{' '}
            {metrics.find(m => m.id === 'conversion-rate')?.value}% and{' '}
            {metrics.find(m => m.id === 'weekly-activity')?.value} activities this week.
            {' '}Keep up the momentum!
          </p>
        </div>
      )}
    </section>
  );
};
