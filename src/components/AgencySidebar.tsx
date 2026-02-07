"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building,
    CheckSquare,
    UserSearch,
    Home,
    Briefcase,
    Target,
    ContactRound,
    DollarSign,
    TrendingUp,
    BarChart3,
    FileText,
    LogOut,
    ChevronRight,
    Layers,
    Package,
    Plus,
    Users,
    Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { useAuthStore } from '@/store/useAuthStore';

interface SidebarProps {
    className?: string;
    isCollapsed?: boolean;
    unreadNotificationCount?: number;
}

interface MenuItem {
    id: string;
    label: string;
    href: string;
    icon?: any;
    badge?: number;
}

export function AgencySidebar({ className, isCollapsed = false, unreadNotificationCount = 3 }: SidebarProps) {
    const pathname = usePathname();
    const { logout, user } = useAuthStore();

    // Helper to check active state
    const isItemActive = (href: string) => pathname === href || pathname?.startsWith(href);

    const renderNavItem = (item: MenuItem, isNested: boolean = false, showIcon: boolean = true) => {
        const Icon = item.icon;
        const isActive = isItemActive(item.href);

        const content = (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all group relative",
                    isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                    isCollapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "h-10",
                    isNested && !isCollapsed && "ml-4 text-sm"
                )}
            >
                {showIcon && Icon && (
                    <Icon className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "group-hover:text-gray-900"
                    )} />
                )}
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white h-5 w-auto min-w-[1.25rem] px-1 flex items-center justify-center border-0 text-[10px] font-bold">
                        {item.badge}
                    </Badge>
                )}
                {!isCollapsed && isActive && !isNested && item.badge === undefined && (
                    <ChevronRight className="ml-auto h-3 w-3 opacity-50" />
                )}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
            </Link>
        );

        if (isCollapsed) {
            return (
                <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                        {content}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return <div key={item.id}>{content}</div>;
    };

    return (
        <div className={cn(
            "flex flex-col h-full border-r bg-white transition-all duration-300",
            isCollapsed ? "w-20" : "w-64",
            className
        )}>
            {/* Quick Action: Add Lead */}
            <div className="p-4">
                {!isCollapsed ? (
                    <Button
                        className="w-full bg-secondary hover:bg-secondary/90 text-white shadow-sm h-11 transition-all flex items-center justify-center gap-2 font-semibold"
                        onClick={() => {/* TODO: Implement add lead logic */ }}
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Lead</span>
                    </Button>
                ) : (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    className="w-full bg-secondary hover:bg-secondary/90 text-white p-0 h-10 w-10 mx-auto"
                                    onClick={() => {/* TODO: Implement add lead logic */ }}
                                >
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Add Lead</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            <ScrollArea className="flex-1 px-4">
                <nav className="space-y-6 pb-6">
                    {/* Core */}
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                Core
                            </h3>
                        )}
                        {renderNavItem({ id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard })}
                    </div>

                    {/* Real Estate Portfolios */}
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                Portfolios
                            </h3>
                        )}
                        <div className={cn("space-y-0.5", !isCollapsed && "ml-2 border-l-2 border-gray-200 pl-1")}>
                            {renderNavItem({ id: 'sell-cycles', label: 'Sell Cycles', href: '/dashboard/sell-cycles' }, true)}
                            {renderNavItem({ id: 'purchase-cycles', label: 'Purchase Cycles', href: '/dashboard/purchase-cycles' }, true)}
                            {renderNavItem({ id: 'rent-cycles', label: 'Rent Cycles', href: '/dashboard/rent-cycles' }, true)}
                            {renderNavItem({ id: 'deals', label: 'Deal Management', href: '/dashboard/deals' }, true)}
                        </div>
                    </div>

                    {/* Requirements & Relationships */}
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                Requirements & Relationships
                            </h3>
                        )}
                        <div className="space-y-1">
                            {renderNavItem({ id: 'tasks', label: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare })}
                            {renderNavItem({ id: 'leads', label: 'Leads', href: '/dashboard/leads', icon: Target })}
                            {renderNavItem({ id: 'contacts', label: 'Contacts', href: '/dashboard/contacts', icon: ContactRound })}
                            {renderNavItem({ id: 'notifications', label: 'Notifications', href: '/dashboard/notifications', icon: Bell, badge: unreadNotificationCount })}
                            {renderNavItem({ id: 'buyer-requirements', label: 'Buyer Requirements', href: '/dashboard/buyer-requirements', icon: UserSearch })}
                            {renderNavItem({ id: 'rent-requirements', label: 'Rent Requirements', href: '/dashboard/rent-requirements', icon: Home })}
                            {renderNavItem({ id: 'submitted-offers', label: 'Submitted Offers', href: '/dashboard/submitted-offers', icon: Briefcase })}
                        </div>
                    </div>

                    {/* Performance & Results */}
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                Performance & Results
                            </h3>
                        )}
                        <div className="space-y-1">
                            {renderNavItem({ id: 'financials', label: 'Financials', href: '/dashboard/financials', icon: DollarSign })}
                            {renderNavItem({ id: 'portfolio', label: 'Portfolio Management', href: '/dashboard/portfolio', icon: Briefcase })}
                            {renderNavItem({ id: 'performance', label: 'Performance', href: '/dashboard/performance', icon: TrendingUp })}
                            {renderNavItem({ id: 'reports', label: 'Reports', href: '/dashboard/reports', icon: BarChart3 })}
                            {renderNavItem({ id: 'documents', label: 'Documents', href: '/dashboard/documents', icon: FileText })}
                        </div>
                    </div>
                </nav>
            </ScrollArea>

            {/* Profile Footer */}
            <div className="p-4 border-t bg-gray-50/50">
                {!isCollapsed ? (
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                            {user?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Ali Raza'}</p>
                            <p className="text-[10px] text-gray-500 truncate uppercase mt-0.5 font-medium tracking-wider">
                                {user?.role?.replace('_', ' ') || 'AGENT'}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                                logout();
                                window.location.href = '/';
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex justify-center flex-col items-center gap-3">
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 cursor-pointer">
                                        {user?.name?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p className="font-semibold">{user?.name}</p>
                                    <p className="text-xs opacity-70">{user?.role}</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            logout();
                                            window.location.href = '/';
                                        }}
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Logout</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>
        </div>
    );
}
