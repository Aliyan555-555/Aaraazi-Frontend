/**
 * Performance Optimization Utilities - V3.0
 * Tools for monitoring and optimizing application performance
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing and record metric
   */
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`No timer found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    return duration;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average duration for operation
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const operations = new Map<string, PerformanceMetric[]>();

    // Group by operation name
    this.metrics.forEach(metric => {
      if (!operations.has(metric.name)) {
        operations.set(metric.name, []);
      }
      operations.get(metric.name)!.push(metric);
    });

    let report = '📊 Performance Report\n';
    report += '='.repeat(50) + '\n\n';

    operations.forEach((metrics, name) => {
      const durations = metrics.map(m => m.duration);
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      report += `${name}:\n`;
      report += `  Count: ${metrics.length}\n`;
      report += `  Avg: ${avg.toFixed(2)}ms\n`;
      report += `  Min: ${min.toFixed(2)}ms\n`;
      report += `  Max: ${max.toFixed(2)}ms\n`;
      report += '\n';
    });

    return report;
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  perfMonitor.startTimer(name);
  try {
    return fn();
  } finally {
    const duration = perfMonitor.endTimer(name);
    if (duration > 100) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Measure async function execution time
 */
export async function measurePerformanceAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  perfMonitor.startTimer(name);
  try {
    return await fn();
  } finally {
    const duration = perfMonitor.endTimer(name);
    if (duration > 100) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Optimize localStorage operations
 */
export class StorageCache {
  private cache: Map<string, any> = new Map();
  private timestamps: Map<string, number> = new Map();
  private ttl: number = 60000; // 1 minute default

  constructor(ttl?: number) {
    if (ttl) this.ttl = ttl;
  }

  /**
   * Get from cache or localStorage
   */
  get<T>(key: string): T | null {
    // Check cache first
    if (this.cache.has(key)) {
      const timestamp = this.timestamps.get(key)!;
      if (Date.now() - timestamp < this.ttl) {
        return this.cache.get(key) as T;
      }
      // Cache expired
      this.cache.delete(key);
      this.timestamps.delete(key);
    }

    // Load from localStorage
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      this.cache.set(key, parsed);
      this.timestamps.set(key, Date.now());
      return parsed as T;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set in cache and localStorage
   */
  set(key: string, value: any): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Invalidate cache for key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }
}

// Global storage cache instance
export const storageCache = new StorageCache();

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getCacheKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getCacheKey
      ? getCacheKey(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch operations to reduce renders
 */
export class OperationBatcher {
  private queue: Array<() => void> = [];
  private timeout: NodeJS.Timeout | null = null;
  private delay: number = 16; // ~60fps

  /**
   * Add operation to batch
   */
  add(operation: () => void): void {
    this.queue.push(operation);
    this.scheduleBatch();
  }

  /**
   * Schedule batch execution
   */
  private scheduleBatch(): void {
    if (this.timeout) return;

    this.timeout = setTimeout(() => {
      this.executeBatch();
    }, this.delay);
  }

  /**
   * Execute all batched operations
   */
  private executeBatch(): void {
    const operations = [...this.queue];
    this.queue = [];
    this.timeout = null;

    operations.forEach(op => {
      try {
        op();
      } catch (error) {
        console.error('Batch operation failed:', error);
      }
    });
  }

  /**
   * Force immediate execution
   */
  flush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.executeBatch();
  }
}

/**
 * Analyze localStorage usage
 */
export function analyzeStorageUsage(): {
  totalSize: number;
  byKey: Array<{ key: string; size: number }>;
  utilization: number;
} {
  const byKey: Array<{ key: string; size: number }> = [];
  let totalSize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const value = localStorage.getItem(key) || '';
    const size = new Blob([value]).size;

    byKey.push({ key, size });
    totalSize += size;
  }

  // Sort by size
  byKey.sort((a, b) => b.size - a.size);

  // Estimate quota (usually 5-10MB)
  const estimatedQuota = 5 * 1024 * 1024; // 5MB
  const utilization = (totalSize / estimatedQuota) * 100;

  return {
    totalSize,
    byKey,
    utilization,
  };
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Print storage usage report
 */
export function printStorageReport(): void {
  const usage = analyzeStorageUsage();

  console.log('💾 Storage Usage Report');
  console.log('='.repeat(50));
  console.log(`Total Size: ${formatBytes(usage.totalSize)}`);
  console.log(`Utilization: ${usage.utilization.toFixed(2)}%`);
  console.log('');
  console.log('Top Storage Consumers:');
  
  usage.byKey.slice(0, 10).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.key}: ${formatBytes(item.size)}`);
  });
}

/**
 * Cleanup old data
 */
export function cleanupOldData(daysOld: number = 90): number {
  let cleaned = 0;
  const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

  // Check timestamped data
  const keysToCheck = ['properties', 'sell_cycles_v3', 'purchase_cycles_v3', 'rent_cycles_v3'];
  
  keysToCheck.forEach(key => {
    const stored = localStorage.getItem(key);
    if (!stored) return;

    try {
      const data = JSON.parse(stored);
      if (!Array.isArray(data)) return;

      const filtered = data.filter((item: any) => {
        if (!item.createdAt) return true;
        const created = new Date(item.createdAt).getTime();
        return created > cutoffDate;
      });

      if (filtered.length < data.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
        cleaned += data.length - filtered.length;
      }
    } catch (error) {
      console.error(`Error cleaning ${key}:`, error);
    }
  });

  return cleaned;
}

// Expose to window for console use
if (typeof window !== 'undefined') {
  (window as any).performance = {
    monitor: perfMonitor,
    measure: measurePerformance,
    measureAsync: measurePerformanceAsync,
    cache: storageCache,
    analyzeStorage: analyzeStorageUsage,
    printStorageReport,
    cleanupOldData,
    formatBytes,
  };
}
