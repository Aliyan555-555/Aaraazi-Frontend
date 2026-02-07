/**
 * Reports Module - Type Definitions
 * 
 * Comprehensive ERP-standard reporting system for aaraazi
 * Integrates data from Properties, Leads, Contacts, Financials, Portfolios, and Performance modules
 * 
 * @module types/reports
 * @version 1.0.0
 */

// ============================================
// CORE REPORT TYPES
// ============================================

/**
 * Report template definition
 * Pre-built or custom report configurations
 */
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  module: ReportModule;

  // Report configuration
  config: ReportConfig;

  // Visualization
  visualizationType: VisualizationType[];
  defaultVisualization: VisualizationType;

  // Access control
  isSystemTemplate: boolean; // Pre-built templates (cannot be deleted)
  isShared: boolean;
  createdBy: string;
  sharedWith: string[]; // User IDs

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastGenerated?: string;
  generationCount: number;

  // Tags for organization
  tags: string[];
  isFavorite: boolean;
}

/**
 * Report categories for organization
 */
export type ReportCategory =
  | 'executive-summary'      // High-level KPI dashboards
  | 'financial-analysis'     // P&L, Cash Flow, ROI
  | 'sales-performance'      // Deal analytics, conversion
  | 'inventory-analysis'     // Property portfolio insights
  | 'lead-analytics'         // Lead funnel, sources
  | 'agent-performance'      // Individual/team metrics
  | 'client-insights'        // Client behavior, lifetime value
  | 'market-trends'          // Market analysis, pricing
  | 'operational'            // Process efficiency
  | 'compliance'             // Regulatory, audit trails
  | 'custom';                // User-created reports

/**
 * Data modules that can be reported on
 */
export type ReportModule =
  | 'properties'
  | 'leads'
  | 'contacts'
  | 'deals'
  | 'financials'
  | 'portfolio'
  | 'performance'
  | 'requirements'
  | 'cycles'
  | 'cross-module'; // Reports that combine multiple modules

/**
 * Report configuration
 */
export interface ReportConfig {
  // Data source
  dataSources: ReportDataSource[];

  // Time range
  dateRange: DateRangeConfig;

  // Filters
  filters: ReportFilter[];

  // Dimensions (grouping)
  dimensions: ReportDimension[];

  // Metrics (what to measure)
  metrics: ReportMetric[];

  // Sorting
  sortBy?: ReportSort[];

  // Limits
  limit?: number;

  // Comparison
  comparison?: ComparisonConfig;
}

/**
 * Data source configuration
 */
export interface ReportDataSource {
  module: ReportModule;
  entity: string; // e.g., 'Property', 'Lead', 'Deal'
  alias?: string;

  // Joins for cross-module reports
  joins?: ReportJoin[];
}

/**
 * Join configuration for multi-module reports
 */
export interface ReportJoin {
  targetModule: ReportModule;
  targetEntity: string;
  joinType: 'inner' | 'left' | 'right';
  onField: string;
  targetField: string;
}

/**
 * Date range configuration
 */
export interface DateRangeConfig {
  type: 'preset' | 'custom' | 'rolling';

  // Preset ranges
  preset?: DateRangePreset;

  // Custom range
  startDate?: string;
  endDate?: string;

  // Rolling range
  rollingPeriod?: number;
  rollingUnit?: 'days' | 'weeks' | 'months' | 'quarters' | 'years';

  // Comparison
  compareWith?: 'previous-period' | 'previous-year' | 'custom';
  comparisonStartDate?: string;
  comparisonEndDate?: string;
}

/**
 * Preset date ranges
 */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'this-year'
  | 'last-year'
  | 'mtd'              // Month to date
  | 'qtd'              // Quarter to date
  | 'ytd'              // Year to date
  | 'last-7-days'
  | 'last-30-days'
  | 'last-90-days'
  | 'last-12-months'
  | 'all-time';

/**
 * Report filter
 */
