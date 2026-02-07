import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { getUserSettings, updateUserSettings } from '../../lib/userSettings';
import { Mail, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CommunicationSettingsProps {
  user: User;
}

export const CommunicationSettings: React.FC<CommunicationSettingsProps> = ({ user }) => {
  const [settings, setSettings] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const userSettings = getUserSettings(user.id);
    setSettings(userSettings);
  }, [user.id]);

  const handleSave = () => {
    if (!settings) return;
    updateUserSettings(user.id, settings);
    setHasChanges(false);
    toast.success('Communication settings saved');
  };

  const updateCommunication = (key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      communication: { ...settings.communication, [key]: value },
      notifications: { ...settings.notifications, ...value },
    });
    setHasChanges(true);
  };

  if (!settings) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Email Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="mb-0">Email Notifications</Label>
              <p className="text-xs text-gray-500">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.emailNotifications}
              onChange={(e) => updateCommunication('notifications', { emailNotifications: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="mb-0">Weekly Digest</Label>
              <p className="text-xs text-gray-500">Get a weekly summary email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.weeklyDigest}
              onChange={(e) => updateCommunication('notifications', { weeklyDigest: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="mb-0">Monthly Report</Label>
              <p className="text-xs text-gray-500">Receive monthly performance reports</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.monthlyReport}
              onChange={(e) => updateCommunication('notifications', { monthlyReport: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl text-gray-900 mb-4">Auto-Reply</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="mb-0">Enable Auto-Reply</Label>
            <input
              type="checkbox"
              checked={settings.communication.autoReplyEnabled}
              onChange={(e) => updateCommunication('autoReplyEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
          </div>
          {settings.communication.autoReplyEnabled && (
            <div>
              <Label>Auto-Reply Message</Label>
              <Textarea
                value={settings.communication.autoReplyMessage || ''}
                onChange={(e) => updateCommunication('autoReplyMessage', e.target.value)}
                placeholder="Enter your auto-reply message..."
                rows={4}
              />
            </div>
          )}
        </div>
      </Card>

      {hasChanges && (
        <div className="sticky bottom-6 bg-white border rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Unsaved Changes</p>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
