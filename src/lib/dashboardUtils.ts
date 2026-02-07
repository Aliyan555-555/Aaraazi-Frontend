/**
 * Dashboard Utilities - Enhanced Features
 * GAP FIX: Dashboard Enhancements
 * 
 * Features:
 * - Advanced filtering options
 * - Dashboard data export
 * - Optimized refresh with polling
 */

import { DashboardMetrics } from '../components/dashboard/types/dashboard.types';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface DashboardFilter {
  dateRange?: {
    start: string;
    end: string;
  };
  module?: string[];
  status?: string[];
  agent?: string[];
  propertyType?: string[];
}

export interface DashboardExport {
  id: string;
  exportedAt: string;
  exportedBy: string;
  format: 'json' | 'csv' | 'excel';
  data: DashboardExportData;
}

export interface DashboardExportData {
  metrics: DashboardMetrics;
  timestamp: string;
  filters?: DashboardFilter;
}

export interface RefreshConfig {
  enabled: boolean;
  interval: number; // milliseconds
  lastRefresh: string | null;
  nextRefresh: string | null;
}

// ============================================
// FILTERING
// ============================================

/**
 * Apply filters to dashboard data
 */
export function applyDashboardFilters<T>(
  data: T[],
  filter: DashboardFilter,
  getDate: (item: T) => string,
  getModule?: (item: T) => string,
  getStatus?: (item: T) => string,
  getAgent?: (item: T) => string
): T[] {
  return data.filter(item => {
    // Date range filter
    if (filter.dateRange) {
      const itemDate = new Date(getDate(item));
      const start = new Date(filter.dateRange.start);
      const end = new Date(filter.dateRange.end);
      if (itemDate < start || itemDate > end) {
        return false;
      }
    }

    // Module filter
    if (filter.module && filter.module.length > 0 && getModule) {
      const module = getModule(item);
      if (!filter.module.includes(module)) {
        return false;
      }
    }

    // Status filter
    if (filter.status && filter.status.length > 0 && getStatus) {
      const status = getStatus(item);
      if (!filter.status.includes(status)) {
        return false;
      }
    }

    // Agent filter
    if (filter.agent && filter.agent.length > 0 && getAgent) {
      const agent = getAgent(item);
      if (!filter.agent.includes(agent)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get available filter options from data
 */
export function getFilterOptions<T>(
  data: T[],
  getModule?: (item: T) => string,
  getStatus?: (item: T) => string,
  getAgent?: (item: T) => string
): {
  modules: string[];
  statuses: string[];
  agents: string[];
} {
  const modules = new Set<string>();
  const statuses = new Set<string>();
  const agents = new Set<string>();

  for (const item of data) {
    if (getModule) {
      const module = getModule(item);
      if (module) modules.add(module);
    }
    if (getStatus) {
      const status = getStatus(item);
      if (status) statuses.add(status);
    }
    if (getAgent) {
      const agent = getAgent(item);
      if (agent) agents.add(agent);
    }
  }

  return {
    modules: Array.from(modules).sort(),
    statuses: Array.from(statuses).sort(),
    agents: Array.from(agents).sort(),
  };
}

// ============================================
// EXPORT FUNCTIONALITY
// ============================================

/**
 * Export dashboard data as JSON
 */
export function exportDashboardJSON(
  metrics: DashboardMetrics,
  filters?: DashboardFilter,
  exportedBy: string = 'System'
): string {
  const exportData: DashboardExportData = {
    metrics,
    timestamp: new Date().toISOString(),
    filters,
  };

  const exportRecord: DashboardExport = {
    id: `export-${Date.now()}`,
    exportedAt: new Date().toISOString(),
    exportedBy,
    format: 'json',
    data: exportData,
  };

  // Save export history
  saveExportHistory(exportRecord);

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export dashboard data as CSV
 */
export function exportDashboardCSV(
  metrics: DashboardMetrics,
  filters?: DashboardFilter,
  exportedBy: string = 'System'
): string {
  const rows: string[] = [];

  // Header
  rows.push('Metric,Value,Change');

  // Metrics
  rows.push(`Active Pipeline,${metrics.activePipeline.raw},${metrics.activePipeline.trend.value}`);
  rows.push(`Monthly Revenue,${metrics.monthlyRevenue.raw},${metrics.monthlyRevenue.trend.value}`);
  rows.push(`Available Inventory,${metrics.availableInventory.raw},-`);
  rows.push(`Conversion Rate,${metrics.conversionRate.raw}%,${metrics.conversionRate.trend.value}`);

  // Footer
  rows.push('');
  rows.push(`Exported: ${new Date().toISOString()}`);
  if (filters) {
    rows.push(`Filters: ${JSON.stringify(filters)}`);
  }

  const csv = rows.join('\n');

  // Save export history
  const exportRecord: DashboardExport = {
    id: `export-${Date.now()}`,
    exportedAt: new Date().toISOString(),
    exportedBy,
    format: 'csv',
    data: { metrics, timestamp: new Date().toISOString(), filters },
  };
  saveExportHistory(exportRecord);

  return csv;
}

/**
 * Download dashboard export
 */
export function downloadDashboardExport(
  content: string,
  filename: string,
  mimeType: string = 'application/json'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get export history
 */
export function getExportHistory(limit: number = 10): DashboardExport[] {
  const history = JSON.parse(
    localStorage.getItem('dashboard_export_history') || '[]'
  ) as DashboardExport[];
  return history.slice(-limit).reverse();
}

/**
 * Save export history
 */
function saveExportHistory(exportRecord: DashboardExport): void {
  const history = JSON.parse(
    localStorage.getItem('dashboard_export_history') || '[]'
  ) as DashboardExport[];
  history.push(exportRecord);

  // Keep only last 50 exports
  const limited = history.slice(-50);
  localStorage.setItem('dashboard_export_history', JSON.stringify(limited));
}

// ============================================
// REFRESH OPTIMIZATION
// ============================================

/**
 * Get refresh configuration
 */
export function getRefreshConfig(): RefreshConfig {
  const stored = localStorage.getItem('dashboard_refresh_config');
  if (stored) {
    return JSON.parse(stored) as RefreshConfig;
  }

  // Default: refresh every 5 minutes
  return {
    enabled: true,
    interval: 5 * 60 * 1000, // 5 minutes
    lastRefresh: null,
    nextRefresh: null,
  };
}

/**
 * Update refresh configuration
 */
export function updateRefreshConfig(config: Partial<RefreshConfig>): void {
  const current = getRefreshConfig();
  const updated: RefreshConfig = {
    ...current,
    ...config,
    lastRefresh: config.enabled !== false ? new Date().toISOString() : current.lastRefresh,
    nextRefresh: config.enabled !== false
      ? new Date(Date.now() + (config.interval || current.interval)).toISOString()
      : null,
  };
  localStorage.setItem('dashboard_refresh_config', JSON.stringify(updated));
}

/**
 * Check if dashboard should refresh
 */
export function shouldRefreshDashboard(): boolean {
  const config = getRefreshConfig();
  if (!config.enabled) return false;

  if (!config.nextRefresh) return true;

  const nextRefresh = new Date(config.nextRefresh);
  return new Date() >= nextRefresh;
}

/**
 * Mark dashboard as refreshed
 */
export function markDashboardRefreshed(): void {
  const config = getRefreshConfig();
  if (config.enabled) {
    updateRefreshConfig({
      lastRefresh: new Date().toISOString(),
      nextRefresh: new Date(Date.now() + config.interval).toISOString(),
    });
  }
}

// ============================================
// POLLING OPTIMIZATION
// ============================================

/**
 * Create optimized polling function
 */
export function createOptimizedPolling<T>(
  fetchFn: () => Promise<T> | T,
  onUpdate: (data: T) => void,
  interval: number = 30000, // 30 seconds default
  options: {
    immediate?: boolean;
    onError?: (error: Error) => void;
  } = {}
): () => void {
  let pollingInterval: NodeJS.Timeout | null = null;
  let isPolling = false;

  const poll = async () => {
    if (isPolling) return;
    isPolling = true;

    try {
      const data = await Promise.resolve(fetchFn());
      onUpdate(data);
    } catch (error) {
      console.error('Polling error:', error);
      if (options.onError) {
        options.onError(error as Error);
      }
    } finally {
      isPolling = false;
    }
  };

  const start = () => {
    if (pollingInterval) return;

    if (options.immediate) {
      poll();
    }

    pollingInterval = setInterval(poll, interval);
  };

  const stop = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };

  start();

  return stop;
}
