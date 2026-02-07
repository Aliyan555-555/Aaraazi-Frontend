/**
 * Auto-Save Functionality
 * Automatic draft saving and recovery system
 */

export interface AutoSaveState<T = any> {
  key: string;
  data: T;
  timestamp: string;
  version: number;
}

export interface AutoSaveOptions {
  key: string;
  debounceMs?: number; // Default 2000ms (2 seconds)
  maxVersions?: number; // Default 5 versions
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// AUTO-SAVE MANAGER
// ============================================================================

class AutoSaveManager {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private saveCallbacks: Map<string, () => void> = new Map();

  /**
   * Save data with debouncing
   */
  save<T>(options: AutoSaveOptions, data: T): void {
    const { key, debounceMs = 2000, maxVersions = 5, onSave, onError } = options;

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      try {
        this.performSave(key, data, maxVersions);
        onSave?.(data);
      } catch (error) {
        onError?.(error as Error);
        console.error('Auto-save failed:', error);
      }
      this.debounceTimers.delete(key);
    }, debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Perform actual save to localStorage
   */
  private performSave<T>(key: string, data: T, maxVersions: number): void {
    const storageKey = `autosave_${key}`;
    
    // Get existing versions
    const versions = this.getVersions(key);

    // Create new version
    const newVersion: AutoSaveState<T> = {
      key,
      data,
      timestamp: new Date().toISOString(),
      version: versions.length > 0 ? versions[versions.length - 1].version + 1 : 1
    };

    // Add new version
    versions.push(newVersion);

    // Keep only max versions
    const trimmedVersions = versions.slice(-maxVersions);

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(trimmedVersions));
  }

  /**
   * Restore latest saved data
   */
  restore<T>(key: string): T | null {
    try {
      const versions = this.getVersions(key);
      if (versions.length === 0) return null;

      const latest = versions[versions.length - 1];
      return latest.data as T;
    } catch (error) {
      console.error('Auto-restore failed:', error);
      return null;
    }
  }

  /**
   * Get all saved versions
   */
  getVersions(key: string): AutoSaveState[] {
    try {
      const storageKey = `autosave_${key}`;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get versions:', error);
      return [];
    }
  }

  /**
   * Get specific version
   */
  getVersion<T>(key: string, version: number): T | null {
    const versions = this.getVersions(key);
    const targetVersion = versions.find(v => v.version === version);
    return targetVersion ? (targetVersion.data as T) : null;
  }

  /**
   * Check if autosave exists
   */
  hasAutoSave(key: string): boolean {
    const versions = this.getVersions(key);
    return versions.length > 0;
  }

  /**
   * Get latest save timestamp
   */
  getLastSaveTime(key: string): string | null {
    const versions = this.getVersions(key);
    if (versions.length === 0) return null;
    return versions[versions.length - 1].timestamp;
  }

  /**
   * Clear autosave for a key
   */
  clear(key: string): void {
    const storageKey = `autosave_${key}`;
    localStorage.removeItem(storageKey);
    
    // Clear any pending timers
    const timer = this.debounceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(key);
    }
  }

  /**
   * Clear all autosaves
   */
  clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('autosave_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  /**
   * Get all autosave keys
   */
  getAllKeys(): string[] {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith('autosave_'))
      .map(key => key.replace('autosave_', ''));
  }

  /**
   * Get autosave statistics
   */
  getStats(key: string): {
    versions: number;
    lastSaved: string | null;
    oldestSave: string | null;
    totalSize: number;
  } {
    const versions = this.getVersions(key);
    const storageKey = `autosave_${key}`;
    const data = localStorage.getItem(storageKey);
    
    return {
      versions: versions.length,
      lastSaved: versions.length > 0 ? versions[versions.length - 1].timestamp : null,
      oldestSave: versions.length > 0 ? versions[0].timestamp : null,
      totalSize: data ? data.length : 0
    };
  }
}