export interface ReportFilter {
  id: string;
  field: string;
  fieldLabel: string;
  operator: FilterOperator;
  value: any;
  dataType: FilterDataType;
  logicalOperator?: 'AND' | 'OR';
}

/**
 * Filter operators
 */
export type FilterOperator =
  | 'equals'
  | 'not-equals'
  | 'contains'
  | 'not-contains'
  | 'starts-with'
  | 'ends-with'
  | 'greater-than'
  | 'less-than'
  | 'greater-or-equal'
  | 'less-or-equal'
  | 'between'
  | 'in'
  | 'not-in'
  | 'is-null'
  | 'is-not-null';

/**
 * Filter data types
 */
export type FilterDataType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multi-select';

/**
 * Report dimension (grouping/breakdown)
 */
export interface ReportDimension {
  id: string;
  field: string;
  label: string;
  groupBy: GroupByType;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Group by types for dimensions
 */
export type GroupByType =
  | 'exact'              // Exact value
  | 'date-day'           // Group by day
  | 'date-week'          // Group by week
  | 'date-month'         // Group by month
  | 'date-quarter'       // Group by quarter
  | 'date-year'          // Group by year
  | 'range'              // Numeric ranges
  | 'custom';            // Custom grouping logic

/**
 * Report metric (what to measure)
 */
export interface ReportMetric {
  id: string;
  field: string;
  label: string;
  aggregation: AggregationType;
  format: MetricFormat;

  // Conditional formatting
  thresholds?: MetricThreshold[];
}

/**
 * Aggregation types
 */
export type AggregationType =
  | 'count'
  | 'count-distinct'
  | 'sum'
  | 'average'
  | 'min'
  | 'max'
  | 'median'
  | 'percentile'
  | 'first'
  | 'last'
  | 'none';

/**
 * Metric format
 */
export interface MetricFormat {
  type: 'number' | 'currency' | 'percentage' | 'duration' | 'text';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  multiplier?: number;
}

/**
 * Metric threshold for conditional formatting
 */
export interface MetricThreshold {
  condition: 'greater-than' | 'less-than' | 'between';
  value: number;
  value2?: number; // For 'between'
  color: string;
  icon?: string;
}

/**
 * Report sorting
 */
export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
  priority: number;
}

/**
 * Comparison configuration
 */
export interface ComparisonConfig {
  enabled: boolean;
  type: 'period-over-period' | 'year-over-year' | 'custom';
  showVariance: boolean;
  showPercentChange: boolean;
}

/**
 * Visualization types
 */
export type VisualizationType =
  | 'table'              // Data table
  | 'summary-cards'      // KPI cards
  | 'bar-chart'          // Bar chart
  | 'line-chart'         // Line chart
  | 'area-chart'         // Area chart
  | 'pie-chart'          // Pie chart
  | 'donut-chart'        // Donut chart
  | 'funnel-chart'       // Funnel chart
  | 'scatter-plot'       // Scatter plot
  | 'heatmap'            // Heat map
  | 'tree-map'           // Tree map
  | 'pivot-table'        // Pivot table
  | 'gauge'              // Gauge/speedometer
  | 'progress-bar';      // Progress bar

// ============================================
// GENERATED REPORT INSTANCE
// ============================================

/**
 * Generated report instance
 */
export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;

  // Configuration used
  config: ReportConfig;

  // Generated data
  data: ReportData;

  // Metadata
  generatedAt: string;
  generatedBy: string;
  generatedByName: string;

  // Parameters used
  parameters: ReportParameters;

  // Export info
  exports: ReportExport[];
}

/**
 * Report data structure
 */
export interface ReportData {
  // Raw data rows
  rows: ReportRow[];

  // Summary statistics
  summary: ReportSummary;

  // Metadata
  rowCount: number;
  filteredRowCount: number;

  // Comparison data (if enabled)
  comparisonRows?: ReportRow[];
  comparisonSummary?: ReportSummary;
}

/**
 * Report row
 */
export interface ReportRow {
  id: string;
  [key: string]: any; // Dynamic fields based on report config

