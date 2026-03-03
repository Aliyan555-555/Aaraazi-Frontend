/**
 * ScheduleConfiguratorStep Component
 * 
 * Step 6 of custom report builder - Configure automated scheduling.
 * Allows users to schedule reports to run automatically.
 * 
 * Features:
 * - Enable/disable scheduling
 * - Select frequency (daily, weekly, monthly, quarterly)
 * - Configure time and day settings
 * - View next run time
 * 
 * Design System Compliant
 */

import React, { useState, useEffect } from 'react';
import {
  ReportConfiguration,
} from '../../../../types/custom-reports';
import {
  ScheduleConfig,
  ScheduleFrequency
} from '../../../../types/reports';
import { User } from '../../../../types';
import { Button } from '../../../ui/button';
import { Label } from '../../../ui/label';
import { Input } from '../../../ui/input';
import { Checkbox } from '../../../ui/checkbox';
import {
  Clock,
  Calendar,
  AlertCircle,
  Check,
  Zap
} from 'lucide-react';

interface ScheduleConfiguratorStepProps {
  config: Partial<ReportConfiguration>;
  onChange: (updates: Partial<ReportConfiguration>) => void;
  user: User;
}

// Frequency options
const FREQUENCY_OPTIONS: Array<{
  value: ScheduleFrequency;
  label: string;
  description: string;
  icon: string;
}> = [
    {
      value: 'daily',
      label: 'Daily',
      description: 'Run every day at a specific time',
      icon: '📅',
    },
    {
      value: 'weekly',
      label: 'Weekly',
      description: 'Run once a week on a specific day',
      icon: '📆',
    },
    {
      value: 'monthly',
      label: 'Monthly',
      description: 'Run once a month on a specific date',
      icon: '🗓️',
    },
    {
      value: 'quarterly',
      label: 'Quarterly',
      description: 'Run every quarter (every 3 months)',
      icon: '📊',
    },
  ];

// Days of week
const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

// Months in quarter
const MONTHS_IN_QUARTER = [
  { value: 1, label: 'First month of quarter' },
  { value: 2, label: 'Second month of quarter' },
  { value: 3, label: 'Third month of quarter' },
];

