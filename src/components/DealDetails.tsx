import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { Deal } from '../types/deals';
import { PropertyAddressDisplay, useFormattedAddress } from './PropertyAddressDisplay';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

// DetailPageTemplate System
import {
  DetailPageTemplate,
  DetailPageTab,
  QuickActionsPanel,
  MetricCardsGroup,
  SummaryStatsPanel,
  PaymentSummaryPanel,
  ActivityTimeline,
  Activity,
  ContactCard,
  NotesPanel as LayoutNotesPanel,
  Note,
  DocumentList as LayoutDocumentList,
  Document,
} from './layout';

// Foundation Components
import { InfoPanel } from './ui/info-panel';
import { StatusTimeline } from './ui/status-timeline';
import { StatusBadge } from './layout/StatusBadge';

// Deal-Specific Components
import { DualAgentHeader } from './deals/DualAgentHeader';
import { PermissionGate } from './deals/PermissionGate';
import { DocumentList as DealDocumentList } from './deals/DocumentList';
import { AddDealDocumentModal } from './deals/AddDealDocumentModal';
import { NotesPanel as DealNotesPanel } from './deals/NotesPanel';
import { CommissionTab } from './deals/CommissionTab';
import { AgentRatingModal } from './sharing/AgentRatingModal';

// Tasks Module Integration
import { Task } from '../types/tasks';
import type { DealTask } from '../types/deals';
import { TaskQuickAddWidget } from './tasks/TaskQuickAddWidget';
import { TaskListView } from './tasks/TaskListView';

// Payment System Components
import { PaymentSummaryCard } from './deals/PaymentSummaryCard';
import { PaymentSchedule } from './deals/PaymentSchedule';
import { PaymentHistory } from './deals/PaymentHistory';
import { CreatePaymentPlanModal } from './deals/CreatePaymentPlanModal';
import { AddInstallmentModal } from './deals/AddInstallmentModal';
import { RecordPaymentModal } from './deals/RecordPaymentModal';
import { generatePaymentSchedulePDF } from '../lib/pdfExport';

// Icons
import {
  DollarSign,
  Home,
  Users,
  CheckSquare,
  FileText,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Wallet,
  User as UserIcon,
  TrendingUp,
  Phone,
  Settings,
  Plus,
  CheckCircle,
  Loader2,
} from 'lucide-react';

// Business Logic
import { useDealMutations } from '@/hooks/useDeals';
import { getUserRoleInDeal } from '../lib/dealPermissions';
import { formatPKR } from '../lib/currency';
import { toast } from 'sonner';

// Transaction System
import { getTransactionGraph } from '@/lib/transaction-graph';
import { useDealTimeline } from '@/hooks/useDealTimeline';

interface DealDetailsProps {
  deal: Deal;
  user: User;
  onBack: () => void;
  onUpdate?: () => void;
  onNavigate?: (page: string, id: string) => void;
}

