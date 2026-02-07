/**
 * Report Field Configuration
 * 
 * Defines available fields for each module in the Report Builder
 * Includes financial-specific fields for enhanced cash flow tracking
 * 
 * @module lib/reportFieldConfig
 * @version 1.0.0
 */

import { ReportModule, FilterOperator, FilterDataType, AggregationType } from '../types/reports';

// ============================================
// FIELD DEFINITIONS
// ============================================

export interface FieldDefinition {
  id: string;
  label: string;
  dataType: FilterDataType;
  availableOperators: FilterOperator[];
  availableAggregations: AggregationType[];
  category: 'basic' | 'financial' | 'advanced' | 'custom';
  description?: string;
}

// ============================================
// PROPERTIES MODULE FIELDS
// ============================================

export const PROPERTY_FIELDS: FieldDefinition[] = [
  // Basic Fields
  {
    id: 'title',
    label: 'Property Title',
    dataType: 'text',
    availableOperators: ['contains', 'equals', 'starts-with'],
    availableAggregations: ['none', 'count-distinct'],
    category: 'basic',
  },
  {
    id: 'type',
    label: 'Property Type',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'status',
    label: 'Status',
    dataType: 'select',
    availableOperators: ['equals', 'in', 'not-in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'price',
    label: 'Price',
    dataType: 'currency',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average', 'min', 'max'],
    category: 'financial',
  },
  {
    id: 'area',
    label: 'Area (sq yd)',
    dataType: 'number',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average', 'min', 'max'],
    category: 'basic',
  },
  {
    id: 'location',
    label: 'Location',
    dataType: 'text',
    availableOperators: ['equals', 'contains', 'in'],
    availableAggregations: ['count-distinct'],
    category: 'basic',
  },
  {
    id: 'agentName',
    label: 'Agent',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count-distinct'],
    category: 'basic',
  },
  {
    id: 'daysOnMarket',
    label: 'Days on Market',
    dataType: 'number',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['average', 'min', 'max'],
    category: 'advanced',
    description: 'Number of days since property was listed',
  },
  {
    id: 'createdAt',
    label: 'Listed Date',
    dataType: 'date',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['count', 'first', 'last'],
    category: 'basic',
  },
];

// ============================================
// DEALS/TRANSACTIONS MODULE FIELDS
// ============================================

export const DEAL_FIELDS: FieldDefinition[] = [
  // Basic Fields
  {
    id: 'dealType',
    label: 'Deal Type',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
    description: 'Sale, Purchase, Rental, etc.',
  },
  {
    id: 'status',
    label: 'Deal Status',
    dataType: 'select',
    availableOperators: ['equals', 'in', 'not-in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'stage',
    label: 'Deal Stage',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  
  // Financial Fields
  {
    id: 'dealValue',
    label: 'Deal Value',
    dataType: 'currency',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average', 'min', 'max'],
    category: 'financial',
  },
  {
    id: 'paymentStatus',
    label: 'Payment Status',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'financial',
    description: 'Paid, Pending, Partial, Overdue',
  },
  {
    id: 'amountDue',
    label: 'Amount Due',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
    description: 'Total amount owed',
  },
  {
    id: 'amountPaid',
    label: 'Amount Paid',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
  },
  {
    id: 'amountPending',
    label: 'Amount Pending',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
    description: 'Remaining balance',
  },
  {
    id: 'dueDate',
    label: 'Payment Due Date',
    dataType: 'date',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['first', 'last', 'count'],
    category: 'financial',
  },
  {
    id: 'daysOutstanding',
    label: 'Days Outstanding',
    dataType: 'number',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['average', 'min', 'max'],
    category: 'financial',
    description: 'Days since payment was due (for AR)',
  },
  {
    id: 'daysUntilDue',
    label: 'Days Until Due',
    dataType: 'number',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['average', 'min', 'max'],
    category: 'financial',
    description: 'Days until payment is due (for AP)',
  },
  
  // Advanced Fields
  {
    id: 'buyerName',
    label: 'Buyer Name',
    dataType: 'text',
    availableOperators: ['equals', 'contains', 'in'],
    availableAggregations: ['count-distinct'],
    category: 'basic',
  },
  {
    id: 'sellerName',
    label: 'Seller Name',
    dataType: 'text',
    availableOperators: ['equals', 'contains', 'in'],
    availableAggregations: ['count-distinct'],
    category: 'basic',
  },
  {
    id: 'agentName',
    label: 'Agent',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count-distinct'],
    category: 'basic',
  },
  {
    id: 'propertyTitle',
    label: 'Property',
    dataType: 'text',
    availableOperators: ['contains', 'equals'],
    availableAggregations: ['count-distinct'],
    category: 'basic',
  },
  {
    id: 'propertyType',
    label: 'Property Type',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'expectedCloseDate',
    label: 'Expected Close Date',
    dataType: 'date',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['first', 'last'],
    category: 'advanced',
  },
  {
    id: 'confidenceLevel',
    label: 'Confidence Level',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'advanced',
    description: 'High, Medium, Low probability of closing',
  },
  {
    id: 'probability',
    label: 'Close Probability',
    dataType: 'number',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['average'],
    category: 'advanced',
    description: 'Probability % of deal closing',
  },
  {
    id: 'expectedRevenue',
    label: 'Expected Revenue',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
  },
  {
    id: 'expectedCommission',
    label: 'Expected Commission',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
  },
  {
    id: 'weightedRevenue',
    label: 'Weighted Revenue',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
    description: 'Revenue * Probability',
  },
];

// ============================================
// LEADS MODULE FIELDS
// ============================================

export const LEAD_FIELDS: FieldDefinition[] = [
  {
    id: 'stage',
    label: 'Lead Stage',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'source',
    label: 'Lead Source',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count', 'count-distinct'],
    category: 'basic',
  },
  {
    id: 'status',
    label: 'Status',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'agentName',
    label: 'Assigned Agent',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count-distinct'],
    category: 'basic',
  },
  {
    id: 'createdAt',
    label: 'Created Date',
    dataType: 'date',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['count', 'first', 'last'],
    category: 'basic',
  },
  {
    id: 'estimatedValue',
    label: 'Estimated Value',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
  },
];

// ============================================
// FINANCIALS MODULE FIELDS
// ============================================

export const FINANCIAL_FIELDS: FieldDefinition[] = [
  {
    id: 'transactionType',
    label: 'Transaction Type',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
    description: 'Income, Expense, Commission, etc.',
  },
  {
    id: 'category',
    label: 'Category',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'amount',
    label: 'Amount',
    dataType: 'currency',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average', 'min', 'max'],
    category: 'financial',
  },
  {
    id: 'cashInflow',
    label: 'Cash Inflow',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
    description: 'Money coming into the agency',
  },
  {
    id: 'cashOutflow',
    label: 'Cash Outflow',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
    description: 'Money going out of the agency',
  },
  {
    id: 'netCashFlow',
    label: 'Net Cash Flow',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['sum', 'average'],
    category: 'financial',
    description: 'Inflow - Outflow',
  },
  {
    id: 'paymentMethod',
    label: 'Payment Method',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'status',
    label: 'Payment Status',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'financial',
  },
  {
    id: 'date',
    label: 'Transaction Date',
    dataType: 'date',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['count', 'first', 'last'],
    category: 'basic',
  },
  {
    id: 'agentName',
    label: 'Agent',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count-distinct'],
    category: 'basic',
  },
];

// ============================================
// CONTACTS MODULE FIELDS
// ============================================

export const CONTACT_FIELDS: FieldDefinition[] = [
  {
    id: 'name',
    label: 'Contact Name',
    dataType: 'text',
    availableOperators: ['contains', 'equals', 'starts-with'],
    availableAggregations: ['count', 'count-distinct'],
    category: 'basic',
  },
  {
    id: 'type',
    label: 'Contact Type',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'status',
    label: 'Status',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'createdAt',
    label: 'Created Date',
    dataType: 'date',
    availableOperators: ['equals', 'greater-than', 'less-than', 'between'],
    availableAggregations: ['count', 'first', 'last'],
    category: 'basic',
  },
];

// ============================================
// REQUIREMENTS MODULE FIELDS
// ============================================

export const REQUIREMENT_FIELDS: FieldDefinition[] = [
  {
    id: 'propertyType',
    label: 'Property Type',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'status',
    label: 'Status',
    dataType: 'select',
    availableOperators: ['equals', 'in'],
    availableAggregations: ['count'],
    category: 'basic',
  },
  {
    id: 'minBudget',
    label: 'Min Budget',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['average', 'min', 'max'],
    category: 'financial',
  },
  {
    id: 'maxBudget',
    label: 'Max Budget',
    dataType: 'currency',
    availableOperators: ['greater-than', 'less-than', 'between'],
    availableAggregations: ['average', 'min', 'max'],
    category: 'financial',
  },
  {
    id: 'location',
    label: 'Preferred Location',
    dataType: 'text',
    availableOperators: ['equals', 'contains', 'in'],
    availableAggregations: ['count-distinct'],
    category: 'basic',
  },
];

// ============================================
// FIELD LOOKUP FUNCTIONS
// ============================================

/**
 * Get fields for a specific module
 */
export function getFieldsForModule(module: ReportModule): FieldDefinition[] {
  const fieldMap: Record<ReportModule, FieldDefinition[]> = {
    properties: PROPERTY_FIELDS,
    deals: DEAL_FIELDS,
    leads: LEAD_FIELDS,
    financials: FINANCIAL_FIELDS,
    contacts: CONTACT_FIELDS,
    requirements: REQUIREMENT_FIELDS,
    portfolio: PROPERTY_FIELDS,
    performance: DEAL_FIELDS,
    cycles: DEAL_FIELDS,
    'cross-module': [
      ...PROPERTY_FIELDS,
      ...DEAL_FIELDS,
      ...LEAD_FIELDS,
      ...FINANCIAL_FIELDS,
    ],
  };

  return fieldMap[module] || [];
}

/**
 * Get financial-specific fields across all modules
 */
export function getFinancialFields(): FieldDefinition[] {
  return [
    ...PROPERTY_FIELDS.filter(f => f.category === 'financial'),
    ...DEAL_FIELDS.filter(f => f.category === 'financial'),
    ...FINANCIAL_FIELDS.filter(f => f.category === 'financial'),
    ...REQUIREMENT_FIELDS.filter(f => f.category === 'financial'),
  ];
}

/**
 * Get field definition by ID and module
 */
export function getFieldDefinition(module: ReportModule, fieldId: string): FieldDefinition | null {
  const fields = getFieldsForModule(module);
  return fields.find(f => f.id === fieldId) || null;
}

// ============================================
// AGING BUCKET PRESETS
// ============================================

export interface AgingBucket {
  id: string;
  label: string;
  minDays: number;
  maxDays: number | null;
  color: string;
}

export const AGING_BUCKETS: AgingBucket[] = [
  {
    id: 'current',
    label: '0-30 Days (Current)',
    minDays: 0,
    maxDays: 30,
    color: '#2D6A54', // Green
  },
  {
    id: '31-60',
    label: '31-60 Days',
    minDays: 31,
    maxDays: 60,
    color: '#E8E2D5', // Neutral
  },
  {
    id: '61-90',
    label: '61-90 Days',
    minDays: 61,
    maxDays: 90,
    color: '#C17052', // Warning
  },
  {
    id: '90-plus',
    label: '90+ Days (Overdue)',
    minDays: 91,
    maxDays: null,
    color: '#d4183d', // Danger
  },
];

// ============================================
// PAYMENT STATUS OPTIONS
// ============================================

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid', color: '#2D6A54' },
  { value: 'pending', label: 'Pending', color: '#C17052' },
  { value: 'partial', label: 'Partial', color: '#E8E2D5' },
  { value: 'overdue', label: 'Overdue', color: '#d4183d' },
  { value: 'cancelled', label: 'Cancelled', color: '#363F47' },
];

// ============================================
// CONFIDENCE LEVEL OPTIONS (for projections)
// ============================================

export const CONFIDENCE_LEVEL_OPTIONS = [
  { value: 'high', label: 'High (80-100%)', probability: 90, color: '#2D6A54' },
  { value: 'medium', label: 'Medium (50-79%)', probability: 65, color: '#C17052' },
  { value: 'low', label: 'Low (0-49%)', probability: 30, color: '#E8E2D5' },
];

// ============================================
// CASH FLOW CATEGORIES
// ============================================

export const CASH_FLOW_CATEGORIES = [
  { value: 'operating', label: 'Operating Activities', description: 'Day-to-day business operations' },
  { value: 'investing', label: 'Investing Activities', description: 'Property acquisitions and disposals' },
  { value: 'financing', label: 'Financing Activities', description: 'Loans and capital' },
];
