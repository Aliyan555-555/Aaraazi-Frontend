/**
 * Lead Details * 
 * Individual lead detail page with:
 * - Lead information and qualification data
 * - Interaction timeline
 * - Qualification scoring breakdown
 * - SLA tracking
 * - Quick actions (qualify, convert, mark lost)
 */

import React, { useState, useMemo } from 'react';
import {
  Phone,
  Mail,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Edit,
  MessageSquare,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { ConnectedEntitiesBar } from '../layout/ConnectedEntitiesBar';
import { StatusBadge } from '../layout/StatusBadge';
import { MetricCard } from '../layout/MetricCard';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Lead, LeadInteraction } from '../../types/leads';
import { getLeadById, updateLead } from '../../lib/leads';
import { getLeadSLAStatus } from '../../lib/leadUtils';
import { previewLeadConversion } from '../../lib/leadConversion';
import { getTasksByEntity, updateTask, Task } from '../../lib/tasks';
import { TaskQuickAddWidget } from '../tasks/TaskQuickAddWidget';
import { TaskListView } from '../tasks/TaskListView';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-toastify';

interface LeadDetailsProps {
  leadId: string;
  user: {
    id: string;
    name: string;
    role: 'admin' | 'agent';
  };
  onNavigate: (view: string, id?: string) => void;
  onBack: () => void;
  onQualify: (leadId: string) => void;
  onConvert: (leadId: string) => void;
  onAddInteraction: (leadId: string) => void;
  onMarkLost: (leadId: string) => void;
  onEdit: (leadId: string) => void;
}

