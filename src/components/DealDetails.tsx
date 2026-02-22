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
import { TaskList } from './deals/TaskList';
import { DocumentList as DealDocumentList } from './deals/DocumentList';
import { AddDealDocumentModal } from './deals/AddDealDocumentModal';
import { NotesPanel as DealNotesPanel } from './deals/NotesPanel';
import { CommissionTab } from './deals/CommissionTab';
import { AgentRatingModal } from './sharing/AgentRatingModal';

// Tasks Module Integration
import { getTasksByEntity, updateTask } from '../lib/tasks';
import { Task } from '../types/tasks';
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
} from 'lucide-react';

// Business Logic
import { dealsService } from '@/services/deals.service';
import { getUserRoleInDeal } from '../lib/dealPermissions';
import { formatPKR } from '../lib/currency';
import { toast } from 'sonner';

// Transaction System
import { getTransactionGraph, getUnifiedTimeline } from '@/lib/transaction-graph';

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
  const [deal, setDeal] = useState<Deal>(initialDeal);
  const [dealTasks, setDealTasks] = useState<Task[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync when parent passes updated deal (e.g. after refetch)
  React.useEffect(() => {
    setDeal(initialDeal);
  }, [initialDeal]);

  // Load tasks for this deal (Tasks Module - stub)
  useMemo(() => {
    if (deal) {
      const tasks = getTasksByEntity('deal', deal.id) ?? [];
      setDealTasks(Array.isArray(tasks) ? tasks : []);
    }
  }, [deal?.id, refreshTrigger]);

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

  const timeline = useMemo(
    () => (deal?.id != null ? getUnifiedTimeline(deal.id) : []),
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

  const userRole = getUserRoleInDeal(user.id, deal);
  const isPrimary = userRole === 'primary';

  // Calculate progress
  const calculateOverallProgress = () => {
    const stages = Object.values(deal.lifecycle.timeline.stages);
    const completed = stages.filter((s) => s.status === 'completed').length;
    return (completed / stages.length) * 100;
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
      await dealsService.progressStage(deal.id, { stage: apiStage });
      toast.success(`Deal progressed to ${getStageDisplay(nextStage)}`);
      onUpdate?.();
    } catch (error) {
      console.error('Error progressing stage:', error);
      toast.error('Failed to progress stage');
    }
  };

  // Complete deal handler — uses backend API
  const handleCompleteDeal = async () => {
    const isFinalHandover = deal.lifecycle.stage === 'final-handover';
    const confirmMessage = isFinalHandover
      ? 'This will mark Final Handover as complete and close the deal. Property ownership will be transferred to the buyer. Continue?'
      : 'Are you sure you want to mark this deal as completed? This will complete all remaining stages including Final Handover.';

    if (!confirm(confirmMessage)) return;

    try {
      await dealsService.completeDeal(deal.id);
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
      await dealsService.cancelDeal(deal.id, reason.trim());
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
  const sellerName = deal.parties?.seller?.name ?? 'Seller';
  const buyerName = deal.parties?.buyer?.name ?? 'Buyer';
  const sellerContact = deal.parties?.seller?.contact ?? '';
  const buyerContact = deal.parties?.buyer?.contact ?? '';
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
          ? [{ label: 'Progress Stage', onClick: handleProgressStage }]
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
              <Button onClick={handleProgressStage} className="w-full">
                Progress to Next Stage
                <ChevronRight className="h-4 w-4 ml-2" />
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
                label: 'Progress Stage',
                icon: <ChevronRight className="h-4 w-4" />,
                onClick: handleProgressStage,
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
            onDealUpdate={(updatedDeal) => setDeal(updatedDeal)}
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
  const tasksContent = (
    <div className="space-y-6">
      {/* Quick Add Widget - Tasks Module */}
      <TaskQuickAddWidget
        user={user}
        entityType="deal"
        entityId={deal.id}
        entityName={deal.dealNumber}
        onTaskCreated={() => {
          const updatedTasks = getTasksByEntity('deal', deal.id);
          setDealTasks(updatedTasks);
          setRefreshTrigger(prev => prev + 1);
          toast.success('Task created successfully');
        }}
      />

      {/* Tasks List - Tasks Module */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base mb-4 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-gray-600" />
          Deal Tasks ({dealTasks.length})
        </h3>
        {dealTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No tasks for this deal yet</p>
            <p className="text-sm text-gray-400 mt-1">Tasks will appear here when created</p>
          </div>
        ) : (
          <TaskListView
            tasks={dealTasks}
            showSelection={false}
            onViewTask={(taskId) => {
              toast.info(`View task ${taskId}`);
              // In full app: onNavigate('task-details', taskId)
            }}
            onStatusChange={(taskId, status) => {
              updateTask(taskId, { status }, user);
              const updatedTasks = getTasksByEntity('deal', deal.id);
              setDealTasks(updatedTasks);
              setRefreshTrigger(prev => prev + 1);
              toast.success('Task status updated');
            }}
          />
        )}
      </div>

      {/* Legacy Deal Tasks Section - Keep for backwards compatibility */}
      {deal.tasks && deal.tasks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h3 className="text-base text-amber-900">
              Legacy Deal Tasks ({deal.tasks.length})
            </h3>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            These are old-style deal tasks. New tasks should be created using the widget above.
          </p>
          <TaskList deal={deal} currentUserId={user.id} />
        </div>
      )}
    </div>
  );

  // ==================== ACTIVITY TAB ====================
  const activities: Activity[] = useMemo(() => {
    return (timeline || []).map((event: { type?: string; title?: string; description?: string; date?: string }, idx: number) => ({
      id: `timeline-${idx}`,
      type: (event as any).entityType ?? event.type ?? 'activity',
      title: (event as any).event ?? event.title ?? 'Activity',
      description: event.description,
      date: event.date ?? '',
      user: undefined,
      icon: <FileText className="h-5 w-5 text-blue-600" />,
    }));
  }, [timeline]);

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
              await dealsService.createNote(deal.id, content);
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
        setDeal(updatedDeal);
      }}
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
          onSuccess={(updatedDeal) => {
            if (updatedDeal && typeof updatedDeal === 'object' && updatedDeal.parties) {
              setDeal(updatedDeal);
            }
            setShowAddInstallment(false);
            onUpdate?.();
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
          onSuccess={async () => {
            await onUpdate?.();
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
            await dealsService.createDocument(deal.id, payload);
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