export const DealDetails: React.FC<DealDetailsProps> = ({
  deal: initialDeal,
  user,
  onBack,
  onUpdate,
  onNavigate,
}) => {
  const {
    progressStage: progressStageMutation,
    progressStageLoading,
    completeDeal: completeDealMutation,
    cancelDeal: cancelDealMutation,
    createNote: createNoteMutation,
    createDocument: createDocumentMutation,
    createDealTask: createDealTaskMutation,
    updateDealTask: updateDealTaskMutation,
  } = useDealMutations();
  const [deal, setDeal] = useState<Deal | null>(initialDeal ?? null);

  // Sync when parent passes updated deal (e.g. after refetch)
  React.useEffect(() => {
    setDeal(initialDeal ?? null);
  }, [initialDeal]);

  // Convert DealTask[] to Task[] for TaskListView
  const dealTasksAsTasks = React.useMemo((): Task[] => {
    const tasks = deal?.tasks ?? [];
    const now = new Date().toISOString();
    return tasks.map((dt: DealTask) => ({
      id: dt.id,
      title: dt.title,
      description: dt.description,
      status: dt.status as Task['status'],
      priority: dt.priority as Task['priority'],
      dueDate: dt.dueDate,
      progress: dt.status === 'completed' ? 100 : 0,
      agentId: dt.assignedTo,
      assignedTo: [dt.assignedTo],
      createdBy: '',
      completed: dt.status === 'completed',
      completedAt: dt.completedAt,
      category: 'follow-up',
      hasSubtasks: false,
      isRecurring: false,
      checklist: [],
      blockedBy: [],
      blocking: [],
      watchers: [],
      comments: [],
      timeEntries: [],
      attachments: [],
      reminders: [],
      tags: [],
      isTemplate: false,
      entityType: 'deal',
      entityId: deal?.id,
      entityName: deal?.dealNumber,
      createdAt: dt.createdAt ?? now,
      updatedAt: now,
    })) as Task[];
  }, [deal?.tasks, deal?.id, deal?.dealNumber]);

  // Payment system modals
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showAddInstallment, setShowAddInstallment] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);

  // Navigation helper
  const handleNavigation = (page: string, id: string) => {
    if (onNavigate) {
      onNavigate(page, id);
    } else {
      toast.info('Navigate to ' + page);
    }
  };

  // Transaction graph (stub returns null; use deal data for display)
  const graph = useMemo(
    () => (deal?.id != null ? getTransactionGraph(deal.id, 'deal') : null),
    [deal?.id],
  );

  // Format property address for display (prefer deal.property when graph is null)
  const propertyDisplayName = useMemo(() => {
    const prop = graph?.property ?? deal?.property;
    if (!prop) return 'Property';
    if (prop.title) return prop.title;
    if (typeof prop.address === 'string') return prop.address;
    if (prop.address && typeof prop.address === 'object') {
      const addr = prop.address as Record<string, unknown>;
      const parts = [];
      if (addr.plotNumber) parts.push(`Plot ${addr.plotNumber}`);
      if (addr.areaName) parts.push(String(addr.areaName));
      if (addr.cityName && parts.length < 2) parts.push(String(addr.cityName));
      return parts.length > 0 ? parts.join(', ') : 'Property';
    }
    return 'Property';
  }, [graph?.property, deal?.property]);

  const activities = useDealTimeline(deal);

  // Guard: do not render if deal is missing (e.g. invalid update callback)
  if (!deal || !deal.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Deal data unavailable. Please refresh the page.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          Back to Deals
        </Button>
      </div>
    );
  }

  const userRole = getUserRoleInDeal(user.id, deal);
  const isPrimary = userRole === 'primary';

  // Calculate progress (prototype: completed deal = 100%)
  const calculateOverallProgress = () => {
    if (deal.lifecycle.stage === 'completed' || deal.lifecycle.status === 'completed') {
      return 100;
    }
    const stages = Object.values(deal.lifecycle.timeline.stages);
    const completed = stages.filter((s) => s.status === 'completed').length;
    return stages.length > 0 ? (completed / stages.length) * 100 : 0;
  };

  const getStageDisplay = (stage: string) => {
    return stage
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Map UI stage (kebab-case) to API stage (UPPER_SNAKE_CASE)
  const toApiStage = (uiStage: string) =>
    uiStage.replace(/-/g, '_').toUpperCase();

  // Progress stage handler — uses backend API
  const handleProgressStage = async () => {
    const stageOrder: Array<Deal['lifecycle']['stage']> = [
      'offer-accepted',
      'agreement-signing',
      'documentation',
      'payment-processing',
      'handover-prep',
      'transfer-registration',
      'final-handover',
    ];

    const currentIndex = stageOrder.indexOf(deal.lifecycle.stage);
    if (currentIndex === stageOrder.length - 1) {
      toast.info('Already at final stage');
      return;
    }

    const nextStage = stageOrder[currentIndex + 1];
    const apiStage = toApiStage(nextStage);

    try {
      await progressStageMutation(deal.id, { stage: apiStage });
      toast.success(`Deal progressed to ${getStageDisplay(nextStage)}`);
      onUpdate?.();
    } catch (error) {
      console.error('Error progressing stage:', error);
      toast.error('Failed to progress stage');
    }
  };

  const isProgressingStage = Boolean(progressStageLoading);

  // Complete deal handler — uses backend API
  const handleCompleteDeal = async () => {
    const isFinalHandover = deal.lifecycle.stage === 'final-handover';
    const confirmMessage = isFinalHandover
      ? 'This will mark Final Handover as complete and close the deal. Property ownership will be transferred to the buyer. Continue?'
      : 'Are you sure you want to mark this deal as completed? This will complete all remaining stages including Final Handover.';

    if (!confirm(confirmMessage)) return;

    try {
      await completeDealMutation(deal.id);
      toast.success('Deal completed successfully! 🎉');
      onUpdate?.();

      // If cross-agent deal, show rating modal
      if (deal.agents.secondary) {
        setShowRatingModal(true);
      }
    } catch (error) {
      console.error('Error completing deal:', error);
      toast.error('Failed to complete deal');
    }
  };

  // Cancel deal handler — uses backend API
  const handleCancelDeal = async () => {
    const reason = prompt('Enter reason for cancelling this deal:');
    if (!reason?.trim()) return;

    try {
      await cancelDealMutation(deal.id, reason.trim());
      toast.success('Deal cancelled');
      onUpdate?.();
      onBack?.();
    } catch (error) {
      console.error('Error cancelling deal:', error);
      toast.error('Failed to cancel deal');
    }
  };

  // Mark commission as received from client
  const handleMarkCommissionReceived = async () => {
    if (!deal) return;

    const confirmMessage = 'Mark commission as received from client? This will update all commission statuses to "paid" and update the financial hub.';
    if (!confirm(confirmMessage)) return;

    try {
      const now = new Date().toISOString();

      // Update commission split statuses
      const updatedCommission = {
        ...deal.financial.commission,
        split: {
          ...deal.financial.commission.split,
          primaryAgent: {
            ...deal.financial.commission.split.primaryAgent,
            status: 'paid' as const,
          },
          secondaryAgent: deal.financial.commission.split.secondaryAgent
            ? {
              ...deal.financial.commission.split.secondaryAgent,
              status: 'paid' as const,
            }
            : undefined,
        },
        receivedFromClient: true,
        receivedAt: now,
        receivedBy: user.id,
        receivedByName: user.name,
      };

      setDeal({
        ...deal,
        financial: {
          ...deal.financial,
          commission: updatedCommission,
        },
        collaboration: {
          ...deal.collaboration,
          lastUpdatedBy: {
            agentId: user.id,
            agentName: user.name,
            timestamp: now,
            action: 'commission-marked-received',
          },
        },
      });
      toast.success('Commission marked as received from client! ✅');
      onUpdate?.();
    } catch (error) {
      console.error('Error marking commission as received:', error);
      toast.error('Failed to mark commission as received');
    }
  };

  // ==================== PAGE HEADER ====================
  const sellerName = deal?.parties?.seller?.name ?? 'Seller';
  const buyerName = deal?.parties?.buyer?.name ?? 'Buyer';
  const sellerContact = deal?.parties?.seller?.contact ?? '';
  const buyerContact = deal?.parties?.buyer?.contact ?? '';
  const pageHeader = {
    title: deal.dealNumber,
    breadcrumbs: [
      { label: 'Deal Management', onClick: onBack },
      { label: deal.dealNumber },
    ],
    description: `${sellerName} → ${buyerName}`,
    metrics: [
      {
        label: 'Agreed Price',
        value: formatPKR(deal.financial.agreedPrice),
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Total Paid',
        value: formatPKR(deal.financial.totalPaid),
        icon: <Wallet className="w-4 h-4" />,
      },
      {
        label: 'Balance',
        value: formatPKR(deal.financial.balanceRemaining),
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Progress',
        value: `${Math.round(calculateOverallProgress())}%`,
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
    ],
    primaryActions:
      deal.lifecycle.status === 'active'
        ? [
          {
            label:
              deal.lifecycle.stage === 'final-handover'
                ? 'Complete Final Handover'
                : 'Complete Deal',
            onClick: handleCompleteDeal,
            variant: 'default' as const,
          },
        ]
        : [],
    secondaryActions: deal.lifecycle.status === 'active'
      ? [
        ...(deal.lifecycle.stage !== 'final-handover'
          ? [{
            label: isProgressingStage ? 'Progressing...' : 'Progress Stage',
            onClick: () => { if (!isProgressingStage) handleProgressStage(); },
            icon: isProgressingStage ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined,
          }]
          : []),
        { label: 'Cancel Deal', onClick: handleCancelDeal },
      ]
      : [],
    status: {
      label: deal.lifecycle.status,
      variant: (deal.lifecycle.status === 'active' ? 'success'
        : deal.lifecycle.status === 'completed' ? 'success'
          : deal.lifecycle.status === 'cancelled' ? 'destructive'
            : deal.lifecycle.status === 'on-hold' ? 'warning'
              : 'default') as "default" | "success" | "destructive" | "warning" | "info",
    },
    onBack,
  };

  // ==================== CONNECTED ENTITIES ====================
  const connectedEntities = [
    {
      type: 'property' as const,
      name: propertyDisplayName,
      icon: <Home className="h-3 w-3" />,
      onClick: () => graph?.property && handleNavigation('property-detail', graph.property.id),
    },
    {
      type: 'seller' as const,
      name: sellerName,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => { },
    },
    {
      type: 'buyer' as const,
      name: buyerName,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => { },
    },
    {
      type: 'agent' as const,
      name: deal.agents.primary.name,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => { },
    },
    ...(deal.agents.secondary
      ? [
        {
          type: 'agent' as const,
          name: deal.agents.secondary.name,
          icon: <UserIcon className="h-3 w-3" />,
          onClick: () => { },
        },
      ]
      : []),
  ];

  // ==================== OVERVIEW TAB - LEFT COLUMN ====================
  const overviewContent = (
    <>
      {/* Dual Agent Header */}
      <DualAgentHeader deal={deal} currentUserId={user.id} />

      {/* Overall Progress Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium">Overall Progress</h3>
              <p className="text-sm text-gray-600">
                Current Stage: {getStageDisplay(deal.lifecycle.stage)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(calculateOverallProgress())}%</div>
              <div className="text-xs text-gray-600">Complete</div>
            </div>
          </div>
          <Progress value={calculateOverallProgress()} className="h-3" />

          {/* Final Handover Notice */}
          {deal.lifecycle.status === 'active' && deal.lifecycle.stage === 'final-handover' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Final Handover Stage</p>
                  <p className="text-sm text-blue-700 mt-1">
                    All previous stages completed. Click "Complete Final Handover" button above to
                    finalize this transaction and transfer property ownership.
                  </p>
                </div>
              </div>
            </div>
          )}

          <PermissionGate
            deal={deal}
            userId={user.id}
            permission="canProgressStages"
            showMessage={false}
          >
            {deal.lifecycle.status === 'active' && deal.lifecycle.stage !== 'final-handover' && (
              <Button
                onClick={handleProgressStage}
                className="w-full"
                disabled={isProgressingStage}
                aria-busy={isProgressingStage}
              >
                {isProgressingStage ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
                ) : null}
                {isProgressingStage ? 'Progressing...' : 'Progress to Next Stage'}
                {!isProgressingStage && <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
            )}
          </PermissionGate>
        </div>
      </div>

      {/* Status Timeline */}
      <StatusTimeline
        steps={[
          {
            label: 'Offer Accepted',
            status: 'complete',
            date: deal.lifecycle.timeline.offerAcceptedDate,
            description: formatPKR(deal.financial.agreedPrice),
          },
          {
            label: 'Agreement',
            status:
              deal.lifecycle.stage === 'agreement-signing'
                ? 'current'
                : [
                  'documentation',
                  'payment-processing',
                  'handover-prep',
                  'transfer-registration',
                  'final-handover',
                ].includes(deal.lifecycle.stage)
                  ? 'complete'
                  : 'pending',
          },
          {
            label: 'Documentation',
            status:
              deal.lifecycle.stage === 'documentation'
                ? 'current'
                : [
                  'payment-processing',
                  'handover-prep',
                  'transfer-registration',
                  'final-handover',
                ].includes(deal.lifecycle.stage)
                  ? 'complete'
                  : 'pending',
          },
          {
            label: 'Payment',
            status:
              deal.lifecycle.stage === 'payment-processing'
                ? 'current'
                : ['handover-prep', 'transfer-registration', 'final-handover'].includes(
                  deal.lifecycle.stage
                )
                  ? 'complete'
                  : 'pending',
            description: `${Math.round((deal.financial.totalPaid / deal.financial.agreedPrice) * 100)}% paid`,
          },
          {
            label: 'Transfer',
            status:
              deal.lifecycle.stage === 'transfer-registration'
                ? 'current'
                : deal.lifecycle.stage === 'final-handover'
                  ? 'complete'
                  : 'pending',
          },
          {
            label: 'Handover',
            status:
              deal.lifecycle.stage === 'final-handover'
                ? 'current'
                : deal.lifecycle.status === 'completed'
                  ? 'complete'
                  : 'pending',
            date: deal.lifecycle.timeline.actualClosingDate,
          },
        ]}
      />

      {/* Deal Information */}
      <InfoPanel
        title="Deal Information"
        data={[
          {
            label: 'Deal Number',
            value: deal.dealNumber,
            icon: <FileText className="h-4 w-4" />,
          },
          {
            label: 'Status',
            value: <StatusBadge status={deal.lifecycle.status} />,
          },
          {
            label: 'Stage',
            value: getStageDisplay(deal.lifecycle.stage),
            icon: <TrendingUp className="h-4 w-4" />,
          },
          {
            label: 'Offer Accepted',
            value: new Date(deal.lifecycle.timeline.offerAcceptedDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Expected Closing',
            value: new Date(deal.lifecycle.timeline.expectedClosingDate).toLocaleDateString(
              'en-US',
              { year: 'numeric', month: 'short', day: 'numeric' }
            ),
            icon: <Calendar className="h-4 w-4" />,
          },
          ...(deal.lifecycle.timeline.actualClosingDate
            ? [
              {
                label: 'Actual Closing',
                value: new Date(deal.lifecycle.timeline.actualClosingDate).toLocaleDateString(
                  'en-US',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                ),
                icon: <CheckCircle2 className="h-4 w-4" />,
              },
            ]
            : []),
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Parties Involved */}
      <InfoPanel
        title="Parties Involved"
        data={[
          {
            label: 'Seller',
            value: sellerName,
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Seller Contact',
            value: sellerContact || 'N/A',
            icon: <Phone className="h-4 w-4" />,
            copyable: true,
          },
          {
            label: 'Seller Agent',
            value: deal.agents?.primary?.name ?? '',
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Buyer',
            value: buyerName,
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Buyer Contact',
            value: buyerContact || 'N/A',
            icon: <Phone className="h-4 w-4" />,
            copyable: true,
          },
          {
            label: 'Buyer Agent',
            value: deal.agents.secondary?.name || 'None',
            icon: <UserIcon className="h-4 w-4" />,
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Financial Details */}
      <InfoPanel
        title="Financial Details"
        data={[
          {
            label: 'Agreed Price',
            value: formatPKR(deal.financial.agreedPrice),
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Total Paid',
            value: formatPKR(deal.financial.totalPaid),
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: 'Balance Remaining',
            value: formatPKR(deal.financial.balanceRemaining),
            icon: <AlertCircle className="h-4 w-4" />,
          },
          {
            label: 'Commission Rate',
            value: `${deal.financial.commission.rate}%`,
          },
          {
            label: 'Total Commission',
            value: formatPKR(deal.financial.commission.total),
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Primary Agent Split',
            value: `${formatPKR(deal.financial.commission.split.primaryAgent.amount)} (${deal.financial.commission.split.primaryAgent.percentage
              }%)`,
          },
        ]}
        columns={2}
        density="comfortable"
      />
    </>
  );

  // ==================== OVERVIEW TAB - RIGHT COLUMN ====================
  const overviewSidebar = (
    <>
      {/* Seller Contact Card */}
      <ContactCard
        name={sellerName}
        role="seller"
        phone={sellerContact}
        notes={`Represented by ${deal.agents?.primary?.name ?? ''}`}
        tags={['Seller']}
        onCall={() => sellerContact && window.open(`tel:${sellerContact}`)}
      />

      {/* Buyer Contact Card */}
      <ContactCard
        name={buyerName}
        role="buyer"
        phone={buyerContact}
        notes={deal.agents?.secondary ? `Represented by ${deal.agents.secondary.name}` : undefined}
        tags={['Buyer']}
        onCall={() => buyerContact && window.open(`tel:${buyerContact}`)}
      />

      {/* Quick Actions */}
      <QuickActionsPanel
        title="Quick Actions"
        actions={[
          {
            label: 'View Payments',
            icon: <DollarSign className="h-4 w-4" />,
            onClick: () => toast.info('Switch to Payments tab'),
          },
          {
            label: 'View Tasks',
            icon: <CheckSquare className="h-4 w-4" />,
            onClick: () => toast.info('Switch to Tasks tab'),
          },
          ...(deal.lifecycle.status === 'active' && deal.lifecycle.stage !== 'final-handover'
            ? [
              {
                label: isProgressingStage ? 'Progressing...' : 'Progress Stage',
                icon: isProgressingStage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />,
                onClick: () => { if (!isProgressingStage) handleProgressStage(); },
              },
            ]
            : []),
          ...(deal.lifecycle.status === 'completed' &&
            (!deal.financial.commission.receivedFromClient ||
              deal.financial.commission.split.primaryAgent.status !== 'paid')
            ? [
              {
                label: 'Mark Commission as Received',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: handleMarkCommissionReceived,
                variant: 'default' as const,
              },
            ]
            : []),
          ...(graph?.property
            ? [
              {
                label: 'View Property',
                icon: <Home className="h-4 w-4" />,
                onClick: () => handleNavigation('property-detail', graph.property!.id),
              },
            ]
            : []),
        ]}
      />

      {/* Key Metrics */}
      <MetricCardsGroup
        metrics={[
          {
            label: 'Deal Value',
            value: formatPKR(deal.financial.agreedPrice),
            icon: <DollarSign className="h-5 w-5" />,
            variant: 'success',
          },
          {
            label: 'Total Commission',
            value: formatPKR(deal.financial.commission.total),
            icon: <DollarSign className="h-5 w-5" />,
            variant: 'info',
          },
          {
            label: 'Days to Close',
            value: deal.lifecycle.timeline.expectedClosingDate
              ? Math.ceil(
                (new Date(deal.lifecycle.timeline.expectedClosingDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
              ).toString()
              : 'TBD',
            icon: <Clock className="h-5 w-5" />,
            variant: 'default',
          },
        ]}
        columns={2}
      />

      {/* Quick Stats */}
      <SummaryStatsPanel
        title="Quick Stats"
        stats={[
          {
            icon: <CheckCircle2 className="h-4 w-4" />,
            label: 'Payment Progress',
            value: `${Math.round((deal.financial.totalPaid / deal.financial.agreedPrice) * 100)}%`,
            color: 'green',
          },
          {
            icon: <TrendingUp className="h-4 w-4" />,
            label: 'Overall Progress',
            value: `${Math.round(calculateOverallProgress())}%`,
            color: 'blue',
          },
          {
            icon: <AlertCircle className="h-4 w-4" />,
            label: 'Current Stage',
            value: getStageDisplay(deal.lifecycle.stage),
            color: 'yellow',
          },
        ]}
      />
    </>
  );

  // ==================== PAYMENTS TAB ====================
  const paymentsContent = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Payment Summary */}
      <div className="lg:col-span-1">
        <PaymentSummaryCard
          deal={deal}
          onCreatePlan={() => setShowCreatePlan(true)}
          onRecordAdHoc={() => {
            setSelectedInstallment(undefined);
            setShowRecordPayment(true);
          }}
          onExport={() => {
            try {
              generatePaymentSchedulePDF(deal.id);
              toast.success('Opening payment schedule PDF...');
            } catch (error: any) {
              toast.error(error.message || 'Failed to generate PDF');
            }
          }}
          isPrimaryAgent={isPrimary}
        />
      </div>

      {/* Right Column: Payment Schedule & History */}
      <div className="lg:col-span-2 space-y-6">
        {/* Payment Schedule */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-medium mb-4">Payment Schedule</h3>
          <PaymentSchedule
            deal={deal}
            currentUserId={user.id}
            currentUserName={user.name}
            onDealUpdate={(updatedDeal) => {
              if (updatedDeal && typeof updatedDeal === 'object' && updatedDeal.parties) {
                setDeal(updatedDeal);
              }
            }}
            onPaymentRecorded={async () => {
              await onUpdate?.();
            }}
            onAddInstallment={() => setShowAddInstallment(true)}
          />
        </div>

        {/* Payment History */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-medium mb-4">Payment History</h3>
          <PaymentHistory deal={deal} />
        </div>
      </div>
    </div>
  );

  // ==================== TASKS TAB ====================
  const TASK_STATUS_TO_API: Record<string, string> = {
    'not-started': 'PENDING',
    'in-progress': 'IN_PROGRESS',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
    waiting: 'IN_PROGRESS',
    overdue: 'OVERDUE',
  };
  const tasksContent = (
    <div className="space-y-6">
      {/* Quick Add Widget - Tasks Module (API-backed for deals) */}
      <TaskQuickAddWidget
        user={user}
        entityType="deal"
        entityId={deal.id}
        entityName={deal.dealNumber}
        onCreateTaskApi={async (payload) => {
          await createDealTaskMutation(deal.id, payload);
          await onUpdate?.();
        }}
      />

      {/* Tasks List - Tasks from backend */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base mb-4 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-gray-600" />
          Deal Tasks ({dealTasksAsTasks.length})
        </h3>
        {dealTasksAsTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No tasks for this deal yet</p>
            <p className="text-sm text-gray-400 mt-1">Tasks will appear here when created</p>
          </div>
        ) : (
          <TaskListView
            tasks={dealTasksAsTasks}
            showSelection={false}
            onViewTask={(taskId) => {
              toast.info(`View task ${taskId}`);
            }}
            onStatusChange={async (taskId, status) => {
              await updateDealTaskMutation(deal.id, taskId, {
                status: TASK_STATUS_TO_API[status] ?? 'PENDING',
              });
              await onUpdate?.();
              toast.success('Task status updated');
            }}
          />
        )}
      </div>
    </div>
  );

  // ==================== ACTIVITY TAB ====================
  const activityContent = (
    <>
      {/* Activity Timeline */}
      <ActivityTimeline
        title="Deal Timeline"
        activities={activities}
        emptyMessage="No activities yet"
      />

      {/* Documents */}
      <div className="mt-6">
        <DealDocumentList
          deal={deal}
          currentUserId={user.id}
          onUploadDocument={() => setShowAddDocument(true)}
          onViewDocument={(doc) => doc.url && window.open(doc.url, '_blank')}
          onDownloadDocument={(doc) => doc.url && window.open(doc.url, '_blank')}
        />
      </div>

      {/* Notes */}
      <div className="mt-6">
        <DealNotesPanel
          deal={deal}
          currentUserId={user.id}
          currentUserName={user.name}
          onAddNote={async (content, _isPrivate) => {
            try {
              await createNoteMutation(deal.id, content);
              onUpdate?.();
            } catch (e) {
              console.error('Failed to add note:', e);
              toast.error('Failed to add note');
            }
          }}
        />
      </div>
    </>
  );

  // ==================== COMMISSION TAB ====================
  const commissionContent = (
    <CommissionTab
      deal={deal}
      user={user}
      isPrimary={isPrimary}
      onUpdate={(updatedDeal) => {
        if (updatedDeal) setDeal(updatedDeal);
      }}
      onRefetch={onUpdate}
    />
  );

  // ==================== TABS CONFIGURATION ====================
  const tabs: DetailPageTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: overviewContent,
      sidebar: overviewSidebar,
      layout: '2-1',
    },
    {
      id: 'payments',
      label: 'Payments',
      content: paymentsContent,
      layout: '3-0',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      content: tasksContent,
      layout: '3-0',
    },
    {
      id: 'activity',
      label: 'Activity',
      content: activityContent,
      layout: '3-0',
    },
    {
      id: 'commission',
      label: 'Commission',
      content: commissionContent,
      layout: '3-0',
    },
  ];

  // ==================== RENDER ====================
  return (
    <>
      <DetailPageTemplate
        pageHeader={pageHeader}
        connectedEntities={connectedEntities}
        tabs={tabs}
        defaultTab="overview"
      />

      {/* Payment Modals */}
      {showCreatePlan && (
        <CreatePaymentPlanModal
          open={showCreatePlan}
          onClose={() => setShowCreatePlan(false)}
          deal={deal}
          currentUserId={user.id}
          currentUserName={user.name}
          onSuccess={async () => {
            await onUpdate?.();
            setShowCreatePlan(false);
          }}
        />
      )}

      {showAddInstallment && (
        <AddInstallmentModal
          open={showAddInstallment}
          onClose={() => setShowAddInstallment(false)}
          deal={deal}
          currentUserId={user.id}
          currentUserName={user.name}
          onSuccess={async () => {
            setShowAddInstallment(false);
            await onUpdate?.();
          }}
        />
      )}

      {showRecordPayment && (
        <RecordPaymentModal
          open={showRecordPayment}
          onClose={() => {
            setShowRecordPayment(false);
            setSelectedInstallment(null);
          }}
          deal={deal}
          currentUserId={user.id}
          currentUserName={user.name}
          selectedInstallment={selectedInstallment}
          onSuccess={() => {
            onUpdate?.();
            setShowRecordPayment(false);
            setSelectedInstallment(null);
          }}
        />
      )}

      {showAddDocument && (
        <AddDealDocumentModal
          open={showAddDocument}
          onClose={() => setShowAddDocument(false)}
          dealId={deal.id}
          onCreateDocument={async (payload) => {
            await createDocumentMutation(deal.id, payload);
            setShowAddDocument(false);
            onUpdate?.();
          }}
        />
      )}

      {/* Agent Rating Modal for Cross-Agent Deals */}
      {deal.agents.secondary && (
        <AgentRatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          targetAgentId={
            user.id === deal.agents.primary.id
              ? deal.agents.secondary.id
              : deal.agents.primary.id
          }
          targetAgentName={
            user.id === deal.agents.primary.id
              ? deal.agents.secondary.name
              : deal.agents.primary.name
          }
          fromAgentId={user.id}
          fromAgentName={user.name}
          dealId={deal.id}
        />
      )}
    </>
  );
};