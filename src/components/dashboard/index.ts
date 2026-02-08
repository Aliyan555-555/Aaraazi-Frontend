/**
 * Dashboard Components Index
 *
 * Central export for all dashboard-related components.
 */

// Main component
export { DashboardV4 } from "./DashboardV4";

// Sections (Phase 1-6)
export { HeroSection } from "./sections/HeroSection";
export { ActionCenterSection } from "./sections/ActionCenterSection";
export { QuickLaunchSection } from "./sections/QuickLaunchSection";
export { PerformancePulseSection } from "./sections/PerformancePulseSection";
export { IntelligencePanelSection } from "./sections/IntelligencePanelSection";

// Components (Phase 1-6)
export { DashboardMetricCard } from "./components/DashboardMetricCard";
export { ActionItem } from "./components/ActionItem";
export { QuickLaunchCard } from "./components/QuickLaunchCard";
export type { QuickLaunchWorkflow } from "./components/QuickLaunchCard";
export { PerformanceCard } from "./components/PerformanceCard";
export type {
  PerformanceMetric,
  TrendDirection,
  ChartType,
} from "./components/PerformanceCard";
export { InsightCard } from "./components/InsightCard";
export type {
  Insight,
  InsightType,
  InsightPriority,
} from "./components/InsightCard";

// Hooks (Phase 2-6)
export { useDashboardData } from "./hooks/useDashboardData";
export type { DashboardData } from "./hooks/useDashboardData";
export { useActionData } from "./hooks/useActionData";
export type { ActionData } from "./hooks/useActionData";
export { useRecentActivity } from "./hooks/useRecentActivity";
export type { RecentActivityData } from "./hooks/useRecentActivity";
export { usePerformanceData } from "./hooks/usePerformanceData";
export type { PerformanceData } from "./hooks/usePerformanceData";
export { useInsightsData } from "./hooks/useInsightsData";
export type { InsightsData } from "./hooks/useInsightsData";

// Utilities (Phase 2-6)
export * from "./utils/calculateMetrics";
export * from "./utils/detectActions";
export * from "./utils/workflows";
export * from "./utils/calculatePerformanceMetrics";
export * from "./utils/detectInsights";

// Types exported above from individual components
