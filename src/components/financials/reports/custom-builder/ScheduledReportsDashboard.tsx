/**
 * ScheduledReportsDashboard Component
 * 
 * Displays and manages all scheduled reports.
 * Shows schedule status, next run time, and execution history.
 * 
 * Features:
 * - View all scheduled reports
 * - Enable/disable schedules
 * - View schedule details
 * - See execution history
 * - Quick run scheduled reports
 * 
 * Design System V4.1 Compliant
 */

import React, { useState, useMemo } from 'react';
import { User } from '../../../../types';
import { CustomReportTemplate } from '../../../../types/custom-reports';
import { ScheduledReportStatus } from '../../../../types/report-history';
import { getScheduledReportStatuses, getTemplateHistory } from '../../../../lib/report-history';
import { WorkspaceHeader } from '../../../workspace/WorkspaceHeader';
import { Button } from '../../../ui/button';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  AlertCircle,
  TrendingUp,
  Activity,
  Edit2,
} from 'lucide-react';
import { Badge } from '../../../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../ui/table';
import { toast } from 'sonner';

interface ScheduledReportsDashboardProps {
  user: User;
  templates: CustomReportTemplate[];
  onRunTemplate: (template: CustomReportTemplate) => void;
  onEditTemplate: (template: CustomReportTemplate) => void;
  onUpdateTemplate: (templateId: string, updates: Partial<CustomReportTemplate>) => void;
  onClose: () => void;
}

export const ScheduledReportsDashboard: React.FC<ScheduledReportsDashboardProps> = ({
  user,
  templates,
  onRunTemplate,
  onEditTemplate,
  onUpdateTemplate,
  onClose,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Load scheduled report statuses
  const scheduledStatuses = useMemo(() => getScheduledReportStatuses(), []);

  // Get template by ID
  const getTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format frequency
  const formatFrequency = (template: CustomReportTemplate): string => {
    if (!template.config.schedule) return 'N/A';

    const { frequency, dayOfWeek, dayOfMonth, time } = template.config.schedule;

    switch (frequency) {
      case 'daily':
        return `Daily at ${time}`;

      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = days[dayOfWeek ?? 1];
        return `Weekly on ${day} at ${time}`;

      case 'monthly':
        const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
        return `Monthly on ${dayOfMonth}${suffix} at ${time}`;

      case 'quarterly':
        return `Quarterly at ${time}`;

      default:
        return 'Unknown';
    }
  };

  // Calculate success rate
  const calculateSuccessRate = (status: ScheduledReportStatus): number => {
    if (status.totalRuns === 0) return 0;
    return Math.round((status.successfulRuns / status.totalRuns) * 100);
  };

  // Toggle schedule
  const handleToggleSchedule = (template: CustomReportTemplate) => {
    if (!template.config.schedule) return;

    const newEnabled = !template.config.schedule.enabled;

    onUpdateTemplate(template.id, {
      config: {
        ...template.config,
        schedule: {
          ...template.config.schedule,
          enabled: newEnabled,
        },
      },
    });

    toast.success(
      newEnabled
        ? `Schedule enabled for "${template.name}"`
        : `Schedule paused for "${template.name}"`
    );
  };

  // Run now
  const handleRunNow = (template: CustomReportTemplate) => {
    onRunTemplate(template);
  };

  // Edit schedule
  const handleEditSchedule = (template: CustomReportTemplate) => {
    onEditTemplate(template);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkspaceHeader
        title="Scheduled Reports"
        description="Manage automated report schedules"
        stats={[
          {
            label: 'Active Schedules',
            value: scheduledStatuses.filter(s => s.isActive).length,
            variant: 'success',
          },
          {
            label: 'Paused',
            value: scheduledStatuses.filter(s => !s.isActive).length,
            variant: 'default',
          },
          {
            label: 'Total Runs',
            value: scheduledStatuses.reduce((sum, s) => sum + s.totalRuns, 0),
            variant: 'default',
          },
          {
            label: 'Success Rate',
            value: scheduledStatuses.length > 0
              ? Math.round(
                (scheduledStatuses.reduce((sum, s) => sum + s.successfulRuns, 0) /
                  scheduledStatuses.reduce((sum, s) => sum + s.totalRuns, 0)) * 100
              ) + '%'
              : 'N/A',
            variant: 'info',
          },
        ]}
      />

      {/* Scheduled Reports Table */}
      <div className="p-6">
        {scheduledStatuses.length === 0 ? (
          <div className="bg-white border border-gray-300 rounded-lg p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">No Scheduled Reports</h3>
            <p className="text-gray-600 mb-4">
              Create a report with an automated schedule to see it here.
            </p>
            <Button onClick={onClose}>
              Create Scheduled Report
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledStatuses.map(status => {
                  const template = getTemplate(status.templateId);
                  if (!template) return null;

                  const successRate = calculateSuccessRate(status);

                  return (
                    <TableRow key={status.templateId}>
                      <TableCell>
                        <div>
                          <div className="text-gray-900">{status.templateName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {template.config.dataSources.length} source{template.config.dataSources.length !== 1 ? 's' : ''} •
                            {' '}{template.config.fields.length} field{template.config.fields.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900">{formatFrequency(template)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {status.isActive ? (
                          <Badge variant="success">
                            <Activity className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Pause className="h-3 w-3 mr-1" />
                            Paused
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {status.isActive && status.nextRun ? (
                          <div className="text-sm">
                            <div className="text-gray-900">{formatDate(status.nextRun)}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {status.lastRun ? (
                          <div className="flex items-center gap-2">
                            {status.lastRunStatus === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <div className="text-sm">
                              <div className="text-gray-900">{formatDate(status.lastRun)}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Never run</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {status.totalRuns > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm text-gray-900 mb-1">
                                {successRate}% success
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${successRate >= 90 ? 'bg-green-500' :
                                      successRate >= 70 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                    }`}
                                  style={{ width: `${successRate}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {status.successfulRuns}/{status.totalRuns} runs
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No runs yet</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRunNow(template)}
                            title="Run now"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSchedule(template)}
                            title="Edit schedule"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleSchedule(template)}
                            title={status.isActive ? 'Pause schedule' : 'Resume schedule'}
                          >
                            {status.isActive ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Info Box */}
      {scheduledStatuses.length > 0 && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full flex-shrink-0">
                <span className="text-xs text-blue-600">ℹ️</span>
              </div>
              <div>
                <p className="text-blue-900 mb-1">About Scheduled Reports</p>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Scheduled reports run automatically based on their configured schedule</p>
                  <p>• All scheduled runs are saved to report history</p>
                  <p>• You can pause/resume schedules at any time without losing the configuration</p>
                  <p>• Use "Run Now" to generate a report immediately without waiting for the schedule</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