// Singleton instance
export const autoSaveManager = new AutoSaveManager();

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook for auto-save functionality in React components
 */
export function useAutoSave<T>(options: AutoSaveOptions) {
  const { key, debounceMs = 2000 } = options;

  const save = (data: T) => {
    autoSaveManager.save(options, data);
  };

  const restore = (): T | null => {
    return autoSaveManager.restore<T>(key);
  };

  const clear = () => {
    autoSaveManager.clear(key);
  };

  const hasAutoSave = (): boolean => {
    return autoSaveManager.hasAutoSave(key);
  };

  const getLastSaveTime = (): string | null => {
    return autoSaveManager.getLastSaveTime(key);
  };

  const getVersions = () => {
    return autoSaveManager.getVersions(key);
  };

  return {
    save,
    restore,
    clear,
    hasAutoSave,
    getLastSaveTime,
    getVersions
  };
}

// ============================================================================
// FORM-SPECIFIC AUTO-SAVE
// ============================================================================

/**
 * Auto-save for property forms
 */
export const propertyFormAutoSave = {
  save: (formData: any) => {
    autoSaveManager.save({ key: 'property-form' }, formData);
  },
  
  restore: () => {
    return autoSaveManager.restore('property-form');
  },
  
  clear: () => {
    autoSaveManager.clear('property-form');
  },
  
  hasAutoSave: () => {
    return autoSaveManager.hasAutoSave('property-form');
  }
};

/**
 * Auto-save for lead forms
 */
export const leadFormAutoSave = {
  save: (formData: any) => {
    autoSaveManager.save({ key: 'lead-form' }, formData);
  },
  
  restore: () => {
    return autoSaveManager.restore('lead-form');
  },
  
  clear: () => {
    autoSaveManager.clear('lead-form');
  },
  
  hasAutoSave: () => {
    return autoSaveManager.hasAutoSave('lead-form');
  }
};

/**
 * Auto-save for contact forms
 */
export const contactFormAutoSave = {
  save: (formData: any) => {
    autoSaveManager.save({ key: 'contact-form' }, formData);
  },
  
  restore: () => {
    return autoSaveManager.restore('contact-form');
  },
  
  clear: () => {
    autoSaveManager.clear('contact-form');
  },
  
  hasAutoSave: () => {
    return autoSaveManager.hasAutoSave('contact-form');
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format time since last save
 */
export function formatTimeSince(timestamp: string): string {
  const now = new Date();
  const saveTime = new Date(timestamp);
  const diffMs = now.getTime() - saveTime.getTime();
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

/**
 * Check if autosave is recent (within last hour)
 */
export function isAutoSaveRecent(timestamp: string): boolean {
  const now = new Date();
  const saveTime = new Date(timestamp);
  const diffMs = now.getTime() - saveTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours < 1;
}

/**
 * Calculate storage usage
 */
export function getAutoSaveStorageUsage(): {
  totalKeys: number;
  totalSize: number;
  keys: Array<{ key: string; size: number }>;
} {
  const keys = autoSaveManager.getAllKeys();
  const details = keys.map(key => {
    const stats = autoSaveManager.getStats(key);
    return {
      key,
      size: stats.totalSize
    };
  });

  const totalSize = details.reduce((sum, item) => sum + item.size, 0);

  return {
    totalKeys: keys.length,
    totalSize,
    keys: details
  };
}

/**
 * Clean up old autosaves (older than N days)
 */
export function cleanupOldAutoSaves(daysOld: number = 7): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const keys = autoSaveManager.getAllKeys();
  let cleaned = 0;

  keys.forEach(key => {
    const lastSaveTime = autoSaveManager.getLastSaveTime(key);
    if (lastSaveTime) {
      const saveDate = new Date(lastSaveTime);
      if (saveDate < cutoffDate) {
        autoSaveManager.clear(key);
        cleaned++;
      }
    }
  });

  return cleaned;
}
