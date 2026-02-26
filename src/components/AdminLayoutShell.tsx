'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types/schema';

interface AdminLayoutShellProps {
    children: React.ReactNode;
}

export const AdminLayoutShell: React.FC<AdminLayoutShellProps> = ({ children }) => {
    const router = useRouter();
    const { user: saasUser, logout, currentModule, setCurrentModule } = useAuthStore();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/auth/agency-code');
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar
                saasUser={saasUser ?? undefined}
                currentModule={currentModule ?? undefined}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onLogout={handleLogout}
                onModuleSwitch={() => setCurrentModule(currentModule === 'developers' ? 'agency' : 'developers')}
                onNavigateToSettings={() => router.push('/dashboard/settings')}
                onNavigateToProfile={() => router.push('/dashboard/profile')}
            />
            <div className="flex flex-1 overflow-hidden">
                <div className={`hidden md:flex md:flex-col flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-60'}`}>
                    <Sidebar
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        userRole={saasUser?.role === UserRole.SAAS_ADMIN || saasUser?.role === UserRole.AGENCY_OWNER || saasUser?.role === UserRole.AGENCY_MANAGER ? 'admin' : 'agent'}
                        currentModule={currentModule ?? 'agency'}
                        saasUser={saasUser ?? undefined}
                        isCollapsed={isSidebarCollapsed}
                    />
                </div>
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};
