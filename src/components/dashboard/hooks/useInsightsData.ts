/**
 * useInsightsData Hook
 *
 * Loads data and detects insights for the Intelligence Panel.
 *
 * FEATURES:
 * - Loads all required data
 * - Detects 8+ insight patterns
 * - Role-based filtering
 * - Returns loading state
 * - Handles dismissal
 */

import { useState, useEffect, useCallback } from "react";
import { User, Property } from "../../../types";
import { LeadV4 } from "../../../types/leads";
import { TaskV4 } from "../../../types/tasks";
import { Insight } from "../components/InsightCard";
import { detectInsights } from "../utils/detectInsights";
import { getProperties } from "../../../lib/data";
import { getLeadsV4 } from "../../../lib/leadsV4";
import { getAllTasksV4 } from "../../../lib/tasks";
import { getAllAgents } from "../../../lib/auth";

export interface InsightsData {
  insights: Insight[];
  loading: boolean;
  error: string | null;
  dismissInsight: (id: string) => void;
}

const DISMISSED_INSIGHTS_KEY = "aaraazi_dismissed_insights";

/**
 * Get dismissed insight IDs from localStorage
 */
function getDismissedInsights(): Set<string> {
  try {
    const dismissed = localStorage.getItem(DISMISSED_INSIGHTS_KEY);
    return dismissed ? new Set(JSON.parse(dismissed)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Save dismissed insight IDs to localStorage
 */
function saveDismissedInsights(dismissed: Set<string>): void {
  try {
    localStorage.setItem(
      DISMISSED_INSIGHTS_KEY,
      JSON.stringify([...dismissed]),
    );
  } catch (error) {
    console.error("Error saving dismissed insights:", error);
  }
}

/**
 * useInsightsData hook
 */
export function useInsightsData(
  user: User,
  onNavigate?: (page: string, id?: string) => void,
): InsightsData {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    getDismissedInsights(),
  );

  // Load and detect insights
  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      const userId = user.role === "admin" ? undefined : user.id;
      const userRole = user.role;

      // Load all required data
      const properties = getProperties(userId, userRole);
      const leads = getLeadsV4(userId, userRole);
      const tasks = getAllTasksV4(userId || user.id, userRole);
      const users = getAllAgents();

      // Detect insights
      const detectedInsights = detectInsights({
        properties,
        leads,
        tasks,
        users,
      });

      // Attach navigation handlers to insights
      const insightsWithHandlers = detectedInsights.map((insight) => {
        if (insight.action && onNavigate) {
          return {
            ...insight,
            action: {
              ...insight.action,
              onClick: () => {
                // Map insight IDs to navigation
                switch (insight.id) {
                  case "staled-leads":
                    onNavigate("leads");
                    break;
                  case "pipeline-risk":
                    onNavigate("leads");
                    break;
                  default:
                    if (insight.action?.onClick) {
                      insight.action.onClick();
                    }
                }
              },
            },
          };
        }
        return insight;
      });

      // Filter out dismissed insights
      const visibleInsights = insightsWithHandlers.filter(
        (i) => !dismissedIds.has(i.id),
      );

      setInsights(visibleInsights);
      setLoading(false);
    } catch (err) {
      console.error("Error loading insights data:", err);
      setError("Failed to load insights");
      setLoading(false);
    }
  }, [user.id, user.role, dismissedIds, onNavigate]);

  // Dismiss insight
  const dismissInsight = useCallback(
    (id: string) => {
      const newDismissed = new Set(dismissedIds);
      newDismissed.add(id);
      setDismissedIds(newDismissed);
      saveDismissedInsights(newDismissed);

      // Remove from current insights
      setInsights((prev) => prev.filter((i) => i.id !== id));
    },
    [dismissedIds],
  );

  return {
    insights,
    loading,
    error,
    dismissInsight,
  };
}
