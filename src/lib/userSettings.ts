/**
 * User Settings Management Service
 * Handles application settings, preferences, and configurations
 */

const SETTINGS_STORAGE_KEY = 'estatemanager_user_settings';

export interface UserSettings {
  userId: string;
  
  // Appearance Settings
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    sidebarCollapsed: boolean;
    colorScheme: 'blue' | 'purple' | 'green';
    fontSize: 'small' | 'medium' | 'large';
  };
  
  // Notification Settings (in addition to NotificationPreferences)
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    weeklyDigest: boolean;
    monthlyReport: boolean;
    marketingEmails: boolean;
  };
  
  // Privacy Settings
  privacy: {
    profileVisibility: 'public' | 'team' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    allowDataSharing: boolean;
    activityStatus: boolean; // Show online/offline status
  };
  
  // Security Settings
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number; // Minutes
    loginAlerts: boolean;
    trustedDevices: Array<{
      id: string;
      name: string;
      lastUsed: string;
      browser: string;
      os: string;
    }>;
  };
  
  // Dashboard Settings
  dashboard: {
    defaultView: 'grid' | 'list' | 'kanban';
    widgetsEnabled: string[]; // Widget IDs
    refreshInterval: number; // Seconds
    showWelcomeMessage: boolean;
  };
  
  // Data & Export Settings
  data: {
    autoSave: boolean;
    autoSaveInterval: number; // Seconds
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    exportFormat: 'csv' | 'xlsx' | 'pdf';
    dataRetentionDays: number;
  };
  
  // Regional Settings
  regional: {
    language: 'en' | 'ur';
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    firstDayOfWeek: 'sunday' | 'monday';
    currency: 'PKR';
  };
  
  // Communication Settings
  communication: {
    defaultEmailSignature?: string;
    autoReplyEnabled: boolean;
    autoReplyMessage?: string;
    emailTemplates: Array<{
      id: string;
      name: string;
      subject: string;
      body: string;
    }>;
  };
  
  // Integration Settings (API Keys, Webhooks)
  integrations: {
    apiKey?: string;
    webhookUrl?: string;
    calendarSync: boolean;
    googleDriveSync: boolean;
    dropboxSync: boolean;
  };
  
  // Performance Settings
  performance: {
    cacheEnabled: boolean;
    imageQuality: 'low' | 'medium' | 'high';
    lazyLoading: boolean;
    animationsEnabled: boolean;
  };
  
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

// Default settings
export const getDefaultSettings = (userId: string): UserSettings => ({
  userId,
  appearance: {
    theme: 'light',
    compactMode: false,
    sidebarCollapsed: false,
    colorScheme: 'blue',
    fontSize: 'medium',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    weeklyDigest: true,
    monthlyReport: true,
    marketingEmails: false,
  },
  privacy: {
    profileVisibility: 'team',
    showEmail: true,
    showPhone: true,
    allowDataSharing: false,
    activityStatus: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60, // 60 minutes
    loginAlerts: true,
    trustedDevices: [],
  },
  dashboard: {
    defaultView: 'grid',
    widgetsEnabled: ['stats', 'recent-activity', 'quick-actions', 'notifications'],
    refreshInterval: 300, // 5 minutes
    showWelcomeMessage: true,
  },
  data: {
    autoSave: true,
    autoSaveInterval: 30, // 30 seconds
    backupFrequency: 'weekly',
    exportFormat: 'xlsx',
    dataRetentionDays: 365,
  },
  regional: {
    language: 'en',
    timezone: 'Asia/Karachi',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 'monday',
    currency: 'PKR',
  },
  communication: {
    autoReplyEnabled: false,
    emailTemplates: [],
  },
  integrations: {
    calendarSync: false,
    googleDriveSync: false,
    dropboxSync: false,
  },
  performance: {
    cacheEnabled: true,
    imageQuality: 'high',
    lazyLoading: true,
    animationsEnabled: true,
  },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});

// Initialize settings storage
export const initializeSettings = (): void => {
  if (!localStorage.getItem(SETTINGS_STORAGE_KEY)) {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify([]));
  }
};

// Get all settings
const getAllSettings = (): UserSettings[] => {
  const settings = localStorage.getItem(SETTINGS_STORAGE_KEY);
  return settings ? JSON.parse(settings) : [];
};

// Save settings
const saveSettings = (settings: UserSettings[]): void => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

// Get user settings
export const getUserSettings = (userId: string): UserSettings => {
  const allSettings = getAllSettings();
  const userSettings = allSettings.find(s => s.userId === userId);
  
  if (!userSettings) {
    // Create default settings for new user
    const defaultSettings = getDefaultSettings(userId);
    const updated = [...allSettings, defaultSettings];
    saveSettings(updated);
    return defaultSettings;
  }
  
  return userSettings;
};

