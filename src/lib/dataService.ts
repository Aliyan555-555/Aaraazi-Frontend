/**
 * Hybrid Data Service Layer
 * 
 * Intelligent data routing between localStorage (fast, local) and Supabase (persistent, multi-device)
 * 
 * Strategy:
 * - UI State: localStorage only (filters, preferences, recent items)
 * - Critical Business Data: Supabase with localStorage cache
 * - Real-time Data: Supabase
 * - Heavy Documents: Supabase Storage
 * 
 * DEVELOPMENT MODE:
 * - When config.supabaseEnabled = false, acts as pure localStorage wrapper
 * - Zero performance impact, zero backend calls
 * - Perfect for Figma Make rapid iteration
 * 
 * PRODUCTION MODE:
 * - When config.supabaseEnabled = true, syncs to Supabase
 * - Multi-device, multi-tenant support
 */

// Supabase removed - using localStorage only
import { config, devLog, verboseLog } from './config';

// const BACKEND_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c0858a00`;

interface DataServiceConfig {
  useSupabase: boolean;
  cacheDuration: number; // milliseconds
  syncStrategy: 'immediate' | 'batched' | 'offline-first';
}

// Default configuration - respects global config
const defaultConfig: DataServiceConfig = {
  useSupabase: config.supabaseEnabled,
  cacheDuration: config.cache.duration,
  syncStrategy: 'offline-first'
};

/**
 * Get current tenant context from session
 */
export function getCurrentTenant(): { tenantId: string | null; userId: string } {
  const userStr = localStorage.getItem('estate_user');
  if (!userStr) {
    return { tenantId: null, userId: 'guest' };
  }
  
  const user = JSON.parse(userStr);
  return {
    tenantId: user.tenantId || null,
    userId: user.id
  };
}

/**
 * Generate tenant-scoped key for data isolation
 */
export function getTenantKey(baseKey: string): string {
  const { tenantId } = getCurrentTenant();
  if (!tenantId) {
    // For non-tenant users, use base key
    return baseKey;
  }
  return `tenant:${tenantId}:${baseKey}`;
}

/**
 * Hybrid data service class
 */
export class HybridDataService<T> {
  private localKey: string;
  private supabaseKey: string;
  private config: DataServiceConfig;
  private cache: Map<string, { data: T[]; timestamp: number }> = new Map();

