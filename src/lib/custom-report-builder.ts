/**
 * Custom Report Builder - Business Logic
 * 
 * Handles report generation, data fetching, filtering, grouping, and aggregation.
 * Provides utilities for the custom report builder feature.
 * 
 * @module lib/custom-report-builder
 */

import { 
  CustomReportTemplate, 
  ReportConfiguration, 
  GeneratedReport, 
  ReportRow,
  ReportColumn,
  FilterRule,
  AvailableField,
  SelectedField
} from '../types/custom-reports';
import { Deal } from '../types';
import { getDeals } from './deals';
import { getProperties, getExpenses, getCommissions } from './data';
import { formatPKR } from './currency';

/**
 * localStorage key for custom report templates
 */
const STORAGE_KEY = 'custom_report_templates';

/**
 * Save custom report template to localStorage
 */
export const saveCustomReport = (template: CustomReportTemplate): void => {
  try {
    const templates = getCustomReports();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving custom report:', error);
    throw new Error('Failed to save custom report');
  }
};

/**
 * Get all custom report templates
 */
export const getCustomReports = (): CustomReportTemplate[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading custom reports:', error);
    return [];
  }
};

/**
 * Get custom report template by ID
 */
export const getCustomReportById = (id: string): CustomReportTemplate | null => {
  const templates = getCustomReports();
  return templates.find(t => t.id === id) || null;
};

/**
 * Delete custom report template
 */
export const deleteCustomReport = (id: string): void => {
  try {
    const templates = getCustomReports();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting custom report:', error);
    throw new Error('Failed to delete custom report');
  }
};

/**
 * Update custom report template (partial update)
 */
export const updateCustomReport = (id: string, updates: Partial<CustomReportTemplate>): void => {
  try {
    const templates = getCustomReports();
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      throw new Error('Template not found');
    }
    
    templates[templateIndex] = {
      ...templates[templateIndex],
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error updating custom report:', error);
    throw new Error('Failed to update custom report');
  }
};

/**
 * Update report generation count
 */
export const incrementReportGeneration = (templateId: string): void => {
  const template = getCustomReportById(templateId);
  if (template) {
    template.generationCount += 1;
    template.lastGenerated = new Date().toISOString();
    saveCustomReport(template);
  }
};

/**
 * Generate report from configuration
 */
export const generateReport = (
  config: ReportConfiguration,
  userId: string,
  userRole: 'admin' | 'agent'
): GeneratedReport => {
  // Fetch data from all sources
  const rawData = fetchDataFromSources(config.dataSources, userId, userRole);
  
  // Apply filters
  const filteredData = applyFilters(rawData, config.filters);
  
  // Apply grouping and aggregation
  const processedData = config.grouping 
    ? applyGrouping(filteredData, config.grouping, config.fields)
    : selectFields(filteredData, config.fields);
  
  // Apply sorting
  const sortedData = config.sorting 
    ? applySorting(processedData, config.sorting)
    : processedData;
  
  // Generate columns
  const columns = generateColumns(config.fields);
  
  return {
    id: generateId(),
    templateId: '',
    templateName: 'Custom Report',
    config,
    data: sortedData,
    columns,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
    rowCount: sortedData.length,
  };
};

/**
 * Fetch data from specified sources
 */
const fetchDataFromSources = (
  sources: any[],
  userId: string,
  userRole: 'admin' | 'agent'
): any[] => {
  let allData: any[] = [];
  
  sources.forEach(sourceConfig => {
    const sourceData = fetchFromSource(sourceConfig.source, userId, userRole);
    
    // Add source identifier to each row
    const taggedData = sourceData.map(row => ({
      ...row,
      _source: sourceConfig.source,
    }));
    
    allData = [...allData, ...taggedData];
  });
  
  return allData;
};

/**
 * Fetch data from a single source
 */
const fetchFromSource = (
  source: string,
  userId: string,
  userRole: 'admin' | 'agent'
): any[] => {
  switch (source) {
    case 'deals':
      return getDeals(userId, userRole);
    
    case 'properties':
      return getProperties(userId, userRole);
    
    case 'expenses':
      return getExpenses(userId, userRole);
    
    case 'commissions':
      return getCommissions(userId, userRole);
    
    // Add other sources as needed
    default:
      console.warn(`Unknown source: ${source}`);
      return [];
  }
};

