/**
 * Lead Management Dashboard Widget
 * 
 * Comprehensive dashboard widget for the main agency dashboard
 * Shows key lead metrics, SLA alerts, and quick actions
 * 
 * Design System V4.1 Compliant
 * Accessibility: WCAG 2.1 AA
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { 
  UserPlus, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  ArrowRight,
  Users,
  Target,
  Activity,
  Award,
  Phone,
  Calendar,
  Zap
} from 'lucide-react';
import { getLeads, getLeadsByStatus } from '../../lib/leads';
import { 
  getSLAPerformance, 
  getSLAAlerts, 
  getLeadsByPriority,
  filterLeads 
} from '../../lib/leadUtils';
import type { Lead, LeadStatus } from '../../types/leads';

interface LeadsDashboardWidgetProps {
  user: {
    id: string;
    name: string;
    role: 'admin' | 'agent' | 'superadmin';
  };
  onNavigate: (view: string, id?: string) => void;
  variant?: 'compact' | 'full';
}

export function LeadsDashboardWidget({ 
  user, 
  onNavigate,
  variant = 'full' 
}: LeadsDashboardWidgetProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Load leads data
  useEffect(() => {
    try {
      const allLeads = getLeads(user.id, user.role);
      setLeads(allLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id, user.role]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeLeads = leads.filter(l => 
      ['new', 'qualifying', 'qualified'].includes(l.status)
    );
    
    const requiresAction = filterLeads({
      status: ['new', 'qualifying'],
      slaCompliant: false
    }).length;
    
    const newLeads = leads.filter(l => l.status === 'new').length;
    const qualifyingLeads = leads.filter(l => l.status === 'qualifying').length;
    const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
    
    const highPriority = getLeadsByPriority('high').length;
    
    const slaPerformance = getSLAPerformance();
    const slaAlerts = getSLAAlerts();
    
    // Conversion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLeads = leads.filter(l => 
      new Date(l.createdAt) >= thirtyDaysAgo
    );
    
    const recentConversions = recentLeads.filter(l => l.status === 'converted');
    const conversionRate = recentLeads.length > 0 
      ? (recentConversions.length / recentLeads.length) * 100 
      : 0;
    
    // Average score
    const scoresSum = activeLeads.reduce((sum, l) => sum + l.qualificationScore, 0);
    const avgScore = activeLeads.length > 0 ? scoresSum / activeLeads.length : 0;
    
    return {
      total: leads.length,
      active: activeLeads.length,
      requiresAction,
      new: newLeads,
      qualifying: qualifyingLeads,
      qualified: qualifiedLeads,
      highPriority,
      slaCompliance: slaPerformance.complianceRate,
      slaAlerts: slaAlerts.length,
      overdueLeads: slaAlerts.filter(a => a.isOverdue).length,
      conversionRate,
      avgScore,
      recentConversions: recentConversions.length,
    };
  }, [leads]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Lead Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Activity className="h-5 w-5 animate-spin mr-2" />
            Loading lead data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return <CompactWidget metrics={metrics} onNavigate={onNavigate} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Lead Management
            </CardTitle>
            <CardDescription className="mt-1">
              Track and convert new opportunities
            </CardDescription>
          </div>
          <Button 
            onClick={() => onNavigate('leads')}
            variant="outline"
            size="sm"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alert Banner - SLA Issues */}
        {metrics.requiresAction > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  {metrics.requiresAction} {metrics.requiresAction === 1 ? 'lead requires' : 'leads require'} immediate attention
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.overdueLeads} {metrics.overdueLeads === 1 ? 'is' : 'are'} overdue on SLA targets
                </p>
              </div>
              <Button 
                onClick={() => onNavigate('leads', 'requires-action')}
                size="sm"
                variant="destructive"
              >
                Take Action
              </Button>
            </div>
          </div>
        )}

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Active Leads */}
          <MetricCard
            icon={<Users className="h-4 w-4" />}
            label="Active Leads"
            value={metrics.active}
            trend={metrics.active > 0 ? 'positive' : 'neutral'}
            onClick={() => onNavigate('leads', 'active')}
          />

          {/* High Priority */}
          <MetricCard
            icon={<Target className="h-4 w-4" />}
            label="High Priority"
            value={metrics.highPriority}
            trend={metrics.highPriority > 0 ? 'warning' : 'neutral'}
            onClick={() => onNavigate('leads', 'high-priority')}
          />

          {/* Conversion Rate */}
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Conversion Rate"
            value={`${metrics.conversionRate.toFixed(0)}%`}
            trend={metrics.conversionRate >= 50 ? 'positive' : metrics.conversionRate >= 30 ? 'neutral' : 'negative'}
          />

          {/* SLA Compliance */}
          <MetricCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="SLA Compliance"
            value={`${metrics.slaCompliance.toFixed(0)}%`}
            trend={metrics.slaCompliance >= 90 ? 'positive' : metrics.slaCompliance >= 70 ? 'neutral' : 'negative'}
          />
        </div>

        <Separator />

        {/* Pipeline Overview */}
        <div>
          <h4 className="text-sm font-medium mb-4">Lead Pipeline</h4>
          <div className="space-y-3">
            <PipelineStage
              label="New Leads"
              count={metrics.new}
              total={metrics.active}
              color="blue"
              icon={<Zap className="h-4 w-4" />}
              onClick={() => onNavigate('leads', 'new')}
            />
            <PipelineStage
              label="Qualifying"
              count={metrics.qualifying}
              total={metrics.active}
              color="yellow"
              icon={<Phone className="h-4 w-4" />}
              onClick={() => onNavigate('leads', 'qualifying')}
            />
            <PipelineStage
              label="Qualified"
              count={metrics.qualified}
              total={metrics.active}
              color="green"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => onNavigate('leads', 'qualified')}
            />
          </div>
        </div>

        <Separator />

        {/* Performance Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg. Quality Score</span>
              <span className="text-sm font-medium">
                {metrics.avgScore.toFixed(0)}/100
              </span>
            </div>
            <Progress value={metrics.avgScore} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">SLA Performance</span>
              <span className="text-sm font-medium">
                {metrics.slaCompliance.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={metrics.slaCompliance} 
              className="h-2"
              // @ts-ignore - custom color based on performance
              indicatorClassName={
                metrics.slaCompliance >= 90 ? 'bg-green-500' :
                metrics.slaCompliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onNavigate('leads', 'create')}
            size="sm"
            className="flex-1"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
          <Button 
            onClick={() => onNavigate('leads')}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Activity className="h-4 w-4 mr-2" />
            View Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: 'positive' | 'negative' | 'warning' | 'neutral';
  onClick?: () => void;
}

function MetricCard({ icon, label, value, trend, onClick }: MetricCardProps) {
  const trendColors = {
    positive: 'text-green-600 bg-green-50 border-green-200',
    negative: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    neutral: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        text-left p-3 rounded-lg border transition-all
        ${onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
        ${trendColors[trend]}
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </button>
  );
}

interface PipelineStageProps {
  label: string;
  count: number;
  total: number;
  color: 'blue' | 'yellow' | 'green';
  icon: React.ReactNode;
  onClick?: () => void;
}

function PipelineStage({ label, count, total, color, icon, onClick }: PipelineStageProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        w-full text-left p-3 rounded-lg border bg-white
        ${onClick ? 'hover:shadow-md hover:border-primary/50 transition-all cursor-pointer' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-lg font-bold">{count}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClasses[color]} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground mt-1 block">
        {percentage.toFixed(0)}% of pipeline
      </span>
    </button>
  );
}

// ============================================
// COMPACT VARIANT
// ============================================

interface CompactWidgetProps {
  metrics: any;
  onNavigate: (view: string, id?: string) => void;
}

function CompactWidget({ metrics, onNavigate }: CompactWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Leads
          </CardTitle>
          <Button 
            onClick={() => onNavigate('leads')}
            variant="ghost"
            size="sm"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Alert */}
        {metrics.requiresAction > 0 && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium text-destructive">
              {metrics.requiresAction} require action
            </span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-muted rounded">
            <div className="text-xs text-muted-foreground">Active</div>
            <div className="text-lg font-bold">{metrics.active}</div>
          </div>
          <div className="p-2 bg-muted rounded">
            <div className="text-xs text-muted-foreground">Conversion</div>
            <div className="text-lg font-bold">{metrics.conversionRate.toFixed(0)}%</div>
          </div>
        </div>

        {/* Pipeline Breakdown */}
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="bg-blue-50">
            {metrics.new} New
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            {metrics.qualifying} Qualifying
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {metrics.qualified} Qualified
          </Badge>
        </div>

        {/* Quick Action */}
        <Button 
          onClick={() => onNavigate('leads', 'create')}
          size="sm"
          className="w-full"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </CardContent>
    </Card>
  );
}