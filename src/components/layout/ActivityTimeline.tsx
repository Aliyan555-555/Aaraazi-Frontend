/**
 * ActivityTimeline - Display chronological activity feed
 * 
 * Features:
 * - Icon-based activity types
 * - Relative time display
 * - User attribution
 * - Clickable activities
 * - Empty state
 * 
 * Usage:
 * <ActivityTimeline
 *   activities={[
 *     {
 *       id: '1',
 *       type: 'offer',
 *       title: 'New offer received',
 *       description: 'PKR 5,000,000 from John Doe',
 *       date: '2024-12-27T10:30:00',
 *       user: 'Agent Name',
 *       icon: <FileText />
 *     }
 *   ]}
 * />
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Clock } from 'lucide-react';

export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  user?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface ActivityTimelineProps {
  activities: Activity[];
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export function ActivityTimeline({
  activities,
  title = 'Activity Timeline',
  emptyMessage = 'No activities yet',
  className = '',
}: ActivityTimelineProps) {
  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-base mb-6">{title}</h3>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex gap-4 pb-4 ${
                index < activities.length - 1 ? 'border-b border-gray-100' : ''
              } ${activity.onClick ? 'cursor-pointer hover:bg-gray-50 -mx-3 px-3 py-2 rounded-lg transition-colors' : ''}`}
              onClick={activity.onClick}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                {activity.icon || <Clock className="h-5 w-5 text-blue-600" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#030213]">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{formatRelativeTime(activity.date)}</span>
                  {activity.user && (
                    <>
                      <span>•</span>
                      <span>{activity.user}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
