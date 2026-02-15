'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { AuthUser } from '@/types/auth.types';
import type { User as UIUser } from '../types';
import { Notification } from '../types/notifications';
import { NotificationItem } from './NotificationItem';

const getNotifications = (..._args: any[]): any => { return []; };
const getUnreadCount = (..._args: any[]): any => { return 0; };
const markAsRead = (..._args: any[]): any => { };
const markAllAsRead = (..._args: any[]): any => { };
const archiveNotification = (..._args: any[]): any => { };
const autoCleanupOldNotifications = (..._args: any[]): any => { };


interface NotificationBellProps {
  user: UIUser | AuthUser | { id: string };
  onNavigate?: (entityType: string, entityId: string) => void;
  onOpenCenter?: () => void;
}

export function NotificationBell({ user, onNavigate, onOpenCenter }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    autoCleanupOldNotifications();

    // Set up periodic refresh
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = () => {
    const notifs = getNotifications(user.id);
    setNotifications(notifs.slice(0, 5)); // Show only 5 most recent in dropdown
    setUnreadCount(getUnreadCount(user.id));
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(user.id);
    loadNotifications();
  };

  const handleArchive = (notificationId: string) => {
    archiveNotification(notificationId);
    loadNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate if entity is provided
    if (notification.entityType && notification.entityId && onNavigate) {
      onNavigate(notification.entityType, notification.entityId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-medium">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length > 0 ? (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <NotificationItem
                      notification={notification}
                      compact
                      onMarkAsRead={() => handleMarkAsRead(notification.id)}
                      onArchive={() => handleArchive(notification.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCenter?.();
                }}
              >
                View All Notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
