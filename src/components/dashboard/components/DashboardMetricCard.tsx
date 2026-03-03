/**
 * DashboardMetricCard Component
 * 
 * Specialized metric card for dashboard with brand colors.
 * Extended from ui/metric-card.tsx with dashboard-specific styling.
 * 
 * FEATURES:
 * - Brand color variants (Forest Green, Terracotta, Slate)
 * - Large value display
 * - Trend indicators
 * - Clickable
 * - Responsive
 * 
 * Design System:
 * - NO Tailwind typography classes (uses globals.css)
 * - Brand colors: #2D6A54 (Forest Green), #C17052 (Terracotta), #363F47 (Slate)
 * - Warm Cream background on hover: #E8E2D5
 * - 8px spacing grid
 * 
 * UX LAWS:
 * - Fitts's Law: Large click target (min 120x100px)
 * - Aesthetic-Usability: Beautiful, professional design
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Trend {
  direction: 'up' | 'down' | 'neutral';
  value: string | number;
}

interface DashboardMetricCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: Trend;
  comparison?: string;
  color?: 'forestGreen' | 'terracotta' | 'slate';
  onClick?: () => void;
  loading?: boolean;
}

/**
 * Brand color configuration
 */
const colorConfig = {
  forestGreen: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    border: 'border-border',
    hoverBorder: 'hover:border-primary',
  },
  terracotta: {
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    border: 'border-border',
    hoverBorder: 'hover:border-secondary',
  },
  slate: {
    iconBg: 'bg-muted/10',
    iconColor: 'text-muted-foreground',
    border: 'border-border',
    hoverBorder: 'hover:border-muted-foreground',
  },
};

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  comparison,
  color = 'slate',
  onClick,
  loading = false,
}) => {
  const colors = colorConfig[color];

  // Trend styling
  const getTrendClasses = (direction: Trend['direction']) => {
    switch (direction) {
      case 'up':
        return 'text-primary bg-primary/10';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-muted-foreground bg-muted/10';
    }
  };

  const getTrendIcon = (direction: Trend['direction']) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-[#E8E2D5] rounded-lg p-6 min-h-[140px]">
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-24 h-4 bg-[#E8E2D5] rounded" />
            <div className="w-12 h-12 bg-[#E8E2D5] rounded-lg" />
          </div>
          <div className="w-32 h-8 bg-[#E8E2D5] rounded mb-2" />
          <div className="w-20 h-3 bg-[#E8E2D5] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white 
        border ${colors.border} 
        rounded-lg 
        p-6 
        transition-all 
        duration-200
        min-h-[140px]
        ${onClick ? `cursor-pointer ${colors.hoverBorder} hover:shadow-md` : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }
          : undefined
      }
      aria-label={onClick ? `View ${label} details` : undefined}
    >
      {/* Header: Label and Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-[#363F47]">
          <small>{label}</small>
        </div>
        {icon && (
          <div
            className={`
              w-12 h-12 
              ${colors.iconBg} 
              rounded-lg 
              flex items-center justify-center 
              ${colors.iconColor}
            `}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <h3 className="text-[#1A1D1F]">{value}</h3>
      </div>

      {/* Trend & Comparison */}
      {(trend || comparison) && (
        <div className="flex items-center gap-2 flex-wrap">
          {trend && (
            <div
              className={`
                inline-flex items-center gap-1 
                px-2 py-0.5 
                rounded-full 
                ${getTrendClasses(trend.direction)}
              `}
            >
              {getTrendIcon(trend.direction)}
              <small>
                {typeof trend.value === 'number'
                  ? `${trend.value}%`
                  : trend.value}
              </small>
            </div>
          )}
          {comparison && (
            <small className="text-[#363F47]">{comparison}</small>
          )}
        </div>
      )}
    </div>
  );
};
