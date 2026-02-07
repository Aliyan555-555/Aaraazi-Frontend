/**
 * Security Management Service
 * Handles password changes, security logs, and authentication security
 */

import { getUserSettings } from './userSettings';
import { getUserProfile } from './userProfile';

const SECURITY_LOGS_KEY = 'estatemanager_security_logs';
const PASSWORD_HISTORY_KEY = 'estatemanager_password_history';

export interface SecurityLog {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'password_change' | 'failed_login' | '2fa_enabled' | '2fa_disabled' | 'settings_change';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface PasswordHistoryEntry {
  userId: string;
  passwordHash: string; // In production, use proper hashing
  changedAt: string;
}

// Simple hash function (In production, use bcrypt or similar)
const simpleHash = (password: string): string => {
  return btoa(password); // Base64 encoding - NOT SECURE, just for demo
};

// Initialize storage
export const initializeSecurity = (): void => {
  if (!localStorage.getItem(SECURITY_LOGS_KEY)) {
    localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(PASSWORD_HISTORY_KEY)) {
    localStorage.setItem(PASSWORD_HISTORY_KEY, JSON.stringify([]));
  }
};

// Security Logs
export const getSecurityLogs = (userId?: string): SecurityLog[] => {
  const logs = localStorage.getItem(SECURITY_LOGS_KEY);
  const allLogs: SecurityLog[] = logs ? JSON.parse(logs) : [];
  
  if (userId) {
    return allLogs.filter(log => log.userId === userId);
  }
  
  return allLogs;
};

const saveSecurityLogs = (logs: SecurityLog[]): void => {
  // Keep only last 1000 logs
  const trimmed = logs.slice(-1000);
  localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(trimmed));
};

export const addSecurityLog = (log: Omit<SecurityLog, 'id' | 'timestamp'>): void => {
  const logs = getSecurityLogs();
  const newLog: SecurityLog = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  
  logs.push(newLog);
  saveSecurityLogs(logs);
};

// Password Management
export const changePassword = (
  userId: string,
  currentPassword: string,
  newPassword: string
): { success: boolean; message: string } => {
  // Get users from auth system
  const usersData = localStorage.getItem('estatemanager_saas_users');
  if (!usersData) {
    return { success: false, message: 'User system not initialized' };
  }
  
  const users = JSON.parse(usersData);
  const userIndex = users.findIndex((u: any) => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, message: 'User not found' };
  }
  
  const user = users[userIndex];
  
  // Verify current password (in production, use proper password verification)
  if (user.password && user.password !== currentPassword) {
    addSecurityLog({
      userId,
      type: 'failed_login',
      description: 'Failed password change - incorrect current password',
      severity: 'warning',
    });
    return { success: false, message: 'Current password is incorrect' };
  }
  
  // Validate new password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    return { success: false, message: validation.message };
  }
  
  // Check password history
  const history = getPasswordHistory(userId);
  const hashedNew = simpleHash(newPassword);
  
  if (history.some(entry => entry.passwordHash === hashedNew)) {
    return { success: false, message: 'Cannot reuse previous passwords' };
  }
  
  // Update password
  users[userIndex].password = newPassword;
  localStorage.setItem('estatemanager_saas_users', JSON.stringify(users));
  
  // Add to password history
  addPasswordHistory(userId, hashedNew);
  
  // Log the change
  addSecurityLog({
    userId,
    type: 'password_change',
    description: 'Password changed successfully',
    severity: 'info',
  });
  
  return { success: true, message: 'Password changed successfully' };
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; message: string; strength: 'weak' | 'medium' | 'strong' } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters', strength: 'weak' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (criteriaCount < 2) {
    return { 
      isValid: false, 
      message: 'Password must include at least 2 of: uppercase, lowercase, numbers, special characters',
      strength: 'weak'
    };
  }
  
  if (criteriaCount === 2) {
    return { isValid: true, message: 'Password strength: Medium', strength: 'medium' };
  }
  
  return { isValid: true, message: 'Password strength: Strong', strength: 'strong' };
};

// Password history
const getPasswordHistory = (userId: string): PasswordHistoryEntry[] => {
  const history = localStorage.getItem(PASSWORD_HISTORY_KEY);
  const allHistory: PasswordHistoryEntry[] = history ? JSON.parse(history) : [];
  return allHistory.filter(entry => entry.userId === userId).slice(-5); // Keep last 5
};

