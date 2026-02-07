/**
 * OfferStatusBadge Component
 * Displays the status of cross-agent offers/applications with consistent styling
 * 
 * Features:
 * - Color-coded status badges
 * - Optional icon display
 * - Support for both offers and rental applications
 * - Hover tooltips with additional context
 */

import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, Send } from 'lucide-react';

type OfferStatus = 
  | 'pending' 
  | 'accepted' 
  | 'rejected' 
  | 'withdrawn' 
  | 'countered'
  | 'expired';

interface OfferStatusBadgeProps {
  status: OfferStatus | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<OfferStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}> = {
  pending: {
    label: 'Pending',
    color: '#C17052',
    bgColor: '#FFF5F1',
    borderColor: '#F4D5C8',
    icon: Clock,
    tooltip: 'Waiting for response from listing agent',
  },
  accepted: {
    label: 'Accepted',
    color: '#2D6A54',
    bgColor: '#F0F7F4',
    borderColor: '#C5E0D8',
    icon: CheckCircle2,
    tooltip: 'Offer has been accepted',
  },
  rejected: {
    label: 'Rejected',
    color: '#8B8B8B',
    bgColor: '#F5F5F5',
    borderColor: '#D9D9D9',
    icon: XCircle,
    tooltip: 'Offer was not accepted',
  },
  withdrawn: {
    label: 'Withdrawn',
    color: '#8B8B8B',
    bgColor: '#F5F5F5',
    borderColor: '#D9D9D9',
    icon: AlertCircle,
    tooltip: 'Offer was withdrawn',
  },
  countered: {
    label: 'Countered',
    color: '#6B9F8A',
    bgColor: '#F3F9F7',
    borderColor: '#D4EBE4',
    icon: Send,
    tooltip: 'Listing agent has made a counter offer',
  },
  expired: {
    label: 'Expired',
    color: '#8B8B8B',
    bgColor: '#F5F5F5',
    borderColor: '#D9D9D9',
    icon: AlertCircle,
    tooltip: 'Offer has expired',
  },
};

export const OfferStatusBadge: React.FC<OfferStatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  // Normalize status to lowercase for matching
  const normalizedStatus = status.toLowerCase() as OfferStatus;
  const config = statusConfig[normalizedStatus] || statusConfig.rejected;
  const Icon = config.icon;

  // Size configurations
  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      icon: 'h-3 w-3',
      gap: 'gap-1',
    },
    md: {
      container: 'px-2.5 py-1 text-sm',
      icon: 'h-3.5 w-3.5',
      gap: 'gap-1.5',
    },
    lg: {
      container: 'px-3 py-1.5 text-base',
      icon: 'h-4 w-4',
      gap: 'gap-2',
    },
  };

  const sizeConfig = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center ${sizeConfig.gap} ${sizeConfig.container} rounded-full font-medium border ${className}`}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
      title={config.tooltip}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      <span>{config.label}</span>
    </span>
  );
};

/**
 * OfferStatusIndicator - Alternative compact version with just a colored dot
 */
interface OfferStatusIndicatorProps {
  status: OfferStatus | string;
  size?: 'sm' | 'md' | 'lg';
  withLabel?: boolean;
  className?: string;
}

export const OfferStatusIndicator: React.FC<OfferStatusIndicatorProps> = ({
  status,
  size = 'md',
  withLabel = false,
  className = '',
}) => {
  const normalizedStatus = status.toLowerCase() as OfferStatus;
  const config = statusConfig[normalizedStatus] || statusConfig.rejected;

  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  if (withLabel) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`} title={config.tooltip}>
        <div
          className={`${dotSizes[size]} rounded-full`}
          style={{ backgroundColor: config.color }}
        />
        <span className="text-sm text-gray-700">{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`${dotSizes[size]} rounded-full ${className}`}
      style={{ backgroundColor: config.color }}
      title={`${config.label}: ${config.tooltip}`}
    />
  );
};

/**
 * OfferStatusTimeline - Shows progression through offer states
 */
interface OfferStatusTimelineProps {
  currentStatus: OfferStatus | string;
  submittedDate: string;
  responseDate?: string;
  className?: string;
}

export const OfferStatusTimeline: React.FC<OfferStatusTimelineProps> = ({
  currentStatus,
  submittedDate,
  responseDate,
  className = '',
}) => {
  const normalizedStatus = currentStatus.toLowerCase() as OfferStatus;
  const config = statusConfig[normalizedStatus] || statusConfig.rejected;

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Submitted */}
      <div className="flex items-center gap-2 text-sm">
        <div className="h-2 w-2 rounded-full bg-[#2D6A54]" />
        <span className="text-gray-600">Submitted</span>
        <span className="text-gray-400 text-xs ml-auto">{formatDate(submittedDate)}</span>
      </div>

      {/* Current Status */}
      {responseDate && (
        <div className="flex items-center gap-2 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-gray-900 font-medium">{config.label}</span>
          <span className="text-gray-400 text-xs ml-auto">{formatDate(responseDate)}</span>
        </div>
      )}

      {/* Pending indicator */}
      {!responseDate && normalizedStatus === 'pending' && (
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full border-2 border-[#C17052] animate-pulse" />
          <span className="text-gray-500 italic">Awaiting response...</span>
        </div>
      )}
    </div>
  );
};
