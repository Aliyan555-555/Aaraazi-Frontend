import React, { useState } from 'react';
import type { User } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Settings as SettingsIcon,
  User as UserIcon,
  Bell,
  Shield,
  Palette,
  Database,
  Globe,
  Mail,
  Zap,
  CreditCard,
  Users,
  ChevronRight
} from 'lucide-react';
import { AccountSettings } from './settings/AccountSettings';
import { SecuritySettings } from './settings/SecuritySettings';
import { AppearanceSettings } from './settings/AppearanceSettings';
import { DataSettings } from './settings/DataSettings';
import { CommunicationSettings } from './settings/CommunicationSettings';
import { IntegrationSettings } from './settings/IntegrationSettings';

interface SettingsProps {
  user: User;
  onBack?: () => void;
}

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
  roleRequired?: ('admin' | 'agent')[];
}

export const Settings: React.FC<SettingsProps> = ({ user, onBack }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  const userRole = user.role ?? 'agent';

  const menuItems: MenuItem[] = [
    {
      id: 'account',
      label: 'Account',
      description: 'Manage your account settings and preferences',
      icon: UserIcon,
    },
    {
      id: 'security',
      label: 'Security',
      description: 'Password, two-factor authentication, and sessions',
      icon: Shield,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Customize theme, colors, and display options',
      icon: Palette,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Configure notification preferences',
      icon: Bell,
    },
    {
      id: 'data',
      label: 'Data & Privacy',
      description: 'Export data, backups, and privacy settings',
      icon: Database,
    },
    {
      id: 'communication',
      label: 'Communication',
      description: 'Email templates and auto-replies',
      icon: Mail,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      description: 'API keys, webhooks, and third-party apps',
      icon: Zap,
    },
    {
      id: 'team',
      label: 'Team Management',
      description: 'Manage team members and permissions',
      icon: Users,
      roleRequired: ['super-admin', 'saas-admin'],
    },
    {
      id: 'billing',
      label: 'Billing & Subscription',
      description: 'Manage your subscription and payment methods',
      icon: CreditCard,
      roleRequired: ['saas-admin'],
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roleRequired) return true;
    return item.roleRequired.includes(userRole as any);
  });

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings user={user} />;
      case 'security':
        return <SecuritySettings user={user} />;
      case 'appearance':
        return <AppearanceSettings user={user} />;
      case 'notifications':
        return (
          <Card className="p-6">
            <h2 className="text-xl text-gray-900 mb-4">Notification Preferences</h2>
            <p className="text-gray-600 mb-4">
              Manage your notification settings in the dedicated notification preferences panel.
            </p>
            <Button onClick={() => {
              // Import and show notification preferences modal
              const event = new CustomEvent('show-notification-preferences');
              window.dispatchEvent(event);
            }}>
              Open Notification Preferences
            </Button>
          </Card>
        );
      case 'data':
        return <DataSettings user={user} />;
      case 'communication':
        return <CommunicationSettings user={user} />;
      case 'integrations':
        return <IntegrationSettings user={user} />;
      case 'team':
        return (
          <Card className="p-6">
            <h2 className="text-xl text-gray-900 mb-4">Team Management</h2>
            <p className="text-gray-600">Team management features coming soon...</p>
          </Card>
        );
      case 'billing':
        return (
          <Card className="p-6">
            <h2 className="text-xl text-gray-900 mb-4">Billing & Subscription</h2>
            <p className="text-gray-600">Billing features coming soon...</p>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-gray-900 flex items-center gap-2">
                <SettingsIcon className="h-6 w-6" />
                Settings
              </h1>
              <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <Card className="p-2">
              <nav className="space-y-1">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`
                        w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-gray-500 hidden xl:block">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  );
                })}
              </nav>
            </Card>

            {/* Quick Info Card */}
            <Card className="p-4 mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
              <p className="text-xs text-gray-600 mb-3">
                Visit our help center or contact support for assistance with settings.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Get Help
              </Button>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
