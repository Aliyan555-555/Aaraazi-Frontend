import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import {
  LayoutDashboard,
  Building,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  ContactRound,
  FolderKanban,
  Layers,
  Package,
  Target,
  TrendingUp,
  Home,
  Bell,
  UserSearch,
  Briefcase,
  CheckSquare,
} from 'lucide-react';
import type { AuthUser } from '@/types/auth.types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

function formatRole(role: string): string {
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: 'admin' | 'agent';
  currentModule?: string | null;
  saasUser?: AuthUser;
  unreadNotificationCount?: number;
  isCollapsed?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon?: any;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  items: MenuItem[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  primary: boolean;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeTab,
  onTabChange,
  userRole,
  currentModule,
  saasUser,
  unreadNotificationCount,
  isCollapsed = false
}) => {
  // Agency Module Menu Items - Only Properties is grouped
  const agencyGroups: MenuGroup[] = [
    {
      id: 'properties',
      label: 'Properties',
      icon: Building,
      items: [
        { id: 'sell-cycles', label: 'Sell Cycles' },
        { id: 'purchase-cycles', label: 'Purchase Cycles' },
        { id: 'rent-cycles', label: 'Rent Cycles' },
        { id: 'deals', label: 'Deal Management' },
      ]
    }
  ];

  // Standalone menu items with icons (not grouped)
  const agencyStandaloneItems: MenuItem[] = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'buyer-requirements', label: 'Buyer Requirements', icon: UserSearch },
    { id: 'rent-requirements', label: 'Rent Requirements', icon: Home },
    { id: 'submitted-offers', label: 'My Submitted Offers', icon: Briefcase },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'contacts', label: 'Contacts', icon: ContactRound },
  ];

  const agencyFinancialItems: MenuItem[] = [
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'portfolio', label: 'Portfolio Management', icon: Briefcase },
    { id: 'agency', label: 'Performance', icon: TrendingUp },
  ];

  const agencyReportItems: MenuItem[] = [
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];



  // Get menu structure based on current module
  const getMenuGroups = (): MenuGroup[] => {
    if (currentModule === 'agency') {
      return agencyGroups;
    }
    // Default combined menu for legacy support (no icons on items)
    return [
      {
        id: 'core',
        label: 'Core Operations',
        icon: LayoutDashboard,
        items: [
          { id: 'dashboard', label: 'Dashboard' },
        ]
      },
      {
        id: 'property',
        label: 'Property Management',
        icon: Building,
        items: [
          { id: 'inventory', label: 'Properties' },
          { id: 'leads', label: 'Leads' },
        ]
      },
      {
        id: 'financials',
        label: 'Financials',
        icon: DollarSign,
        items: [
          { id: 'project-accounting', label: 'Project Accounting' },
          { id: 'banking-treasury', label: 'Banking & Treasury' },
          { id: 'financials', label: 'Financials' },
          { id: 'agency', label: 'Agency Hub' },
        ]
      },
      {
        id: 'resources',
        label: 'Resources',
        icon: FileText,
        items: [
          { id: 'documents', label: 'Documents' },
          { id: 'reports', label: 'Reports' },
        ]
      }
    ];
  };

  const getStandaloneItems = (): MenuItem[] => {
    if (currentModule === 'agency') {
      return agencyStandaloneItems;
    }
    return [];
  };

  const getFinancialItems = (): MenuItem[] => {
    if (currentModule === 'agency') {
      return agencyFinancialItems;
    }
    return [];
  };

  const getReportItems = (): MenuItem[] => {
    if (currentModule === 'agency') {
      return agencyReportItems;
    }
    return [];
  };

  const menuGroups = getMenuGroups();
  const standaloneItems = getStandaloneItems();
  const financialItems = getFinancialItems();
  const reportItems = getReportItems();

  // Get quick action buttons based on module
  const getQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (currentModule === 'agency') {
      actions.push(
        { id: 'add-lead', label: 'Add Lead', icon: Users, primary: true }
      );
    } else {
      // Default actions for legacy support
      actions.push(
        { id: 'add-project', label: 'New Project', icon: FolderKanban, primary: true }
      );
    }

    return actions;
  };

  const quickActions = getQuickActions();

  // Render a navigation item without icon (for group items)
  const renderNavItem = (item: MenuItem, showBadge: boolean = false, showIcon: boolean = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const showNotificationBadge = showBadge && item.id === 'notifications' && unreadNotificationCount && unreadNotificationCount > 0;

    const button = (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start",
          isActive && currentModule === 'agency' && "bg-primary/10 text-primary hover:bg-primary/20",
          isActive && !currentModule && "bg-primary/10 text-primary hover:bg-primary/20"
        )}
        onClick={() => onTabChange(item.id)}
      >
        {showIcon && Icon && <Icon className="h-4 w-4 mr-3" />}
        <span>{item.label}</span>
        {showNotificationBadge && (
          <Badge className="ml-auto bg-red-500 text-white">
            {unreadNotificationCount! > 9 ? '9+' : unreadNotificationCount}
          </Badge>
        )}
      </Button>
    );

    return button;
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "bg-white border-r h-screen flex flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="p-4 space-y-2">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.id}
                  className={cn(
                    "w-full",
                    action.primary ? "bg-primary hover:bg-primary/90 text-white" : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  )}
                  variant={action.primary ? "default" : "outline"}
                  onClick={() => onTabChange(action.id)}
                >
                  <ActionIcon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Quick Actions - Collapsed */}
        {isCollapsed && (
          <div className="p-2">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      className={cn(
                        "w-full",
                        action.primary ? "bg-secondary hover:bg-secondary/90 text-white" : ""
                      )}
                      variant={action.primary ? "default" : "outline"}
                      size="icon"
                      onClick={() => onTabChange(action.id)}
                    >
                      <ActionIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Dashboard - Top Item (Expanded) */}
        {!isCollapsed && (
          <div className="px-2 pt-2">
            {renderNavItem({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, false, true)}
          </div>
        )}

        {/* Dashboard - Top Item (Collapsed) */}
        {isCollapsed && (
          <div className="px-2 pt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === 'dashboard' ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-center px-2",
                    activeTab === 'dashboard' && currentModule === 'agency' && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  size="icon"
                  onClick={() => onTabChange('dashboard')}
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Navigation Menu - Expanded (Always Open Groups) */}
        {!isCollapsed && (
          <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            <ul className="space-y-1">
              {/* Render grouped items (Properties) */}
              {menuGroups.map((group, index) => {
                const GroupIcon = group.icon;
                const isGroupActive = activeTab === group.id;

                return (
                  <li key={group.id}>
                    {/* Add separator before group */}
                    {group.id === 'properties' && (
                      <div className="border-t border-gray-200 my-2 mx-2"></div>
                    )}

                    {/* Group Header - Clickable as main link */}
                    <Button
                      variant={isGroupActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start font-medium mb-1",
                        isGroupActive && currentModule === 'agency' && "bg-primary/10 text-primary hover:bg-primary/20",
                        isGroupActive && !currentModule && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                      onClick={() => onTabChange(group.id)}
                    >
                      <GroupIcon className="h-4 w-4 mr-3" />
                      <span>{group.label}</span>
                    </Button>

                    {/* Group Items - Always visible, indented */}
                    <ul className="space-y-0.5 pl-7 border-l-2 border-gray-200 ml-2">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          {renderNavItem(item, false, false)}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}

              {/* Standalone Items (Requirements & Relationships section) */}
              {standaloneItems.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-2 mx-2"></div>
                  {standaloneItems.map((item) => (
                    <li key={item.id}>
                      {renderNavItem(item, false, true)}
                    </li>
                  ))}
                </>
              )}

              {/* Financial Items */}
              {financialItems.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-2 mx-2"></div>
                  {financialItems.map((item) => (
                    <li key={item.id}>
                      {renderNavItem(item, false, true)}
                    </li>
                  ))}
                </>
              )}

              {/* Report Items */}
              {reportItems.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-2 mx-2"></div>
                  {reportItems.map((item) => (
                    <li key={item.id}>
                      {renderNavItem(item, false, true)}
                    </li>
                  ))}
                </>
              )}
            </ul>
          </nav>
        )}

        {/* Navigation Menu - Collapsed (Icon Only) */}
        {isCollapsed && (
          <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            <ul className="space-y-1">
              {/* Render grouped items (Properties with dropdown) */}
              {menuGroups.map((group) => {
                const GroupIcon = group.icon;
                const isGroupActive = activeTab === group.id;

                return (
                  <li key={group.id}>
                    {/* Group Icon with Flyout on Hover */}
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            variant={isGroupActive ? "secondary" : "ghost"}
                            size="icon"
                            className={cn(
                              "w-full",
                              isGroupActive && currentModule === 'agency' && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            )}
                            onClick={() => onTabChange(group.id)}
                          >
                            <GroupIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="p-2 bg-white border shadow-lg">
                        <div className="space-y-1 min-w-[200px]">
                          {/* Group Label as Header */}
                          <button
                            className={cn(
                              "w-full flex items-center px-3 py-2 text-sm font-medium rounded transition-colors text-left",
                              isGroupActive
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                : "hover:bg-gray-100 text-gray-700"
                            )}
                            onClick={() => onTabChange(group.id)}
                          >
                            <GroupIcon className="h-4 w-4 mr-2" />
                            <span>{group.label}</span>
                          </button>

                          {/* Divider */}
                          <div className="border-t border-gray-200 my-1"></div>

                          {/* Sub-items */}
                          {group.items.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                className={cn(
                                  "w-full flex items-start px-3 py-1.5 text-sm rounded transition-colors text-left",
                                  isActive
                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    : "hover:bg-gray-100 text-gray-600"
                                )}
                                onClick={() => onTabChange(item.id)}
                              >
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              })}

              {/* Standalone Items (with simple tooltip) */}
              {standaloneItems.length > 0 && (
                <>
                  {standaloneItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <li key={item.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              size="icon"
                              className={cn(
                                "w-full",
                                isActive && currentModule === 'agency' && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              )}
                              onClick={() => onTabChange(item.id)}
                            >
                              {ItemIcon && <ItemIcon className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  })}
                </>
              )}

              {/* Financial Items */}
              {financialItems.length > 0 && (
                <>
                  {financialItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <li key={item.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              size="icon"
                              className={cn(
                                "w-full",
                                isActive && currentModule === 'agency' && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              )}
                              onClick={() => onTabChange(item.id)}
                            >
                              {ItemIcon && <ItemIcon className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  })}
                </>
              )}

              {/* Report Items */}
              {reportItems.length > 0 && (
                <>
                  {reportItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <li key={item.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              size="icon"
                              className={cn(
                                "w-full",
                                isActive && currentModule === 'agency' && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              )}
                              onClick={() => onTabChange(item.id)}
                            >
                              {ItemIcon && <ItemIcon className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  })}
                </>
              )}
            </ul>
          </nav>
        )}

        {/* Notifications - Bottom Item (Expanded) */}
        {!isCollapsed && (
          <div className="px-2 pb-2 border-t pt-2">
            {renderNavItem({ id: 'notifications', label: 'Notifications', icon: Bell }, true, true)}
          </div>
        )}

        {/* Notifications - Bottom Item (Collapsed) */}
        {isCollapsed && (
          <div className="px-2 pb-2 border-t pt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === 'notifications' ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-center px-2 relative",
                    activeTab === 'notifications' && currentModule === 'agency' && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  )}
                  size="icon"
                  onClick={() => onTabChange('notifications')}
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationCount && unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Notifications</p>
                {unreadNotificationCount && unreadNotificationCount > 0 && (
                  <p className="text-xs text-red-400">{unreadNotificationCount} unread</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* User Context Footer */}
        {saasUser && !isCollapsed && (
          <div className="p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              <p className="font-medium">{saasUser.name}</p>
              <p>{formatRole(saasUser.role)}</p>
              {saasUser.modules?.length > 1 && (
                <p className="mt-1 text-gray-400">
                  {saasUser.modules?.length} modules available
                </p>
              )}
            </div>
          </div>
        )}

        {/* User Context Footer - Collapsed */}
        {saasUser && isCollapsed && (
          <div className="p-2 border-t bg-gray-50 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border border-primary/20">
                  {saasUser.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{saasUser.name}</p>
                <p className="text-xs text-gray-400">
                  {formatRole(saasUser.role)}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider >
  );
});