export const ScheduleConfiguratorStep: React.FC<ScheduleConfiguratorStepProps> = ({
  config,
  onChange,
  user,
}) => {
  const [scheduleEnabled, setScheduleEnabled] = useState(!!config.schedule?.enabled);

  // Initialize schedule config
  const initializeSchedule = () => {
    const defaultSchedule: ScheduleConfig = {
      enabled: true,
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '09:00',
      timezone: 'Asia/Karachi',
      dateRangeMode: 'rolling',
    };

    onChange({ schedule: defaultSchedule });
  };

  // Toggle schedule
  const handleToggleSchedule = (enabled: boolean) => {
    setScheduleEnabled(enabled);
    if (enabled && !config.schedule) {
      initializeSchedule();
    } else if (!enabled) {
      onChange({ schedule: { ...config.schedule!, enabled: false } });
    } else {
      onChange({ schedule: { ...config.schedule!, enabled: true } });
    }
  };

  // Update schedule config
  const handleUpdateSchedule = (updates: Partial<ScheduleConfig>) => {
    if (!config.schedule) return;

    onChange({
      schedule: {
        ...config.schedule,
        ...updates,
      }
    });
  };

  // Calculate next run time
  const calculateNextRun = (): string => {
    if (!config.schedule || !config.schedule.enabled) {
      return 'Not scheduled';
    }

    const now = new Date();
    const [hours, minutes] = config.schedule.time.split(':').map(Number);

    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (config.schedule.frequency) {
      case 'daily':
        // If time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly':
        const targetDay = config.schedule.dayOfWeek ?? 1;
        const currentDay = nextRun.getDay();
        let daysUntilTarget = targetDay - currentDay;

        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7;
        }

        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        break;

      case 'monthly':
        const targetDate = config.schedule.dayOfMonth ?? 1;
        nextRun.setDate(targetDate);

        // If this month's date has passed, go to next month
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;

      case 'quarterly':
        // Set to the specified month in current quarter
        const currentMonth = nextRun.getMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
        const targetMonthInQuarter = config.schedule.monthOfQuarter ?? 1;
        const targetMonth = quarterStartMonth + (targetMonthInQuarter - 1);

        nextRun.setMonth(targetMonth);
        nextRun.setDate(config.schedule.dayOfMonth ?? 1);

        // If this quarter's date has passed, go to next quarter
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 3);
        }
        break;
    }

    return nextRun.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg text-gray-900">Automated Scheduling (Optional)</h3>
        <p className="text-gray-600">
          Schedule this report to run automatically and generate fresh data on a recurring basis.
        </p>
      </div>

      {/* Enable Schedule Toggle */}
      <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
        <div className="flex items-start gap-3">
          <Checkbox
            id="enable-schedule"
            checked={scheduleEnabled}
            onCheckedChange={handleToggleSchedule}
            className="mt-1"
          />
          <div className="flex-1">
            <Label
              htmlFor="enable-schedule"
              className="cursor-pointer text-gray-900"
            >
              Enable Automated Scheduling
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Automatically run this report on a recurring schedule
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Configuration */}
      {scheduleEnabled && config.schedule && (
        <>
          {/* Frequency Selection */}
          <div className="space-y-3">
            <Label className="text-gray-900">Run Frequency</Label>
            <div className="grid grid-cols-2 gap-3">
              {FREQUENCY_OPTIONS.map(freq => {
                const isSelected = config.schedule?.frequency === freq.value;

                return (
                  <button
                    key={freq.value}
                    onClick={() => handleUpdateSchedule({ frequency: freq.value })}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-2xl">{freq.icon}</div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className={isSelected ? 'text-blue-900' : 'text-gray-900'}>
                      {freq.label}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {freq.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency-specific settings */}
          <div className="space-y-4">
            {/* Weekly - Day of Week */}
            {config.schedule.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label className="text-gray-900">Day of Week</Label>
                <select
                  value={config.schedule.dayOfWeek ?? 1}
                  onChange={(e) => handleUpdateSchedule({ dayOfWeek: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Monthly - Day of Month */}
            {config.schedule.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label className="text-gray-900">Day of Month</Label>
                <select
                  value={config.schedule.dayOfMonth ?? 1}
                  onChange={(e) => handleUpdateSchedule({ dayOfMonth: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quarterly - Month and Day */}
            {config.schedule.frequency === 'quarterly' && (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-900">Month in Quarter</Label>
                  <select
                    value={config.schedule.monthOfQuarter ?? 1}
                    onChange={(e) => handleUpdateSchedule({ monthOfQuarter: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    {MONTHS_IN_QUARTER.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900">Day of Month</Label>
                  <select
                    value={config.schedule.dayOfMonth ?? 1}
                    onChange={(e) => handleUpdateSchedule({ dayOfMonth: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Time */}
            <div className="space-y-2">
              <Label className="text-gray-900">Time of Day</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <Input
                  type="time"
                  value={config.schedule.time}
                  onChange={(e) => handleUpdateSchedule({ time: e.target.value })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600">PKT</span>
              </div>
              <p className="text-xs text-gray-500">
                Reports will run at this time in Pakistan Standard Time (PKT)
              </p>
            </div>
          </div>

          {/* Next Run Preview */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Zap className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-green-900 mb-1">Next Scheduled Run</p>
                <p className="text-sm text-green-700">
                  {calculateNextRun()}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Information Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full flex-shrink-0">
            <span className="text-xs text-blue-600">ℹ️</span>
          </div>
          <div>
            <p className="text-blue-900 mb-1">About Scheduled Reports</p>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Scheduled reports run automatically in the background</p>
              <p>• Generated reports are saved to your report history</p>
              <p>• You can view, export, or email scheduled report results</p>
              <p>• Schedules can be paused or modified at any time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for complex reports */}
      {scheduleEnabled && config.filters && config.filters.length > 5 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-900 mb-1">Performance Notice</p>
              <p className="text-sm text-yellow-700">
                This report has multiple filters and may take longer to generate.
                Consider scheduling during off-peak hours for better performance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
