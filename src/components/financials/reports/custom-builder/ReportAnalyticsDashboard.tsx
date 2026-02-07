/**
 * ReportAnalyticsDashboard Component
 * 
 * Analytics and insights about custom report usage.
 * 
 * Features:
 * - Usage statistics
 * - Performance metrics
 * - Popular reports
 * - Sharing statistics
 * - Trend analysis
 * 
 * Design System V4.1 Compliant
 */

import React, { useMemo } from 'react';
import { User } from '../../../../types';
import { CustomReportTemplate } from '../../../../types/custom-reports';
import { getReportHistory } from '../../../../lib/report-history';
import { getSharingStatistics } from '../../../../lib/report-sharing';
import { getDistributionStatistics } from '../../../../lib/report-distribution';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Star,
  Mail,
  Calendar,
  ArrowLeft,
  FileText,
} from 'lucide-react';

interface ReportAnalyticsDashboardProps {
  user: User;
  templates: CustomReportTemplate[];
  onClose: () => void;
}

export const ReportAnalyticsDashboard: React.FC<ReportAnalyticsDashboardProps> = ({
  user,
  templates,
  onClose,
}) => {
  // Calculate analytics
  const analytics = useMemo(() => {
    const history = getReportHistory();
    const sharingStats = getSharingStatistics(user.id);
    const distributionStats = getDistributionStatistics();
    
    // Overall statistics
    const totalGenerations = history.length;
    const uniqueTemplates = new Set(history.map(h => h.templateId)).size;
    
    // Time-based statistics
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const thisMonthGenerations = history.filter(h => {
      const date = new Date(h.generatedAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;
    
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const lastMonthGenerations = history.filter(h => {
      const date = new Date(h.generatedAt);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    }).length;
    
    const monthOverMonthChange = lastMonthGenerations > 0
      ? ((thisMonthGenerations - lastMonthGenerations) / lastMonthGenerations) * 100
      : 0;
    
    // Performance statistics
    const executionTimes = history
      .filter(h => h.executionTime !== undefined)
      .map(h => h.executionTime!);
    
    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;
    
    const maxExecutionTime = executionTimes.length > 0
      ? Math.max(...executionTimes)
      : 0;
    
    // Template popularity
    const templateUsage = history.reduce((acc, h) => {
      acc[h.templateId] = (acc[h.templateId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsedTemplateId = Object.entries(templateUsage)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    const mostUsedTemplate = templates.find(t => t.id === mostUsedTemplateId);
    
    // Top 5 templates by usage
    const topTemplates = Object.entries(templateUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        template: templates.find(t => t.id === id),
        count,
      }))
      .filter(item => item.template);
    
    // Generation type breakdown
    const manualGenerations = history.filter(h => h.generationType === 'manual').length;
    const scheduledGenerations = history.filter(h => h.generationType === 'scheduled').length;
    
    return {
      totalGenerations,
      uniqueTemplates,
      thisMonthGenerations,
      lastMonthGenerations,
      monthOverMonthChange,
      avgExecutionTime,
      maxExecutionTime,
      mostUsedTemplate,
      topTemplates,
      manualGenerations,
      scheduledGenerations,
      sharingStats,
      distributionStats,
    };
  }, [templates, user.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-gray-900">Report Analytics</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Usage insights and performance metrics
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-900">Total Reports</span>
              </div>
              <div className="text-2xl text-blue-900">{analytics.totalGenerations}</div>
              <div className="text-xs text-blue-700 mt-1">
                {analytics.uniqueTemplates} unique templates
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-900">This Month</span>
              </div>
              <div className="text-2xl text-green-900">{analytics.thisMonthGenerations}</div>
              <div className="text-xs text-green-700 mt-1">
                {analytics.monthOverMonthChange > 0 ? '+' : ''}
                {analytics.monthOverMonthChange.toFixed(0)}% vs last month
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-900">Avg Speed</span>
              </div>
              <div className="text-2xl text-purple-900">
                {analytics.avgExecutionTime.toFixed(0)}ms
              </div>
              <div className="text-xs text-purple-700 mt-1">
                Max: {analytics.maxExecutionTime.toFixed(0)}ms
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-900">Sharing</span>
              </div>
              <div className="text-2xl text-orange-900">
                {analytics.sharingStats.totalShares}
              </div>
              <div className="text-xs text-orange-700 mt-1">
                {analytics.sharingStats.uniqueUsersSharedWith} users
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Templates */}
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-600" />
            <h2 className="text-gray-900">Most Used Templates</h2>
          </div>

          {analytics.topTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No usage data yet
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topTemplates.map((item, index) => (
                <div
                  key={item.template?.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                      <span className="text-sm text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-gray-900">{item.template?.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.template?.config.dataSources.join(', ')}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {item.count} generation{item.count !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Breakdown */}
        <div className="grid grid-cols-2 gap-6">
          {/* Generation Types */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h2 className="text-gray-900">Generation Types</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-900">Manual</span>
                </div>
                <span className="text-gray-900">{analytics.manualGenerations}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-900">Scheduled</span>
                </div>
                <span className="text-gray-900">{analytics.scheduledGenerations}</span>
              </div>
            </div>

            {/* Percentage bars */}
            <div className="mt-4 space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{
                    width: `${(analytics.manualGenerations / (analytics.manualGenerations + analytics.scheduledGenerations)) * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  {((analytics.manualGenerations / (analytics.manualGenerations + analytics.scheduledGenerations)) * 100).toFixed(0)}% Manual
                </span>
                <span>
                  {((analytics.scheduledGenerations / (analytics.manualGenerations + analytics.scheduledGenerations)) * 100).toFixed(0)}% Scheduled
                </span>
              </div>
            </div>
          </div>

          {/* Distribution Stats */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-green-600" />
              <h2 className="text-gray-900">Distribution</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Total Distributions</span>
                <span className="text-gray-900">
                  {analytics.distributionStats.totalDistributions}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Active Schedules</span>
                <span className="text-gray-900">
                  {analytics.distributionStats.activeSchedules}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Success Rate</span>
                <Badge variant={analytics.distributionStats.successRate > 90 ? 'success' : 'default'}>
                  {analytics.distributionStats.successRate}%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Unique Recipients</span>
                <span className="text-gray-900">
                  {analytics.distributionStats.uniqueRecipients}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sharing Stats */}
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-orange-600" />
            <h2 className="text-gray-900">Collaboration</h2>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl text-gray-900">
                {analytics.sharingStats.templatesSharedByMe}
              </div>
              <div className="text-xs text-gray-600 mt-1">Templates Shared</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl text-gray-900">
                {analytics.sharingStats.usersSharedWith}
              </div>
              <div className="text-xs text-gray-600 mt-1">Users Shared With</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl text-gray-900">
                {analytics.sharingStats.templatesSharedWithMe}
              </div>
              <div className="text-xs text-gray-600 mt-1">Shared With Me</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl text-gray-900">
                {analytics.sharingStats.recentlyAccessed}
              </div>
              <div className="text-xs text-gray-600 mt-1">Recent Access (7d)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