/**
 * Apply filter rules to data
 */
const applyFilters = (data: any[], filters: FilterRule[]): any[] => {
  if (!filters || filters.length === 0) return data;
  
  return data.filter(row => {
    // Apply all filters with AND logic (can be enhanced for OR logic)
    return filters.every(filter => evaluateFilter(row, filter));
  });
};

/**
 * Evaluate single filter rule
 */
const evaluateFilter = (row: any, filter: FilterRule): boolean => {
  const value = getNestedValue(row, filter.field);
  const filterValue = filter.value;
  
  switch (filter.operator) {
    case 'equals':
      return value === filterValue;
    
    case 'not-equals':
      return value !== filterValue;
    
    case 'contains':
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    
    case 'not-contains':
      return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    
    case 'greater-than':
      return Number(value) > Number(filterValue);
    
    case 'less-than':
      return Number(value) < Number(filterValue);
    
    case 'greater-or-equal':
      return Number(value) >= Number(filterValue);
    
    case 'less-or-equal':
      return Number(value) <= Number(filterValue);
    
    case 'between':
      return Number(value) >= filterValue[0] && Number(value) <= filterValue[1];
    
    case 'in':
      return Array.isArray(filterValue) && filterValue.includes(value);
    
    case 'is-null':
      return value === null || value === undefined;
    
    case 'is-not-null':
      return value !== null && value !== undefined;
    
    default:
      return true;
  }
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj: any, path: string): any => {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
};

/**
 * Select specific fields from data
 */
const selectFields = (data: any[], fields: SelectedField[]): ReportRow[] => {
  return data.map(row => {
    const newRow: ReportRow = {};
    
    fields.forEach(field => {
      const value = getNestedValue(row, field.field);
      newRow[field.id] = formatFieldValue(value, field.type);
    });
    
    return newRow;
  });
};

/**
 * Apply grouping and aggregation
 */
const applyGrouping = (
  data: any[],
  grouping: any,
  fields: SelectedField[]
): ReportRow[] => {
  // Group data by specified fields
  const groups: { [key: string]: any[] } = {};
  
  data.forEach(row => {
    const groupKey = grouping.groupBy
      .map((field: string) => getNestedValue(row, field))
      .join('|');
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(row);
  });
  
  // Apply aggregations to each group
  const result: ReportRow[] = [];
  
  Object.entries(groups).forEach(([groupKey, groupRows]) => {
    const newRow: ReportRow = {};
    
    // Add group by fields
    grouping.groupBy.forEach((field: string, index: number) => {
      const values = groupKey.split('|');
      newRow[field] = values[index];
    });
    
    // Apply aggregations
    grouping.aggregations.forEach((agg: any) => {
      const values = groupRows.map(row => getNestedValue(row, agg.field));
      newRow[agg.label] = calculateAggregation(values, agg.function);
    });
    
    result.push(newRow);
  });
  
  return result;
};

/**
 * Calculate aggregation function
 */
const calculateAggregation = (values: any[], func: string): number => {
  const numbers = values.filter(v => typeof v === 'number');
  
  switch (func) {
    case 'sum':
      return numbers.reduce((sum, val) => sum + val, 0);
    
    case 'avg':
      return numbers.length > 0 
        ? numbers.reduce((sum, val) => sum + val, 0) / numbers.length 
        : 0;
    
    case 'count':
      return values.length;
    
    case 'min':
      return numbers.length > 0 ? Math.min(...numbers) : 0;
    
    case 'max':
      return numbers.length > 0 ? Math.max(...numbers) : 0;
    
    default:
      return 0;
  }
};

/**
 * Apply sorting to data
 */
