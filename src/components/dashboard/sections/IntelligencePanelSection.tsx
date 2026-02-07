/**
 * IntelligencePanelSection Component
 * 
 * Displays smart insights and recommendations based on data patterns.
 * 
 * FEATURES:
 * - 8+ insight patterns detected
 * - Sorted by priority (high > medium > low)
 * - Dismissible insights (saved to localStorage)
 * - Action buttons for key insights
 * - Empty state when no insights
 * - Loading states
 * 
 * DESIGN:
 * - Follows Design System V4.1
 * - Brand colors
 * - NO Tailwind typography classes
 * 
 * UX LAWS:
 * - Miller's Law: Show 5-7 insights max
 * - Aesthetic-Usability: Clean card design
 */

import React from 'react';
import { User } from '../../../types';
import { InsightCard } from '../components/InsightCard';
import { useInsightsData } from '../hooks/useInsightsData';
import { Lightbulb, Sparkles, CheckCircle2 } from 'lucide-react';

interface IntelligencePanelSectionProps {
  user: User;
  onNavigate?: (page: string, id?: string) => void;
}

/**
 * Loading state
 */
const LoadingState: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="bg-gray-100 rounded-lg h-32 animate-pulse"
        />
      ))}
    </div>
  );
};

/**
 * Error state
 */
const ErrorState: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="bg-destructive-bg border border-destructive-border rounded-lg p-6 text-center">
      <p className="text-destructive-foreground">
        {message}
      </p>
    </div>
  );
};

/**
 * Empty state (no insights)
 */
const EmptyState: React.FC = () => {
  return (
    <div className="bg-[#2D6A54]/5 border border-[#2D6A54]/20 rounded-lg p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-full bg-[#2D6A54]/10">
          <CheckCircle2 className="h-8 w-8 text-[#2D6A54]" />
        </div>
      </div>
      <h3 className="text-[#1A1D1F] mb-2">
        All clear! No insights right now.
      </h3>
      <p className="text-[#363F47]">
        Your business is running smoothly. We'll alert you when we detect patterns or opportunities that need your attention.
      </p>
    </div>
  );
};

/**
 * IntelligencePanelSection Component
 */
export const IntelligencePanelSection: React.FC<IntelligencePanelSectionProps> = ({
  user,
  onNavigate,
}) => {
  const { insights, loading, error, dismissInsight } = useInsightsData(user, onNavigate);

  // Miller's Law: Show max 7 insights
  const visibleInsights = insights.slice(0, 7);

  return (
    <section aria-labelledby="intelligence-panel-title" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#C17052]/10">
            <Lightbulb className="h-5 w-5 text-[#C17052]" />
          </div>
          <div>
            <h2 id="intelligence-panel-title" className="text-[#1A1D1F]">
              Intelligence Panel
            </h2>
            <p className="text-[#363F47]">
              Smart insights and recommendations based on your data
            </p>
          </div>
        </div>

        {/* Insight count */}
        {!loading && !error && visibleInsights.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#C17052]/10 rounded-full">
            <Sparkles className="h-4 w-4 text-[#C17052]" />
            <span className="text-[#C17052]">
              {visibleInsights.length} insight{visibleInsights.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Insights */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : visibleInsights.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {visibleInsights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={dismissInsight}
            />
          ))}

          {/* Show count if more than 7 */}
          {insights.length > 7 && (
            <div className="text-center py-2">
              <p className="text-[#6B7280]">
                +{insights.length - 7} more insights available
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer note */}
      {!loading && !error && visibleInsights.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-[#6B7280]">
            <strong className="text-[#363F47]">💡 How it works:</strong> Our intelligence system analyzes your data in real-time to detect patterns, opportunities, and risks. Insights are prioritized by urgency and impact.
          </p>
        </div>
      )}
    </section>
  );
};
