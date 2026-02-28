/**
 * Notification Center - V3.0
 * Full-featured notification management interface
 */

import { useState, useEffect } from 'react';
import { User } from '../types';
import { Notification, NotificationType, NotificationPriority } from '../types/notifications';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Bell,
  Search,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  Settings,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
// [STUBBED] import {
// [STUBBED]   getNotifications,
// [STUBBED]   filterNotifications,
// [STUBBED]   getNotificationStats,
// [STUBBED]   markAsRead,
// [STUBBED]   markAllAsRead,
// [STUBBED]   archiveNotification,
// [STUBBED]   bulkArchive,
// [STUBBED]   bulkDelete,
// [STUBBED] } from '../lib/notifications';
import { NotificationItem } from './NotificationItem';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';

// ===== STUBS for removed prototype functions =====
const getNotifications = (..._args: any[]): any => { /* stub - prototype function removed */ };
const filterNotifications = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getNotificationStats = (..._args: any[]): any => { /* stub - prototype function removed */ };
const markAsRead = (..._args: any[]): any => { /* stub - prototype function removed */ };
const markAllAsRead = (..._args: any[]): any => { /* stub - prototype function removed */ };
const archiveNotification = (..._args: any[]): any => { /* stub - prototype function removed */ };
const bulkArchive = (..._args: any[]): any => { /* stub - prototype function removed */ };
const bulkDelete = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface NotificationCenterProps {
  user: User;
  onNavigate?: (entityType: string, entityId: string) => void;
}

export function NotificationCenter({ user, onNavigate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPreferences, setShowPreferences] = useState(false);
  const [stats, setStats] = useState(getNotificationStats(user.id));

  useEffect(() => {
    loadNotifications();
  }, [user.id]);

  useEffect(() => {
    applyFilters();
  }, [notifications, searchQuery, selectedTab, selectedType, selectedPriority, dateRange]);

  const loadNotifications = () => {
    const notifs = getNotifications(user.id);
    setNotifications(notifs);
    setStats(getNotificationStats(user.id));
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Apply tab filter
    if (selectedTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (selectedTab === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filterNotifications(filtered, { types: [selectedType] });
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      filtered = filterNotifications(filtered, { priorities: [selectedPriority] });
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      filtered = filterNotifications(filtered, { dateRange });
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(user.id);
    loadNotifications();
  };

  const handleArchive = (id: string) => {
    archiveNotification(id);
    loadNotifications();
  };

  const handleBulkArchive = () => {
    if (selectedIds.size > 0) {
      bulkArchive(Array.from(selectedIds));
      setSelectedIds(new Set());
      loadNotifications();
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      if (confirm(`Delete ${selectedIds.size} notification(s)?`)) {
        bulkDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
        loadNotifications();
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate if entity is provided
    if (notification.entityType && notification.entityId && onNavigate) {
      onNavigate(notification.entityType, notification.entityId);
    }
  };

  const groupByDate = (notifications: Notification[]) => {
    const groups: Record<string, Notification[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    notifications.forEach(notification => {
      const notifDate = new Date(notification.timestamp);

      if (notifDate >= todayStart) {
        groups.today.push(notification);
      } else if (notifDate >= yesterdayStart) {
        groups.yesterday.push(notification);
      } else if (notifDate >= weekStart) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupByDate(filteredNotifications);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all your notifications in one place
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreferences(true)}
        >
          <Settings className="mr-2 h-4 w-4" />
          Preferences
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              Unread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.todayCount}</p>
            <p className="text-xs text-muted-foreground">New today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {stats.byCriticality.CRITICAL + stats.byCriticality.HIGH}
            </p>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={(value:any) => setSelectedType(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="OFFER_RECEIVED">Offers</SelectItem>
                <SelectItem value="NEW_PROPERTY_MATCH">Matches</SelectItem>
                <SelectItem value="LEAD_STATUS_CHANGE">Leads</SelectItem>
                <SelectItem value="FOLLOW_UP_REMINDER">Reminders</SelectItem>
                <SelectItem value="COMMISSION_EARNED">Commissions</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={selectedPriority} onValueChange={(value:any) => setSelectedPriority(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Select value={dateRange} onValueChange={(value:any) => setDateRange(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm">
            <span className="font-medium">{selectedIds.size}</span> notification(s) selected
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive Selected
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(value:any) => setSelectedTab(value as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({stats.unread})
            </TabsTrigger>
            <TabsTrigger value="read">
              Read ({stats.total - stats.unread})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              {selectedIds.size === filteredNotifications.length ? 'Deselect All' : 'Select All'}
            </Button>
            {stats.unread > 0 && (
              <Button size="sm" variant="outline" onClick={handleMarkAllAsRead}>
                <Check className="mr-2 h-4 w-4" />
                Mark All as Read
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="all" className="space-y-6 mt-6">
          {renderNotificationGroups()}
        </TabsContent>

        <TabsContent value="unread" className="space-y-6 mt-6">
          {renderNotificationGroups()}
        </TabsContent>

        <TabsContent value="read" className="space-y-6 mt-6">
          {renderNotificationGroups()}
        </TabsContent>
      </Tabs>

      {/* Preferences Modal */}
      {showPreferences && (
        <NotificationPreferencesModal
          isOpen={showPreferences}
          user={user}
          onClose={() => setShowPreferences(false)}
          onUpdate={loadNotifications}
        />
      )}
    </div>
  );

  function renderNotificationGroups() {
    if (filteredNotifications.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="font-medium mb-2">No notifications found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'You\'re all caught up!'}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {groupedNotifications.today.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Today</h3>
            {renderNotificationList(groupedNotifications.today)}
          </div>
        )}

        {groupedNotifications.yesterday.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Yesterday</h3>
            {renderNotificationList(groupedNotifications.yesterday)}
          </div>
        )}

        {groupedNotifications.thisWeek.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">This Week</h3>
            {renderNotificationList(groupedNotifications.thisWeek)}
          </div>
        )}

        {groupedNotifications.older.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Older</h3>
            {renderNotificationList(groupedNotifications.older)}
          </div>
        )}
      </>
    );
  }

  function renderNotificationList(notifications: Notification[]) {
    return (
      <div className="space-y-3">
        {notifications.map(notification => (
          <div key={notification.id} className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selectedIds.has(notification.id)}
              onChange={() => handleToggleSelect(notification.id)}
              className="mt-6"
            />
            <div className="flex-1">
              <NotificationItem
                notification={notification}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onArchive={() => handleArchive(notification.id)}
                onClick={() => handleNotificationClick(notification)}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
}
