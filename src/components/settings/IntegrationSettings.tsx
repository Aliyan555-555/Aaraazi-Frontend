import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getUserSettings, updateUserSettings } from '../../lib/userSettings';
import { Zap, Key, Copy, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationSettingsProps {
  user: User;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({ user }) => {
  const [settings, setSettings] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const userSettings = getUserSettings(user.id);
    setSettings(userSettings);
  }, [user.id]);

  const generateApiKey = () => {
    const key = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    updateIntegration('apiKey', key);
    toast.success('API key generated');
  };

  const copyApiKey = () => {
    if (settings?.integrations.apiKey) {
      navigator.clipboard.writeText(settings.integrations.apiKey);
      toast.success('API key copied to clipboard');
    }
  };

  const handleSave = () => {
    if (!settings) return;
    updateUserSettings(user.id, settings);
    setHasChanges(false);
    toast.success('Integration settings saved');
  };

  const updateIntegration = (key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      integrations: { ...settings.integrations, [key]: value },
    });
    setHasChanges(true);
  };

  if (!settings) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">API Access</h2>
        </div>
        <p className="text-gray-600 mb-6">Generate and manage your API credentials</p>

        <div className="space-y-4">
          <div>
            <Label>API Key</Label>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.integrations.apiKey || 'No API key generated'}
                  readOnly
                  className="pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {settings.integrations.apiKey && (
                <Button variant="outline" onClick={copyApiKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" onClick={generateApiKey}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Keep your API key secure. Do not share it publicly.
            </p>
          </div>

          <div>
            <Label>Webhook URL</Label>
            <Input
              value={settings.integrations.webhookUrl || ''}
              onChange={(e) => updateIntegration('webhookUrl', e.target.value)}
              placeholder="https://your-domain.com/webhook"
            />
            <p className="text-xs text-gray-500 mt-1">
              Receive real-time notifications at this URL
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Third-Party Integrations</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="mb-0">Calendar Sync</Label>
              <p className="text-xs text-gray-500">Sync with Google Calendar</p>
            </div>
            <input
              type="checkbox"
              checked={settings.integrations.calendarSync}
              onChange={(e) => updateIntegration('calendarSync', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="mb-0">Google Drive</Label>
              <p className="text-xs text-gray-500">Backup to Google Drive</p>
            </div>
            <input
              type="checkbox"
              checked={settings.integrations.googleDriveSync}
              onChange={(e) => updateIntegration('googleDriveSync', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="mb-0">Dropbox</Label>
              <p className="text-xs text-gray-500">Sync files with Dropbox</p>
            </div>
            <input
              type="checkbox"
              checked={settings.integrations.dropboxSync}
              onChange={(e) => updateIntegration('dropboxSync', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
          </div>
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
