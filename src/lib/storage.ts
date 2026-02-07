// Storage utilities with error handling and quota management

export const STORAGE_KEYS = {
  PROPERTIES: 'estate_properties',
  LEADS: 'estate_leads',
  DOCUMENTS: 'estate_documents',
  COMMISSIONS: 'estate_commissions',
  EXPENSES: 'estate_expenses',
  CRM_CONTACTS: 'crm_contacts',
  CRM_INTERACTIONS: 'crm_interactions',
  CRM_TASKS: 'crm_tasks',
  PAYMENTS: 'property_payments',
  PROJECTS: 'projects',
  USERS: 'estate_users',
  CURRENT_USER: 'current_user'
};

interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class StorageManager {
  private static instance: StorageManager;
  
  private constructor() {}
  
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Get data from localStorage with error handling
  get<T>(key: string, defaultValue: T): StorageResult<T> {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return { success: true, data: defaultValue };
      }
      
      const parsed = JSON.parse(item);
      return { success: true, data: parsed };
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return { 
        success: false, 
        data: defaultValue, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Set data to localStorage with quota handling
  set<T>(key: string, value: T): StorageResult<T> {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return { success: true, data: value };
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      
      // Handle quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        const cleanupResult = this.cleanupOldData();
        
        if (cleanupResult.success) {
          // Try again after cleanup
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return { success: true, data: value };
          } catch (retryError) {
            return { 
              success: false, 
              error: 'Storage quota exceeded even after cleanup' 
            };
          }
        }
        
        return { 
          success: false, 
          error: 'Storage quota exceeded and cleanup failed' 
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Remove item from localStorage
  remove(key: string): StorageResult<null> {
    try {
      localStorage.removeItem(key);
      return { success: true, data: null };
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get storage usage information
  getStorageInfo(): { used: number; available: number; percentage: number } {
    let used = 0;
    let available = 5 * 1024 * 1024; // 5MB typical localStorage limit
    
    try {
      // Calculate used storage
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // Try to determine available space
      const testKey = 'test_storage_limit';
      const testValue = 'x'.repeat(1024); // 1KB test
      let testSize = 1024;
      
      try {
        while (testSize < available) {
          localStorage.setItem(testKey, 'x'.repeat(testSize));
          testSize += 1024;
        }
      } catch (e) {
        available = testSize - 1024;
      } finally {
        localStorage.removeItem(testKey);
      }
      
    } catch (error) {
      console.error('Error calculating storage info:', error);
    }
    
    return {
      used,
      available,
      percentage: (used / available) * 100
    };
  }

  // Cleanup old or unnecessary data
  private cleanupOldData(): StorageResult<null> {
    try {
      const cleanupActions = [
        // Remove old interaction logs (keep only last 30 days)
        () => this.cleanupInteractions(),
        // Remove old completed tasks
        () => this.cleanupTasks(),
        // Remove temporary data
        () => this.cleanupTempData()
      ];
      
      for (const action of cleanupActions) {
        try {
          action();
        } catch (error) {
          console.warn('Cleanup action failed:', error);
        }
      }
      
      return { success: true, data: null };
    } catch (error) {
      console.error('Error during storage cleanup:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cleanup failed' 
      };
    }
  }

  private cleanupInteractions(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = this.get(STORAGE_KEYS.CRM_INTERACTIONS, []);
    if (result.success && Array.isArray(result.data)) {
      const filtered = result.data.filter((interaction: any) => {
        if (!interaction.date) return true;
        return new Date(interaction.date) > thirtyDaysAgo;
      });
      
      if (filtered.length < result.data.length) {
        this.set(STORAGE_KEYS.CRM_INTERACTIONS, filtered);
        console.log(`Cleaned up ${result.data.length - filtered.length} old interactions`);
      }
    }
  }

  private cleanupTasks(): void {
    const result = this.get(STORAGE_KEYS.CRM_TASKS, []);
    if (result.success && Array.isArray(result.data)) {
      const filtered = result.data.filter((task: any) => {
        return task.status !== 'completed' || !task.completedAt;
      });
      
      if (filtered.length < result.data.length) {
        this.set(STORAGE_KEYS.CRM_TASKS, filtered);
        console.log(`Cleaned up ${result.data.length - filtered.length} completed tasks`);
      }
    }
  }

  private cleanupTempData(): void {
    // Remove any keys that start with 'temp_' or 'cache_'
    const keysToRemove = [];
    for (let key in localStorage) {
      if (key.startsWith('temp_') || key.startsWith('cache_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} temporary items`);
    }
  }

  // Check if storage is near capacity
  isStorageNearCapacity(): boolean {
    const info = this.getStorageInfo();
    return info.percentage > 80; // 80% threshold
  }

  // Get a formatted storage report
  getStorageReport(): string {
    const info = this.getStorageInfo();
    return `Storage: ${(info.used / 1024).toFixed(1)}KB used of ${(info.available / 1024).toFixed(1)}KB (${info.percentage.toFixed(1)}%)`;
  }
}

// Export singleton instance
export const storage = StorageManager.getInstance();

// Convenience functions
export const safeGetItem = <T>(key: string, defaultValue: T): T => {
  const result = storage.get(key, defaultValue);
  return result.data!;
};

export const safeSetItem = <T>(key: string, value: T): boolean => {
  const result = storage.set(key, value);
  return result.success;
};

export const safeRemoveItem = (key: string): boolean => {
  const result = storage.remove(key);
  return result.success;
};