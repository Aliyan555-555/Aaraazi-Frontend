/**
 * QuickLaunchSection Component
 * 
 * Displays workflow shortcuts for common actions.
 * 
 * FEATURES:
 * - 8 most common workflows
 * - Grid layout (2-4 columns responsive)
 * - Recent activity counts
 * - Keyboard shortcuts displayed
 * - Personalized by user role
 * - Smart workflow suggestions
 * 
 * DESIGN:
 * - Follows Design System V4.1
 * - Brand colors (Forest Green, Terracotta)
 * - NO Tailwind typography classes
 * 
 * UX LAWS:
 * - Miller's Law: Show 6-8 items
 * - Fitts's Law: Large click targets
 * - Jakob's Law: Familiar workflow names
 */

import React, { useMemo } from 'react';
import { User } from '../../../types';
import { QuickLaunchCard, QuickLaunchWorkflow } from '../components/QuickLaunchCard';
import {
  getPersonalizedWorkflows,
  calculateRecentCount,
  WorkflowDefinition,
} from '../utils/workflows';
import { Zap } from 'lucide-react';

interface QuickLaunchSectionProps {
  user: User;
  onNavigate: (route: string, id?: string) => void;
  recentData?: {
    properties?: any[];
    leads?: any[];
    contacts?: any[];
    tasks?: any[];
    payments?: any[];
    documents?: any[];
  };
  loading?: boolean;
}
/**
 * Convert workflow definition to card props
 */
function workflowToCard(
  workflow: WorkflowDefinition,
  onNavigate: (route: string, id?: string) => void,
  recentCount?: number
): QuickLaunchWorkflow {
  return {
    id: workflow.id,
    title: workflow.title,
    description: workflow.description,
    icon: workflow.icon,
    iconColor: workflow.iconColor,
    iconBgColor: workflow.iconBgColor,
    onClick: () => {
      // Parse route and navigate
      const parts = workflow.route.split('/');
      if (parts.length === 1) {
        onNavigate(parts[0]);
      } else {
        onNavigate(parts[0], parts[1]);
      }
    },
    keyboardShortcut: workflow.keyboardShortcut,
    recentCount,
    recentLabel: 'this week',
  };
}

/**
 * Loading skeleton
 */
const LoadingState: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div
          key={i}
          className="bg-gray-100 rounded-lg h-40 animate-pulse"
        />
      ))}
    </div>
  );
};

/**
 * QuickLaunchSection Component
 */
export const QuickLaunchSection: React.FC<QuickLaunchSectionProps> = ({
  user,
  onNavigate,
  recentData,
  loading = false,
}) => {
  // Get personalized workflows
  const workflows = useMemo(() => {
    return getPersonalizedWorkflows(user.role);
  }, [user.role]);

  // Convert to cards with recent counts
  const cards = useMemo(() => {
    return workflows.map(workflow => {
      const recentCount = recentData
        ? calculateRecentCount(workflow.id, recentData)
        : undefined;

      return workflowToCard(workflow, onNavigate, recentCount);
    });
  }, [workflows, onNavigate, recentData]);

  // Show top 8 (Miller's Law: 7±2)
  const topCards = cards.slice(0, 8);

  return (
    <section aria-labelledby="quick-launch-title" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Zap className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 id="quick-launch-title" className="text-[#1A1D1F]">
              Quick Launch
            </h2>
            <p className="text-[#363F47]">
              Jump to common workflows and actions
            </p>
          </div>
        </div>

        {/* Optional: Keyboard shortcuts info */}
        <div className="hidden md:flex items-center gap-2 text-[#6B7280]">
          <kbd className="px-2 py-1 bg-gray-100 rounded font-mono">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded font-mono">Key</kbd>
          <span className="ml-2">for shortcuts</span>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topCards.map(card => (
            <QuickLaunchCard
              key={card.id}
              workflow={card}
              size="default"
            />
          ))}
        </div>
      )}

      {/* Tip */}
      {!loading && (
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
          <p className="text-[#363F47]">
            💡 <strong>Pro tip:</strong> Use keyboard shortcuts for even faster access.
            Press <kbd className="px-1.5 py-0.5 bg-white rounded font-mono">Ctrl</kbd> + the letter to launch workflows instantly.
          </p>
        </div>
      )}
    </section>
  );
};
