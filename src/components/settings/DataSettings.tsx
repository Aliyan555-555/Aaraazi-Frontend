import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { getUserSettings, updateUserSettings, exportUserSettings } from '../../lib/userSettings';
import { getUserProfile } from '../../lib/userProfile';
import { Database, Download, Upload, Trash2, Archive, Save } from 'lucide-react';
import { toast } from 'sonner';

interface DataSettingsProps {
  user: User;
}

export const DataSettings: React.FC<DataSettingsProps> = ({ user }) => {
  const [settings, setSettings] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const userSettings = getUserSettings(user.id);
    setSettings(userSettings);
  }, [user.id]);

  const handleExportSettings = () => {
    const exported = exportUserSettings(user.id);
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatemanager-settings-${user.id}-${Date.now()}.json`;
    a.click();
    toast.success('Settings exported successfully');
  };

  const handleExportData = () => {
    const profile = getUserProfile(user.id);
    const settings = getUserSettings(user.id);
    const data = { profile, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatemanager-data-${user.id}-${Date.now()}.json`;
    a.click();
    toast.success('Data exported successfully');
  };

  const handleSave = () => {
    if (!settings) return;
    updateUserSettings(user.id, settings);
    setHasChanges(false);
    toast.success('Data settings saved');
  };

  const updateData = (key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      data: { ...settings.data, [key]: value },
    });
    setHasChanges(true);
  };

  if (!settings) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Data Management</h2>
        </div>

        <div className="space-y-6">
          <div>
            <Label>Auto-Save Interval</Label>
            <select
              value={settings.data.autoSaveInterval}
              onChange={(e) => updateData('autoSaveInterval', parseInt(e.target.value))}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
            </select>
          </div>

          <div>
            <Label>Backup Frequency</Label>
            <select
              value={settings.data.backupFrequency}
              onChange={(e) => updateData('backupFrequency', e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <Label>Export Format</Label>
            <select
              value={settings.data.exportFormat}
              onChange={(e) => updateData('exportFormat', e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Label className="mb-0">Auto-Save Enabled</Label>
            <input
              type="checkbox"
              checked={settings.data.autoSave}
              onChange={(e) => updateData('autoSave', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Export & Backup</h2>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleExportSettings}>
            <Archive className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
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
