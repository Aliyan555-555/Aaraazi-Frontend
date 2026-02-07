'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../src/components/Sidebar';
import { Navbar } from '../../src/components/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/schema';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user: saasUser, currentModule, setCurrentModule, logout: saasLogout } = useAuthStore();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Map pathname to activeTab for Sidebar
    // Example: /dashboard/leads -> leads
    const activeTab = pathname.split('/').pop() || 'dashboard';

    const handleTabChange = (tab: string) => {
        const routeMap: Record<string, string> = {
            'dashboard': '/dashboard',
            'inventory': '/dashboard/properties',
            'properties': '/dashboard/properties',
            'leads': '/dashboard/leads',
            'contacts': '/dashboard/contacts',
            'tasks': '/dashboard/tasks',
            'deals': '/dashboard/deals',
            'sell-cycles': '/dashboard/sell-cycles',
            'purchase-cycles': '/dashboard/purchase-cycles',
            'rent-cycles': '/dashboard/rent-cycles',
            'financials': '/dashboard/financials',
            'reports': '/dashboard/reports',
            'documents': '/dashboard/documents',
            'settings': '/dashboard/settings',
            'performance': '/dashboard/performance',
            'portfolio': '/dashboard/portfolio',
            'agency': '/dashboard/performance',
            'buyer-requirements': '/dashboard/buyer-requirements',
            'rent-requirements': '/dashboard/rent-requirements',
            'submitted-offers': '/dashboard/submitted-offers',
        };

        const route = routeMap[tab] || `/dashboard/${tab}`;
        router.push(route);
    };


    const handleLogout = () => {
        saasLogout();
        router.push('/auth/login');
    };

    const handleModuleSwitch = () => {
        const nextModule = currentModule === 'developers' ? 'agency' : 'developers';
        setCurrentModule(nextModule);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar
                saasUser={saasUser || undefined}
                currentModule={currentModule}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={toggleSidebar}
                onLogout={handleLogout}
                onModuleSwitch={handleModuleSwitch}
                onNavigateToSettings={() => router.push('/dashboard/settings')}
                onNavigateToProfile={() => router.push('/dashboard/profile')}
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    userRole={saasUser?.role === UserRole.SAAS_ADMIN || saasUser?.role === UserRole.AGENCY_OWNER || saasUser?.role === UserRole.AGENCY_MANAGER ? 'admin' : 'agent'}
                    currentModule={currentModule || 'agency'}
                    saasUser={saasUser || undefined}
                    isCollapsed={isSidebarCollapsed}
                />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}