  // Metadata
  _metadata?: {
    highlighted?: boolean;
    flagged?: boolean;
    notes?: string;
  };
}

/**
 * Report summary statistics
 */
export interface ReportSummary {
  [metricId: string]: {
    value: number;
    formatted: string;
    change?: number;
    percentChange?: number;
    trend?: 'up' | 'down' | 'stable';
  };
}

/**
 * Report parameters (user inputs)
 */
export interface ReportParameters {
  dateRange: {
    label: string;
    startDate: string;
    endDate: string;
  };

  filters: {
    [filterId: string]: {
      label: string;
      value: any;
      formatted: string;
    };
  };

  dimensions: string[];
  metrics: string[];
}

/**
 * Report export record
 */
export interface ReportExport {
  id: string;
  format: ExportFormat;
  fileName: string;
  fileSize?: number;
  exportedAt: string;
  exportedBy: string;
  downloadUrl?: string;
}

/**
 * Export formats
 */
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'png';

// ============================================
// REPORT SCHEDULING
// ============================================

/**
 * Scheduled report
 */
export interface ScheduledReport {
  id: string;
  templateId: string;
  templateName: string;

  // Schedule configuration
  schedule: ScheduleConfig;

  // Report configuration
  reportConfig: ReportConfig;

  // Distribution
  distribution: DistributionConfig;

  // Status
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  runCount: number;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  frequency: ScheduleFrequency;

  // Status
  enabled?: boolean;
  nextRun?: string;

  // Time
  time: string; // HH:MM format (24-hour)
  timezone: string; // e.g., 'Asia/Karachi'

  // Recurrence
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  monthOfQuarter?: number; // 1-3 for quarterly

  // Date range (how to handle report date ranges)
  dateRangeMode: 'rolling' | 'fixed';

  // End date for schedule
  endDate?: string;
  maxRuns?: number;
}

/**
 * Schedule frequency
 */
export type ScheduleFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

/**
 * Distribution configuration
 */
export interface DistributionConfig {
  // Email distribution
  emailEnabled: boolean;
  emailTo: string[];
  emailCc?: string[];
  emailSubject?: string;
  emailBody?: string;

  // Attachments
  attachmentFormats: ExportFormat[];

  // Delivery options
  deliveryMethod: 'email' | 'save-to-storage' | 'both';
  storagePath?: string;
}

// ============================================
// REPORT HISTORY & AUDIT
// ============================================

/**
 * Report execution history
 */
export interface ReportHistory {
  id: string;
  reportId: string;
  templateId: string;
  templateName: string;

  // Execution details
  executedAt: string;
  executedBy: string;
  executedByName: string;

  // Result
  status: 'success' | 'failed' | 'partial';
  rowCount?: number;
  executionTime: number; // milliseconds

  // Parameters used
  parameters: ReportParameters;

  // Error details (if failed)
  error?: string;

  // Actions taken
  actions: ReportAction[];
}

/**
 * Report action (view, export, share)
 */
export interface ReportAction {
  id: string;
  type: ReportActionType;
  performedAt: string;
  performedBy: string;
  details?: any;
}

/**
 * Report action types
 */
export type ReportActionType =
  | 'generated'
  | 'viewed'
  | 'exported'
  | 'shared'
  | 'scheduled'
  | 'modified'
  | 'deleted';

// ============================================
// REPORT WIDGETS & DASHBOARDS
// ============================================

/**
 * Report widget for embedding in dashboards
 */
export interface ReportWidget {
  id: string;
  templateId: string;
  templateName: string;

  // Widget configuration
  visualization: VisualizationType;
  refreshInterval?: number; // minutes (0 = manual only)

  // Filters (can override template filters)
  filters?: ReportFilter[];

  // Display options
  showTitle: boolean;
  showRefreshButton: boolean;
  showFilters: boolean;
  height?: number;

