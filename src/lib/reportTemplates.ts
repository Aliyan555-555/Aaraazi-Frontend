/**
 * Report Templates - System Pre-built Reports
 * 
 * Defines all system report templates that come with aaraazi
 * These are production-ready, ERP-standard reports covering all modules
 * 
 * @module lib/reportTemplates
 * @version 1.0.0
 */

import { ReportTemplate, SYSTEM_REPORTS } from '../types/reports';

/**
 * Initialize system report templates
 * Called on first app load to populate default reports
 */
export function initializeSystemReports(): ReportTemplate[] {
  const systemTemplates: ReportTemplate[] = [
    // ============================================
    // EXECUTIVE SUMMARY REPORTS
    // ============================================
    
    {
      id: SYSTEM_REPORTS.EXECUTIVE_DASHBOARD,
      name: 'Executive Dashboard',
      description: 'Comprehensive overview of business performance with key metrics across all modules',
      category: 'executive-summary',
      module: 'cross-module',
      config: {
        dataSources: [
          { module: 'deals', entity: 'Deal' },
          { module: 'leads', entity: 'Lead' },
          { module: 'properties', entity: 'Property' },
          { module: 'financials', entity: 'Transaction' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'mtd',
        },
        filters: [],
        dimensions: [],
        metrics: [
          {
            id: 'total_revenue',
            field: 'amount',
            label: 'Total Revenue',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'active_deals',
            field: 'id',
            label: 'Active Deals',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'new_leads',
            field: 'id',
            label: 'New Leads',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
        ],
        sortBy: [],
      },
      visualizationType: ['summary-cards', 'bar-chart', 'table'],
      defaultVisualization: 'summary-cards',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['executive', 'overview', 'dashboard', 'kpi'],
      isFavorite: false,
    },
    
    // ============================================
    // FINANCIAL ANALYSIS REPORTS
    // ============================================
    
    {
      id: SYSTEM_REPORTS.REVENUE_ANALYSIS,
      name: 'Revenue Analysis',
      description: 'Detailed breakdown of revenue sources by property type, agent, and time period',
      category: 'financial-analysis',
      module: 'financials',
      config: {
        dataSources: [
          { module: 'deals', entity: 'Deal' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'this-month',
        },
        filters: [
          {
            id: 'status_filter',
            field: 'status',
            fieldLabel: 'Deal Status',
            operator: 'in',
            value: ['won', 'closed'],
            dataType: 'multi-select',
          },
        ],
        dimensions: [
          {
            id: 'property_type',
            field: 'propertyType',
            label: 'Property Type',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'total_revenue',
            field: 'dealValue',
            label: 'Total Revenue',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'deal_count',
            field: 'id',
            label: 'Number of Deals',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'avg_deal_value',
            field: 'dealValue',
            label: 'Average Deal Value',
            aggregation: 'average',
            format: { type: 'currency', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'total_revenue',
            direction: 'desc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['bar-chart', 'pie-chart', 'table'],
      defaultVisualization: 'bar-chart',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['revenue', 'financial', 'income', 'analysis'],
      isFavorite: false,
    },
    
    {
      id: SYSTEM_REPORTS.COMMISSION_SUMMARY,
      name: 'Commission Summary',
      description: 'Comprehensive commission tracking by agent, property, and status',
      category: 'financial-analysis',
      module: 'financials',
      config: {
        dataSources: [
          { module: 'financials', entity: 'Commission' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'this-month',
        },
        filters: [],
        dimensions: [
          {
            id: 'agent',
            field: 'agentName',
            label: 'Agent',
            groupBy: 'exact',
          },
          {
            id: 'status',
            field: 'status',
            label: 'Commission Status',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'total_commission',
            field: 'amount',
            label: 'Total Commission',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'commission_count',
            field: 'id',
            label: 'Count',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'total_commission',
            direction: 'desc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['table', 'bar-chart', 'pie-chart'],
      defaultVisualization: 'table',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['commission', 'financial', 'agent', 'earnings'],
      isFavorite: false,
    },
    
    {
      id: SYSTEM_REPORTS.EXPENSE_ANALYSIS,
      name: 'Expense Analysis',
      description: 'Detailed expense breakdown by category, property, and time period',
      category: 'financial-analysis',
      module: 'financials',
      config: {
        dataSources: [
          { module: 'financials', entity: 'Expense' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'this-month',
        },
        filters: [],
        dimensions: [
          {
            id: 'category',
            field: 'category',
            label: 'Expense Category',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'total_expense',
            field: 'amount',
            label: 'Total Expenses',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'expense_count',
            field: 'id',
            label: 'Number of Expenses',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'avg_expense',
            field: 'amount',
            label: 'Average Expense',
            aggregation: 'average',
            format: { type: 'currency', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'total_expense',
            direction: 'desc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['pie-chart', 'bar-chart', 'table'],
      defaultVisualization: 'pie-chart',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['expense', 'financial', 'costs', 'spending'],
      isFavorite: false,
    },
    
    // ============================================
    // SALES PERFORMANCE REPORTS
    // ============================================
    
    {
      id: SYSTEM_REPORTS.DEALS_PIPELINE,
      name: 'Deals Pipeline Analysis',
      description: 'Comprehensive view of deals by stage with conversion metrics and aging',
      category: 'sales-performance',
      module: 'deals',
      config: {
        dataSources: [
          { module: 'deals', entity: 'Deal' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'all-time',
        },
        filters: [
          {
            id: 'active_deals',
            field: 'status',
            fieldLabel: 'Deal Status',
            operator: 'not-in',
            value: ['won', 'lost', 'cancelled'],
            dataType: 'multi-select',
          },
        ],
        dimensions: [
          {
            id: 'stage',
            field: 'stage',
            label: 'Deal Stage',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'deal_count',
            field: 'id',
            label: 'Number of Deals',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'total_value',
            field: 'dealValue',
            label: 'Total Value',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'avg_value',
            field: 'dealValue',
            label: 'Average Deal Value',
            aggregation: 'average',
            format: { type: 'currency', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'stage',
            direction: 'asc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['funnel-chart', 'table', 'bar-chart'],
      defaultVisualization: 'funnel-chart',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['pipeline', 'deals', 'sales', 'funnel'],
      isFavorite: false,
    },
    
    {
      id: SYSTEM_REPORTS.CONVERSION_FUNNEL,
      name: 'Lead to Deal Conversion Funnel',
      description: 'Track conversion rates from lead to closed deal with drop-off analysis',
      category: 'sales-performance',
      module: 'cross-module',
      config: {
        dataSources: [
          { module: 'leads', entity: 'Lead' },
          { module: 'deals', entity: 'Deal' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'last-30-days',
        },
        filters: [],
        dimensions: [],
        metrics: [
          {
            id: 'total_leads',
            field: 'id',
            label: 'Total Leads',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'qualified_leads',
            field: 'id',
            label: 'Qualified Leads',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
        ],
        sortBy: [],
      },
      visualizationType: ['funnel-chart', 'summary-cards'],
      defaultVisualization: 'funnel-chart',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['conversion', 'funnel', 'leads', 'sales'],
      isFavorite: false,
    },
    
    {
      id: SYSTEM_REPORTS.SALES_BY_AGENT,
      name: 'Sales Performance by Agent',
      description: 'Individual agent performance metrics including deals closed, revenue, and win rate',
      category: 'sales-performance',
      module: 'deals',
      config: {
        dataSources: [
          { module: 'deals', entity: 'Deal' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'this-month',
        },
        filters: [
          {
            id: 'closed_deals',
            field: 'status',
            fieldLabel: 'Deal Status',
            operator: 'equals',
            value: 'won',
            dataType: 'select',
          },
        ],
        dimensions: [
          {
            id: 'agent',
            field: 'agentName',
            label: 'Agent',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'deals_closed',
            field: 'id',
            label: 'Deals Closed',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'total_revenue',
            field: 'dealValue',
            label: 'Total Revenue',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'avg_deal_size',
            field: 'dealValue',
            label: 'Avg Deal Size',
            aggregation: 'average',
            format: { type: 'currency', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'total_revenue',
            direction: 'desc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['table', 'bar-chart'],
      defaultVisualization: 'table',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['agent', 'performance', 'sales', 'leaderboard'],
      isFavorite: false,
    },
    
    // ============================================
    // INVENTORY ANALYSIS REPORTS
    // ============================================
    
    {
      id: SYSTEM_REPORTS.PROPERTY_PORTFOLIO,
      name: 'Property Portfolio Overview',
      description: 'Complete inventory analysis by type, status, location, and valuation',
      category: 'inventory-analysis',
      module: 'properties',
      config: {
        dataSources: [
          { module: 'properties', entity: 'Property' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'all-time',
        },
        filters: [],
        dimensions: [
          {
            id: 'type',
            field: 'type',
            label: 'Property Type',
            groupBy: 'exact',
          },
          {
            id: 'status',
            field: 'status',
            label: 'Status',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'property_count',
            field: 'id',
            label: 'Count',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'total_value',
            field: 'price',
            label: 'Total Value',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'avg_price',
            field: 'price',
            label: 'Average Price',
            aggregation: 'average',
            format: { type: 'currency', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'total_value',
            direction: 'desc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['table', 'pie-chart', 'bar-chart'],
      defaultVisualization: 'table',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['portfolio', 'inventory', 'properties', 'valuation'],
      isFavorite: false,
    },
    
    {
      id: SYSTEM_REPORTS.INVENTORY_AGING,
      name: 'Inventory Aging Report',
      description: 'Days on market analysis to identify stale inventory and pricing issues',
      category: 'inventory-analysis',
      module: 'properties',
      config: {
        dataSources: [
          { module: 'properties', entity: 'Property' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'all-time',
        },
        filters: [
          {
            id: 'active_properties',
            field: 'status',
            fieldLabel: 'Property Status',
            operator: 'equals',
            value: 'available',
            dataType: 'select',
          },
        ],
        dimensions: [],
        metrics: [
          {
            id: 'total_properties',
            field: 'id',
            label: 'Total Properties',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'createdAt',
            direction: 'asc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['table', 'bar-chart'],
      defaultVisualization: 'table',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['aging', 'inventory', 'days-on-market', 'stale'],
      isFavorite: false,
    },
    
    // ============================================
    // LEAD ANALYTICS REPORTS
    // ============================================
    
    {
      id: SYSTEM_REPORTS.LEAD_FUNNEL,
      name: 'Lead Funnel Analysis',
      description: 'Lead progression through stages with conversion rates and bottleneck identification',
      category: 'lead-analytics',
      module: 'leads',
      config: {
        dataSources: [
          { module: 'leads', entity: 'Lead' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'this-month',
        },
        filters: [],
        dimensions: [
          {
            id: 'stage',
            field: 'stage',
            label: 'Lead Stage',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'lead_count',
            field: 'id',
            label: 'Number of Leads',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'stage',
            direction: 'asc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['funnel-chart', 'bar-chart', 'table'],
      defaultVisualization: 'funnel-chart',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['leads', 'funnel', 'conversion', 'stages'],
      isFavorite: false,
    },
    
    {
      id: SYSTEM_REPORTS.LEAD_SOURCE_ANALYSIS,
      name: 'Lead Source Performance',
      description: 'Compare lead quality and conversion rates across different sources',
      category: 'lead-analytics',
      module: 'leads',
      config: {
        dataSources: [
          { module: 'leads', entity: 'Lead' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'last-30-days',
        },
        filters: [],
        dimensions: [
          {
            id: 'source',
            field: 'source',
            label: 'Lead Source',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'total_leads',
            field: 'id',
            label: 'Total Leads',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'total_leads',
            direction: 'desc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['pie-chart', 'bar-chart', 'table'],
      defaultVisualization: 'pie-chart',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['leads', 'source', 'marketing', 'roi'],
      isFavorite: false,
    },
    
    // ============================================
    // AGENT PERFORMANCE REPORTS
    // ============================================
    
    {
      id: SYSTEM_REPORTS.AGENT_PERFORMANCE,
      name: 'Agent Performance Dashboard',
      description: 'Comprehensive agent metrics including deals, revenue, leads, and activity',
      category: 'agent-performance',
      module: 'cross-module',
      config: {
        dataSources: [
          { module: 'deals', entity: 'Deal' },
          { module: 'leads', entity: 'Lead' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'this-month',
        },
        filters: [],
        dimensions: [
          {
            id: 'agent',
            field: 'agentName',
            label: 'Agent',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'deals_count',
            field: 'id',
            label: 'Active Deals',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'deals_count',
            direction: 'desc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['table', 'bar-chart'],
      defaultVisualization: 'table',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['agent', 'performance', 'metrics', 'kpi'],
      isFavorite: false,
    },
    
    // ============================================
    // BUYER & RENT REQUIREMENTS
    // ============================================
    
    {
      id: SYSTEM_REPORTS.BUYER_REQUIREMENTS,
      name: 'Buyer Requirements Analysis',
      description: 'Active buyer requirements with matching statistics and fulfillment rates',
      category: 'lead-analytics',
      module: 'requirements',
      config: {
        dataSources: [
          { module: 'requirements', entity: 'BuyerRequirement' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'all-time',
        },
        filters: [
          {
            id: 'active_requirements',
            field: 'status',
            fieldLabel: 'Status',
            operator: 'equals',
            value: 'active',
            dataType: 'select',
          },
        ],
        dimensions: [
          {
            id: 'property_type',
            field: 'propertyType',
            label: 'Property Type',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'requirement_count',
            field: 'id',
            label: 'Requirements',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'requirement_count',
            direction: 'desc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['bar-chart', 'table'],
      defaultVisualization: 'bar-chart',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['requirements', 'buyers', 'matching', 'demand'],
      isFavorite: false,
    },
    
    // ============================================
    // ADVANCED FINANCIAL TRACKING REPORTS
    // ============================================
    
    {
      id: SYSTEM_REPORTS.ACCOUNTS_RECEIVABLE,
      name: 'Accounts Receivable (Money Coming In)',
      description: 'Track all pending payments from property sales - money owed TO the agency by buyers',
      category: 'financial-analysis',
      module: 'financials',
      config: {
        dataSources: [
          { 
            module: 'deals', 
            entity: 'Deal',
            joins: [
              {
                targetModule: 'properties',
                targetEntity: 'Property',
                joinType: 'left',
                onField: 'propertyId',
                targetField: 'id',
              },
              {
                targetModule: 'contacts',
                targetEntity: 'Contact',
                joinType: 'left',
                onField: 'buyerId',
                targetField: 'id',
              },
            ],
          },
        ],
        dateRange: {
          type: 'preset',
          preset: 'this-month',
        },
        filters: [
          {
            id: 'deal_type_filter',
            field: 'dealType',
            fieldLabel: 'Deal Type',
            operator: 'equals',
            value: 'sale',
            dataType: 'select',
          },
          {
            id: 'payment_status_filter',
            field: 'paymentStatus',
            fieldLabel: 'Payment Status',
            operator: 'in',
            value: ['pending', 'partial'],
            dataType: 'multi-select',
          },
        ],
        dimensions: [
          {
            id: 'aging_bucket',
            field: 'dueDate',
            label: 'Aging Bucket',
            groupBy: 'custom', // 0-30, 31-60, 61-90, 90+ days
          },
          {
            id: 'buyer_name',
            field: 'buyerName',
            label: 'Buyer',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'total_receivable',
            field: 'amountDue',
            label: 'Total Receivable',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
            thresholds: [
              {
                condition: 'greater-than',
                value: 5000000,
                color: '#2D6A54', // Success green
                icon: 'trending-up',
              },
            ],
          },
          {
            id: 'amount_paid',
            field: 'amountPaid',
            label: 'Amount Paid',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'amount_pending',
            field: 'amountPending',
            label: 'Amount Pending',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
            thresholds: [
              {
                condition: 'greater-than',
                value: 10000000,
                color: '#C17052', // Warning terracotta
                icon: 'alert-circle',
              },
            ],
          },
          {
            id: 'invoice_count',
            field: 'id',
            label: 'Number of Invoices',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'avg_days_outstanding',
            field: 'daysOutstanding',
            label: 'Avg Days Outstanding',
            aggregation: 'average',
            format: { type: 'number', decimals: 0, suffix: ' days' },
          },
        ],
        sortBy: [
          {
            field: 'dueDate',
            direction: 'asc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['table', 'bar-chart', 'pie-chart', 'summary-cards'],
      defaultVisualization: 'table',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['financial', 'receivables', 'cash-flow', 'collections', 'ar'],
      isFavorite: false,
    },
    
    {
      id: SYSTEM_REPORTS.ACCOUNTS_PAYABLE,
      name: 'Accounts Payable (Money Going Out)',
      description: 'Track all pending payments for property purchases - money the agency OWES to sellers',
      category: 'financial-analysis',
      module: 'financials',
      config: {
        dataSources: [
          { 
            module: 'deals', 
            entity: 'Deal',
            joins: [
              {
                targetModule: 'properties',
                targetEntity: 'Property',
                joinType: 'left',
                onField: 'propertyId',
                targetField: 'id',
              },
              {
                targetModule: 'contacts',
                targetEntity: 'Contact',
                joinType: 'left',
                onField: 'sellerId',
                targetField: 'id',
              },
            ],
          },
        ],
        dateRange: {
          type: 'preset',
          preset: 'this-month',
        },
        filters: [
          {
            id: 'deal_type_filter',
            field: 'dealType',
            fieldLabel: 'Deal Type',
            operator: 'equals',
            value: 'purchase',
            dataType: 'select',
          },
          {
            id: 'payment_status_filter',
            field: 'paymentStatus',
            fieldLabel: 'Payment Status',
            operator: 'in',
            value: ['pending', 'partial'],
            dataType: 'multi-select',
          },
        ],
        dimensions: [
          {
            id: 'due_date_group',
            field: 'dueDate',
            label: 'Due Date',
            groupBy: 'date-week',
          },
          {
            id: 'seller_name',
            field: 'sellerName',
            label: 'Seller',
            groupBy: 'exact',
          },
          {
            id: 'property_title',
            field: 'propertyTitle',
            label: 'Property',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'total_payable',
            field: 'amountDue',
            label: 'Total Payable',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
            thresholds: [
              {
                condition: 'greater-than',
                value: 10000000,
                color: '#C17052', // Warning
                icon: 'alert-triangle',
              },
            ],
          },
          {
            id: 'amount_paid',
            field: 'amountPaid',
            label: 'Amount Paid',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'amount_remaining',
            field: 'amountRemaining',
            label: 'Amount Remaining',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'payment_count',
            field: 'id',
            label: 'Number of Payments',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'days_until_due',
            field: 'daysUntilDue',
            label: 'Avg Days Until Due',
            aggregation: 'average',
            format: { type: 'number', decimals: 0, suffix: ' days' },
          },
        ],
        sortBy: [
          {
            field: 'dueDate',
            direction: 'asc',
            priority: 1,
          },
        ],
      },
      visualizationType: ['table', 'bar-chart', 'line-chart', 'summary-cards'],
      defaultVisualization: 'table',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['financial', 'payables', 'cash-flow', 'obligations', 'ap'],
      isFavorite: false,
    },
    
    {
      id: SYSTEM_REPORTS.MONTHLY_REVENUE_PROJECTION,
      name: 'Monthly Revenue Projection',
      description: 'Project expected revenue for the current month based on pipeline deals and scheduled closings',
      category: 'financial-analysis',
      module: 'cross-module',
      config: {
        dataSources: [
          { 
            module: 'deals', 
            entity: 'Deal',
            joins: [
              {
                targetModule: 'properties',
                targetEntity: 'Property',
                joinType: 'left',
                onField: 'propertyId',
                targetField: 'id',
              },
            ],
          },
          {
            module: 'financials',
            entity: 'Commission',
          },
        ],
        dateRange: {
          type: 'preset',
          preset: 'this-month',
        },
        filters: [
          {
            id: 'deal_status_filter',
            field: 'status',
            fieldLabel: 'Deal Status',
            operator: 'in',
            value: ['negotiation', 'closing', 'won'],
            dataType: 'multi-select',
          },
        ],
        dimensions: [
          {
            id: 'confidence_level',
            field: 'confidenceLevel',
            label: 'Confidence Level',
            groupBy: 'exact', // High, Medium, Low
          },
          {
            id: 'expected_close_week',
            field: 'expectedCloseDate',
            label: 'Expected Close Week',
            groupBy: 'date-week',
          },
          {
            id: 'deal_type',
            field: 'dealType',
            label: 'Deal Type',
            groupBy: 'exact',
          },
        ],
        metrics: [
          {
            id: 'projected_revenue',
            field: 'expectedRevenue',
            label: 'Projected Revenue',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
            thresholds: [
              {
                condition: 'greater-than',
                value: 5000000,
                color: '#2D6A54',
                icon: 'trending-up',
              },
              {
                condition: 'less-than',
                value: 2000000,
                color: '#C17052',
                icon: 'trending-down',
              },
            ],
          },
          {
            id: 'expected_commission',
            field: 'expectedCommission',
            label: 'Expected Commission',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'weighted_revenue',
            field: 'weightedRevenue',
            label: 'Weighted Revenue',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'deal_count',
            field: 'id',
            label: 'Number of Deals',
            aggregation: 'count',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'probability',
            field: 'probability',
            label: 'Avg Probability',
            aggregation: 'average',
            format: { type: 'percentage', decimals: 0 },
          },
        ],
        sortBy: [
          {
            field: 'weighted_revenue',
            direction: 'desc',
            priority: 1,
          },
        ],
        comparison: {
          enabled: true,
          type: 'period-over-period',
          showVariance: true,
          showPercentChange: true,
        },
      },
      visualizationType: ['summary-cards', 'bar-chart', 'line-chart', 'table', 'funnel-chart'],
      defaultVisualization: 'summary-cards',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['financial', 'projection', 'forecast', 'revenue', 'pipeline'],
      isFavorite: false,
    },
    
    {
      id: SYSTEM_REPORTS.DAILY_OPERATIONS,
      name: 'Daily Operations Dashboard',
      description: 'Real-time snapshot of daily activities, transactions, and cash position',
      category: 'operational',
      module: 'cross-module',
      config: {
        dataSources: [
          { module: 'deals', entity: 'Deal' },
          { module: 'leads', entity: 'Lead' },
          { module: 'contacts', entity: 'Contact' },
          { module: 'financials', entity: 'Transaction' },
          { module: 'properties', entity: 'Property' },
        ],
        dateRange: {
          type: 'preset',
          preset: 'today',
        },
        filters: [],
        dimensions: [
          {
            id: 'activity_type',
            field: 'activityType',
            label: 'Activity Type',
            groupBy: 'exact',
          },
          {
            id: 'hour_of_day',
            field: 'timestamp',
            label: 'Hour',
            groupBy: 'custom', // Hour buckets: Morning, Afternoon, Evening
          },
        ],
        metrics: [
          {
            id: 'cash_in_today',
            field: 'cashInflow',
            label: "Today's Cash In",
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'cash_out_today',
            field: 'cashOutflow',
            label: "Today's Cash Out",
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'net_cash_flow',
            field: 'netCashFlow',
            label: 'Net Cash Flow',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
            thresholds: [
              {
                condition: 'greater-than',
                value: 0,
                color: '#2D6A54',
                icon: 'arrow-up',
              },
              {
                condition: 'less-than',
                value: 0,
                color: '#C17052',
                icon: 'arrow-down',
              },
            ],
          },
          {
            id: 'new_leads_today',
            field: 'leadId',
            label: 'New Leads',
            aggregation: 'count-distinct',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'deals_closed_today',
            field: 'dealId',
            label: 'Deals Closed',
            aggregation: 'count-distinct',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'contacts_added_today',
            field: 'contactId',
            label: 'Contacts Added',
            aggregation: 'count-distinct',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'properties_listed_today',
            field: 'propertyId',
            label: 'Properties Listed',
            aggregation: 'count-distinct',
            format: { type: 'number', decimals: 0 },
          },
          {
            id: 'payments_due_today',
            field: 'paymentDueToday',
            label: 'Payments Due Today',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
          {
            id: 'payments_due_this_week',
            field: 'paymentDueWeek',
            label: 'Payments Due This Week',
            aggregation: 'sum',
            format: { type: 'currency', decimals: 0 },
          },
        ],
        sortBy: [],
      },
      visualizationType: ['summary-cards', 'table', 'bar-chart', 'line-chart'],
      defaultVisualization: 'summary-cards',
      isSystemTemplate: true,
      isShared: false,
      createdBy: 'system',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generationCount: 0,
      tags: ['operational', 'daily', 'dashboard', 'real-time', 'cash'],
      isFavorite: false,
    },
  ];
  
  return systemTemplates;
}

/**
 * Save system templates to localStorage
 */
export function saveSystemTemplates(): void {
  const REPORT_TEMPLATES_KEY = 'aaraazi_report_templates';
  
  const existing = JSON.parse(localStorage.getItem(REPORT_TEMPLATES_KEY) || '[]');
  const systemTemplates = initializeSystemReports();
  
  // Only add system templates that don't exist
  systemTemplates.forEach(template => {
    if (!existing.find((t: ReportTemplate) => t.id === template.id)) {
      existing.push(template);
    }
  });
  
  localStorage.setItem(REPORT_TEMPLATES_KEY, JSON.stringify(existing));
}