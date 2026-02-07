/**
 * QuickLaunchCard Component
 * 
 * Individual workflow card for quick access to common actions.
 * 
 * FEATURES:
 * - Large icon (brand colors)
 * - Title and description
 * - Keyboard shortcut display
 * - Recent activity count
 * - Hover effects
 * - Click to launch workflow
 * 
 * DESIGN:
 * - Follows Design System V4.1
 * - Brand colors (Forest Green, Terracotta)
 * - NO Tailwind typography classes
 * 
 * UX LAWS:
 * - Fitts's Law: Large click target (full card)
 * - Aesthetic-Usability: Clean, professional
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface QuickLaunchWorkflow {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;           // e.g., 'text-[#2D6A54]'
  iconBgColor: string;          // e.g., 'bg-[#2D6A54]/10'
  onClick: () => void;
  keyboardShortcut?: string;    // e.g., 'Ctrl+P'
  recentCount?: number;         // e.g., 5 (this week)
  recentLabel?: string;         // e.g., 'this week'
  badge?: string;               // e.g., 'New'
}

interface QuickLaunchCardProps {
  workflow: QuickLaunchWorkflow;
  size?: 'default' | 'compact';
}

/**
 * QuickLaunchCard Component
 */
export const QuickLaunchCard: React.FC<QuickLaunchCardProps> = ({
  workflow,
  size = 'default',
}) => {
  const {
    title,
    description,
    icon: Icon,
    iconColor,
    iconBgColor,
    onClick,
    keyboardShortcut,
    recentCount,
    recentLabel = 'this week',
    badge,
  } = workflow;

  const isCompact = size === 'compact';

  return (
    <button
      onClick={onClick}
      className={`
        group relative
        w-full text-left
        bg-white rounded-lg border border-[#E8E2D5]
        ${isCompact ? 'p-4' : 'p-6'}
        hover:border-[#2D6A54] hover:shadow-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[#2D6A54] focus:ring-offset-2
      `}
      aria-label={`${title} - ${description}`}
    >
      {/* Badge (top-right) */}
      {badge && (
        <div className="absolute top-3 right-3">
          <span className="bg-[#C17052] text-white px-2 py-0.5 rounded">
            {badge}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`${iconBgColor} ${isCompact ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className={`${iconColor} ${isCompact ? 'h-5 w-5' : 'h-6 w-6'}`} />
      </div>

      {/* Title */}
      <h3 className={`text-[#1A1D1F] ${isCompact ? 'mb-1' : 'mb-2'}`}>
        {title}
      </h3>

      {/* Description */}
      {!isCompact && (
        <p className="text-[#363F47] mb-3 line-clamp-2">
          {description}
        </p>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between ${isCompact ? 'mt-2' : 'mt-4'}`}>
        {/* Recent count or keyboard shortcut */}
        <div className="flex items-center gap-2">
          {recentCount !== undefined && recentCount > 0 ? (
            <span className="text-[#2D6A54]">
              {recentCount} {recentLabel}
            </span>
          ) : keyboardShortcut ? (
            <span className="text-[#6B7280] px-2 py-1 bg-gray-100 rounded font-mono">
              {keyboardShortcut}
            </span>
          ) : (
            <span className="text-[#6B7280]">Quick access</span>
          )}
        </div>

        {/* Arrow indicator */}
        <svg
          className="h-4 w-4 text-[#363F47] group-hover:text-[#2D6A54] group-hover:translate-x-1 transition-all"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      {/* Hover overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A54]/0 to-[#2D6A54]/0 group-hover:from-[#2D6A54]/5 group-hover:to-transparent rounded-lg transition-all pointer-events-none" />
    </button>
  );
};
