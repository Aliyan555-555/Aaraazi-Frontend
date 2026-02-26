'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Palette,
  Bell,
  Database,
  Mail,
  Zap,
  CreditCard,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { getDefaultSettings, type UserSettings } from '@/types/settings.types';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { DataSettings } from '@/components/settings/DataSettings';
import { CommunicationSettings } from '@/components/settings/CommunicationSettings';
import { IntegrationSettings } from '@/components/settings/IntegrationSettings';

type SettingsSection =
  | 'account'
  | 'security'
  | 'appearance'
  | 'notifications'
  | 'data'
  | 'communication'
  | 'integrations'
  | 'team'
  | 'billing';

interface MenuItem {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ElementType;
  roleRequired?: string[];
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [settings, setSettingsState] = useState<UserSettings | null>(null);

  useEffect(() => {
    if (user?.id) setSettingsState(getDefaultSettings(user.id));
  }, [user?.id]);

  const menuItems: MenuItem[] = [
    { id: 'account', label: 'Account', description: 'Manage your account and preferences', icon: User },
    { id: 'security', label: 'Security', description: 'Password, 2FA, and sessions', icon: Shield },
    { id: 'appearance', label: 'Appearance', description: 'Theme, colors, and display', icon: Palette },
    { id: 'notifications', label: 'Notifications', description: 'Notification preferences', icon: Bell },
    { id: 'data', label: 'Data & Privacy', description: 'Export, backups, and privacy', icon: Database },
    { id: 'communication', label: 'Communication', description: 'Email templates and auto-reply', icon: Mail },
    { id: 'integrations', label: 'Integrations', description: 'API keys and third-party apps', icon: Zap },
    { id: 'team', label: 'Team Management', description: 'Team members and permissions', icon: Users, roleRequired: ['SAAS_ADMIN', 'AGENCY_OWNER', 'AGENCY_MANAGER'] },
    { id: 'billing', label: 'Billing & Subscription', description: 'Subscription and payment', icon: CreditCard, roleRequired: ['SAAS_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roleRequired) return true;
    return user?.role && item.roleRequired.includes(user.role);
  });

  const renderContent = () => {
    if (!user || !settings) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }
    switch (activeSection) {
      case 'account':
        return <AccountSettings user={user} settings={settings} onSettingsChange={setSettingsState} />;
      case 'security':
        return <SecuritySettings user={user} settings={settings} onSettingsChange={setSettingsState} />;
      case 'appearance':
        return <AppearanceSettings user={user} settings={settings} onSettingsChange={setSettingsState} />;
      case 'notifications':
        return (
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Notification Preferences</h2>
            <p className="mb-4 text-muted-foreground">
              Manage your notification settings in the dedicated notification preferences panel.
            </p>
            <Button
              onClick={() => {
                const event = new CustomEvent('show-notification-preferences');
                if (typeof window !== 'undefined') window.dispatchEvent(event);
              }}
            >
              Open Notification Preferences
            </Button>
          </Card>
        );
      case 'data':
        return <DataSettings user={user} settings={settings} onSettingsChange={setSettingsState} />;
      case 'communication':
        return <CommunicationSettings user={user} settings={settings} onSettingsChange={setSettingsState} />;
      case 'integrations':
        return <IntegrationSettings user={user} settings={settings} onSettingsChange={setSettingsState} />;
      case 'team':
        return (
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Team Management</h2>
            <p className="text-muted-foreground">Team management features coming soon.</p>
          </Card>
        );
      case 'billing':
        return (
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Billing & Subscription</h2>
            <p className="text-muted-foreground">Billing features coming soon.</p>
          </Card>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                <SettingsIcon className="h-6 w-6" />
                Settings
              </h1>
              <p className="mt-1 text-muted-foreground">Manage your account and application preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card className="p-2">
              <nav className="space-y-1">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="hidden truncate text-xs text-muted-foreground xl:block">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                  );
                })}
              </nav>
            </Card>
            <Card className="mt-4 p-4">
              <h3 className="mb-2 text-sm font-medium">Need Help?</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Visit our help center or contact support for assistance with settings.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Get Help
              </Button>
            </Card>
          </div>
          <div className="lg:col-span-3">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
