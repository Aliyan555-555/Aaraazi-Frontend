/**
 * Dashboard Component
 * 
 * Smart, action-oriented dashboard for the Agency Module.
 * Replaces the old cluttered Dashboard with a focused, context-aware design.
 * 
 * FEATURES:
 * - Context-aware metrics (adapts to user profile)
 * - Smart action prioritization
 * - Quick workflow access
 * - Performance visualization
 * - Intelligent insights
 * 
 * Design System:
 * - Brand colors: Forest Green, Terracotta, Warm Cream
 * - NO Tailwind typography classes (uses globals.css)
 * - 8px spacing grid
 * - WorkspaceHeader pattern
 * 
 * UX LAWS:
 * - Fitts's Law: Large touch targets (44x44px minimum)
 * - Miller's Law: 3-4 metrics, 4-6 actions (within 7±2)
 * - Hick's Law: Progressive disclosure
 * - Jakob's Law: Familiar patterns
 * - Aesthetic-Usability: Beautiful design
 * 
 * ARCHITECTURE:
 * 1. Hero Section - Business health (3-4 metrics)
 * 2. Action Center - What needs attention (4-6 items)
 * 3. Quick Launch - Workflow shortcuts (6-8 cards)
 * 4. Performance Pulse - Activity & trends
 * 5. Intelligence Panel - Smart insights
 * 6. Task Widgets - Task overview
 * 
 * @example
 * <Dashboard 
 *   user={user} 
 *   onNavigate={handleNavigation}
 *   currentModule="agency"
 * />
 */

import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { HeroSection } from './sections/HeroSection';
import { ActionCenterSection } from './sections/ActionCenterSection';
import { QuickLaunchSection } from './sections/QuickLaunchSection';
import { PerformancePulseSection } from './sections/PerformancePulseSection';
import { IntelligencePanelSection } from './sections/IntelligencePanelSection';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';
import { TasksSummaryWidget } from './components/TasksSummaryWidget';
import { UpcomingTasksWidget } from './components/UpcomingTasksWidget';
import { useDashboardData } from './hooks/useDashboardData';
import { useActionData } from './hooks/useActionData';
import { useRecentActivity } from './hooks/useRecentActivity';
import {
  Bell,
  Search,
  Settings,
  TrendingUp,
  Building2,
  DollarSign,
  Users,
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onNavigate: (page: string, data?: any) => void;
  currentModule?: 'agency' | 'developer' | null;
}

/**
 * Get context-aware greeting based on time of day
 */
function getGreeting(userName: string): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return `Good morning, ${userName} 👋`;
  } else if (hour >= 12 && hour < 17) {
    return `Good afternoon, ${userName} 👋`;
  } else if (hour >= 17 && hour < 22) {
    return `Good evening, ${userName} 👋`;
  } else {
    return `Hello, ${userName} 👋`;
  }
}

/**
 * Get context-aware description
 */
function getDescription(timeOfDay: 'morning' | 'afternoon' | 'evening'): string {
  const descriptions = {
    morning: "Here's what needs your attention today",
    afternoon: "Here's your progress and what's next",
    evening: "Here's today's summary and tomorrow's prep",
  };

  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return descriptions.morning;
  if (hour >= 12 && hour < 17) return descriptions.afternoon;
  return descriptions.evening;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onNavigate,
  currentModule = 'agency'
}) => {
  // State
  const [showNotifications, setShowNotifications] = useState(false);

  // Load real data
  const { metrics, loading } = useDashboardData(user);
  const actionData = useActionData(user);
  const recentActivity = useRecentActivity(user);

  // Memoized values
  const greeting = useMemo(() => getGreeting(user.name), [user.name]);
  const description = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Here's what needs your attention today";
    if (hour >= 12 && hour < 17) return "Here's your progress and what's next";
    return "Here's today's summary and tomorrow's prep";
  }, []);

  // Real stats for WorkspaceHeader
  const headerStats = useMemo(() => {
    if (loading) {
      return [
        { label: 'Active Deals', value: '...', variant: 'success' as const },
        { label: 'This Month', value: '...', variant: 'default' as const },
        { label: 'Available', value: '...', variant: 'info' as const },
      ];
    }

    return [
      { label: 'Active Deals', value: `${metrics.activePipeline.count}`, variant: 'success' as const },
      { label: 'This Month', value: metrics.monthlyRevenue.value.replace('PKR ', ''), variant: 'default' as const },
      { label: 'Available', value: metrics.availableInventory.value, variant: 'info' as const },
    ];
  }, [metrics, loading]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Workspace Header */}
      <WorkspaceHeader
        title={greeting}
        description={description}
        stats={headerStats}
        secondaryActions={[
          {
            label: 'Notifications',
            icon: <Bell className="h-4 w-4" />,
            onClick: () => setShowNotifications(!showNotifications),
          },
          {
            label: 'Search',
            icon: <Search className="h-4 w-4" />,
            onClick: () => {/* TODO: Implement search */ },
          },
          {
            label: 'Settings',
            icon: <Settings className="h-4 w-4" />,
            onClick: () => onNavigate('settings'),
          },
        ]}
      />

      {/* Main Content */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* 1. Hero Section - Business Health */}
        <HeroSection user={user} onNavigate={onNavigate} />

        {/* 2. Action Center - What needs attention */}
        <ActionCenterSection
          user={user}
          tasks={actionData.tasks}
          leads={actionData.leads}
          properties={actionData.properties}
          sellCycles={actionData.sellCycles}
          onNavigate={onNavigate}
          loading={actionData.loading}
        />

        {/* 3. Quick Launch - Workflow shortcuts */}
        <QuickLaunchSection
          user={user}
          onNavigate={onNavigate}
          recentData={recentActivity}
          loading={recentActivity.loading}
        />

        {/* 4. Performance Pulse - Activity & trends */}
        <PerformancePulseSection
          user={user}
        />

        {/* 5. Intelligence Panel - Smart insights */}
        <IntelligencePanelSection
          user={user}
          onNavigate={onNavigate}
        />

        {/* 6. Task Widgets - Task overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksSummaryWidget user={user} onNavigate={onNavigate} />
          <UpcomingTasksWidget user={user} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
};