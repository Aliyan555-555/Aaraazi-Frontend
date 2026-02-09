/**
 * Custom Report Builder - Type Definitions
 *
 * Defines all TypeScript interfaces for the custom report builder feature.
 * Supports multi-source data integration, filtering, grouping, and aggregation.
 *
 * @module types/custom-reports
 */

import {
  FilterOperator,
  GeneratedReport as BaseGeneratedReport,
  ReportRow as BaseReportRow,
  ScheduleConfig as BaseScheduleConfig,
  ScheduleFrequency as BaseScheduleFrequency,
  ReportCategory as BaseReportCategory,
  ValidationError as BaseValidationError,
} from "./reports";

/**
 * Main custom report template
 * Persisted to localStorage as 'custom_report_templates'
 */
export interface CustomReportTemplate {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  isShared: boolean;

  // Report configuration
  config: ReportConfiguration;

  // Usage statistics
  generationCount: number;
  lastGenerated?: string;
}

/**
 * Grouping configuration
 */
export interface GroupingConfig {
  groupBy: string[]; // Field paths to group by
  aggregations: AggregationConfig[];
  sortGroupsBy: "name" | "value";
  sortDirection: "asc" | "desc";
}

/**
 * Chart types
 */
export type ChartType = "bar" | "line" | "pie" | "area" | "scatter";

/**
 * Chart configuration
 */
export interface ChartConfig {
  enabled: boolean;
  chartType: ChartType;
  xAxis?: string; // Field path for X axis
  yAxis?: string; // Field path for Y axis
  series?: string[]; // Field paths for series (multiple lines/bars)
  title?: string;
  showLegend: boolean;
  showGrid: boolean;
  colorScheme?: "default" | "blue" | "green" | "red" | "purple";
}

/**
 * Report configuration
 */
export interface ReportConfiguration {
  dataSources: DataSource[];
  fields: SelectedField[];
  filters: FilterRule[];
  grouping?: GroupingConfig;
  sorting: SortConfig[];
  chart?: ChartConfig;
  schedule?: BaseScheduleConfig;
}

/**
 * Data source selection
 * Supports multiple sources for join-like queries
 */
export interface DataSource {
  source:
    | "deals"
    | "properties"
    | "expenses"
    | "commissions"
    | "investors"
    | "budgets"
    | "ledger";
  alias?: string;
  joins?: JoinConfig[];
}

/**
 * Join configuration for multi-source reports
 * Future feature - not implemented in Phase 7A
 */
export interface JoinConfig {
  targetSource: string;
  joinType: "inner" | "left" | "right";
  onField: string;
  targetField: string;
}

/**
 * Selected field for display in report
 * Includes field metadata and optional aggregation
 */
export interface SelectedField {
  id: string;
  source: string;
  field: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "percentage" | "boolean";
  aggregation?: AggregationFunction;

  // Display formatting
  format?: FieldFormat;
}

/**
 * Aggregation functions for grouping
 */
export type AggregationFunction =
  | "sum"
  | "avg"
  | "count"
  | "min"
  | "max"
  | "none";

/**
 * Field formatting options
 */
export interface FieldFormat {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  dateFormat?: string;
}

/**
 * Filter rule for data filtering
 * Supports multiple operators based on field type
 */
export interface FilterRule {
  id: string;
  field: string;
  fieldType: "text" | "number" | "date" | "currency" | "percentage" | "boolean";
  operator: FilterOperator;
  value: any;
  logicalOperator?: "AND" | "OR";
}

/**
 * Aggregation configuration for grouped data
 */
export interface AggregationConfig {
  field: string;
  function: AggregationFunction;
  label: string;
}

/**
 * Sorting configuration
 */
export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
  priority: number; // For multi-column sorting
}

/**
 * Report-wide formatting configuration
 */
export interface FormattingConfig {
  // Table formatting
  showRowNumbers?: boolean;
  alternateRowColors?: boolean;

  // Number formatting
  currencySymbol?: string;
  decimalPlaces?: number;
  thousandsSeparator?: string;

  // Date formatting
  dateFormat?: "short" | "medium" | "long" | "iso";

  // Styling
  headerBackgroundColor?: string;
  fontSize?: "small" | "medium" | "large";
}

/**
 * Available field definition
 * Defines fields available for selection from each data source
 */
export interface AvailableField {
  id: string;
  source: string;
  field: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "percentage" | "boolean";
  description?: string;

  // Metadata
  isRequired?: boolean;
  isPrimaryKey?: boolean;
  allowAggregation?: boolean;
  allowGrouping?: boolean;
}

/**
 * Generated report data
 * Result of executing a report configuration
 * Note: Uses customized GeneratedReport that wraps ReportConfiguration
 */
export interface CustomGeneratedReport extends Omit<
  BaseGeneratedReport,
  "config"
> {
  config: ReportConfiguration;
  columns: ReportColumn[];
}

/**
 * Report column metadata
 */
export interface ReportColumn {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "percentage" | "boolean";
  width?: number;
  align?: "left" | "center" | "right";
}

/**
 * Internal Report Builder State
 */
export interface CustomReportBuilderState {
  currentStep: number;
  config: Partial<ReportConfiguration>;
  errors: BaseValidationError[];
  isPreviewLoading: boolean;
  previewData?: CustomGeneratedReport;
}

/**
 * Quick filter preset
 * Pre-configured common filters for quick selection
 */
export interface QuickFilterPreset {
  id: string;
  label: string;
  description: string;
  filters: FilterRule[];
}

/**
 * Export options
 */
export interface ExportOptions {
  format: "pdf" | "csv" | "excel";
  includeHeader: boolean;
  includeFooter: boolean;
  paperSize?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";

  // PDF-specific
  title?: string;
  subtitle?: string;
  logo?: string;

  // CSV-specific
  delimiter?: "," | ";" | "\t";
  encoding?: "utf-8" | "utf-16";
}
