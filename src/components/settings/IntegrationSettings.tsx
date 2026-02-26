'use client';

import React, { useState } from 'react';
import type { User } from '@/types';
import type { UserSettings } from '@/types/settings.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, Key, Copy, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationSettingsProps {
  user: User;
  settings: UserSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export function IntegrationSettings({ settings, onSettingsChange }: IntegrationSettingsProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const updateIntegration = (key: keyof UserSettings['integrations'], value: unknown) => {
    onSettingsChange((prev) => ({
      ...prev,
      integrations: { ...prev.integrations, [key]: value },
    }));
    setHasChanges(true);
  };

  const generateApiKey = () => {
    const key = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    updateIntegration('apiKey', key);
    toast.success('API key generated');
  };

  const copyApiKey = () => {
    if (settings.integrations.apiKey) {
      navigator.clipboard.writeText(settings.integrations.apiKey);
      toast.success('API key copied to clipboard');
    }
  };

  const handleSave = () => {
    setHasChanges(false);
    toast.success('Integration settings saved');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">API Access</h2>
        </div>
        <p className="mb-6 text-muted-foreground">Generate and manage your API credentials.</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.integrations.apiKey ?? 'No API key generated'}
                  readOnly
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {settings.integrations.apiKey && (
                <Button variant="outline" size="icon" onClick={copyApiKey} title="Copy">
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={generateApiKey} title="Generate">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep your API key secure. Do not share it publicly.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              value={settings.integrations.webhookUrl ?? ''}
              onChange={(e) => updateIntegration('webhookUrl', e.target.value)}
              placeholder="https://your-domain.com/webhook"
            />
            <p className="text-xs text-muted-foreground">
              Receive real-time notifications at this URL
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Third-Party Integrations</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-normal">Calendar Sync</Label>
              <p className="text-xs text-muted-foreground">Sync with Google Calendar</p>
            </div>
            <Checkbox
              checked={settings.integrations.calendarSync}
              onCheckedChange={(checked) =>
                updateIntegration('calendarSync', checked === true)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-normal">Google Drive</Label>
              <p className="text-xs text-muted-foreground">Backup to Google Drive</p>
            </div>
            <Checkbox
              checked={settings.integrations.googleDriveSync}
              onCheckedChange={(checked) =>
                updateIntegration('googleDriveSync', checked === true)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-normal">Dropbox</Label>
              <p className="text-xs text-muted-foreground">Sync files with Dropbox</p>
            </div>
            <Checkbox
              checked={settings.integrations.dropboxSync}
              onCheckedChange={(checked) =>
                updateIntegration('dropboxSync', checked === true)
              }
            />
          </div>
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