const applySorting = (data: ReportRow[], sorting: any[]): ReportRow[] => {
  const sorted = [...data];
  
  sorted.sort((a, b) => {
    for (const sort of sorting) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  return sorted;
};

/**
 * Generate column definitions from fields
 */
const generateColumns = (fields: SelectedField[]): ReportColumn[] => {
  return fields.map(field => ({
    id: field.id,
    label: field.label,
    type: field.type,
    align: field.type === 'number' || field.type === 'currency' ? 'right' : 'left',
  }));
};

/**
 * Format field value based on type
 */
const formatFieldValue = (value: any, type: string): any => {
  if (value === null || value === undefined) return '';
  
  switch (type) {
    case 'currency':
      return formatPKR(Number(value));
    
    case 'percentage':
      return `${Number(value).toFixed(1)}%`;
    
    case 'date':
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    
    case 'boolean':
      return value ? 'Yes' : 'No';
    
    case 'number':
      return Number(value).toLocaleString();
    
    default:
      return String(value);
  }
};

/**
 * Get available fields for a data source
 */
export const getAvailableFields = (source: string): AvailableField[] => {
  const fieldsBySource: { [key: string]: AvailableField[] } = {
    deals: [
      { id: 'deal_id', source: 'deals', field: 'id', label: 'Deal ID', type: 'text' },
      { id: 'deal_title', source: 'deals', field: 'title', label: 'Deal Title', type: 'text' },
      { id: 'deal_price', source: 'deals', field: 'financial.agreedPrice', label: 'Deal Price', type: 'currency', allowAggregation: true },
      { id: 'deal_status', source: 'deals', field: 'lifecycle.status', label: 'Status', type: 'text', allowGrouping: true },
      { id: 'deal_date', source: 'deals', field: 'metadata.createdAt', label: 'Created Date', type: 'date' },
      { id: 'deal_agent', source: 'deals', field: 'participants.agentId', label: 'Agent ID', type: 'text', allowGrouping: true },
    ],
    properties: [
      { id: 'property_id', source: 'properties', field: 'id', label: 'Property ID', type: 'text' },
      { id: 'property_title', source: 'properties', field: 'title', label: 'Property Title', type: 'text' },
      { id: 'property_price', source: 'properties', field: 'price', label: 'Price', type: 'currency', allowAggregation: true },
      { id: 'property_area', source: 'properties', field: 'area', label: 'Area (sq yd)', type: 'number', allowAggregation: true },
      { id: 'property_type', source: 'properties', field: 'type', label: 'Type', type: 'text', allowGrouping: true },
      { id: 'property_status', source: 'properties', field: 'status', label: 'Status', type: 'text', allowGrouping: true },
    ],
    expenses: [
      { id: 'expense_id', source: 'expenses', field: 'id', label: 'Expense ID', type: 'text' },
      { id: 'expense_amount', source: 'expenses', field: 'amount', label: 'Amount', type: 'currency', allowAggregation: true },
      { id: 'expense_category', source: 'expenses', field: 'category', label: 'Category', type: 'text', allowGrouping: true },
      { id: 'expense_date', source: 'expenses', field: 'date', label: 'Date', type: 'date' },
      { id: 'expense_status', source: 'expenses', field: 'status', label: 'Status', type: 'text', allowGrouping: true },
    ],
    commissions: [
      { id: 'commission_id', source: 'commissions', field: 'id', label: 'Commission ID', type: 'text' },
      { id: 'commission_amount', source: 'commissions', field: 'amount', label: 'Amount', type: 'currency', allowAggregation: true },
      { id: 'commission_category', source: 'commissions', field: 'category', label: 'Category', type: 'text', allowGrouping: true },
      { id: 'commission_date', source: 'commissions', field: 'date', label: 'Date', type: 'date' },
      { id: 'commission_status', source: 'commissions', field: 'status', label: 'Status', type: 'text', allowGrouping: true },
    ],
  };
  
  return fieldsBySource[source] || [];
};

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate report configuration
 */
export const validateReportConfig = (config: Partial<ReportConfiguration>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config.dataSources || config.dataSources.length === 0) {
    errors.push('At least one data source must be selected');
  }
  
  if (!config.fields || config.fields.length === 0) {
    errors.push('At least one field must be selected');
  }
  
  if (config.grouping && (!config.grouping.groupBy || config.grouping.groupBy.length === 0)) {
    errors.push('Group by field must be selected when grouping is enabled');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};