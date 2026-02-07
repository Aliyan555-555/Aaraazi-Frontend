/**
 * ScheduledReportsDashboard Component
 * 
 * Comprehensive management interface for scheduled reports
 * Shows active schedules, execution history, and management actions
 * 
 * @version 2.0.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Mail,
  Pause,
  Play,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';
import { getCurrentUser } from '../../lib/auth';
import {
  getScheduledReports,
  deleteScheduledReport,
  toggleScheduleActive,
  executeScheduledReport
} from '../../lib/reports';
import { ScheduledReport } from '../../types/reports';
import { toast } from 'sonner';
import { formatDate } from '../../lib/validation';
import ScheduleReportModal from './ScheduleReportModal';

interface ScheduledReportsDashboardProps {
  onClose: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export default function ScheduledReportsDashboard({ onClose, onNavigate }: ScheduledReportsDashboardProps) {
  const user = getCurrentUser();

  // State
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load schedules
  const schedules = useMemo(() => {
    if (!user) return [];
    return getScheduledReports(user.id);
  }, [user, refreshKey]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = schedules.filter(s => s.isActive).length;
    const paused = schedules.filter(s => !s.isActive).length;
    const totalRuns = schedules.reduce((sum, s) => sum + s.runCount, 0);

    return [
      { label: 'Active Schedules', value: active, variant: 'success' as const },
      { label: 'Paused', value: paused, variant: 'warning' as const },
      { label: 'Total Schedules', value: schedules.length, variant: 'default' as const },
      { label: 'Total Runs', value: totalRuns, variant: 'info' as const },
    ];
  }, [schedules]);

  // Handle toggle active
  const handleToggleActive = (schedule: ScheduledReport) => {
    try {
      toggleScheduleActive(schedule.id);
      toast.success(
        schedule.isActive
          ? `Schedule paused: ${schedule.templateName}`
          : `Schedule activated: ${schedule.templateName}`
      );
      setRefreshKey(k => k + 1);
    } catch (error) {
      toast.error('Failed to toggle schedule');
    }
  };

  // Handle delete
  const handleDelete = (schedule: ScheduledReport) => {
    if (!confirm(`Are you sure you want to delete the schedule for "${schedule.templateName}"?`)) {
      return;
    }

    try {
      deleteScheduledReport(schedule.id);
      toast.success('Schedule deleted successfully');
      setRefreshKey(k => k + 1);
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  // Handle edit
  const handleEdit = (schedule: ScheduledReport) => {
    setEditingSchedule(schedule);
    setScheduleModalOpen(true);
  };

  // Handle run now
  const handleRunNow = (schedule: ScheduledReport) => {
    try {
      const report = executeScheduledReport(schedule.id);
      if (report) {
        toast.success(`Report generated: ${schedule.templateName}`);
        setRefreshKey(k => k + 1);
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      toast.error('Failed to execute schedule');
    }
  };

  // Get frequency label
  const getFrequencyLabel = (schedule: ScheduledReport): string => {
    const { frequency, time, dayOfWeek, dayOfMonth } = schedule.schedule;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    switch (frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        return `Every ${days[dayOfWeek || 0]} at ${time}`;
      case 'monthly':
        return `Monthly on day ${dayOfMonth} at ${time}`;
      case 'quarterly':
        return `Quarterly at ${time}`;
      case 'yearly':
        return `Yearly at ${time}`;
      default:
        return frequency;
    }
  };

  // Get next run display
  const getNextRunDisplay = (schedule: ScheduledReport): string => {
    if (!schedule.isActive) {
      return 'Paused';
    }

    if (!schedule.nextRun) {
      return 'Not scheduled';
    }

    const nextRun = new Date(schedule.nextRun);
    const now = new Date();
    const diffMs = nextRun.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return 'Overdue';
    } else if (diffMins < 60) {
      return `In ${diffMins}m`;
    } else if (diffHours < 24) {
      return `In ${diffHours}h`;
    } else if (diffDays < 7) {
      return `In ${diffDays}d`;
    } else {
      return formatDate(schedule.nextRun);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Workspace Header */}
      <WorkspaceHeader
        title="Scheduled Reports"
        description="Manage automatic report generation and delivery"
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('dashboard') },
          { label: 'Reports', onClick: () => onNavigate('reports') },
          { label: 'Scheduled' },
        ]}
        stats={stats}
        primaryAction={{
          label: 'Create Schedule',
          icon: <Calendar />,
          onClick: () => {
            setEditingSchedule(null);
            setScheduleModalOpen(true);
          },
        }}
      />

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {schedules.length === 0 ? (
          /* Empty State */
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
              No Scheduled Reports
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Set up automatic report generation and email delivery on a recurring schedule.
            </p>
            <Button
              onClick={() => {
                setEditingSchedule(null);
                setScheduleModalOpen(true);
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Create Your First Schedule
            </Button>
          </Card>
        ) : (
          /* Schedules List */
          <div className="space-y-4">
            {schedules.map(schedule => (
              <Card key={schedule.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  {/* Schedule Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg" style={{ color: 'var(--color-heading)' }}>
                        {schedule.templateName}
                      </h3>
                      <Badge variant={schedule.isActive ? 'success' : 'secondary'}>
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {/* Frequency */}
                      <div>
                        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                          <RefreshCw className="h-4 w-4" />
                          <span>Frequency</span>
                        </div>
                        <div className="font-medium" style={{ color: 'var(--color-heading)' }}>
                          {getFrequencyLabel(schedule)}
                        </div>
                      </div>

                      {/* Next Run */}
                      <div>
                        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                          <Clock className="h-4 w-4" />
                          <span>Next Run</span>
                        </div>
                        <div className="font-medium" style={{ color: 'var(--color-heading)' }}>
                          {getNextRunDisplay(schedule)}
                        </div>
                      </div>

                      {/* Recipients */}
                      <div>
                        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                          <Mail className="h-4 w-4" />
                          <span>Recipients</span>
                        </div>
                        <div className="font-medium" style={{ color: 'var(--color-heading)' }}>
                          {schedule.distribution.emailEnabled
                            ? `${schedule.distribution.emailTo.length} recipient(s)`
                            : 'No email'}
                        </div>
                      </div>

                      {/* Run Count */}
                      <div>
                        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                          <CheckCircle className="h-4 w-4" />
                          <span>Runs</span>
                        </div>
                        <div className="font-medium" style={{ color: 'var(--color-heading)' }}>
                          {schedule.runCount} time(s)
                        </div>
                      </div>
                    </div>

                    {/* Last Run */}
                    {schedule.lastRun && (
                      <div className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Last run: {formatDate(schedule.lastRun)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Toggle Active/Pause */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(schedule)}
                    >
                      {schedule.isActive ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>

                    {/* More Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRunNow(schedule)}>
                          <Play className="h-4 w-4 mr-2" />
                          Run Now
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(schedule)}>
                          <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                          <span className="text-red-600">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModalOpen && editingSchedule && (
        <ScheduleReportModal
          open={scheduleModalOpen}
          template={editingSchedule.reportConfig as any}
          existingSchedule={editingSchedule}
          onClose={() => {
            setScheduleModalOpen(false);
            setEditingSchedule(null);
            setRefreshKey(k => k + 1);
          }}
        />
      )}
    </div>
  );
}