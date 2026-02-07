'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useRouter } from 'next/navigation';
import { User } from '../types';

interface AdminLayoutShellProps {
    children: React.ReactNode;
}

export const AdminLayoutShell: React.FC<AdminLayoutShellProps> = ({ children }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Mock user to satisfy Navbar props
    const mockUser: User = {
        id: 'admin_user',
        name: 'Admin User',
        email: 'admin@system.com',
        role: 'admin',
        avatar: '',
    };

    const handleLogout = () => {
        router.push('/login');
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        // Navigation logic could go here
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar
                user={mockUser}
                onLogout={handleLogout}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className="flex flex-1 overflow-hidden">
                <div className={`hidden md:flex md:flex-col flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-60'}`}>
                    <Sidebar
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        userRole="admin"
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
