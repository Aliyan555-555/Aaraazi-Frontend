/**
 * PerformanceCard Component
 * 
 * Displays a performance metric with mini chart and trend.
 * 
 * FEATURES:
 * - Large metric value
 * - Trend indicator (up/down %)
 * - Mini chart (sparkline/bar)
 * - Comparison text
 * - Color-coded by trend
 * 
 * DESIGN:
 * - Follows Design System
 * - Brand colors (Forest Green, Terracotta)
 * - NO Tailwind typography classes
 * 
 * CHARTS:
 * - Uses Recharts for mini charts
 * - Sparkline for trends
 * - Bar chart for comparisons
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer } from 'recharts';

export type TrendDirection = 'up' | 'down' | 'neutral';
export type ChartType = 'line' | 'bar' | 'none';

export interface PerformanceMetric {
  id: string;
  title: string;
  value: string | number;           // Main value (e.g., "5,234" or "87%")
  unit?: string;                     // Unit (e.g., "PKR", "%", "days")
  trend: TrendDirection;
  trendValue: number;                // Percentage change (e.g., 12.5)
  comparison?: string;               // Text comparison (e.g., "vs last week")
  chartType: ChartType;
  chartData?: Array<{ value: number; label?: string }>;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  loading?: boolean;
}

interface PerformanceCardProps {
  metric: PerformanceMetric;
  size?: 'default' | 'large';
}

/**
 * Get trend color based on direction
 */
function getTrendColor(trend: TrendDirection): {
  text: string;
  bg: string;
  icon: string;
} {
  switch (trend) {
    case 'up':
      return {
        text: 'text-[#2D6A54]',
        bg: 'bg-[#2D6A54]/10',
        icon: 'text-[#2D6A54]',
      };
    case 'down':
      return {
        text: 'text-[#d4183d]',
        bg: 'bg-[#d4183d]/10',
        icon: 'text-[#d4183d]',
      };
    case 'neutral':
      return {
        text: 'text-[#6B7280]',
        bg: 'bg-[#E8E2D5]',
        icon: 'text-[#6B7280]',
      };
  }
}

/**
 * Get trend icon
 */
function getTrendIcon(trend: TrendDirection): LucideIcon {
  switch (trend) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    case 'neutral':
      return Minus;
  }
}

/**
 * Mini Line Chart (Sparkline)
 */
const MiniLineChart: React.FC<{ data: Array<{ value: number }> }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="#2D6A54"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Mini Bar Chart
 */
const MiniBarChart: React.FC<{ data: Array<{ value: number }> }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <BarChart data={data}>
        <Bar dataKey="value" fill="#2D6A54" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Loading Skeleton
 */
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
      <div className="h-12 bg-gray-100 rounded animate-pulse" />
    </div>
  );
};

/**
 * PerformanceCard Component
 */
export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  metric,
  size = 'default',
}) => {
  const {
    title,
    value,
    unit,
    trend,
    trendValue,
    comparison,
    chartType,
    chartData = [],
    icon: Icon,
    iconColor,
    iconBgColor,
    loading = false,
  } = metric;

  const trendColors = getTrendColor(trend);
  const TrendIcon = getTrendIcon(trend);
  const isLarge = size === 'large';

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-[#E8E2D5] ${isLarge ? 'p-6' : 'p-5'}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-lg border border-[#E8E2D5]
        ${isLarge ? 'p-6' : 'p-5'}
        hover:border-[#2D6A54] hover:shadow-md
        transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        {/* Title */}
        <div className="flex-1">
          <h3 className="text-[#6B7280] mb-1" style={{ fontSize: 'var(--text-sm)' }}>
            {title}
          </h3>
        </div>

        {/* Icon (optional) */}
        {Icon && iconColor && iconBgColor && (
          <div className={`${iconBgColor} w-8 h-8 rounded-lg flex items-center justify-center`}>
            <Icon className={`${iconColor} h-4 w-4`} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className={`text-[#1A1D1F] flex items-baseline gap-1`} style={{ fontSize: isLarge ? 'var(--text-3xl)' : 'var(--text-2xl)' }}>
          <span>{value}</span>
          {unit && (
            <span className="text-[#6B7280]" style={{ fontSize: 'var(--text-sm)' }}>
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`${trendColors.bg} px-2 py-1 rounded flex items-center gap-1`}>
          <TrendIcon className={`${trendColors.icon} h-3 w-3`} />
          <span className={trendColors.text} style={{ fontSize: 'var(--text-xs)' }}>
            {trendValue > 0 ? '+' : ''}{trendValue}%
          </span>
        </div>
        {comparison && (
          <span className="text-[#6B7280]" style={{ fontSize: 'var(--text-xs)' }}>
            {comparison}
          </span>
        )}
      </div>

      {/* Chart */}
      {chartType !== 'none' && chartData.length > 0 && (
        <div className="mt-4">
          {chartType === 'line' && <MiniLineChart data={chartData} />}
          {chartType === 'bar' && <MiniBarChart data={chartData} />}
        </div>
      )}
    </div>
  );
};
