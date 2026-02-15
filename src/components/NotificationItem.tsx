/**
 * Notification Item - V3.0
 * Individual notification card component
 */

import React from 'react';
import { Notification } from '../types/notifications';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
// [STUBBED] import {
// [STUBBED]   getRelativeTime,
// [STUBBED]   getPriorityColor,
// [STUBBED]   getTypeIcon
// [STUBBED] } from '../lib/notifications';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  Undo,
  Home,
  Activity,
  RotateCcw,
  TrendingUp,
  UserPlus,
  GitBranch,
  Trophy,
  Bell,
  Calendar,
  MessageSquare,
  Clock,
  Coins,
  AlertCircle,
  AlertTriangle,
  FileText,
  FileCheck,
  FileX,
  Target,
  Info,
  Shield,
  Mail,
  Check,
  Archive,
  Eye,
} from 'lucide-react';

// ===== STUBS for removed prototype functions =====
const getRelativeTime = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getPriorityColor = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getTypeIcon = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
  onMarkAsRead?: () => void;
  onArchive?: () => void;
  onClick?: () => void;
}

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  Undo,
  Home,
  Activity,
  RotateCcw,
  TrendingUp,
  UserPlus,
  GitBranch,
  Trophy,
  Bell,
  Calendar,
  MessageSquare,
  Clock,
  Coins,
  AlertCircle,
  AlertTriangle,
  FileText,
  FileCheck,
  FileX,
  Target,
  Info,
  Shield,
  Mail,
};

export function NotificationItem({
  notification,
  compact = false,
  onMarkAsRead,
  onArchive,
  onClick,
}: NotificationItemProps) {
  const iconName = getTypeIcon(notification.type);
  const IconComponent = iconComponents[iconName] || Bell;
  const priorityColor = getPriorityColor(notification.priority);

  const getPriorityBadgeColor = (priority: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-500',
      HIGH: 'bg-orange-500',
      MEDIUM: 'bg-blue-500',
      LOW: 'bg-gray-400',
    };
    return colors[priority] || 'bg-gray-400';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`rounded-full p-2 ${priorityColor}`}>
            <IconComponent className="h-4 w-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm line-clamp-1">{notification.title}</p>
              {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getRelativeTime(notification.timestamp)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        } hover:shadow-md cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Priority Indicator & Icon */}
        <div className="relative">
          <div className={`rounded-full p-3 ${priorityColor}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div
            className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${getPriorityBadgeColor(notification.priority)}`}
            title={notification.priority}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium">{notification.title}</h4>
            {!notification.read && (
              <Badge variant="default" className="bg-blue-500 text-white text-xs">
                New
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            {notification.message}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span>{getRelativeTime(notification.timestamp)}</span>
            {notification.entityType && (
              <>
                <span>•</span>
                <span className="capitalize">{notification.entityType}</span>
              </>
            )}
            <span>•</span>
            <Badge
              variant="outline"
              className={`text-xs ${getPriorityBadgeColor(notification.priority)} text-white border-none`}
            >
              {notification.priority}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {notification.actionLabel && (
              <Button
                size="sm"
                variant="default"
                className="text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                {notification.actionLabel}
              </Button>
            )}

            {!notification.read && onMarkAsRead && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead();
                }}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark as Read
              </Button>
            )}

            {onArchive && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive();
                }}
              >
                <Archive className="h-3 w-3 mr-1" />
                Archive
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
