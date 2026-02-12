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
import { Palette, Monitor, Sun, Moon, Zap, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AppearanceSettingsProps {
  user: User;
  settings: UserSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export function AppearanceSettings({ settings, onSettingsChange }: AppearanceSettingsProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const updateAppearance = (key: keyof UserSettings['appearance'], value: unknown) => {
    onSettingsChange((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: value },
    }));
    setHasChanges(true);
  };

  const updatePerformance = (key: keyof UserSettings['performance'], value: unknown) => {
    onSettingsChange((prev) => ({
      ...prev,
      performance: { ...prev.performance, [key]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    toast.success('Appearance settings saved');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Theme & Colors</h2>
        </div>
        <div className="space-y-6">
          <div>
            <Label>Theme</Label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => updateAppearance('theme', theme)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    settings.appearance.theme === theme
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  {theme === 'light' && <Sun className="h-6 w-6" />}
                  {theme === 'dark' && <Moon className="h-6 w-6" />}
                  {theme === 'auto' && <Monitor className="h-6 w-6" />}
                  <span className="text-sm capitalize">{theme}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Color Scheme</Label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[
                { id: 'blue' as const, label: 'Blue', color: 'bg-blue-600' },
                { id: 'purple' as const, label: 'Purple', color: 'bg-purple-600' },
                { id: 'green' as const, label: 'Green', color: 'bg-green-600' },
              ].map((scheme) => (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => updateAppearance('colorScheme', scheme.id)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 ${
                    settings.appearance.colorScheme === scheme.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full ${scheme.color}`} />
                  <span className="text-sm">{scheme.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Font Size</Label>
            <Select
              value={settings.appearance.fontSize}
              onValueChange={(v) => updateAppearance('fontSize', v as UserSettings['appearance']['fontSize'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium (Recommended)</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="font-normal">Compact Mode</Label>
              <Checkbox
                checked={settings.appearance.compactMode}
                onCheckedChange={(checked) => updateAppearance('compactMode', checked === true)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-normal">Collapsed Sidebar</Label>
              <Checkbox
                checked={settings.appearance.sidebarCollapsed}
                onCheckedChange={(checked) => updateAppearance('sidebarCollapsed', checked === true)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Performance</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Image Quality</Label>
            <Select
              value={settings.performance.imageQuality}
              onValueChange={(v) =>
                updatePerformance('imageQuality', v as UserSettings['performance']['imageQuality'])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Faster)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (Best Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-normal">Enable Animations</Label>
                <p className="text-xs text-muted-foreground">May improve performance when disabled</p>
              </div>
              <Checkbox
                checked={settings.performance.animationsEnabled}
                onCheckedChange={(checked) =>
                  updatePerformance('animationsEnabled', checked === true)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-normal">Lazy Loading</Label>
                <p className="text-xs text-muted-foreground">Load content as you scroll</p>
              </div>
              <Checkbox
                checked={settings.performance.lazyLoading}
                onCheckedChange={(checked) => updatePerformance('lazyLoading', checked === true)}
              />
            </div>
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
