/**
 * Notification Preferences Modal - V3.0
 * User settings for notification management
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { User } from '../types';
import { NotificationType } from '../types/notifications';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../lib/notifications';
import { toast } from 'sonner';
import { Bell, Save } from 'lucide-react';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

export function NotificationPreferencesModal({
  isOpen,
  user,
  onClose,
  onUpdate,
}: NotificationPreferencesModalProps) {
  const [preferences, setPreferences] = useState(getNotificationPreferences(user.id));

  useEffect(() => {
    setPreferences(getNotificationPreferences(user.id));
  }, [user.id]);

  const handleToggleType = (type: NotificationType) => {
    const enabledTypes = preferences.enabledTypes.includes(type)
      ? preferences.enabledTypes.filter(t => t !== type)
      : [...preferences.enabledTypes, type];

    setPreferences({ ...preferences, enabledTypes });
  };

  const handleSave = () => {
    updateNotificationPreferences(user.id, preferences);
    toast.success('Notification preferences updated');
    onUpdate();
    onClose();
  };

  const notificationCategories = [
    {
      title: 'Offers & Transactions',
      types: [
        { type: 'OFFER_RECEIVED' as NotificationType, label: 'Offer Received' },
        { type: 'OFFER_ACCEPTED' as NotificationType, label: 'Offer Accepted' },
        { type: 'OFFER_REJECTED' as NotificationType, label: 'Offer Rejected' },
        { type: 'COUNTER_OFFER_RECEIVED' as NotificationType, label: 'Counter Offers' },
      ],
    },
    {
      title: 'Property & Matches',
      types: [
        { type: 'NEW_PROPERTY_MATCH' as NotificationType, label: 'New Property Matches' },
        { type: 'PROPERTY_STATUS_CHANGE' as NotificationType, label: 'Property Status Changes' },
        { type: 'RELISTING_OPPORTUNITY' as NotificationType, label: 'Re-listing Opportunities' },
      ],
    },
    {
      title: 'Leads & Follow-ups',
      types: [
        { type: 'NEW_LEAD_ASSIGNED' as NotificationType, label: 'New Leads Assigned' },
        { type: 'LEAD_STATUS_CHANGE' as NotificationType, label: 'Lead Status Changes' },
        { type: 'FOLLOW_UP_REMINDER' as NotificationType, label: 'Follow-up Reminders' },
        { type: 'LEAD_CONVERTED' as NotificationType, label: 'Lead Conversions' },
      ],
    },
    {
      title: 'Viewings',
      types: [
        { type: 'VIEWING_SCHEDULED' as NotificationType, label: 'Viewing Scheduled' },
        { type: 'VIEWING_FEEDBACK_RECEIVED' as NotificationType, label: 'Viewing Feedback' },
        { type: 'VIEWING_REMINDER' as NotificationType, label: 'Viewing Reminders' },
      ],
    },
    {
      title: 'Financial',
      types: [
        { type: 'COMMISSION_EARNED' as NotificationType, label: 'Commission Earned' },
        { type: 'PAYMENT_DUE' as NotificationType, label: 'Payment Due' },
        { type: 'PAYMENT_RECEIVED' as NotificationType, label: 'Payment Received' },
        { type: 'BUDGET_ALERT' as NotificationType, label: 'Budget Alerts' },
      ],
    },
    {
      title: 'System & Documents',
      types: [
        { type: 'DOCUMENT_UPLOADED' as NotificationType, label: 'Document Uploads' },
        { type: 'DOCUMENT_APPROVAL_NEEDED' as NotificationType, label: 'Document Approvals' },
        { type: 'SYSTEM_ALERT' as NotificationType, label: 'System Alerts' },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Customize which notifications you want to receive
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Global Settings */}
          <div className="space-y-4 pb-6 border-b">
            <h3 className="font-medium">General Settings</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable In-App Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Show notifications within the application
                </p>
              </div>
              <Switch
                checked={preferences.enableInApp}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, enableInApp: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Group Similar Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Combine related notifications together
                </p>
              </div>
              <Switch
                checked={preferences.groupSimilar}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, groupSimilar: checked })
                }
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-6">
            <h3 className="font-medium">Notification Types</h3>

            {notificationCategories.map((category) => (
              <div key={category.title} className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {category.title}
                </h4>
                <div className="space-y-3 pl-4">
                  {category.types.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between"
                    >
                      <Label className="font-normal cursor-pointer">
                        {item.label}
                      </Label>
                      <Switch
                        checked={preferences.enabledTypes.includes(item.type)}
                        onCheckedChange={() => handleToggleType(item.type)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPreferences({
                  ...preferences,
                  enabledTypes: notificationCategories.flatMap(c =>
                    c.types.map(t => t.type)
                  ),
                })
              }
            >
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPreferences({ ...preferences, enabledTypes: [] })
              }
            >
              Disable All
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
