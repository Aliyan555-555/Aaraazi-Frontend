/**
 * ScheduleReportModal Component
 * 
 * Allows users to schedule automatic report generation and delivery
 * Supports daily, weekly, monthly, quarterly, and yearly frequencies
 * 
 * @version 2.0.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Mail,
  RefreshCw,
  Save,
  X,
  AlertCircle,
  FileText,
  Users,
  Globe
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import {
  ReportTemplate,
  ScheduledReport,
  ScheduleFrequency,
  ExportFormat
} from '../../types/reports';
import { toast } from 'sonner';
// [STUBBED] import { createScheduledReport, updateScheduledReport } from '../../lib/reports';
import { getCurrentUser } from '../../lib/auth';

// ===== STUBS for removed prototype functions =====
const createScheduledReport = (..._args: any[]): any => { /* stub - prototype function removed */ };
const updateScheduledReport = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface ScheduleReportModalProps {
  open: boolean;
  onClose: () => void;
  template: ReportTemplate;
  existingSchedule?: ScheduledReport;
}

export default function ScheduleReportModal({
  open,
  onClose,
  template,
  existingSchedule
}: ScheduleReportModalProps) {
  const user = getCurrentUser();

  // Form state
  const [frequency, setFrequency] = useState<ScheduleFrequency>(
    existingSchedule?.schedule.frequency || 'weekly'
  );
  const [time, setTime] = useState(existingSchedule?.schedule.time || '09:00');
  const [dayOfWeek, setDayOfWeek] = useState(
    existingSchedule?.schedule.dayOfWeek?.toString() || '1'
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    existingSchedule?.schedule.dayOfMonth?.toString() || '1'
  );

  // Distribution state
  const [emailEnabled, setEmailEnabled] = useState(
    existingSchedule?.distribution.emailEnabled ?? true
  );
  const [emailTo, setEmailTo] = useState(
    existingSchedule?.distribution.emailTo.join(', ') || user?.email || ''
  );
  const [emailCc, setEmailCc] = useState(
    existingSchedule?.distribution.emailCc?.join(', ') || ''
  );
  const [emailSubject, setEmailSubject] = useState(
    existingSchedule?.distribution.emailSubject ||
    `Scheduled Report: ${template.name}`
  );
  const [emailBody, setEmailBody] = useState(
    existingSchedule?.distribution.emailBody ||
    `Please find attached the scheduled report: ${template.name}`
  );

  // Export formats
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(
    existingSchedule?.distribution.attachmentFormats || ['pdf']
  );

  const [isSaving, setIsSaving] = useState(false);

  // Toggle export format
  const toggleFormat = (format: ExportFormat) => {
    if (selectedFormats.includes(format)) {
      setSelectedFormats(selectedFormats.filter(f => f !== format));
    } else {
      setSelectedFormats([...selectedFormats, format]);
    }
  };

  // Get next run time
  const getNextRunDescription = (): string => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    switch (frequency) {
      case 'daily':
        return `Every day at ${time}`;
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Every ${days[parseInt(dayOfWeek)]} at ${time}`;
      case 'monthly':
        return `On day ${dayOfMonth} of each month at ${time}`;
      case 'quarterly':
        return `Quarterly at ${time}`;
      case 'yearly':
        return `Yearly at ${time}`;
      default:
        return 'Not set';
    }
  };

  // Calculate next run time
  const calculateNextRun = (): string => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        const targetDay = parseInt(dayOfWeek);
        const currentDay = now.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        nextRun.setDate(nextRun.getDate() + daysToAdd);
        break;
      case 'monthly':
        nextRun.setDate(parseInt(dayOfMonth));
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
      case 'quarterly':
        // Next quarter
        const currentMonth = now.getMonth();
        const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3;
        nextRun.setMonth(nextQuarterMonth, parseInt(dayOfMonth));
        if (nextRun <= now) {
          nextRun.setMonth(nextQuarterMonth + 3);
        }
        break;
      case 'yearly':
        nextRun.setMonth(0, parseInt(dayOfMonth)); // January 1st
        if (nextRun <= now) {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }
        break;
    }

    return nextRun.toISOString();
  };

  // Handle save
  const handleSave = async () => {
    if (!user) {
      toast.error('User not authenticated. Please log in.');
      return;
    }

    // Validation
    if (emailEnabled && !emailTo.trim()) {
      toast.error('Please enter at least one email recipient');
      return;
    }

    if (selectedFormats.length === 0) {
      toast.error('Please select at least one export format');
      return;
    }

    setIsSaving(true);

    try {
      const scheduledReport: ScheduledReport = {
        id: existingSchedule?.id || `schedule-${Date.now()}`,
        templateId: template.id,
        templateName: template.name,
        schedule: {
          frequency,
          time,
          timezone: 'Asia/Karachi',
          dayOfWeek: frequency === 'weekly' ? parseInt(dayOfWeek) : undefined,
          dayOfMonth: ['monthly', 'quarterly', 'yearly'].includes(frequency)
            ? parseInt(dayOfMonth)
            : undefined,
          dateRangeMode: 'rolling',
        },
        reportConfig: template.config,
        distribution: {
          emailEnabled,
          emailTo: emailTo.split(',').map(e => e.trim()).filter(Boolean),
          emailCc: emailCc ? emailCc.split(',').map(e => e.trim()).filter(Boolean) : [],
          emailSubject,
          emailBody,
          attachmentFormats: selectedFormats,
          deliveryMethod: 'email',
        },
        isActive: true,
        nextRun: calculateNextRun(),
        runCount: existingSchedule?.runCount || 0,
        createdBy: user.id,
        createdAt: existingSchedule?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingSchedule) {
        updateScheduledReport(scheduledReport);
        toast.success('Schedule updated successfully');
      } else {
        createScheduledReport(scheduledReport);
        toast.success('Report scheduled successfully');
      }

      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingSchedule ? 'Edit Schedule' : 'Schedule Report'}
          </DialogTitle>
          <DialogDescription>
            Automatically generate and deliver "{template.name}" on a recurring schedule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Schedule Frequency */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-medium" style={{ color: 'var(--color-heading)' }}>
                Schedule Frequency
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as ScheduleFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              {frequency === 'weekly' && (
                <div>
                  <Label>Day of Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {['monthly', 'quarterly', 'yearly'].includes(frequency) && (
                <div>
                  <Label>Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                  />
                </div>
              )}

              {/* Next Run Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Next run: {getNextRunDescription()}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Timezone: Asia/Karachi (PKT)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Email Distribution */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                <h3 className="font-medium" style={{ color: 'var(--color-heading)' }}>
                  Email Distribution
                </h3>
              </div>
              <Switch
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>

            {emailEnabled && (
              <div className="space-y-4">
                <div>
                  <Label>To (comma-separated)</Label>
                  <Input
                    type="text"
                    placeholder="email1@example.com, email2@example.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                  />
                </div>

                <div>
                  <Label>CC (optional)</Label>
                  <Input
                    type="text"
                    placeholder="email@example.com"
                    value={emailCc}
                    onChange={(e) => setEmailCc(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    rows={3}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Optional message to include in the email"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Export Formats */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-medium" style={{ color: 'var(--color-heading)' }}>
                Export Formats
              </h3>
            </div>

            <div className="flex gap-2">
              {(['pdf', 'excel', 'csv'] as ExportFormat[]).map(format => (
                <button
                  key={format}
                  onClick={() => toggleFormat(format)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${selectedFormats.includes(format)
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium uppercase">{format}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Email Delivery Simulation
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  In the current version, scheduled reports will be generated automatically
                  but email delivery is simulated. Reports will be saved to your report history
                  and you'll receive in-app notifications. Full email integration requires backend
                  configuration.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {existingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}