/**
 * DetailPageTemplate - Reusable template for all detail pages
 * 
 * Provides consistent structure for:
 * - Property Details
 * - Sell Cycle Details
 * - Purchase Cycle Details
 * - Rent Cycle Details
 * - Deal Details
 * - Requirement Details
 * 
 * Features:
 * - PageHeader with metrics and actions
 * - ConnectedEntitiesBar
 * - Tabbed interface
 * - 2/3 + 1/3 responsive layout
 * - Quick Actions sidebar
 * - Consistent spacing and UX laws
 * 
 * UX Laws Applied:
 * - Fitts's Law: Large action buttons, optimal placement
 * - Miller's Law: Max 5 metrics, max 7 tabs
 * - Hick's Law: Progressive disclosure
 * - Jakob's Law: Familiar patterns
 * - Aesthetic-Usability: 8px grid, consistent design
 * 
 * Usage:
 * <DetailPageTemplate
 *   pageHeader={{ title, breadcrumbs, metrics, primaryActions, secondaryActions, status, onBack }}
 *   connectedEntities={[...]}
 *   tabs={[
 *     {
 *       id: 'overview',
 *       label: 'Overview',
 *       content: <OverviewContent />,
 *       sidebar: <OverviewSidebar />
 *     }
 *   ]}
 *   defaultTab="overview"
 * />
 */

import React, { useState, ReactNode } from 'react';
import { PageHeader, PageHeaderProps } from './PageHeader';
import { ConnectedEntitiesBar, ConnectedEntity } from './ConnectedEntitiesBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export interface DetailPageTab {
  id: string;
  label: string;
  badge?: string | number; // For counts like "Offers (5)"
  content: ReactNode;
  sidebar?: ReactNode; // Optional right sidebar content
  layout?: '2-1' | '3-0' | '1-1' | '1-0'; // Column layout ratios
}

export interface DetailPageTemplateProps {
  pageHeader: PageHeaderProps;
  connectedEntities?: ConnectedEntity[];
  tabs: DetailPageTab[];
  defaultTab?: string;
  className?: string;
}

export function DetailPageTemplate({
  pageHeader,
  connectedEntities = [],
  tabs,
  defaultTab,
  className = '',
}: DetailPageTemplateProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  // Get current tab configuration
  const currentTab = tabs.find(tab => tab.id === activeTab);
  const layout = currentTab?.layout || '2-1'; // Default to 2/3 + 1/3 layout

  // Layout grid classes
  const layoutClasses = {
    '2-1': 'grid-cols-1 lg:grid-cols-3', // 2/3 + 1/3
    '3-0': 'grid-cols-1', // Full width
    '1-1': 'grid-cols-1 lg:grid-cols-2', // 1/2 + 1/2
    '1-0': 'grid-cols-1', // Single column
  };

  const leftColSpan = {
    '2-1': 'lg:col-span-2',
    '3-0': 'col-span-1',
    '1-1': 'lg:col-span-1',
    '1-0': 'col-span-1',
  };

  const rightColSpan = {
    '2-1': 'lg:col-span-1',
    '3-0': 'hidden', // No right column
    '1-1': 'lg:col-span-1',
    '1-0': 'hidden', // No right column
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Page Header with breadcrumbs, metrics, actions */}
      <PageHeader {...pageHeader} />

      {/* Connected Entities Bar */}
      {connectedEntities.length > 0 && (
        <ConnectedEntitiesBar entities={connectedEntities} />
      )}

      {/* Main Content Area */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation - Max 7 tabs (Miller's Law) */}
          <TabsList className={`grid w-full ${tabs.length <= 3 ? 'max-w-3xl' : 'max-w-5xl'} grid-cols-${Math.min(tabs.length, 7)}`}>
            {tabs.slice(0, 7).map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
                {tab.badge && (
                  <span className="ml-1.5 text-xs text-gray-500">
                    ({tab.badge})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              {/* Check if tab has sidebar */}
              {tab.sidebar ? (
                <div className={`grid ${layoutClasses[layout]} gap-6`}>
                  {/* Left Column - Main Content */}
                  <div className={`${leftColSpan[layout]} space-y-6`}>
                    {tab.content}
                  </div>

                  {/* Right Column - Sidebar */}
                  <div className={`${rightColSpan[layout]} space-y-6`}>
                    {tab.sidebar}
                  </div>
                </div>
              ) : (
                // No sidebar - full width content
                <div className="space-y-6">
                  {tab.content}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
