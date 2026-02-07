/**
 * aaraazi Configuration
 * 
 * Central configuration for development and production modes
 */

/**
 * DEVELOPMENT MODE SETTINGS
 * 
 * Set these based on your current workflow:
 * - During rapid prototyping in Figma Make: Keep supabaseEnabled = false
 * - When testing multi-tenant/backend features: Set supabaseEnabled = true
 * - In production: Set supabaseEnabled = true
 */

export const config = {
  /**
   * Enable/Disable Supabase Backend
   * 
   * FALSE = Pure localStorage (fastest, for rapid prototyping)
   * TRUE = Hybrid with Supabase sync (for production/testing)
   */
  supabaseEnabled: false,
  
  /**
   * Development Mode
   * 
   * When true, shows extra debugging info and dev tools
   */
  isDevelopment: true,
  
  /**
   * Auto-sync Settings
   * 
   * Only applies when supabaseEnabled = true
   */
  autoSync: {
    enabled: false,        // Auto-sync in background?
    interval: 60000,       // Sync every 60 seconds
    onSave: false          // Sync immediately on save?
  },
  
  /**
   * Cache Settings
   */
  cache: {
    enabled: true,
    duration: 5 * 60 * 1000  // 5 minutes
  },
  
  /**
   * Multi-tenant Settings
   */
  multiTenant: {
    enabled: false,         // Enable tenant isolation?
    strictIsolation: false  // Enforce strict tenant checks?
  },
  
  /**
   * Logging
   */
  logging: {
    enabled: true,
    verbose: false          // Show detailed logs?
  }
};

/**
 * Feature Flags
 * 
 * Toggle specific features on/off for testing
 */
export const features = {
  // Backend features
  supabaseSync: config.supabaseEnabled,
  tenantIsolation: config.multiTenant.enabled,
  roleBasedAccess: false,  // RBAC permissions
  
  // UI features
  devTools: config.isDevelopment,
  syncIndicator: config.supabaseEnabled,
  offlineMode: true,
  
  // Module features
  agencyModule: true,
  developersModule: true,
  investorModule: true
};

/**
 * Quick Mode Presets
 */
export const modes = {
  /**
   * FIGMA MAKE MODE (Default)
   * Pure localStorage, fastest iteration
   */
  figmaMake: () => {
    config.supabaseEnabled = false;
    config.autoSync.enabled = false;
    config.multiTenant.enabled = false;
    features.supabaseSync = false;
    features.tenantIsolation = false;
    features.roleBasedAccess = false;
  },
  
  /**
   * TESTING MODE
   * Enable backend for testing, but manual sync only
   */
  testing: () => {
    config.supabaseEnabled = true;
    config.autoSync.enabled = false;
    config.autoSync.onSave = false;
    config.multiTenant.enabled = false;
    features.supabaseSync = true;
    features.syncIndicator = true;
  },
  
  /**
   * PRODUCTION MODE
   * Full backend sync with tenant isolation
   */
  production: () => {
    config.supabaseEnabled = true;
    config.isDevelopment = false;
    config.autoSync.enabled = true;
    config.autoSync.onSave = true;
    config.multiTenant.enabled = true;
    config.multiTenant.strictIsolation = true;
    features.supabaseSync = true;
    features.tenantIsolation = true;
    features.roleBasedAccess = true;
    features.devTools = false;
    config.logging.verbose = false;
  }
};

/**
 * Initialize config mode
 * 
 * Set your preferred mode here:
 */
// modes.figmaMake();  // <-- Default for rapid prototyping
// modes.testing();     // <-- Use when testing backend
// modes.production();  // <-- Use for production

/**
 * Helper to check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature] === true;
}

/**
 * Helper to log (respects config settings)
 */
export function devLog(message: string, ...args: any[]) {
  if (config.logging.enabled && config.isDevelopment) {
    console.log(`[aaraazi] ${message}`, ...args);
  }
}

/**
 * Helper to log verbose
 */
export function verboseLog(message: string, ...args: any[]) {
  if (config.logging.verbose) {
    console.log(`[Verbose] ${message}`, ...args);
  }
}