export function LeadDetails({
  leadId,
  user,
  onNavigate,
  onBack,
  onQualify,
  onConvert,
  onAddInteraction,
  onMarkLost,
  onEdit,
}: LeadDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [leadTasks, setLeadTasks] = useState<Task[]>([]);

  // Load lead
  const lead = useMemo(() => getLeadById(leadId), [leadId]);

  // Load tasks for this lead
  useMemo(() => {
    const tasks = getTasksByEntity('lead', leadId);
    setLeadTasks(tasks);
  }, [leadId]);

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-gray-900 mb-2">Lead not found</h2>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  // SLA status
  const slaStatus = useMemo(() => getLeadSLAStatus(lead), [lead]);

  // Conversion preview
  const conversionPreview = useMemo(() => previewLeadConversion(leadId), [leadId]);

  // Age
  const leadAge = useMemo(() => {
    const created = new Date(lead.createdAt);
    const now = new Date();
    const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    if (hours < 24) {
      return `${Math.round(hours)} hours old`;
    } else {
      return formatDistanceToNow(created, { addSuffix: true });
    }
  }, [lead.createdAt]);

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Leads', onClick: () => onNavigate('leads') },
    { label: lead.name },
  ];

  // Metrics
  const metrics = [
    {
      label: 'Qualification Score',
      value: `${lead.qualificationScore}/100`,
      icon: <TrendingUp className="w-4 h-4" />,
      variant: lead.qualificationScore >= 70 ? 'success' :
        lead.qualificationScore >= 40 ? 'warning' : 'danger',
    },
    {
      label: 'Priority',
      value: lead.priority.toUpperCase(),
      variant: lead.priority === 'high' ? 'danger' :
        lead.priority === 'medium' ? 'warning' : 'info',
    },
    {
      label: 'Status',
      value: lead.status.charAt(0).toUpperCase() + lead.status.slice(1),
      variant: lead.status === 'converted' ? 'success' :
        lead.status === 'lost' ? 'danger' : 'info',
    },
    {
      label: 'Lead Age',
      value: leadAge,
      icon: <Clock className="w-4 h-4" />,
      variant: 'info',
    },
  ];

  // Primary actions
  const primaryActions = [];

  if (lead.status === 'new' || lead.status === 'qualifying') {
    primaryActions.push({
      label: 'Qualify Lead',
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: () => onQualify(leadId),
    });
  }

  if (lead.status === 'qualified') {
    primaryActions.push({
      label: 'Convert Lead',
      icon: <UserPlus className="w-4 h-4" />,
      onClick: () => onConvert(leadId),
    });
  }

  // Secondary actions
  const secondaryActions: any[] = [
    {
      label: 'Add Interaction',
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: () => onAddInteraction(leadId),
    },
    {
      label: 'Edit Lead',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => onEdit(leadId),
    },
  ];

  if (lead.status !== 'lost' && lead.status !== 'converted') {
    secondaryActions.push({
      label: 'Mark as Lost',
      icon: <XCircle className="w-4 h-4" />,
      onClick: () => onMarkLost(leadId),
      variant: 'destructive',
    });
  }

  // Connected entities (if converted)
  const connectedEntities = [];

  if (lead.routedTo) {
    if (lead.routedTo.contactId) {
      connectedEntities.push({
        type: 'contact' as const,
        id: lead.routedTo.contactId,
        name: lead.name,
        onClick: () => onNavigate('contact-details', lead.routedTo!.contactId),
      });
    }

    if (lead.routedTo.buyerRequirementId) {
      connectedEntities.push({
        type: 'requirement' as const,
        id: lead.routedTo.buyerRequirementId,
        name: 'Buyer Requirement',
        onClick: () => onNavigate('requirement-details', lead.routedTo!.buyerRequirementId),
      });
    }

    if (lead.routedTo.rentRequirementId) {
      connectedEntities.push({
        type: 'requirement' as const,
        id: lead.routedTo.rentRequirementId,
        name: 'Rent Requirement',
        onClick: () => onNavigate('requirement-details', lead.routedTo!.rentRequirementId),
      });
    }

    if (lead.routedTo.propertyId) {
      connectedEntities.push({
        type: 'property' as const,
        id: lead.routedTo.propertyId,
        name: 'Property Listing',
        onClick: () => onNavigate('property-details', lead.routedTo!.propertyId),
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PageHeader
        title={lead.name}
        breadcrumbs={breadcrumbs}
        metrics={metrics}
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
        onBack={onBack}
      />

      {/* SLA Warning */}
      {!slaStatus.slaCompliant && lead.status !== 'converted' && lead.status !== 'archived' && slaStatus.isOverdue && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">SLA Overdue</h4>
              <p className="text-red-700 mt-1">
                {slaStatus.overdueType && `${slaStatus.overdueType.replace(/-/g, ' ')} is `}
                {Math.round(slaStatus.hoursOverdue)} hours overdue
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connected Entities */}
      {connectedEntities.length > 0 && (
        <ConnectedEntitiesBar entities={connectedEntities} />
      )}

      {/* Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="qualification">Qualification</TabsTrigger>
            <TabsTrigger value="interactions">
              Interactions ({lead.interactions.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks ({leadTasks.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contact Information */}
              <div className="lg:col-span-2 space-y-6">
                <LeadContactInfo lead={lead} />
                <LeadSourceInfo lead={lead} />
                <LeadIntentInfo lead={lead} />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <LeadScoreCard lead={lead} />
                <LeadSLACard lead={lead} slaStatus={slaStatus} />
                <LeadAssignmentCard lead={lead} />
              </div>
            </div>
          </TabsContent>

          {/* Qualification Tab */}
          <TabsContent value="qualification" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <QualificationScoreBreakdown lead={lead} />
              </div>
              <div>
                <QualificationDetails lead={lead} />
              </div>
            </div>
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions" className="mt-6">
            <InteractionsList
              interactions={lead.interactions}
              onAddInteraction={() => onAddInteraction(leadId)}
            />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <TaskQuickAddWidget
              user={user as any}
              entityType="lead"
              entityId={leadId}
              entityName={lead.name}
              onTaskCreated={(task: Task) => {
                setLeadTasks([...leadTasks, task]);
              }}
            />
            <TaskListView
              tasks={leadTasks}
              showSelection={false}
              onViewTask={(taskId) => {
                toast.info(`View task ${taskId}`);
                // In full app: onNavigate('task-details', taskId)
              }}
              onEditTask={(taskId) => {
                toast.info(`Edit task ${taskId}`);
                // Simplified for now
              }}
              onDeleteTask={(taskId) => {
                const updatedTasks = leadTasks.filter((t) => t.id !== taskId);
                setLeadTasks(updatedTasks);
                toast.success('Task deleted');
              }}
              onStatusChange={(taskId, status) => {
                const task = leadTasks.find(t => t.id === taskId);
                if (task) {
                  updateTask(taskId, { status }, user as any);
                  const updatedTasks = getTasksByEntity('lead', leadId);
                  setLeadTasks(updatedTasks);
                  toast.success('Task status updated');
                }
              }}
            />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-6">
            <LeadTimeline lead={lead} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================
// CONTACT INFO
// ============================================

function LeadContactInfo({ lead }: { lead: Lead }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-900">{lead.phone}</span>
              {lead.phoneVerified && (
                <Badge variant="success" className="text-xs">Verified</Badge>
              )}
            </div>
            {lead.alternatePhone && (
              <span className="text-gray-500 block mt-1">{lead.alternatePhone}</span>
            )}
          </div>
        </div>

        {lead.email && (
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{lead.email}</span>
                {lead.emailVerified && (
                  <Badge variant="success" className="text-xs">Verified</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {lead.initialMessage && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Initial Message</h4>
          <p className="text-gray-600 whitespace-pre-wrap">{lead.initialMessage}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// SOURCE INFO
// ============================================

function LeadSourceInfo({ lead }: { lead: Lead }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Source & Attribution</h3>

      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-gray-500">Source</dt>
          <dd className="text-gray-900 capitalize">{lead.source.replace(/-/g, ' ')}</dd>
        </div>

        {lead.sourceDetails && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Details</dt>
            <dd className="text-gray-900">{lead.sourceDetails}</dd>
          </div>
        )}

        {lead.campaign && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Campaign</dt>
            <dd className="text-gray-900">{lead.campaign}</dd>
          </div>
        )}

        {lead.referredBy && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Referred By</dt>
            <dd className="text-gray-900">{lead.referredBy}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// ============================================
// INTENT INFO
// ============================================

function LeadIntentInfo({ lead }: { lead: Lead }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Intent & Timeline</h3>

      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-gray-500">Intent</dt>
          <dd>
            <Badge variant="outline" className="capitalize">
              {lead.intent.replace(/-/g, ' ')}
            </Badge>
          </dd>
        </div>

        <div className="flex justify-between">
          <dt className="text-gray-500">Timeline</dt>
          <dd>
            <Badge variant="outline" className="capitalize">
              {lead.timeline.replace(/-/g, ' ')}
            </Badge>
          </dd>
        </div>
      </dl>

      {lead.details && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3">Details</h4>
          <dl className="space-y-2 text-sm">
            {lead.details.budgetMin && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Min Budget</dt>
                <dd className="text-gray-900">PKR {lead.details.budgetMin.toLocaleString()}</dd>
              </div>
            )}
            {lead.details.budgetMax && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Max Budget</dt>
                <dd className="text-gray-900">PKR {lead.details.budgetMax.toLocaleString()}</dd>
              </div>
            )}
            {lead.details.preferredAreas && lead.details.preferredAreas.length > 0 && (
              <div>
                <dt className="text-gray-500 mb-1">Preferred Areas</dt>
                <dd className="flex flex-wrap gap-1">
                  {lead.details.preferredAreas.map((area, i) => (
                    <Badge key={i} variant="outline">{area}</Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {lead.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
          <p className="text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// SCORE CARD
// ============================================

function LeadScoreCard({ lead }: { lead: Lead }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Qualification Score</h3>

      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-gray-900 mb-1">
          {lead.qualificationScore}
        </div>
        <div className="text-gray-500">out of 100</div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all ${lead.qualificationScore >= 70
            ? 'bg-green-500'
            : lead.qualificationScore >= 40
              ? 'bg-yellow-500'
              : 'bg-red-500'
            }`}
          style={{ width: `${lead.qualificationScore}%` }}
        />
      </div>

      <div className="text-center">
        <Badge
          variant={
            lead.qualificationScore >= 70
              ? 'success'
              : lead.qualificationScore >= 40
                ? 'warning'
                : 'destructive'
          }
        >
          {lead.qualificationScore >= 70
            ? 'High Quality Lead'
            : lead.qualificationScore >= 40
              ? 'Medium Quality Lead'
              : 'Low Quality Lead'}
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// SLA CARD
// ============================================

function LeadSLACard({ lead, slaStatus }: { lead: Lead; slaStatus: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">SLA Tracking</h3>

      <div className="space-y-3">
        <SLACheckpoint
          label="First Contact"
          completed={!!lead.sla.firstContactAt}
          timestamp={lead.sla.firstContactAt}
          target="2 hours"
        />

        <SLACheckpoint
          label="Qualification"
          completed={!!lead.sla.qualifiedAt}
          timestamp={lead.sla.qualifiedAt}
          target="24 hours"
        />

        <SLACheckpoint
          label="Conversion"
          completed={!!lead.sla.convertedAt}
          timestamp={lead.sla.convertedAt}
          target="48 hours"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        {slaStatus.slaCompliant ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            SLA Compliant
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            {Math.round(slaStatus.hoursOverdue || 0)}h Overdue
          </Badge>
        )}
      </div>
    </div>
  );
}

function SLACheckpoint({
  label,
  completed,
  timestamp,
  target
}: {
  label: string;
  completed: boolean;
  timestamp?: string;
  target: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {completed ? (
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
      ) : (
        <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900">{label}</div>
        {completed && timestamp ? (
          <div className="text-gray-500">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </div>
        ) : (
          <div className="text-gray-400">Target: {target}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ASSIGNMENT CARD
// ============================================

function LeadAssignmentCard({ lead }: { lead: Lead }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Assignment</h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Agent</span>
          <span className="text-gray-900 font-medium">{lead.agentName}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Created</span>
          <span className="text-gray-900">
            {format(new Date(lead.createdAt), 'MMM d, yyyy')}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Updated</span>
          <span className="text-gray-900">
            {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// QUALIFICATION BREAKDOWN
// ============================================

function QualificationScoreBreakdown({ lead }: { lead: Lead }) {
  const factors = [
    {
      label: 'Contact Quality',
      score: lead.scoreBreakdown.contactQuality,
      max: 20,
      description: 'Phone & email verification status',
    },
    {
      label: 'Intent Clarity',
      score: lead.scoreBreakdown.intentClarity,
      max: 20,
      description: 'How clear and specific the intent is',
    },
    {
      label: 'Budget Realism',
      score: lead.scoreBreakdown.budgetRealism,
      max: 20,
      description: 'Budget information completeness',
    },
    {
      label: 'Timeline Urgency',
      score: lead.scoreBreakdown.timelineUrgency,
      max: 20,
      description: 'How immediate the timeline is',
    },
    {
      label: 'Source Quality',
      score: lead.scoreBreakdown.sourceQuality,
      max: 20,
      description: 'Reliability of the lead source',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-6">Score Breakdown</h3>

      <div className="space-y-6">
        {factors.map((factor) => (
          <div key={factor.label}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium text-gray-900">{factor.label}</div>
                <div className="text-gray-500">{factor.description}</div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {factor.score}/{factor.max}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${factor.score >= factor.max * 0.7
                  ? 'bg-green-500'
                  : factor.score >= factor.max * 0.4
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                  }`}
                style={{ width: `${(factor.score / factor.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// QUALIFICATION DETAILS
// ============================================

function QualificationDetails({ lead }: { lead: Lead }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Qualification Checklist</h3>

      <div className="space-y-3">
        <ChecklistItem
          label="Phone Verified"
          completed={lead.phoneVerified}
        />
        <ChecklistItem
          label="Email Verified"
          completed={lead.emailVerified}
        />
        <ChecklistItem
          label="Intent Identified"
          completed={lead.intent !== 'unknown'}
        />
        <ChecklistItem
          label="Timeline Set"
          completed={lead.timeline !== 'unknown'}
        />
        <ChecklistItem
          label="Budget Discussed"
          completed={!!(lead.details?.budgetMin || lead.details?.budgetMax || lead.details?.monthlyBudget)}
        />
        <ChecklistItem
          label="First Contact Made"
          completed={!!lead.sla.firstContactAt}
        />
      </div>
    </div>
  );
}

function ChecklistItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {completed ? (
        <CheckCircle2 className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-gray-300" />
      )}
      <span className={completed ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
    </div>
  );
}

// ============================================
// INTERACTIONS LIST
// ============================================

function InteractionsList({
  interactions,
  onAddInteraction
}: {
  interactions: LeadInteraction[];
  onAddInteraction: () => void;
}) {
  if (interactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-gray-900 mb-2">No interactions yet</h3>
        <p className="text-gray-500 mb-4">
          Start logging interactions with this lead
        </p>
        <Button onClick={onAddInteraction}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Add First Interaction
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAddInteraction}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Add Interaction
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {interactions.map((interaction, index) => (
          <InteractionItem
            key={interaction.id}
            interaction={interaction}
            isLast={index === interactions.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function InteractionItem({
  interaction,
  isLast
}: {
  interaction: LeadInteraction;
  isLast: boolean;
}) {
  return (
    <div className={`p-4 ${!isLast ? 'border-b border-gray-200' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="capitalize">
              {interaction.type.replace(/-/g, ' ')}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {interaction.direction}
            </Badge>
            <span className="text-gray-400">
              {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
            </span>
          </div>

          <div className="font-medium text-gray-900 mb-1">{interaction.summary}</div>

          {interaction.notes && (
            <p className="text-gray-600 whitespace-pre-wrap">{interaction.notes}</p>
          )}

          <div className="text-gray-500 mt-2">by {interaction.agentName}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TIMELINE
// ============================================

function LeadTimeline({ lead }: { lead: Lead }) {
  const events = [];

  // Created
  events.push({
    timestamp: lead.createdAt,
    label: 'Lead Created',
    description: `Created by ${lead.createdBy}`,
    icon: <UserPlus className="w-4 h-4" />,
  });

  // First contact
  if (lead.sla.firstContactAt) {
    events.push({
      timestamp: lead.sla.firstContactAt,
      label: 'First Contact',
      description: 'Initial contact made',
      icon: <Phone className="w-4 h-4" />,
    });
  }

  // Qualified
  if (lead.sla.qualifiedAt) {
    events.push({
      timestamp: lead.sla.qualifiedAt,
      label: 'Qualified',
      description: 'Lead marked as qualified',
      icon: <CheckCircle2 className="w-4 h-4" />,
    });
  }

  // Converted
  if (lead.sla.convertedAt) {
    events.push({
      timestamp: lead.sla.convertedAt,
      label: 'Converted',
      description: 'Lead successfully converted',
      icon: <TrendingUp className="w-4 h-4" />,
    });
  }

  // Sort by timestamp
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-6">Timeline</h3>

      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                {event.icon}
              </div>
              {index < events.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 my-2" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="font-medium text-gray-900">{event.label}</div>
              <div className="text-gray-500">{event.description}</div>
              <div className="text-gray-400 mt-1">
                {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}