/**
 * SLA Dashboard Widget
 * 
 * Comprehensive SLA monitoring dashboard showing:
 * - SLA compliance metrics
 * - Overdue leads alerts
 * - Performance trends
 * - Agent workload distribution
 */

import React, { useMemo } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  XCircle,
  Users,
  Target
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
// [STUBBED] import { 
// [STUBBED]   getSLAAlerts, 
// [STUBBED]   getSLAPerformance, 
// [STUBBED]   getAgentWorkloads,
// [STUBBED]   SLAAlert 
// [STUBBED] } from '../../lib/leadUtils';
// [STUBBED] import { getLeadById } from '../../lib/leads';
import { formatDistanceToNow } from 'date-fns';

// ===== STUBS for removed prototype functions =====
const getSLAAlerts = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getSLAPerformance = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getAgentWorkloads = (..._args: any[]): any => { /* stub - prototype function removed */ };
type SLAAlert = any;
const getLeadById = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface SLADashboardProps {
  onViewLead?: (leadId: string) => void;
  onViewAllAlerts?: () => void;
  maxAlertsToShow?: number;
}

export function SLADashboard({ 
  onViewLead,
  onViewAllAlerts,
  maxAlertsToShow = 5 
}: SLADashboardProps) {
  // Load data
  const alerts = useMemo(() => getSLAAlerts(), []);
  const performance = useMemo(() => getSLAPerformance(), []);
  const agentWorkloads = useMemo(() => getAgentWorkloads(), []);

  const topAlerts = alerts.slice(0, maxAlertsToShow);
  const hasMoreAlerts = alerts.length > maxAlertsToShow;

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="SLA Compliance"
          value={`${Math.round(performance.complianceRate)}%`}
          icon={<Target className="w-5 h-5" />}
          variant={performance.complianceRate >= 90 ? 'success' : performance.complianceRate >= 70 ? 'warning' : 'danger'}
          subtext={`${performance.slaCompliant}/${performance.totalLeads} compliant`}
        />

        <MetricCard
          label="Overdue Leads"
          value={performance.slaViolated.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={performance.slaViolated === 0 ? 'success' : 'danger'}
          subtext={performance.slaViolated === 0 ? 'All on track!' : 'Require immediate action'}
        />

        <MetricCard
          label="Avg First Contact"
          value={`${Math.round(performance.averageFirstContact)}h`}
          icon={<Clock className="w-5 h-5" />}
          variant={performance.averageFirstContact <= 2 ? 'success' : performance.averageFirstContact <= 4 ? 'warning' : 'danger'}
          subtext="Target: 2 hours"
        />

        <MetricCard
          label="Avg Conversion"
          value={`${Math.round(performance.averageConversion)}h`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant={performance.averageConversion <= 48 ? 'success' : performance.averageConversion <= 72 ? 'warning' : 'danger'}
          subtext="Target: 48 hours"
        />
      </div>

      {/* SLA Alerts */}
      {alerts.length > 0 ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              SLA Alerts ({alerts.length})
            </h3>
            {hasMoreAlerts && onViewAllAlerts && (
              <Button variant="outline" size="sm" onClick={onViewAllAlerts}>
                View All
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {topAlerts.map((alert) => (
              <SLAAlertItem 
                key={alert.leadId} 
                alert={alert} 
                onView={() => onViewLead?.(alert.leadId)}
              />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-500">No SLA violations at the moment</p>
          </div>
        </Card>
      )}

      {/* Alert Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AlertTypeCard
          type="First Contact"
          count={performance.alertsByType['first-contact-overdue']}
          icon={<Clock className="w-5 h-5" />}
          color="red"
          description="Need immediate contact"
        />

        <AlertTypeCard
          type="Qualification"
          count={performance.alertsByType['qualification-overdue']}
          icon={<Target className="w-5 h-5" />}
          color="orange"
          description="Need qualification"
        />

        <AlertTypeCard
          type="Conversion"
          count={performance.alertsByType['conversion-overdue']}
          icon={<TrendingUp className="w-5 h-5" />}
          color="yellow"
          description="Ready to convert"
        />
      </div>

      {/* Agent Workload */}
      {agentWorkloads.length > 0 && (
        <Card className="p-6">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Agent Workload
          </h3>

          <div className="space-y-4">
            {agentWorkloads.slice(0, 5).map((workload) => (
              <AgentWorkloadItem key={workload.agentId} workload={workload} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================
// METRIC CARD
// ============================================

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant: 'success' | 'warning' | 'danger' | 'info';
  subtext?: string;
}

function MetricCard({ label, value, icon, variant, subtext }: MetricCardProps) {
  const variantStyles = {
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg ${variantStyles[variant]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-gray-500 mb-1">{label}</div>
      {subtext && <div className="text-gray-400 text-sm">{subtext}</div>}
    </Card>
  );
}

// ============================================
// SLA ALERT ITEM
// ============================================

interface SLAAlertItemProps {
  alert: SLAAlert;
  onView?: () => void;
}

function SLAAlertItem({ alert, onView }: SLAAlertItemProps) {
  const lead = getLeadById(alert.leadId);
  
  const alertTypeLabels = {
    'first-contact-overdue': 'First Contact',
    'qualification-overdue': 'Qualification',
    'conversion-overdue': 'Conversion',
  };

  const alertTypeColors = {
    'first-contact-overdue': 'bg-red-100 text-red-700 border-red-200',
    'qualification-overdue': 'bg-orange-100 text-orange-700 border-orange-200',
    'conversion-overdue': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{alert.leadName}</span>
          <Badge 
            variant="outline" 
            className={alertTypeColors[alert.alertType]}
          >
            {alertTypeLabels[alert.alertType]}
          </Badge>
          {alert.priority === 'high' && (
            <Badge variant="destructive">High Priority</Badge>
          )}
        </div>
        
        <div className="text-gray-600 text-sm mb-1">
          Overdue by {Math.round(alert.hoursOverdue)} hours • Agent: {alert.agentName}
        </div>
        
        {lead && (
          <div className="text-gray-500 text-sm">
            {lead.phone} • {lead.intent.replace(/-/g, ' ')}
          </div>
        )}
      </div>

      {onView && (
        <Button variant="outline" size="sm" onClick={onView}>
          View
        </Button>
      )}
    </div>
  );
}

// ============================================
// ALERT TYPE CARD
// ============================================

interface AlertTypeCardProps {
  type: string;
  count: number;
  icon: React.ReactNode;
  color: 'red' | 'orange' | 'yellow';
  description: string;
}

function AlertTypeCard({ type, count, icon, color, description }: AlertTypeCardProps) {
  const colorStyles = {
    red: 'bg-red-50 border-red-200 text-red-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
  };

  return (
    <Card className={`p-4 ${count > 0 ? 'border-2' : ''} ${count > 0 ? colorStyles[color] : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg ${colorStyles[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="text-2xl font-bold">{count}</div>
      </div>
      <div className="font-medium mb-1">{type} Overdue</div>
      <div className="text-sm opacity-75">{description}</div>
    </Card>
  );
}

// ============================================
// AGENT WORKLOAD ITEM
// ============================================

interface AgentWorkloadItemProps {
  workload: {
    agentId: string;
    agentName: string;
    activeLeads: number;
    newLeads: number;
    qualifyingLeads: number;
    averageScore: number;
    slaCompliance: number;
  };
}

function AgentWorkloadItem({ workload }: AgentWorkloadItemProps) {
  const complianceColor = 
    workload.slaCompliance >= 90 ? 'bg-green-500' :
    workload.slaCompliance >= 70 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium text-gray-900">{workload.agentName}</div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {workload.activeLeads} active
            </span>
            <span className="text-gray-500">
              Avg: {Math.round(workload.averageScore)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Progress value={workload.slaCompliance} className="flex-1" />
          <span className="text-sm font-medium text-gray-600 w-12 text-right">
            {Math.round(workload.slaCompliance)}%
          </span>
        </div>
        
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span>{workload.newLeads} new</span>
          <span>•</span>
          <span>{workload.qualifyingLeads} qualifying</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export default SLADashboard;
