import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Building2, LogOut, User, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import type { AuthUser } from '@/types/auth.types';
import type { User as UserType } from '../types';
import { NotificationBell } from './NotificationBell';
import Image from 'next/image';

interface NavbarProps {
  user?: UserType;
  saasUser?: AuthUser;
  currentModule?: string | null;
  onLogout: () => void;
  onModuleSwitch?: () => void;
  onNavigateToNotificationCenter?: () => void;
  onNavigateFromNotification?: (entityType: string, entityId: string) => void;
  onNavigateToProfile?: () => void;
  onNavigateToSettings?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = React.memo(({
  user,
  saasUser,
  currentModule,
  onLogout,
  onModuleSwitch,
  onNavigateToNotificationCenter,
  onNavigateFromNotification,
  onNavigateToProfile,
  onNavigateToSettings,
  isSidebarCollapsed = false,
  onToggleSidebar
}) => {
  const { branding } = useAuthStore();
  const displayUser = saasUser || user;
  if (!displayUser) return null;

  const getModuleBadgeColor = (module: string) => {
    return 'bg-primary/10 text-primary';
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'SAAS_ADMIN': 'bg-purple-100 text-purple-800',
      'AGENCY_OWNER': 'bg-blue-100 text-blue-800',
      'AGENCY_MANAGER': 'bg-green-100 text-green-800',
      'AGENCY_AGENT': 'bg-gray-100 text-gray-800',
      'agent': 'bg-orange-100 text-orange-800',
      'developer-admin': 'bg-indigo-100 text-indigo-800',
      'project-manager': 'bg-cyan-100 text-cyan-800',
      'developer-user': 'bg-gray-100 text-gray-800',
      'admin': 'bg-red-100 text-red-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <nav className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button */}
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="hover:bg-gray-100"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
          )}

          <div className="flex items-center gap-2">
            {branding?.logoUrl ? (
              <Image src={branding.logoUrl} alt={branding.companyName} className="w-10 h-10 object-contain" width={100} height={100} />
            ) : (
              <>
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-gray-900 truncate max-w-[200px]">
                  {branding?.companyName || 'aaraazi'}
                </span>
              </>
            )}
          </div>

          {/* Module and Role indicators */}
          <div className="flex items-center gap-2">
            <Badge
              className={getRoleBadgeColor(saasUser?.role ?? user?.role ?? '')}
              variant="secondary"
            >
              {typeof (saasUser?.role ?? user?.role) === 'string'
                ? (saasUser?.role ?? user?.role ?? '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())
                : ''}
            </Badge>

            {currentModule && (
              <Badge
                className={getModuleBadgeColor(currentModule)}
                variant="secondary"
              >
                {currentModule.charAt(0).toUpperCase() + currentModule.slice(1)} Module
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">


          {/* Notification Bell */}
          {displayUser && (
            <NotificationBell
              user={displayUser}
              onNavigate={onNavigateFromNotification}
              onOpenCenter={onNavigateToNotificationCenter}
            />
          )}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={displayUser.avatar ?? undefined} alt={displayUser.name} />
                  <AvatarFallback>
                    {displayUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{displayUser.name}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {displayUser.email}
                  </p>
                  {(saasUser ?? user) && (
                    <p className="text-xs text-gray-500">
                      {(saasUser?.role ?? user?.role ?? '').toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />

              {/* Module Management */}


              <DropdownMenuItem onClick={onNavigateToProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNavigateToSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
});