/**
 * Reports Module - Data Service
 * 
 * Handles report generation, data aggregation, and storage
 * Integrates with all aaraazi modules for comprehensive reporting
 * 
 * @module lib/reports
 * @version 1.0.0
 */

import {
  ReportTemplate,
  ReportConfig,
  GeneratedReport,
  ReportData,
  ReportRow,
  ReportSummary,
  ReportFilter,
  DateRangeConfig,
  DateRangePreset,
  ScheduledReport,
  ReportHistory,
  ReportWidget,
  ReportAnalytics,
  SYSTEM_REPORTS,
  AggregationType,
  ReportModule,
} from '../types/reports';
import { formatPKR } from './currency';
import { Property, Lead, Contact, Deal, Commission, Expense, AgencyTransaction } from '../types';
import { logger } from './logger';

// ============================================
// STORAGE KEYS
// ============================================

const REPORT_TEMPLATES_KEY = 'aaraazi_report_templates';
const GENERATED_REPORTS_KEY = 'aaraazi_generated_reports';
const SCHEDULED_REPORTS_KEY = 'aaraazi_scheduled_reports';
const REPORT_HISTORY_KEY = 'aaraazi_report_history';
const REPORT_WIDGETS_KEY = 'aaraazi_report_widgets';
const REPORT_FAVORITES_KEY = 'aaraazi_report_favorites';

// ============================================
// TEMPLATE MANAGEMENT
// ============================================

/**
 * Get all report templates
 */
export function getReportTemplates(userId: string): ReportTemplate[] {
  try {
    const templates = JSON.parse(localStorage.getItem(REPORT_TEMPLATES_KEY) || '[]') as ReportTemplate[];
    
    // Filter to show system templates + user's templates + shared templates
    return templates.filter(
      t => t.isSystemTemplate || t.createdBy === userId || t.sharedWith.includes(userId)
    );
  } catch (error) {
    logger.error('Failed to get report templates:', error);
    return [];
  }
}

/**
 * Get report template by ID
 */
export function getReportTemplate(id: string): ReportTemplate | null {
  try {
    const templates = JSON.parse(localStorage.getItem(REPORT_TEMPLATES_KEY) || '[]') as ReportTemplate[];
    return templates.find(t => t.id === id) || null;
  } catch (error) {
    logger.error('Failed to get report template:', error);
    return null;
  }
}

/**
 * Save report template
 */
export function saveReportTemplate(template: ReportTemplate): void {
  try {
    const templates = JSON.parse(localStorage.getItem(REPORT_TEMPLATES_KEY) || '[]') as ReportTemplate[];
    
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = {
        ...template,
        updatedAt: new Date().toISOString(),
      };
    } else {
      templates.push(template);
    }
    
    localStorage.setItem(REPORT_TEMPLATES_KEY, JSON.stringify(templates));
    logger.info('Report template saved:', template.id);
  } catch (error) {
    logger.error('Failed to save report template:', error);
    throw error;
  }
}

/**
 * Delete report template
 */
export function deleteReportTemplate(id: string): void {
  try {
    const templates = JSON.parse(localStorage.getItem(REPORT_TEMPLATES_KEY) || '[]') as ReportTemplate[];
    
    // Cannot delete system templates
    const template = templates.find(t => t.id === id);
    if (template?.isSystemTemplate) {
      throw new Error('Cannot delete system templates');
    }
    
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(REPORT_TEMPLATES_KEY, JSON.stringify(filtered));
    
    logger.info('Report template deleted:', id);
  } catch (error) {
    logger.error('Failed to delete report template:', error);
    throw error;
  }
}

/**
 * Toggle template favorite
 */
export function toggleTemplateFavorite(templateId: string, userId: string): void {
  try {
    const templates = JSON.parse(localStorage.getItem(REPORT_TEMPLATES_KEY) || '[]') as ReportTemplate[];
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      template.isFavorite = !template.isFavorite;
      localStorage.setItem(REPORT_TEMPLATES_KEY, JSON.stringify(templates));
    }
  } catch (error) {
    logger.error('Failed to toggle favorite:', error);
  }
}

// ============================================
// REPORT GENERATION
// ============================================