  // Layout
  gridPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Metadata
  lastRefreshed?: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// PRE-BUILT REPORT TEMPLATES
// ============================================

/**
 * System report template IDs
 * These are pre-built reports that come with aaraazi
 */
export const SYSTEM_REPORTS = {
  // Executive Summary
  EXECUTIVE_DASHBOARD: 'exec-dashboard',
  BUSINESS_OVERVIEW: 'business-overview',

  // Financial Analysis
  REVENUE_ANALYSIS: 'revenue-analysis',
  COMMISSION_SUMMARY: 'commission-summary',
  EXPENSE_ANALYSIS: 'expense-analysis',
  PROFIT_LOSS: 'profit-loss',
  CASH_FLOW: 'cash-flow',
  PORTFOLIO_ROI: 'portfolio-roi',
  ACCOUNTS_RECEIVABLE: 'accounts-receivable',
  ACCOUNTS_PAYABLE: 'accounts-payable',
  MONTHLY_REVENUE_PROJECTION: 'monthly-revenue-projection',
  DAILY_OPERATIONS: 'daily-operations',

  // Sales Performance
  DEALS_PIPELINE: 'deals-pipeline',
  CONVERSION_FUNNEL: 'conversion-funnel',
  SALES_BY_AGENT: 'sales-by-agent',
  DEAL_VELOCITY: 'deal-velocity',

  // Inventory Analysis
  PROPERTY_PORTFOLIO: 'property-portfolio',
  INVENTORY_AGING: 'inventory-aging',
  PROPERTY_PERFORMANCE: 'property-performance',
  MARKET_VALUE_TRENDS: 'market-value-trends',

  // Lead Analytics
  LEAD_FUNNEL: 'lead-funnel',
  LEAD_SOURCE_ANALYSIS: 'lead-source-analysis',
  LEAD_RESPONSE_TIME: 'lead-response-time',
  LEAD_CONVERSION: 'lead-conversion',

  // Agent Performance
  AGENT_PERFORMANCE: 'agent-performance',
  AGENT_LEADERBOARD: 'agent-leaderboard',
  TEAM_PRODUCTIVITY: 'team-productivity',

  // Client Insights
  CLIENT_LIFETIME_VALUE: 'client-lifetime-value',
  CLIENT_SEGMENTATION: 'client-segmentation',
  REPEAT_BUSINESS: 'repeat-business',

  // Market Trends
  MARKET_ANALYSIS: 'market-analysis',
  PRICING_TRENDS: 'pricing-trends',
  DEMAND_ANALYSIS: 'demand-analysis',

  // Operational
  CYCLE_TIME_ANALYSIS: 'cycle-time-analysis',
  PROCESS_EFFICIENCY: 'process-efficiency',

  // Requirements
  BUYER_REQUIREMENTS: 'buyer-requirements',
  RENT_REQUIREMENTS: 'rent-requirements',
  MATCHING_SUCCESS: 'matching-success',
} as const;

// ============================================
// REPORT BUILDER STATE
// ============================================

/**
 * Report builder UI state
 */
export interface ReportBuilderState {
  // Current step
  currentStep: number;
  totalSteps: number;

  // Configuration being built
  template: Partial<ReportTemplate>;

  // Validation
  errors: ValidationError[];
  warnings: ValidationWarning[];

  // Preview
  isPreviewLoading: boolean;
  previewData?: ReportData;

  // Save status
  isSaving: boolean;
  lastSaved?: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  step: number;
  field: string;
  message: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  step: number;
  field: string;
  message: string;
}

// ============================================
// REPORT ANALYTICS
// ============================================

/**
 * Report usage analytics
 */
export interface ReportAnalytics {
  templateId: string;

  // Usage metrics
  totalGenerations: number;
  uniqueUsers: number;
  avgExecutionTime: number;

  // Time series
  generationsByDay: { date: string; count: number }[];

  // Popular filters
  popularFilters: { filter: string; usageCount: number }[];

  // Export stats
  exportsByFormat: { format: ExportFormat; count: number }[];

  // Period
  periodStart: string;
  periodEnd: string;
  calculatedAt: string;
}