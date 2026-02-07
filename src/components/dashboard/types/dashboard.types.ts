/**
 * Dashboard Type Definitions
 * 
 * TypeScript interfaces and types for the DashboardV4 component system.
 */

// ============================================
// METRIC TYPES
// ============================================

export interface MetricConfig {
  id: string;
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string | number;
  };
  comparison?: string;
  color?: 'forestGreen' | 'terracotta' | 'slate';
  priority?: number; // For smart selection (0-100)
  onClick?: () => void;
}

// ============================================
// ACTION TYPES
// ============================================

export type ActionType = 'urgent' | 'important' | 'proactive';

export interface ActionItem {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  priority: number; // 1-100
  entityType: 'lead' | 'deal' | 'contact' | 'property' | 'cycle' | 'system';
  entityId?: string;
  actions: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
  icon?: React.ReactNode;
  dueDate?: string;
  slaViolation?: boolean;
}

// ============================================
// CONTEXT TYPES
// ============================================

export type ActivityProfile = 'lead-heavy' | 'property-heavy' | 'deal-heavy' | 'balanced';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type DayOfWeek = 'weekday' | 'weekend';
export type InventoryLevel = 'low' | 'normal' | 'high';
export type PipelineHealth = 'weak' | 'healthy' | 'strong';
export type LeadQuality = 'low' | 'medium' | 'high';

export interface UserContext {
  role: 'admin' | 'agent';
  activityProfile: ActivityProfile;
  timeOfDay: TimeOfDay;
  dayOfWeek: DayOfWeek;
  recentActivity: {
    leadsCreated: number; // last 7 days
    propertiesAdded: number;
    dealsActive: number;
    contactsInteracted: number;
  };
  businessState: {
    inventoryLevel: InventoryLevel;
    pipelineHealth: PipelineHealth;
    leadQuality: LeadQuality;
  };
}

// ============================================
// INSIGHT TYPES
// ============================================

export type InsightType = 'alert' | 'opportunity' | 'performance';

export interface Insight {
  id: string;
  type: InsightType;
  priority: number; // 1-100
  title: string;
  message: string;
  actions: {
    label: string;
    onClick: () => void;
  }[];
  dismissible?: boolean;
  expiresAt?: string;
  icon?: React.ReactNode;
}

// ============================================
// QUICK LAUNCH TYPES
// ============================================

export interface QuickLaunchCard {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  color: 'forestGreen' | 'terracotta' | 'slate';
  onClick: () => void;
}

// ============================================
// ACTIVITY TYPES
// ============================================

export type ActivityType = 
  | 'property-added'
  | 'property-updated'
  | 'lead-created'
  | 'lead-converted'
  | 'deal-created'
  | 'deal-stage-changed'
  | 'deal-closed'
  | 'cycle-created'
  | 'cycle-completed'
  | 'contact-interaction'
  | 'commission-approved'
  | 'payment-received'
  | 'viewing-scheduled';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string | Date;
  entityType: 'property' | 'lead' | 'deal' | 'contact' | 'cycle';
  entityId: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

// ============================================
// DASHBOARD DATA TYPES
// ============================================

export interface DashboardMetrics {
  activePipelineValue: number;
  monthlyRevenue: number;
  availableInventory: number;
  conversionRate?: number;
  commissionPending?: number;
  avgDaysOnMarket?: number;
  teamPerformance?: {
    activeAgents: number;
    totalDeals: number;
  };
}

export interface DashboardData {
  metrics: DashboardMetrics;
  actions: ActionItem[];
  recentActivity: Activity[];
  insights: Insight[];
  quickLaunch: QuickLaunchCard[];
}

// ============================================
// CHART DATA TYPES
// ============================================

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface FunnelStage {
  name: string;
  value: number;
  color?: string;
}

export interface HeatmapCell {
  day: string;
  value: number;
}

export type ChartType = 'revenue-trend' | 'pipeline-funnel' | 'activity-heatmap';

export interface PerformanceData {
  chartType: ChartType;
  data: ChartDataPoint[] | FunnelStage[] | HeatmapCell[];
}