/**
 * Generate report from template
 */
export function generateReport(
  templateId: string,
  userId: string,
  userName: string
): GeneratedReport | null {
  try {
    const template = getReportTemplate(templateId);
    if (!template) {
      const errorMsg = `Template not found: ${templateId}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!template.config) {
      const errorMsg = `Template ${templateId} has no configuration`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!template.config.dataSources || template.config.dataSources.length === 0) {
      const errorMsg = `Template ${templateId} has no data sources configured`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const startTime = Date.now();
    
    // Generate report data
    let data: ReportData;
    try {
      data = executeReportQuery(template.config);
    } catch (queryError: any) {
      const errorMsg = `Failed to execute report query: ${queryError?.message || String(queryError)}`;
      logger.error(errorMsg, queryError);
      throw new Error(errorMsg);
    }
    
    const executionTime = Date.now() - startTime;
    
    // Create generated report
    const report: GeneratedReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      templateId: template.id,
      templateName: template.name,
      config: template.config,
      data,
      generatedAt: new Date().toISOString(),
      generatedBy: userId,
      generatedByName: userName,
      parameters: extractParameters(template.config),
      exports: [],
    };
    
    // Save to history
    try {
      saveReportHistory({
        id: `history-${Date.now()}`,
        reportId: report.id,
        templateId: template.id,
        templateName: template.name,
        executedAt: report.generatedAt,
        executedBy: userId,
        executedByName: userName,
        status: 'success',
        rowCount: data.rowCount,
        executionTime,
        parameters: report.parameters,
        actions: [
          {
            id: `action-${Date.now()}`,
            type: 'generated',
            performedAt: new Date().toISOString(),
            performedBy: userId,
          },
        ],
      });
    } catch (historyError) {
      logger.warn('Failed to save report history:', historyError);
      // Continue even if history save fails
    }
    
    // Update template generation count
    try {
      template.generationCount += 1;
      template.lastGenerated = new Date().toISOString();
      saveReportTemplate(template);
    } catch (templateError) {
      logger.warn('Failed to update template:', templateError);
      // Continue even if template update fails
    }
    
    // Save generated report
    try {
      saveGeneratedReport(report);
    } catch (saveError) {
      logger.warn('Failed to save generated report:', saveError);
      // Continue even if save fails
    }
    
    logger.info('Report generated:', report.id, `(${executionTime}ms)`, `Rows: ${data.rowCount}`);
    
    return report;
  } catch (error: any) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    logger.error('Failed to generate report:', errorMsg, error);
    
    // Try to save error to history if possible
    try {
      const template = getReportTemplate(templateId);
      if (template) {
        saveReportHistory({
          id: `history-${Date.now()}`,
          reportId: '',
          templateId: template.id,
          templateName: template.name,
          executedAt: new Date().toISOString(),
          executedBy: userId,
          executedByName: userName,
          status: 'failed',
          rowCount: 0,
          executionTime: 0,
          parameters: {},
          error: errorMsg,
          actions: [
            {
              id: `action-${Date.now()}`,
              type: 'failed',
              performedAt: new Date().toISOString(),
              performedBy: userId,
            },
          ],
        });
      }
    } catch (historyError) {
      // Ignore history save errors
    }
    
    return null;
  }
}

/**
 * Execute report query and return data
 */
function executeReportQuery(config: ReportConfig): ReportData {
  try {
    // Validate config
    if (!config) {
      throw new Error('Report configuration is missing');
    }
    
    if (!config.dataSources || !Array.isArray(config.dataSources) || config.dataSources.length === 0) {
      throw new Error('Report configuration has no data sources');
    }
    
    // Get raw data from all sources
    const rawData = fetchDataFromSources(config.dataSources);
    
    if (!Array.isArray(rawData)) {
      console.warn('fetchDataFromSources returned non-array, converting to array');
      return {
        rows: [],
        summary: {},
        rowCount: 0,
        filteredRowCount: 0,
      };
    }
    
    // Apply date range filter
    let filteredData = applyDateRangeFilter(rawData, config.dateRange);
    
    // Apply custom filters
    filteredData = applyFilters(filteredData, config.filters || []);
    
    // Apply dimensions (grouping)
    let processedData: any[];
    try {
      processedData = config.dimensions && config.dimensions.length > 0
        ? applyGrouping(filteredData, config)
        : filteredData.map((item, index) => ({ id: `row-${index}`, ...item }));
    } catch (groupingError) {
      console.error('Error applying grouping:', groupingError);
      // Fallback to simple mapping
      processedData = filteredData.map((item, index) => ({ id: `row-${index}`, ...item }));
    }
    
    // Apply sorting
    if (config.sortBy && Array.isArray(config.sortBy) && config.sortBy.length > 0) {
      try {
        processedData = applySorting(processedData, config.sortBy);
      } catch (sortError) {
        console.error('Error applying sorting:', sortError);
        // Continue without sorting
      }
    }
    
    // Apply limit
    if (config.limit && typeof config.limit === 'number' && config.limit > 0) {
      processedData = processedData.slice(0, config.limit);
    }
    
    // Calculate summary statistics
    let summary: any = {};
    try {
      summary = calculateSummary(processedData, config.metrics || []);
    } catch (summaryError) {
      console.error('Error calculating summary:', summaryError);
      // Continue with empty summary
    }
    
    // Handle comparison if enabled
    let comparisonData: ReportData | undefined;
    if (config.comparison?.enabled) {
      // TODO: Implement comparison logic
    }
    
    return {
      rows: processedData,
      summary,
      rowCount: processedData.length,
      filteredRowCount: filteredData.length,
      comparisonRows: comparisonData?.rows,
      comparisonSummary: comparisonData?.summary,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error) || 'Unknown error in executeReportQuery';
    console.error('Error executing report query:', errorMsg, error);
    throw new Error(`Report query execution failed: ${errorMsg}`);
  }
}

/**
 * Fetch data from specified sources
 */
function fetchDataFromSources(dataSources: any[]): any[] {
  const allData: any[] = [];
  
  dataSources.forEach(source => {
    let moduleData: any[] = [];
    
    try {
      switch (source.module) {
        case 'properties':
          moduleData = JSON.parse(localStorage.getItem('estate_properties') || '[]');
          break;
        case 'leads':
          // Try multiple possible keys for leads
          moduleData = JSON.parse(
            localStorage.getItem('aaraazi_leads_v4') || 
            localStorage.getItem('aaraazi_leads_v2') ||
            localStorage.getItem('estate_leads') || 
            '[]'
          );
          break;
        case 'contacts':
          moduleData = JSON.parse(localStorage.getItem('crm_contacts') || '[]');
          break;
        case 'deals':
          // Include actual deals and all cycle types
          moduleData = [
            ...JSON.parse(localStorage.getItem('aaraazi_deals_v4') || '[]'),
            ...JSON.parse(localStorage.getItem('sell_cycles_v3') || '[]'),
            ...JSON.parse(localStorage.getItem('purchase_cycles_v3') || '[]'),
            ...JSON.parse(localStorage.getItem('rent_cycles_v3') || '[]'),
            // Legacy keys for backward compatibility
            ...JSON.parse(localStorage.getItem('estatemanager_sell_cycles') || '[]'),
            ...JSON.parse(localStorage.getItem('estatemanager_purchase_cycles') || '[]'),
          ];
          break;
        case 'financials':
          moduleData = [
            ...JSON.parse(localStorage.getItem('estate_commissions') || '[]'),
            ...JSON.parse(localStorage.getItem('estate_expenses') || '[]'),
            ...JSON.parse(localStorage.getItem('agency_transactions') || '[]'),
          ];
          break;
        case 'portfolio':
          moduleData = JSON.parse(localStorage.getItem('estate_properties') || '[]')
            .filter((p: any) => p.acquisitionType === 'inventory');
          break;
        case 'requirements':
          // Use correct keys for requirements
          moduleData = [
            ...JSON.parse(localStorage.getItem('buyer_requirements_v3') || '[]'),
            ...JSON.parse(localStorage.getItem('estatemanager_rent_requirements_v3') || '[]'),
            // Legacy keys for backward compatibility
            ...JSON.parse(localStorage.getItem('buyer_requirements') || '[]'),
            ...JSON.parse(localStorage.getItem('rent_requirements') || '[]'),
          ];
          break;
        default:
          console.warn(`Unknown data source module: ${source.module}`);
      }
    } catch (error) {
      console.error(`Error fetching data from source ${source.module}:`, error);
      // Continue with empty array instead of breaking
      moduleData = [];
    }
    
    allData.push(...moduleData);
  });
  
  return allData;
}

/**
 * Apply date range filter to data
 */
function applyDateRangeFilter(data: any[], dateRange: DateRangeConfig | undefined): any[] {
  if (!dateRange) {
    return data;
  }
  
  if (dateRange.type === 'preset' && dateRange.preset === 'all-time') {
    return data;
  }
  
  try {
    const { startDate, endDate } = getDateRangeBounds(dateRange);
    
    return data.filter(item => {
      try {
        // Try multiple possible date fields
        const itemDate = item.createdAt || item.date || item.startDate || item.updatedAt || item.timestamp;
        if (!itemDate) return true; // Include items without dates rather than excluding them
        
        const date = new Date(itemDate);
        if (isNaN(date.getTime())) return true; // Invalid date, include it
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return date >= start && date <= end;
      } catch (error) {
        // If date parsing fails, include the item
        console.warn('Error parsing date in filter:', error, item);
        return true;
      }
    });
  } catch (error) {
    console.error('Error applying date range filter:', error);
    // Return all data if filter fails
    return data;
  }
}

/**
 * Get date range bounds
 */
function getDateRangeBounds(dateRange: DateRangeConfig): { startDate: string; endDate: string } {
  if (!dateRange) {
    // Default to all-time if no date range provided
    return {
      startDate: new Date(0).toISOString(),
      endDate: new Date().toISOString(),
    };
  }
  
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  
  if (dateRange.type === 'custom') {
    return {
      startDate: dateRange.startDate || now.toISOString(),
      endDate: dateRange.endDate || now.toISOString(),
    };
  }
  
  if (dateRange.type === 'rolling' && dateRange.rollingPeriod && dateRange.rollingUnit) {
    endDate = new Date();
    startDate = new Date();
    
    switch (dateRange.rollingUnit) {
      case 'days':
        startDate.setDate(startDate.getDate() - dateRange.rollingPeriod);
        break;
      case 'weeks':
        startDate.setDate(startDate.getDate() - dateRange.rollingPeriod * 7);
        break;
      case 'months':
        startDate.setMonth(startDate.getMonth() - dateRange.rollingPeriod);
        break;
      case 'quarters':
        startDate.setMonth(startDate.getMonth() - dateRange.rollingPeriod * 3);
        break;
      case 'years':
        startDate.setFullYear(startDate.getFullYear() - dateRange.rollingPeriod);
        break;
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }
  
  // Preset ranges
  if (dateRange.type === 'preset' && dateRange.preset) {
    return getPresetDateRange(dateRange.preset);
  }
  
  return {
    startDate: now.toISOString(),
    endDate: now.toISOString(),
  };
}

/**
 * Get preset date range
 */
function getPresetDateRange(preset: DateRangePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();
  
  switch (preset) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case 'this-week':
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;
    
    case 'last-week':
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      return {
        startDate: lastWeekStart.toISOString(),
        endDate: lastWeekEnd.toISOString(),
      };
    
    case 'this-month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    
    case 'last-month':
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);
      const lastMonthEnd = new Date(lastMonth);
      lastMonthEnd.setMonth(lastMonth.getMonth() + 1);
      lastMonthEnd.setDate(0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      return {
        startDate: lastMonth.toISOString(),
        endDate: lastMonthEnd.toISOString(),
      };
    
    case 'this-quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate.setMonth(quarterMonth);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    
    case 'this-year':
      startDate.setMonth(0);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    
    case 'mtd':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    
    case 'ytd':
      startDate.setMonth(0);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    
    case 'last-7-days':
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    
    case 'last-30-days':
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    
    case 'last-90-days':
      startDate.setDate(now.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;
    
    case 'last-12-months':
      startDate.setMonth(now.getMonth() - 12);
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * Apply filters to data
 */
function applyFilters(data: any[], filters: ReportFilter[]): any[] {
  if (!filters || filters.length === 0) return data;
  
  return data.filter(item => {
    return filters.every(filter => {
      const fieldValue = getNestedValue(item, filter.field);
      
      switch (filter.operator) {
        case 'equals':
          return fieldValue === filter.value;
        case 'not-equals':
          return fieldValue !== filter.value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'not-contains':
          return !String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'starts-with':
          return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
        case 'ends-with':
          return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
        case 'greater-than':
          return Number(fieldValue) > Number(filter.value);
        case 'less-than':
          return Number(fieldValue) < Number(filter.value);
        case 'greater-or-equal':
          return Number(fieldValue) >= Number(filter.value);
        case 'less-or-equal':
          return Number(fieldValue) <= Number(filter.value);
        case 'between':
          return Number(fieldValue) >= Number(filter.value[0]) && Number(fieldValue) <= Number(filter.value[1]);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);
        case 'not-in':
          return Array.isArray(filter.value) && !filter.value.includes(fieldValue);
        case 'is-null':
          return fieldValue === null || fieldValue === undefined;
        case 'is-not-null':
          return fieldValue !== null && fieldValue !== undefined;
        default:
          return true;
      }
    });
  });
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Apply grouping to data
 */
function applyGrouping(data: any[], config: ReportConfig): ReportRow[] {
  // Group data by dimensions
  const grouped = new Map<string, any[]>();
  
  data.forEach(item => {
    const groupKey = config.dimensions
      .map(dim => getNestedValue(item, dim.field))
      .join('|');
    
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(item);
  });
  
  // Aggregate metrics for each group
  const result: ReportRow[] = [];
  
  grouped.forEach((items, groupKey) => {
    const row: ReportRow = {
      id: `group-${groupKey}`,
    };
    
    // Add dimension values
    const groupValues = groupKey.split('|');
    config.dimensions.forEach((dim, index) => {
      row[dim.field] = groupValues[index];
    });
    
    // Calculate metrics
    config.metrics.forEach(metric => {
      row[metric.field] = calculateAggregation(items, metric.field, metric.aggregation);
    });
    
    result.push(row);
  });
  
  return result;
}

/**
 * Calculate aggregation
 */
function calculateAggregation(items: any[], field: string, aggregation: AggregationType): any {
  const values = items.map(item => getNestedValue(item, field)).filter(v => v !== null && v !== undefined);
  
  switch (aggregation) {
    case 'count':
      return items.length;
    case 'count-distinct':
      return new Set(values).size;
    case 'sum':
      return values.reduce((sum, val) => sum + Number(val), 0);
    case 'average':
      return values.length > 0 ? values.reduce((sum, val) => sum + Number(val), 0) / values.length : 0;
    case 'min':
      return values.length > 0 ? Math.min(...values.map(Number)) : 0;
    case 'max':
      return values.length > 0 ? Math.max(...values.map(Number)) : 0;
    case 'median':
      if (values.length === 0) return 0;
      const sorted = values.map(Number).sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    case 'first':
      return values[0];
    case 'last':
      return values[values.length - 1];
    case 'none':
    default:
      return values[0];
  }
}

/**
 * Apply sorting to data
 */
function applySorting(data: ReportRow[], sortConfig: any[]): ReportRow[] {
  return [...data].sort((a, b) => {
    for (const sort of sortConfig.sort((s1, s2) => s1.priority - s2.priority)) {
      const aVal = getNestedValue(a, sort.field);
      const bVal = getNestedValue(b, sort.field);
      
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Calculate summary statistics
 */
function calculateSummary(data: ReportRow[], metrics: any[]): ReportSummary {
  const summary: ReportSummary = {};
  
  metrics.forEach(metric => {
    const value = calculateAggregation(data, metric.field, metric.aggregation);
    
    summary[metric.id] = {
      value,
      formatted: formatMetricValue(value, metric.format),
      // TODO: Add comparison logic for change/percentChange/trend
    };
  });
  
  return summary;
}

/**
 * Format metric value
 */
function formatMetricValue(value: number, format: any): string {
  if (format.type === 'currency') {
    return formatPKR(value);
  }
  
  if (format.type === 'percentage') {
    return `${(value * (format.multiplier || 1)).toFixed(format.decimals || 1)}%`;
  }
  
  if (format.type === 'number') {
    return value.toLocaleString('en-PK', { minimumFractionDigits: format.decimals || 0, maximumFractionDigits: format.decimals || 0 });
  }
  
  return String(value);
}

/**
 * Extract parameters from config
 */
function extractParameters(config: ReportConfig): any {
  const { startDate, endDate } = getDateRangeBounds(config.dateRange);
  
  return {
    dateRange: {
      label: config.dateRange.preset || 'Custom Range',
      startDate,
      endDate,
    },
    filters: {},
    dimensions: config.dimensions.map(d => d.label),
    metrics: config.metrics.map(m => m.label),
  };
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Save generated report
 */
function saveGeneratedReport(report: GeneratedReport): void {
  try {
    const reports = JSON.parse(localStorage.getItem(GENERATED_REPORTS_KEY) || '[]') as GeneratedReport[];
    reports.push(report);
    
    // Keep only last 100 reports
    if (reports.length > 100) {
      reports.splice(0, reports.length - 100);
    }
    
    localStorage.setItem(GENERATED_REPORTS_KEY, JSON.stringify(reports));
  } catch (error) {
    logger.error('Failed to save generated report:', error);
  }
}

/**
 * Save report history
 */
function saveReportHistory(history: ReportHistory): void {
  try {
    const historyRecords = JSON.parse(localStorage.getItem(REPORT_HISTORY_KEY) || '[]') as ReportHistory[];
    historyRecords.push(history);
    
    // Keep only last 500 history records
    if (historyRecords.length > 500) {
      historyRecords.splice(0, historyRecords.length - 500);
    }
    
    localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(historyRecords));
  } catch (error) {
    logger.error('Failed to save report history:', error);
  }
}

/**
 * Get report history
 */
export function getReportHistory(templateId?: string): ReportHistory[] {
  try {
    const history = JSON.parse(localStorage.getItem(REPORT_HISTORY_KEY) || '[]') as ReportHistory[];
    
    if (templateId) {
      return history.filter(h => h.templateId === templateId);
    }
    
    return history;
  } catch (error) {
    logger.error('Failed to get report history:', error);
    return [];
  }
}

/**
 * Get generated report
 */
export function getGeneratedReport(id: string): GeneratedReport | null {
  try {
    const reports = JSON.parse(localStorage.getItem(GENERATED_REPORTS_KEY) || '[]') as GeneratedReport[];
    return reports.find(r => r.id === id) || null;
  } catch (error) {
    logger.error('Failed to get generated report:', error);
    return null;
  }
}

// ============================================
// SCHEDULED REPORTS
// ============================================

/**
 * Get all scheduled reports for a user
 */
export function getScheduledReports(userId: string): ScheduledReport[] {
  try {
    const schedules = JSON.parse(localStorage.getItem(SCHEDULED_REPORTS_KEY) || '[]') as ScheduledReport[];
    return schedules.filter(s => s.createdBy === userId);
  } catch (error) {
    logger.error('Failed to get scheduled reports:', error);
    return [];
  }
}

/**
 * Get scheduled report by ID
 */
export function getScheduledReport(id: string): ScheduledReport | null {
  try {
    const schedules = JSON.parse(localStorage.getItem(SCHEDULED_REPORTS_KEY) || '[]') as ScheduledReport[];
    return schedules.find(s => s.id === id) || null;
  } catch (error) {
    logger.error('Failed to get scheduled report:', error);
    return null;
  }
}

/**
 * Create scheduled report
 */
export function createScheduledReport(schedule: ScheduledReport): void {
  try {
    const schedules = JSON.parse(localStorage.getItem(SCHEDULED_REPORTS_KEY) || '[]') as ScheduledReport[];
    schedules.push(schedule);
    localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(schedules));
    logger.info('Scheduled report created:', schedule.id);
  } catch (error) {
    logger.error('Failed to create scheduled report:', error);
    throw error;
  }
}

/**
 * Update scheduled report
 */
export function updateScheduledReport(schedule: ScheduledReport): void {
  try {
    const schedules = JSON.parse(localStorage.getItem(SCHEDULED_REPORTS_KEY) || '[]') as ScheduledReport[];
    const index = schedules.findIndex(s => s.id === schedule.id);
    
    if (index >= 0) {
      schedules[index] = {
        ...schedule,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(schedules));
      logger.info('Scheduled report updated:', schedule.id);
    }
  } catch (error) {
    logger.error('Failed to update scheduled report:', error);
    throw error;
  }
}

/**
 * Delete scheduled report
 */
export function deleteScheduledReport(id: string): void {
  try {
    const schedules = JSON.parse(localStorage.getItem(SCHEDULED_REPORTS_KEY) || '[]') as ScheduledReport[];
    const filtered = schedules.filter(s => s.id !== id);
    localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(filtered));
    logger.info('Scheduled report deleted:', id);
  } catch (error) {
    logger.error('Failed to delete scheduled report:', error);
    throw error;
  }
}

/**
 * Toggle schedule active status
 */
export function toggleScheduleActive(id: string): void {
  try {
    const schedules = JSON.parse(localStorage.getItem(SCHEDULED_REPORTS_KEY) || '[]') as ScheduledReport[];
    const schedule = schedules.find(s => s.id === id);
    
    if (schedule) {
      schedule.isActive = !schedule.isActive;
      schedule.updatedAt = new Date().toISOString();
      localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(schedules));
      logger.info('Schedule toggled:', id, schedule.isActive);
    }
  } catch (error) {
    logger.error('Failed to toggle schedule:', error);
    throw error;
  }
}

/**
 * Get schedules that need to run
 * This would be called by a background scheduler
 */
export function getSchedulesDueForRun(): ScheduledReport[] {
  try {
    const schedules = JSON.parse(localStorage.getItem(SCHEDULED_REPORTS_KEY) || '[]') as ScheduledReport[];
    const now = new Date();
    
    return schedules.filter(s => {
      if (!s.isActive) return false;
      if (!s.nextRun) return false;
      
      const nextRunDate = new Date(s.nextRun);
      return nextRunDate <= now;
    });
  } catch (error) {
    logger.error('Failed to get due schedules:', error);
    return [];
  }
}

/**
 * Execute scheduled report
 */
export function executeScheduledReport(scheduleId: string): GeneratedReport | null {
  try {
    const schedule = getScheduledReport(scheduleId);
    if (!schedule) {
      logger.error('Schedule not found:', scheduleId);
      return null;
    }
    
    // Generate the report
    const report = generateReport(
      schedule.templateId,
      schedule.createdBy,
      'Scheduled Report System'
    );
    
    if (!report) {
      logger.error('Failed to generate scheduled report');
      return null;
    }
    
    // Update schedule run count and next run time
    schedule.runCount += 1;
    schedule.lastRun = new Date().toISOString();
    schedule.nextRun = calculateNextRunTime(schedule);
    
    updateScheduledReport(schedule);
    
    // TODO: Send email with report attachment (requires backend)
    logger.info('Scheduled report executed:', scheduleId, 'Report ID:', report.id);
    
    return report;
  } catch (error) {
    logger.error('Failed to execute scheduled report:', error);
    return null;
  }
}

/**
 * Calculate next run time based on schedule configuration
 */
function calculateNextRunTime(schedule: ScheduledReport): string {
  const [hours, minutes] = schedule.schedule.time.split(':').map(Number);
  const nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (schedule.schedule.frequency) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
      
    case 'weekly':
      nextRun.setDate(nextRun.getDate() + 7);
      break;
      
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      if (schedule.schedule.dayOfMonth) {
        nextRun.setDate(schedule.schedule.dayOfMonth);
      }
      break;
      
    case 'quarterly':
      nextRun.setMonth(nextRun.getMonth() + 3);
      if (schedule.schedule.dayOfMonth) {
        nextRun.setDate(schedule.schedule.dayOfMonth);
      }
      break;
      
    case 'yearly':
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      if (schedule.schedule.dayOfMonth) {
        nextRun.setDate(schedule.schedule.dayOfMonth);
      }
      break;
  }
  
  return nextRun.toISOString();
}