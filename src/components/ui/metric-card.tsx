/**
 * MetricCard - Display key metrics with trends
 * 
 * Features:
 * - Large value display
 * - Trend indicator (up/down/neutral)
 * - Comparison text
 * - Icon support
 * - Clickable
 * - Loading state
 * - Color variants
 * 
 * Usage:
 * <MetricCard
 *   label="Total Properties"
 *   value={150}
 *   icon={<Home />}
 *   trend={{ direction: 'up', value: 12 }}
 *   comparison="vs last month"
 *   onClick={() => navigate('/properties')}
 * />
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardTrend {
  direction: 'up' | 'down' | 'neutral';
  value: number | string;
}

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: MetricCardTrend;
  comparison?: string;
  onClick?: () => void;
  loading?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  trend,
  comparison,
  onClick,
  loading = false,
  variant = 'default',
  className = '',
}: MetricCardProps) {
  // Variant classes
  const variantClasses = {
    default: {
      bg: 'bg-white',
      border: 'border-gray-200',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      hover: onClick ? 'hover:border-gray-300 hover:shadow-md' : '',
    },
    success: {
      bg: 'bg-white',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      hover: onClick ? 'hover:border-green-300 hover:shadow-md' : '',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      hover: onClick ? 'hover:border-yellow-300 hover:shadow-md' : '',
    },
    danger: {
      bg: 'bg-white',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      hover: onClick ? 'hover:border-red-300 hover:shadow-md' : '',
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      hover: onClick ? 'hover:border-blue-300 hover:shadow-md' : '',
    },
  };

  // Safeguard: fallback to default if variant doesn't exist
  const classes = variantClasses[variant] || variantClasses.default;

  // Trend color classes
  const getTrendClasses = (direction: MetricCardTrend['direction']) => {
    switch (direction) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Trend icon
  const getTrendIcon = (direction: MetricCardTrend['direction']) => {
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
      <div
        className={`${classes.bg} border ${classes.border} rounded-lg p-6 ${className}`}
      >
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className={`w-10 h-10 ${classes.iconBg} rounded-lg`} />
          </div>
          <div className="w-32 h-8 bg-gray-200 rounded mb-2" />
          <div className="w-20 h-3 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${classes.bg} border ${classes.border} rounded-lg p-6 transition-all ${
        classes.hover
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm text-gray-600">{label}</div>
        {icon && (
          <div
            className={`w-10 h-10 ${classes.iconBg} rounded-lg flex items-center justify-center ${classes.iconColor}`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className="text-3xl font-semibold text-[#030213]">{value}</div>
      </div>

      {/* Trend & Comparison */}
      {(trend || comparison) && (
        <div className="flex items-center gap-2">
          {trend && (
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTrendClasses(
                trend.direction
              )}`}
            >
              {getTrendIcon(trend.direction)}
              <span>
                {typeof trend.value === 'number'
                  ? `${trend.value}%`
                  : trend.value}
              </span>
            </div>
          )}
          {comparison && (
            <span className="text-xs text-gray-500">{comparison}</span>
          )}
        </div>
      )}
    </div>
  );
}