'use client';

import React, { useState } from 'react';
import type { User } from '@/types';
import type { UserSettings } from '@/types/settings.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Calendar as CalendarIcon, DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AccountSettingsProps {
  user: User;
  settings: UserSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export function AccountSettings({ user, settings, onSettingsChange }: AccountSettingsProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const update = <K extends keyof UserSettings>(
    section: K,
    key: keyof UserSettings[K],
    value: UserSettings[K][keyof UserSettings[K]]
  ) => {
    onSettingsChange((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), [key]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    toast.success('Settings saved successfully');
  };

  const handleCancel = () => {
    setHasChanges(false);
    toast.info('Changes discarded');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Regional Settings</h2>
        </div>
        <p className="mb-6 text-muted-foreground">
          Configure your language, timezone, and regional preferences.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={settings.regional.language}
                onValueChange={(v) => update('regional', 'language', v as 'en' | 'ur')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">اردو (Urdu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={settings.regional.timezone}
                onValueChange={(v) => update('regional', 'timezone', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Karachi">Asia/Karachi (PKT)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={settings.regional.dateFormat}
                onValueChange={(v) =>
                  update('regional', 'dateFormat', v as UserSettings['regional']['dateFormat'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (20/12/2024)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/20/2024)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-20)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select
                value={settings.regional.timeFormat}
                onValueChange={(v) => update('regional', 'timeFormat', v as '12h' | '24h')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                  <SelectItem value="24h">24-hour (14:30)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>First Day of Week</Label>
              <Select
                value={settings.regional.firstDayOfWeek}
                onValueChange={(v) =>
                  update('regional', 'firstDayOfWeek', v as 'sunday' | 'monday')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>PKR (Pakistani Rupee)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Dashboard Preferences</h2>
        </div>
        <p className="mb-6 text-muted-foreground">Customize your dashboard experience.</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select
                value={settings.dashboard.defaultView}
                onValueChange={(v) =>
                  update('dashboard', 'defaultView', v as 'grid' | 'list' | 'kanban')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="kanban">Kanban View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Auto Refresh Interval</Label>
              <Select
                value={String(settings.dashboard.refreshInterval)}
                onValueChange={(v) => update('dashboard', 'refreshInterval', parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                  <SelectItem value="0">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="showWelcome"
              checked={settings.dashboard.showWelcomeMessage}
              onCheckedChange={(checked) =>
                update('dashboard', 'showWelcomeMessage', checked === true)
              }
            />
            <Label htmlFor="showWelcome" className="cursor-pointer font-normal">
              Show welcome message on dashboard
            </Label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Privacy Settings</h2>
        <p className="mb-6 text-muted-foreground">Control who can see your information.</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Select
              value={settings.privacy.profileVisibility}
              onValueChange={(v) =>
                update('privacy', 'profileVisibility', v as 'public' | 'team' | 'private')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public — Everyone can see</SelectItem>
                <SelectItem value="team">Team — Only team members</SelectItem>
                <SelectItem value="private">Private — Only you</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-normal">Show Email Address</Label>
                <p className="text-xs text-muted-foreground">Allow others to see your email</p>
              </div>
              <Checkbox
                checked={settings.privacy.showEmail}
                onCheckedChange={(checked) => update('privacy', 'showEmail', checked === true)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-normal">Show Phone Number</Label>
                <p className="text-xs text-muted-foreground">Allow others to see your phone</p>
              </div>
              <Checkbox
                checked={settings.privacy.showPhone}
                onCheckedChange={(checked) => update('privacy', 'showPhone', checked === true)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-normal">Activity Status</Label>
                <p className="text-xs text-muted-foreground">Show when you&apos;re online</p>
              </div>
              <Checkbox
                checked={settings.privacy.activityStatus}
                onCheckedChange={(checked) =>
                  update('privacy', 'activityStatus', checked === true)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-normal">Allow Data Sharing</Label>
                <p className="text-xs text-muted-foreground">Share usage data to improve the app</p>
              </div>
              <Checkbox
                checked={settings.privacy.allowDataSharing}
                onCheckedChange={(checked) =>
                  update('privacy', 'allowDataSharing', checked === true)
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {hasChanges && (
        <div className="sticky bottom-6 rounded-lg border bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Unsaved Changes</p>
              <p className="text-sm text-muted-foreground">You have unsaved changes in your settings</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
