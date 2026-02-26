'use client';

import React, { useState } from 'react';
import type { User } from '@/types';
import type { UserSettings } from '@/types/settings.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CommunicationSettingsProps {
  user: User;
  settings: UserSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export function CommunicationSettings({ settings, onSettingsChange }: CommunicationSettingsProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const updateNotifications = (key: keyof UserSettings['notifications'], value: boolean) => {
    onSettingsChange((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
    setHasChanges(true);
  };

  const updateCommunication = (key: keyof UserSettings['communication'], value: unknown) => {
    onSettingsChange((prev) => ({
      ...prev,
      communication: { ...prev.communication, [key]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    toast.success('Communication settings saved');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Email Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-normal">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive notifications via email</p>
            </div>
            <Checkbox
              checked={settings.notifications.emailNotifications}
              onCheckedChange={(checked) =>
                updateNotifications('emailNotifications', checked === true)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-normal">Weekly Digest</Label>
              <p className="text-xs text-muted-foreground">Get a weekly summary email</p>
            </div>
            <Checkbox
              checked={settings.notifications.weeklyDigest}
              onCheckedChange={(checked) => updateNotifications('weeklyDigest', checked === true)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-normal">Monthly Report</Label>
              <p className="text-xs text-muted-foreground">Receive monthly performance reports</p>
            </div>
            <Checkbox
              checked={settings.notifications.monthlyReport}
              onCheckedChange={(checked) =>
                updateNotifications('monthlyReport', checked === true)
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Auto-Reply</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-normal">Enable Auto-Reply</Label>
            <Checkbox
              checked={settings.communication.autoReplyEnabled}
              onCheckedChange={(checked) =>
                updateCommunication('autoReplyEnabled', checked === true)
              }
            />
          </div>
          {settings.communication.autoReplyEnabled && (
            <div className="space-y-2">
              <Label>Auto-Reply Message</Label>
              <Textarea
                value={settings.communication.autoReplyMessage ?? ''}
                onChange={(e) => updateCommunication('autoReplyMessage', e.target.value)}
                placeholder="Enter your auto-reply message..."
                rows={4}
              />
            </div>
          )}
        </div>
      </Card>

      {hasChanges && (
        <div className="sticky bottom-6 rounded-lg border bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="font-medium">Unsaved Changes</p>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