  constructor(
    baseKey: string,
    config: Partial<DataServiceConfig> = {}
  ) {
    this.localKey = baseKey; // Keep original key for localStorage
    this.supabaseKey = getTenantKey(baseKey); // Tenant-scoped for Supabase
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Get all items
   */
  async getAll(): Promise<T[]> {
    verboseLog(`getAll() called for ${this.localKey}, Supabase: ${this.config.useSupabase}`);
    
    // DEVELOPMENT MODE: Pure localStorage (instant)
    if (!this.config.useSupabase) {
      return this.getFromLocalStorage();
    }
    
    // PRODUCTION MODE: Hybrid approach
    // Check cache first
    const cached = this.cache.get(this.supabaseKey);
    if (cached && Date.now() - cached.timestamp < this.config.cacheDuration) {
      verboseLog(`Cache hit for ${this.localKey}`);
      return cached.data;
    }

    // Try Supabase first if enabled
    try {
      const supabaseData = await this.fetchFromSupabase();
      if (supabaseData) {
        // Update cache
        this.cache.set(this.supabaseKey, {
          data: supabaseData,
          timestamp: Date.now()
        });
        
        // Sync to localStorage for offline access
        this.saveToLocalStorage(supabaseData);
        
        devLog(`Fetched ${supabaseData.length} items from Supabase for ${this.localKey}`);
        return supabaseData;
      }
    } catch (error) {
      console.error('Supabase fetch failed, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    return this.getFromLocalStorage();
  }

  /**
   * Save items
   */
  async save(items: T[]): Promise<void> {
    verboseLog(`save() called for ${this.localKey}, Supabase: ${this.config.useSupabase}`);
    
    // Always save to localStorage immediately for fast access
    this.saveToLocalStorage(items);
    
    // Update cache
    this.cache.set(this.supabaseKey, {
      data: items,
      timestamp: Date.now()
    });

    // DEVELOPMENT MODE: Skip Supabase (instant save)
    if (!this.config.useSupabase) {
      return;
    }
    
    // PRODUCTION MODE: Sync to Supabase based on strategy
    if (config.autoSync.onSave && this.config.syncStrategy === 'immediate') {
      await this.syncToSupabase(items);
    } else if (this.config.syncStrategy === 'batched') {
      this.scheduleBatchSync(items);
    }
    // offline-first: will sync when connection available
  }

  /**
   * Add single item
   */
  async add(item: T): Promise<T> {
    const items = await this.getAll();
    items.push(item);
    await this.save(items);
    return item;
  }

  /**
   * Update single item by ID
   */
  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.getAll();
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    await this.save(items);
    
    return items[index];
  }

  /**
   * Delete single item by ID
   */
  async delete(id: string): Promise<boolean> {
    const items = await this.getAll();
    const filtered = items.filter((item: any) => item.id !== id);
    
    if (filtered.length === items.length) return false;
    
    await this.save(filtered);
    return true;
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    localStorage.removeItem(this.localKey);
    this.cache.delete(this.supabaseKey);
    
    if (this.config.useSupabase) {
      await this.syncToSupabase([]);
    }
  }

  /**
   * Force sync to Supabase
   */
  async forceSync(): Promise<void> {
    const items = this.getFromLocalStorage();
    await this.syncToSupabase(items);
  }

  // Private methods

  private getFromLocalStorage(): T[] {
    try {
      const data = localStorage.getItem(this.localKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('localStorage read error:', error);
      return [];
    }
  }

  private saveToLocalStorage(items: T[]): void {
    try {
      localStorage.setItem(this.localKey, JSON.stringify(items));
    } catch (error) {
      console.error('localStorage write error:', error);
    }
  }

  private async fetchFromSupabase(): Promise<T[] | null> {
    // Supabase removed - always return null to fall back to localStorage
    return null;
  }

  private async syncToSupabase(items: T[]): Promise<void> {
    // Supabase removed - no-op, data is already in localStorage
    return Promise.resolve();
  }

  private batchSyncTimeout: number | null = null;
  
  private scheduleBatchSync(items: T[]): void {
    if (this.batchSyncTimeout) {
      clearTimeout(this.batchSyncTimeout);
    }
    
    this.batchSyncTimeout = window.setTimeout(() => {
      this.syncToSupabase(items).catch(console.error);
      this.batchSyncTimeout = null;
    }, 2000); // Batch after 2 seconds
  }
}

/**
 * Create a hybrid data service for a specific entity type
 */
export function createDataService<T>(
  key: string,
  config?: Partial<DataServiceConfig>
): HybridDataService<T> {
  return new HybridDataService<T>(key, config);
}

/**
 * Check if Supabase is available
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  // Supabase removed - always return false
  return false;
}

/**
 * Sync all critical data to Supabase
 */
export async function syncAllData(): Promise<{
  success: string[];
  failed: string[];
}> {
  const results = {
    success: [] as string[],
    failed: [] as string[]
  };

  const criticalKeys = [
    'estate_properties',
    'estate_leads',
    'crm_contacts',
    'property_payments',
    'developer_projects',
    'estate_investors',
    'estate_investor_investments',
    'estate_profit_distributions',
    'estate_transactions'
  ];

  for (const key of criticalKeys) {
    try {
      const service = createDataService(key);
      await service.forceSync();
      results.success.push(key);
    } catch (error) {
      console.error(`Sync failed for ${key}:`, error);
      results.failed.push(key);
    }
  }

  return results;
}
