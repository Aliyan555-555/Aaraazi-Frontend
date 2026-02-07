/**
 * Budget Versioning System
 * 
 * Provides version control and audit trail for budget changes.
 * Tracks all modifications with before/after snapshots.
 * 
 * Features:
 * - Save budget versions on every change
 * - Track who made the change and when
 * - Store before/after values
 * - Restore previous versions
 * - View complete change history
 */

export interface BudgetVersion {
  id: string;
  budgetId: string;
  version: number;
  timestamp: string;
  changedBy: string;
  changedByName: string;
  changeType: 'created' | 'edited' | 'cloned' | 'restored' | 'bulk_edited';
  changes: BudgetChange[];
  snapshot: BudgetSnapshot;
}

export interface BudgetChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

export interface BudgetSnapshot {
  category: string;
  amount: number;
  period: string;
  notes?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

const VERSIONS_KEY = 'budget_versions';

/**
 * Get all budget versions
 */
export const getAllBudgetVersions = (): BudgetVersion[] => {
  try {
    const stored = localStorage.getItem(VERSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load budget versions:', error);
    return [];
  }
};

/**
 * Get versions for a specific budget
 */
export const getBudgetVersions = (budgetId: string): BudgetVersion[] => {
  const allVersions = getAllBudgetVersions();
  return allVersions
    .filter(v => v.budgetId === budgetId)
    .sort((a, b) => b.version - a.version);
};

/**
 * Get the latest version number for a budget
 */
export const getLatestVersionNumber = (budgetId: string): number => {
  const versions = getBudgetVersions(budgetId);
  return versions.length > 0 ? versions[0].version : 0;
};

/**
 * Save a new budget version
 */
export const saveBudgetVersion = (
  budgetId: string,
  userId: string,
  userName: string,
  changeType: BudgetVersion['changeType'],
  changes: BudgetChange[],
  snapshot: BudgetSnapshot
): BudgetVersion => {
  const allVersions = getAllBudgetVersions();
  const latestVersion = getLatestVersionNumber(budgetId);
  
  const newVersion: BudgetVersion = {
    id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    budgetId,
    version: latestVersion + 1,
    timestamp: new Date().toISOString(),
    changedBy: userId,
    changedByName: userName,
    changeType,
    changes,
    snapshot,
  };
  
  allVersions.push(newVersion);
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(allVersions));
  
  return newVersion;
};

/**
 * Create initial version when budget is created
 */
export const createInitialVersion = (
  budgetId: string,
  userId: string,
  userName: string,
  snapshot: BudgetSnapshot
): BudgetVersion => {
  return saveBudgetVersion(
    budgetId,
    userId,
    userName,
    'created',
    [],
    snapshot
  );
};

/**
 * Compare two snapshots and generate change list
 */
export const compareSnapshots = (
  oldSnapshot: BudgetSnapshot,
  newSnapshot: BudgetSnapshot
): BudgetChange[] => {
  const changes: BudgetChange[] = [];
  
  // Check category
  if (oldSnapshot.category !== newSnapshot.category) {
    changes.push({
      field: 'category',
      fieldLabel: 'Category',
      oldValue: oldSnapshot.category,
      newValue: newSnapshot.category,
    });
  }
  
  // Check amount
  if (oldSnapshot.amount !== newSnapshot.amount) {
    changes.push({
      field: 'amount',
      fieldLabel: 'Amount',
      oldValue: oldSnapshot.amount,
      newValue: newSnapshot.amount,
    });
  }
  
  // Check period
  if (oldSnapshot.period !== newSnapshot.period) {
    changes.push({
      field: 'period',
      fieldLabel: 'Period',
      oldValue: oldSnapshot.period,
      newValue: newSnapshot.period,
    });
  }
  
  // Check notes
  if (oldSnapshot.notes !== newSnapshot.notes) {
    changes.push({
      field: 'notes',
      fieldLabel: 'Notes',
      oldValue: oldSnapshot.notes || '',
      newValue: newSnapshot.notes || '',
    });
  }
  
  // Check isActive
  if (oldSnapshot.isActive !== newSnapshot.isActive) {
    changes.push({
      field: 'isActive',
      fieldLabel: 'Status',
      oldValue: oldSnapshot.isActive ? 'Active' : 'Inactive',
      newValue: newSnapshot.isActive ? 'Active' : 'Inactive',
    });
  }
  
  return changes;
};

/**
 * Get budget snapshot from budget object
 */
export const createSnapshotFromBudget = (budget: any): BudgetSnapshot => {
  return {
    category: budget.category,
    amount: budget.amount,
    period: budget.period,
    notes: budget.notes,
    isActive: budget.isActive ?? true,
    metadata: budget.metadata,
  };
};

/**
 * Restore a budget to a previous version
 */
export const restoreBudgetVersion = (
  budgetId: string,
  versionId: string,
  userId: string,
  userName: string
): BudgetSnapshot | null => {
  const allVersions = getAllBudgetVersions();
  const versionToRestore = allVersions.find(v => v.id === versionId);
  
  if (!versionToRestore) {
    throw new Error('Version not found');
  }
  
  // Get current state (latest version)
  const currentVersions = getBudgetVersions(budgetId);
  const currentSnapshot = currentVersions.length > 0 
    ? currentVersions[0].snapshot 
    : versionToRestore.snapshot;
  
  // Calculate changes
  const changes = compareSnapshots(currentSnapshot, versionToRestore.snapshot);
  
  // Save new version for the restoration
  saveBudgetVersion(
    budgetId,
    userId,
    userName,
    'restored',
    changes,
    versionToRestore.snapshot
  );
  
  return versionToRestore.snapshot;
};

/**
 * Get version statistics for a budget
 */
export const getBudgetVersionStats = (budgetId: string) => {
  const versions = getBudgetVersions(budgetId);
  
  const totalVersions = versions.length;
  const editCount = versions.filter(v => v.changeType === 'edited').length;
  const restoreCount = versions.filter(v => v.changeType === 'restored').length;
  
  const lastModified = versions.length > 0 ? versions[0].timestamp : null;
  const createdAt = versions.length > 0 ? versions[versions.length - 1].timestamp : null;
  
  // Calculate most changed field
  const fieldChangeCounts: Record<string, number> = {};
  versions.forEach(v => {
    v.changes.forEach(change => {
      fieldChangeCounts[change.field] = (fieldChangeCounts[change.field] || 0) + 1;
    });
  });
  
  const mostChangedField = Object.entries(fieldChangeCounts)
    .sort((a, b) => b[1] - a[1])[0];
  
  return {
    totalVersions,
    editCount,
    restoreCount,
    lastModified,
    createdAt,
    mostChangedField: mostChangedField ? {
      field: mostChangedField[0],
      count: mostChangedField[1],
    } : null,
  };
};

/**
 * Delete all versions for a budget
 */
export const deleteBudgetVersions = (budgetId: string): void => {
  const allVersions = getAllBudgetVersions();
  const filtered = allVersions.filter(v => v.budgetId !== budgetId);
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(filtered));
};

/**
 * Get version summary for display
 */
export const getVersionSummary = (version: BudgetVersion): string => {
  if (version.changes.length === 0) {
    return 'Budget created';
  }
  
  const changeDescriptions = version.changes.map(change => {
    if (change.field === 'amount') {
      const diff = Number(change.newValue) - Number(change.oldValue);
      const sign = diff > 0 ? '+' : '';
      return `Amount changed (${sign}${diff.toLocaleString()})`;
    }
    return `${change.fieldLabel} changed`;
  });
  
  return changeDescriptions.join(', ');
};

/**
 * Export version history as JSON
 */
export const exportVersionHistory = (budgetId: string): string => {
  const versions = getBudgetVersions(budgetId);
  return JSON.stringify(versions, null, 2);
};
