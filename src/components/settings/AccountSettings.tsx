import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { getUserSettings, updateUserSettings, UserSettings } from '../../lib/userSettings';
import { Globe, Clock, Calendar as CalendarIcon, DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AccountSettingsProps {
  user: User;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ user }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user.id]);

  const loadSettings = () => {
    const userSettings = getUserSettings(user.id);
    setSettings(userSettings);
  };

  const handleSave = () => {
    if (!settings) return;
    
    try {
      updateUserSettings(user.id, settings);
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...(settings[section] as any),
        [key]: value,
      },
    });
    setHasChanges(true);
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Regional Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Regional Settings</h2>
        </div>
        <p className="text-gray-600 mb-6">Configure your language, timezone, and regional preferences</p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={settings.regional.language}
                onChange={(e) => updateSetting('regional', 'language', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="ur">اردو (Urdu)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={settings.regional.timezone}
                onChange={(e) => updateSetting('regional', 'timezone', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/New_York">America/New York (EST)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <select
                id="dateFormat"
                value={settings.regional.dateFormat}
                onChange={(e) => updateSetting('regional', 'dateFormat', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (20/12/2024)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/20/2024)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-20)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="timeFormat">Time Format</Label>
              <select
                id="timeFormat"
                value={settings.regional.timeFormat}
                onChange={(e) => updateSetting('regional', 'timeFormat', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12h">12-hour (2:30 PM)</option>
                <option value="24h">24-hour (14:30)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="firstDayOfWeek">First Day of Week</Label>
              <select
                id="firstDayOfWeek"
                value={settings.regional.firstDayOfWeek}
                onChange={(e) => updateSetting('regional', 'firstDayOfWeek', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <div className="flex items-center gap-2 mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-900">PKR (Pakistani Rupee)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Dashboard Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Dashboard Preferences</h2>
        </div>
        <p className="text-gray-600 mb-6">Customize your dashboard experience</p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultView">Default View</Label>
              <select
                id="defaultView"
                value={settings.dashboard.defaultView}
                onChange={(e) => updateSetting('dashboard', 'defaultView', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="grid">Grid View</option>
                <option value="list">List View</option>
                <option value="kanban">Kanban View</option>
              </select>
            </div>

            <div>
              <Label htmlFor="refreshInterval">Auto Refresh Interval</Label>
              <select
                id="refreshInterval"
                value={settings.dashboard.refreshInterval}
                onChange={(e) => updateSetting('dashboard', 'refreshInterval', parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
                <option value="600">10 minutes</option>
                <option value="1800">30 minutes</option>
                <option value="0">Disabled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showWelcome"
              checked={settings.dashboard.showWelcomeMessage}
              onChange={(e) => updateSetting('dashboard', 'showWelcomeMessage', e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="showWelcome" className="mb-0">
              Show welcome message on dashboard
            </Label>
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-6">
        <h2 className="text-xl text-gray-900 mb-4">Privacy Settings</h2>
        <p className="text-gray-600 mb-6">Control who can see your information</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <select
              id="profileVisibility"
              value={settings.privacy.profileVisibility}
              onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public - Everyone can see</option>
              <option value="team">Team - Only team members</option>
              <option value="private">Private - Only you</option>
            </select>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label className="mb-0">Show Email Address</Label>
                <p className="text-xs text-gray-500">Allow others to see your email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.showEmail}
                onChange={(e) => updateSetting('privacy', 'showEmail', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="mb-0">Show Phone Number</Label>
                <p className="text-xs text-gray-500">Allow others to see your phone</p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.showPhone}
                onChange={(e) => updateSetting('privacy', 'showPhone', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="mb-0">Activity Status</Label>
                <p className="text-xs text-gray-500">Show when you're online</p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.activityStatus}
                onChange={(e) => updateSetting('privacy', 'activityStatus', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="mb-0">Allow Data Sharing</Label>
                <p className="text-xs text-gray-500">Share usage data to improve the app</p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.allowDataSharing}
                onChange={(e) => updateSetting('privacy', 'allowDataSharing', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Unsaved Changes</p>
              <p className="text-sm text-gray-600">You have unsaved changes in your settings</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={loadSettings}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
