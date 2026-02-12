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
import { Database, Download, Archive, Save } from 'lucide-react';
import { toast } from 'sonner';

interface DataSettingsProps {
  user: User;
  settings: UserSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export function DataSettings({ user, settings, onSettingsChange }: DataSettingsProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const updateData = (key: keyof UserSettings['data'], value: unknown) => {
    onSettingsChange((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
    setHasChanges(true);
  };

  const handleExportSettings = () => {
    const exported = JSON.stringify(settings, null, 2);
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aaraazi-settings-${user.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully');
  };

  const handleExportData = () => {
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone ?? undefined,
    };
    const data = { profile, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aaraazi-data-${user.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleSave = () => {
    setHasChanges(false);
    toast.success('Data settings saved');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Data Management</h2>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Auto-Save Interval</Label>
            <Select
              value={String(settings.data.autoSaveInterval)}
              onValueChange={(v) => updateData('autoSaveInterval', parseInt(v, 10))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Backup Frequency</Label>
            <Select
              value={settings.data.backupFrequency}
              onValueChange={(v) =>
                updateData('backupFrequency', v as UserSettings['data']['backupFrequency'])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={settings.data.exportFormat}
              onValueChange={(v) =>
                updateData('exportFormat', v as UserSettings['data']['exportFormat'])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <Label className="font-normal">Auto-Save Enabled</Label>
            <Checkbox
              checked={settings.data.autoSave}
              onCheckedChange={(checked) => updateData('autoSave', checked === true)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Export & Backup</h2>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleExportSettings}>
            <Archive className="mr-2 h-4 w-4" />
            Export Settings
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export All Data
          </Button>
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