const addPasswordHistory = (userId: string, passwordHash: string): void => {
  const history = localStorage.getItem(PASSWORD_HISTORY_KEY);
  const allHistory: PasswordHistoryEntry[] = history ? JSON.parse(history) : [];
  
  const newEntry: PasswordHistoryEntry = {
    userId,
    passwordHash,
    changedAt: new Date().toISOString(),
  };
  
  allHistory.push(newEntry);
  
  // Keep only last 5 per user
  const userHistory = allHistory.filter(e => e.userId === userId);
  const otherHistory = allHistory.filter(e => e.userId !== userId);
  const trimmedUserHistory = userHistory.slice(-5);
  
  localStorage.setItem(PASSWORD_HISTORY_KEY, JSON.stringify([...otherHistory, ...trimmedUserHistory]));
};

// Session management
export const getActiveSessions = (userId: string): Array<{
  id: string;
  startedAt: string;
  lastActivity: string;
  browser: string;
  os: string;
  ipAddress?: string;
}> => {
  // This is a mock implementation
  // In production, this would come from a session store
  const sessions = localStorage.getItem(`sessions_${userId}`);
  return sessions ? JSON.parse(sessions) : [];
};

export const terminateSession = (userId: string, sessionId: string): void => {
  const sessions = getActiveSessions(userId).filter(s => s.id !== sessionId);
  localStorage.setItem(`sessions_${userId}`, JSON.stringify(sessions));
  
  addSecurityLog({
    userId,
    type: 'logout',
    description: `Session terminated: ${sessionId}`,
    severity: 'info',
  });
};

export const terminateAllSessions = (userId: string, exceptCurrentSession?: string): void => {
  const sessions = exceptCurrentSession 
    ? getActiveSessions(userId).filter(s => s.id === exceptCurrentSession)
    : [];
  
  localStorage.setItem(`sessions_${userId}`, JSON.stringify(sessions));
  
  addSecurityLog({
    userId,
    type: 'logout',
    description: 'All sessions terminated',
    severity: 'warning',
  });
};

// Two-Factor Authentication (Mock)
export const enable2FA = (userId: string): { secret: string; qrCode: string } => {
  // In production, use a proper 2FA library like speakeasy
  const secret = Math.random().toString(36).substring(2, 15);
  const qrCode = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='white' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='12'%3E2FA QR Code%3C/text%3E%3C/svg%3E`;
  
  addSecurityLog({
    userId,
    type: '2fa_enabled',
    description: 'Two-factor authentication enabled',
    severity: 'info',
  });
  
  return { secret, qrCode };
};

export const disable2FA = (userId: string): void => {
  addSecurityLog({
    userId,
    type: '2fa_disabled',
    description: 'Two-factor authentication disabled',
    severity: 'warning',
  });
};

export const verify2FACode = (userId: string, code: string): boolean => {
  // Mock verification - in production, verify against the secret
  return code.length === 6 && /^\d+$/.test(code);
};

// Account security score
export const calculateSecurityScore = (userId: string): {
  score: number;
  recommendations: string[];
} => {
  const settings = getUserSettings(userId);
  const profile = getUserProfile(userId);
  const logs = getSecurityLogs(userId);
  
  let score = 0;
  const recommendations: string[] = [];
  
  // Two-factor authentication (25 points)
  if (settings.security.twoFactorEnabled) {
    score += 25;
  } else {
    recommendations.push('Enable two-factor authentication for enhanced security');
  }
  
  // Recent password change (20 points)
  const recentPasswordChange = logs
    .filter(l => l.type === 'password_change')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  
  if (recentPasswordChange) {
    const daysSinceChange = Math.floor(
      (Date.now() - new Date(recentPasswordChange.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceChange < 90) {
      score += 20;
    } else {
      recommendations.push('Consider changing your password regularly (every 90 days)');
    }
  } else {
    recommendations.push('Change your password to establish security history');
  }
  
  // Profile completeness (15 points)
  if (profile && profile.metadata.profileCompleteness >= 70) {
    score += 15;
  } else {
    recommendations.push('Complete your profile information');
  }
  
  // Login alerts enabled (15 points)
  if (settings.security.loginAlerts) {
    score += 15;
  } else {
    recommendations.push('Enable login alerts to monitor account access');
  }
  
  // Session timeout configured (10 points)
  if (settings.security.sessionTimeout <= 60) {
    score += 10;
  } else {
    recommendations.push('Set a shorter session timeout (60 minutes or less)');
  }
  
  // No recent failed logins (15 points)
  const recentFailedLogins = logs.filter(
    l => l.type === 'failed_login' && 
    new Date(l.timestamp).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
  );
  
  if (recentFailedLogins.length === 0) {
    score += 15;
  } else if (recentFailedLogins.length > 3) {
    recommendations.push('Multiple failed login attempts detected - review your account security');
  }
  
  return { score, recommendations };
};

// Initialize security system
export const initializeSecuritySystem = (): void => {
  initializeSecurity();
};
