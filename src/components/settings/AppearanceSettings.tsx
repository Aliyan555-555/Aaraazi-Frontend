import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { getUserSettings, updateUserSettings } from '../../lib/userSettings';
import { Palette, Monitor, Sun, Moon, Zap, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AppearanceSettingsProps {
  user: User;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ user }) => {
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
    toast.success('Appearance settings saved');
  };

  const updateAppearance = (key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      appearance: { ...settings.appearance, [key]: value },
    });
    setHasChanges(true);
  };

  const updatePerformance = (key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      performance: { ...settings.performance, [key]: value },
    });
    setHasChanges(true);
  };

  if (!settings) return <div className="p-12 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Theme & Colors</h2>
        </div>

        <div className="space-y-6">
          <div>
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {['light', 'dark', 'auto'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateAppearance('theme', theme)}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    settings.appearance.theme === theme
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
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
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { id: 'blue', label: 'Blue', color: 'bg-blue-600' },
                { id: 'purple', label: 'Purple', color: 'bg-purple-600' },
                { id: 'green', label: 'Green', color: 'bg-green-600' },
              ].map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => updateAppearance('colorScheme', scheme.id)}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
                    settings.appearance.colorScheme === scheme.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${scheme.color}`} />
                  <span className="text-sm">{scheme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Font Size</Label>
            <select
              value={settings.appearance.fontSize}
              onChange={(e) => updateAppearance('fontSize', e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="small">Small</option>
              <option value="medium">Medium (Recommended)</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="mb-0">Compact Mode</Label>
              <input
                type="checkbox"
                checked={settings.appearance.compactMode}
                onChange={(e) => updateAppearance('compactMode', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="mb-0">Collapsed Sidebar</Label>
              <input
                type="checkbox"
                checked={settings.appearance.sidebarCollapsed}
                onChange={(e) => updateAppearance('sidebarCollapsed', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl text-gray-900">Performance</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Image Quality</Label>
            <select
              value={settings.performance.imageQuality}
              onChange={(e) => updatePerformance('imageQuality', e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="low">Low (Faster)</option>
              <option value="medium">Medium</option>
              <option value="high">High (Best Quality)</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="mb-0">Enable Animations</Label>
                <p className="text-xs text-gray-500">May improve performance when disabled</p>
              </div>
              <input
                type="checkbox"
                checked={settings.performance.animationsEnabled}
                onChange={(e) => updatePerformance('animationsEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="mb-0">Lazy Loading</Label>
                <p className="text-xs text-gray-500">Load content as you scroll</p>
              </div>
              <input
                type="checkbox"
                checked={settings.performance.lazyLoading}
                onChange={(e) => updatePerformance('lazyLoading', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>
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