// Update user settings
export const updateUserSettings = (
  userId: string, 
  updates: Partial<Omit<UserSettings, 'userId' | 'metadata'>>
): UserSettings => {
  const allSettings = getAllSettings();
  const existingIndex = allSettings.findIndex(s => s.userId === userId);
  
  let updatedSettings: UserSettings;
  
  if (existingIndex >= 0) {
    updatedSettings = {
      ...allSettings[existingIndex],
      ...updates,
      appearance: {
        ...allSettings[existingIndex].appearance,
        ...updates.appearance,
      },
      notifications: {
        ...allSettings[existingIndex].notifications,
        ...updates.notifications,
      },
      privacy: {
        ...allSettings[existingIndex].privacy,
        ...updates.privacy,
      },
      security: {
        ...allSettings[existingIndex].security,
        ...updates.security,
      },
      dashboard: {
        ...allSettings[existingIndex].dashboard,
        ...updates.dashboard,
      },
      data: {
        ...allSettings[existingIndex].data,
        ...updates.data,
      },
      regional: {
        ...allSettings[existingIndex].regional,
        ...updates.regional,
      },
      communication: {
        ...allSettings[existingIndex].communication,
        ...updates.communication,
      },
      integrations: {
        ...allSettings[existingIndex].integrations,
        ...updates.integrations,
      },
      performance: {
        ...allSettings[existingIndex].performance,
        ...updates.performance,
      },
      metadata: {
        ...allSettings[existingIndex].metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    
    allSettings[existingIndex] = updatedSettings;
  } else {
    updatedSettings = {
      ...getDefaultSettings(userId),
      ...updates,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    allSettings.push(updatedSettings);
  }
  
  saveSettings(allSettings);
  return updatedSettings;
};

// Add trusted device
export const addTrustedDevice = (
  userId: string,
  device: {
    name: string;
    browser: string;
    os: string;
  }
): void => {
  const settings = getUserSettings(userId);
  const newDevice = {
    id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...device,
    lastUsed: new Date().toISOString(),
  };
  
  updateUserSettings(userId, {
    security: {
      ...settings.security,
      trustedDevices: [...settings.security.trustedDevices, newDevice],
    },
  });
};

// Remove trusted device
export const removeTrustedDevice = (userId: string, deviceId: string): void => {
  const settings = getUserSettings(userId);
  updateUserSettings(userId, {
    security: {
      ...settings.security,
      trustedDevices: settings.security.trustedDevices.filter(d => d.id !== deviceId),
    },
  });
};

// Add email template
export const addEmailTemplate = (
  userId: string,
  template: { name: string; subject: string; body: string }
): void => {
  const settings = getUserSettings(userId);
  const newTemplate = {
    id: `template_${Date.now()}`,
    ...template,
  };
  
  updateUserSettings(userId, {
    communication: {
      ...settings.communication,
      emailTemplates: [...settings.communication.emailTemplates, newTemplate],
    },
  });
};

// Remove email template
export const removeEmailTemplate = (userId: string, templateId: string): void => {
  const settings = getUserSettings(userId);
  updateUserSettings(userId, {
    communication: {
      ...settings.communication,
      emailTemplates: settings.communication.emailTemplates.filter(t => t.id !== templateId),
    },
  });
};

// Reset settings to default
export const resetUserSettings = (userId: string): UserSettings => {
  const allSettings = getAllSettings();
  const filtered = allSettings.filter(s => s.userId !== userId);
  const defaultSettings = getDefaultSettings(userId);
  filtered.push(defaultSettings);
  saveSettings(filtered);
  return defaultSettings;
};

// Export settings (for backup)
export const exportUserSettings = (userId: string): string => {
  const settings = getUserSettings(userId);
  return JSON.stringify(settings, null, 2);
};

// Import settings (from backup)
export const importUserSettings = (userId: string, settingsJson: string): UserSettings => {
  try {
    const imported = JSON.parse(settingsJson);
    imported.userId = userId; // Ensure correct user ID
    imported.metadata.updatedAt = new Date().toISOString();
    
    const allSettings = getAllSettings();
    const existingIndex = allSettings.findIndex(s => s.userId === userId);
    
    if (existingIndex >= 0) {
      allSettings[existingIndex] = imported;
    } else {
      allSettings.push(imported);
    }
    
    saveSettings(allSettings);
    return imported;
  } catch (error) {
    console.error('Failed to import settings:', error);
    throw new Error('Invalid settings format');
  }
};

// Initialize user settings
export const initializeUserSettings = (): void => {
  initializeSettings();
};
