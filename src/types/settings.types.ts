/**
 * User settings types — in-memory only (no localStorage).
 * Persist via API when backend supports it.
 */

export interface UserSettings {
  userId: string;
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    sidebarCollapsed: boolean;
    colorScheme: 'blue' | 'purple' | 'green';
    fontSize: 'small' | 'medium' | 'large';
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    weeklyDigest: boolean;
    monthlyReport: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'team' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    allowDataSharing: boolean;
    activityStatus: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
    trustedDevices: Array<{
      id: string;
      name: string;
      lastUsed: string;
      browser: string;
      os: string;
    }>;
  };
  dashboard: {
    defaultView: 'grid' | 'list' | 'kanban';
    widgetsEnabled: string[];
    refreshInterval: number;
    showWelcomeMessage: boolean;
  };
  data: {
    autoSave: boolean;
    autoSaveInterval: number;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    exportFormat: 'csv' | 'xlsx' | 'pdf';
    dataRetentionDays: number;
  };
  regional: {
    language: 'en' | 'ur';
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    firstDayOfWeek: 'sunday' | 'monday';
    currency: 'PKR';
  };
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
  integrations: {
    apiKey?: string;
    webhookUrl?: string;
    calendarSync: boolean;
    googleDriveSync: boolean;
    dropboxSync: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    imageQuality: 'low' | 'medium' | 'high';
    lazyLoading: boolean;
    animationsEnabled: boolean;
  };
}

export function getDefaultSettings(userId: string): UserSettings {
  return {
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
      sessionTimeout: 60,
      loginAlerts: true,
      trustedDevices: [],
    },
    dashboard: {
      defaultView: 'grid',
      widgetsEnabled: ['stats', 'recent-activity', 'quick-actions', 'notifications'],
      refreshInterval: 300,
      showWelcomeMessage: true,
    },
    data: {
      autoSave: true,
      autoSaveInterval: 30,
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
  };
}
