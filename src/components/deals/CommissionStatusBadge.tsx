/**
 * CommissionStatusBadge Component
 * 
 * Displays commission status with appropriate color coding
 * following Design System V4.1 guidelines
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  XCircle, 
  Pause,
  AlertCircle 
} from 'lucide-react';

export type CommissionStatus = 
  | 'pending'
  | 'pending-approval'
  | 'approved'
  | 'paid'
  | 'cancelled'
  | 'on-hold';

interface CommissionStatusBadgeProps {
  status: CommissionStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CommissionStatusBadge({ 
  status, 
  showIcon = true,
  size = 'md' 
}: CommissionStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: <Clock className="h-3 w-3" />
        };
      case 'pending-approval':
        return {
          label: 'Pending Approval',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: <AlertCircle className="h-3 w-3" />
        };
      case 'approved':
        return {
          label: 'Approved',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <CheckCircle2 className="h-3 w-3" />
        };
      case 'paid':
        return {
          label: 'Paid',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 border-green-300',
          icon: <DollarSign className="h-3 w-3" />
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          variant: 'secondary' as const,
          className: 'bg-red-100 text-red-800 border-red-300',
          icon: <XCircle className="h-3 w-3" />
        };
      case 'on-hold':
        return {
          label: 'On Hold',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-600 border-gray-300',
          icon: <Pause className="h-3 w-3" />
        };
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: <Clock className="h-3 w-3" />
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} border inline-flex items-center gap-1.5`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
