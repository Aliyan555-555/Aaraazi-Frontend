/**
 * BudgetHistoryModal Component
 * 
 * Display complete version history for a budget.
 * 
 * Features:
 * - Timeline of all changes
 * - Who made changes and when
 * - Before/after values
 * - Restore previous versions
 * - Export history
 * 
 * Design System V4.1 Compliant
 */

import React, { useState, useMemo } from 'react';
import { User } from '../../../types';
import { Budget } from './EditBudgetModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  History,
  Clock,
  User as UserIcon,
  Download,
  RotateCcw,
  Check,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPKR } from '../../../lib/currency';
// [STUBBED] import {
// [STUBBED]   getBudgetVersions,
// [STUBBED]   restoreBudgetVersion,
// [STUBBED]   exportVersionHistory,
// [STUBBED]   getVersionSummary,
// [STUBBED]   BudgetVersion,
// [STUBBED]   getBudgetVersionStats,
// [STUBBED] } from '../../../lib/budget-versioning';

// ===== STUBS for removed prototype functions =====
const getBudgetVersions = (..._args: any[]): any => { /* stub - prototype function removed */ };
const restoreBudgetVersion = (..._args: any[]): any => { /* stub - prototype function removed */ };
const exportVersionHistory = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getVersionSummary = (..._args: any[]): any => { /* stub - prototype function removed */ };
type BudgetVersion = any;
const getBudgetVersionStats = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface BudgetHistoryModalProps {
  open: boolean;
  onClose: () => void;
  budget: Budget;
  user: User;
  onRestore: (budgetId: string, updates: Partial<Budget>) => void;
}

export const BudgetHistoryModal: React.FC<BudgetHistoryModalProps> = ({
  open,
  onClose,
  budget,
  user,
  onRestore,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Load versions - handles null budget
  const versions = useMemo(() => {
    if (!open || !budget) return [];
    return getBudgetVersions(budget.id);
  }, [open, budget]);

  // Load stats - handles null budget
  const stats = useMemo(() => {
    if (!open || !budget) return null;
    return getBudgetVersionStats(budget.id);
  }, [open, budget]);

  // Handle restore
  const handleRestore = (versionId: string) => {
    if (!confirm('Restore this version? This will create a new version with these values.')) {
      return;
    }

    try {
      const snapshot = restoreBudgetVersion(budget.id, versionId, user.id, user.name);
      
      if (!snapshot) {
        throw new Error('Failed to restore version');
      }

      // Apply restored values
      onRestore(budget.id, {
        category: snapshot.category,
        amount: snapshot.amount,
        period: snapshot.period,
        notes: snapshot.notes,
        isActive: snapshot.isActive,
      });

      toast.success('Budget restored to previous version');
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
    }
  };

  // Handle export
  const handleExport = () => {
    try {
      const json = exportVersionHistory(budget.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-history-${budget.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('History exported successfully');
    } catch (error) {
      toast.error('Failed to export history');
    }
  };

  // Get change type badge
  const getChangeTypeBadge = (changeType: BudgetVersion['changeType']) => {
    const variants: Record<typeof changeType, { label: string; variant: any }> = {
      created: { label: 'Created', variant: 'success' },
      edited: { label: 'Edited', variant: 'default' },
      cloned: { label: 'Cloned', variant: 'info' },
      restored: { label: 'Restored', variant: 'warning' },
      bulk_edited: { label: 'Bulk Edit', variant: 'secondary' },
    };

    const config = variants[changeType];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-600" />
            Budget History
          </DialogTitle>
          <DialogDescription>
            {budget ? `Complete version history for "${budget.category}"` : 'Budget history'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-900">Total Versions</div>
                <div className="text-blue-900 mt-1">{stats.totalVersions}</div>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-900">Edits</div>
                <div className="text-green-900 mt-1">{stats.editCount}</div>
              </div>
              
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm text-orange-900">Restorations</div>
                <div className="text-orange-900 mt-1">{stats.restoreCount}</div>
              </div>
              
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-sm text-purple-900">Most Changed</div>
                <div className="text-sm text-purple-900 mt-1 capitalize">
                  {stats.mostChangedField?.field || 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">Version Timeline</h3>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export History
              </Button>
            </div>

            {versions.length === 0 ? (
              <div className="p-8 text-center border border-gray-300 rounded-lg">
                <History className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No version history available</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-300" />

                {/* Version entries */}
                <div className="space-y-6">
                  {versions.map((version, index) => {
                    const isLatest = index === 0;
                    const isSelected = version.id === selectedVersionId;

                    return (
                      <div
                        key={version.id}
                        className={`relative pl-16 ${isSelected ? 'bg-blue-50 -mx-4 px-4 py-3 rounded-lg' : ''}`}
                      >
                        {/* Timeline dot */}
                        <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                          isLatest 
                            ? 'bg-green-500 border-green-600' 
                            : 'bg-white border-gray-300'
                        } flex items-center justify-center`}>
                          {isLatest && <Check className="h-3 w-3 text-white" />}
                        </div>

                        {/* Version content */}
                        <div className="space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getChangeTypeBadge(version.changeType)}
                                <span className="text-sm text-gray-600">
                                  Version {version.version}
                                </span>
                                {isLatest && (
                                  <Badge variant="success">Current</Badge>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-900">
                                {getVersionSummary(version)}
                              </div>
                            </div>

                            {!isLatest && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestore(version.id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore
                              </Button>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <UserIcon className="h-4 w-4" />
                              {version.changedByName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(version.timestamp).toLocaleString()}
                            </div>
                          </div>

                          {/* Changes */}
                          {version.changes.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="text-sm text-gray-700 mb-2">Changes:</div>
                              <div className="space-y-1">
                                {version.changes.map((change, idx) => (
                                  <div key={idx} className="text-sm">
                                    <span className="text-gray-700">{change.fieldLabel}:</span>{' '}
                                    {change.field === 'amount' ? (
                                      <span>
                                        <span className="text-gray-500">
                                          {formatPKR(Number(change.oldValue))}
                                        </span>
                                        {' → '}
                                        <span className="text-gray-900">
                                          {formatPKR(Number(change.newValue))}
                                        </span>
                                        {Number(change.newValue) > Number(change.oldValue) ? (
                                          <TrendingUp className="inline h-4 w-4 ml-1 text-green-600" />
                                        ) : Number(change.newValue) < Number(change.oldValue) ? (
                                          <TrendingDown className="inline h-4 w-4 ml-1 text-red-600" />
                                        ) : null}
                                      </span>
                                    ) : (
                                      <span>
                                        <span className="text-gray-500">{String(change.oldValue)}</span>
                                        {' → '}
                                        <span className="text-gray-900">{String(change.newValue)}</span>
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Snapshot summary */}
                          <div className="grid grid-cols-3 gap-3 mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                            <div>
                              <div className="text-xs text-gray-600">Amount</div>
                              <div className="text-sm text-gray-900">
                                {formatPKR(version.snapshot.amount)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Period</div>
                              <div className="text-sm text-gray-900 capitalize">
                                {version.snapshot.period}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Status</div>
                              <div className="text-sm text-gray-900">
                                {version.snapshot.isActive ? 'Active' : 'Inactive'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-300">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};