/**
 * ContactDetails — Slim orchestrator for the contact detail page.
 *
 * All data-fetching, derived state, and action handlers live in `useContactDetail`.
 * Tab UI components live in `./detail/tabs/`.
 * Dialog UI components live in `./detail/dialogs/`.
 * Shared utilities live in `@/lib/contacts.utils`.
 * URL tab persistence lives in `@/hooks/useContactTabUrl`.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Bell, BellOff, Edit, Trash2, Phone, Mail, MessageSquare, Archive, CheckCircle2 } from 'lucide-react';

import { DetailPageTemplate } from '../layout/DetailPageTemplate';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ContactFormModal } from '../ContactFormModal';
import { InteractionForm } from './InteractionForm';
import { TaskForm } from './TaskForm';
import { InvestorPortfolioDashboard } from '../investor-portfolio/InvestorPortfolioDashboard';

import { useContactDetail } from '@/hooks/useContactDetail';
import { useContactTabUrl } from '@/hooks/useContactTabUrl';

import { OverviewTab } from './detail/tabs/OverviewTab';
import { PropertiesTab } from './detail/tabs/PropertiesTab';
import { TransactionsTab } from './detail/tabs/TransactionsTab';
import { ActivityTab } from './detail/tabs/ActivityTab';
import { InteractionsTab } from './detail/tabs/InteractionsTab';
import { TasksTab } from './detail/tabs/TasksTab';
import { TagDialog } from './detail/dialogs/TagDialog';
import { FollowUpDialog } from './detail/dialogs/FollowUpDialog';

import { ContactStatus, ContactType, ContactCategory } from '@/types/schema';
import type { User } from '../../types';
import type { Contact } from '@/types/schema';

export interface ContactDetailsProps {
  contactId: string;
  user: User;
  onBack: () => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  onNavigate?: (page: string, data?: unknown) => void;
}

export const ContactDetails: React.FC<ContactDetailsProps> = ({
  contactId,
  user,
  onBack,
  onEdit,
  onDelete,
}) => {
  const router = useRouter();
  const { activeTab, handleTabChange } = useContactTabUrl('overview');
  const detail = useContactDetail(contactId, user);

  const {
    contact,
    isLoading,
    error,
    interactions,
    contactTasks,
    metrics,
    relatedProperties,
    relatedDeals,
    investorInvestments,
    isInvestor,
    tenantId,
    agencyId,
    nextFollowUpValue,
    // dialogs
    showTagDialog, setShowTagDialog,
    newTag, setNewTag,
    showFollowUpDialog, setShowFollowUpDialog,
    followUpDate, setFollowUpDate,
    followUpNotes, setFollowUpNotes,
    showInteractionForm, setShowInteractionForm,
    editingInteraction, setEditingInteraction,
    showTaskForm, setShowTaskForm,
    editingTask, setEditingTask,
    showEditContactModal, setShowEditContactModal,
    // handlers
    handleCall,
    handleEmail,
    handleMessage,
    handleEditClick,
    handleDelete,
    handleChangeStatus,
    handleAddTag,
    handleSetFollowUp,
    handleClearFollowUp,
    refetchSilent,
    refetchInteractions,
  } = detail;

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading || (contactId && !contact && !error)) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-pulse h-10 w-10 rounded-full bg-primary/20" />
              <p className="text-muted-foreground text-sm">Loading contact...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── 404 ────────────────────────────────────────────────────────────────────
  if (!contact) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive/80 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Contact Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The contact you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const breadcrumbs = [
    { label: 'Contacts', onClick: onBack },
    { label: contact.name },
  ];

  const primaryActions = [
    { label: 'Call', icon: <Phone className="h-4 w-4" />, onClick: handleCall, variant: 'default' as const },
    { label: 'Email', icon: <Mail className="h-4 w-4" />, onClick: handleEmail, variant: 'outline' as const, disabled: !contact.email },
  ];

  const secondaryActions = [
    { label: 'Message', icon: <MessageSquare className="h-4 w-4" />, onClick: handleMessage },
    { label: 'Set Follow-up', icon: <Bell className="h-4 w-4" />, onClick: () => setShowFollowUpDialog(true) },
    { label: nextFollowUpValue ? 'Clear Follow-up' : 'No Follow-up', icon: <BellOff className="h-4 w-4" />, onClick: handleClearFollowUp, disabled: !nextFollowUpValue },
    { label: 'Edit Contact', icon: <Edit className="h-4 w-4" />, onClick: () => handleEditClick(onEdit) },
    {
      label: contact.status === ContactStatus.ACTIVE ? 'Mark Inactive' : 'Mark Active',
      icon: contact.status === ContactStatus.ACTIVE ? <CheckCircle2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />,
      onClick: () => handleChangeStatus(contact.status === ContactStatus.ACTIVE ? 'inactive' : 'active'),
    },
    {
      label: contact.status === ContactStatus.ARCHIVED ? 'Unarchive' : 'Archive',
      icon: <Archive className="h-4 w-4" />,
      onClick: () => handleChangeStatus(contact.status === ContactStatus.ARCHIVED ? 'active' : 'archived'),
    },
    { label: 'Delete Contact', icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDelete(onDelete, onBack), variant: 'destructive' as const },
  ];

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: <OverviewTab contact={contact} detail={detail} relatedProperties={relatedProperties} relatedDeals={relatedDeals} />,
    },
    {
      id: 'properties',
      label: 'Properties',
      badge: relatedProperties.length > 0 ? relatedProperties.length : undefined,
      content: <PropertiesTab properties={relatedProperties} />,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      badge: relatedDeals.length > 0 ? relatedDeals.length : undefined,
      content: <TransactionsTab deals={relatedDeals} />,
    },
    {
      id: 'activity',
      label: 'Activity',
      content: <ActivityTab contact={contact} relatedDeals={relatedDeals} detail={detail} />,
    },
    {
      id: 'interactions',
      label: 'Interactions',
      badge: interactions.length > 0 ? interactions.length : undefined,
      content: <InteractionsTab interactions={interactions} detail={detail} />,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      badge: contactTasks.length > 0 ? contactTasks.length : undefined,
      content: <TasksTab contactId={contactId} contactName={contact.name} user={user} tasks={contactTasks} detail={detail} />,
    },
    ...(isInvestor ? [{
      id: 'investment-portfolio',
      label: 'Investment Portfolio',
      badge: investorInvestments.filter((inv) => inv.status === 'active').length > 0
        ? investorInvestments.filter((inv) => inv.status === 'active').length
        : undefined,
      content: (
        <div className="p-6">
          <InvestorPortfolioDashboard
            investor={contact as unknown as import('../../types').Contact}
            user={user}
            onNavigateToProperty={(propertyId) => { router.push(`/dashboard/properties/${propertyId}`); }}
          />
        </div>
      ),
    }] : []),
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <DetailPageTemplate
        pageHeader={{ title: contact.name, breadcrumbs, onBack, metrics, primaryActions, secondaryActions }}
        tabs={tabs}
        defaultTab="overview"
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Dialogs */}
      <TagDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        value={newTag}
        onChange={setNewTag}
        onAdd={handleAddTag}
      />

      <FollowUpDialog
        open={showFollowUpDialog}
        onOpenChange={setShowFollowUpDialog}
        followUpDate={followUpDate}
        setFollowUpDate={setFollowUpDate}
        followUpNotes={followUpNotes}
        setFollowUpNotes={setFollowUpNotes}
        onSet={handleSetFollowUp}
      />

      <Dialog open={showInteractionForm} onOpenChange={setShowInteractionForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingInteraction ? 'Edit Interaction' : 'Log New Interaction'}</DialogTitle>
            <DialogDescription>{editingInteraction ? 'Update the interaction details' : 'Record a new interaction with this contact'}</DialogDescription>
          </DialogHeader>
          <InteractionForm
            contactId={contactId}
            user={user}
            tenantId={tenantId ?? undefined}
            agencyId={agencyId ?? undefined}
            interaction={editingInteraction}
            onSuccess={() => { setShowInteractionForm(false); setEditingInteraction(undefined); refetchInteractions(); }}
            onCancel={() => { setShowInteractionForm(false); setEditingInteraction(undefined); }}
          />
        </DialogContent>
      </Dialog>

      {tenantId && agencyId && (
        <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
              <DialogDescription>{editingTask ? 'Update the task details' : 'Create a new task for this contact'}</DialogDescription>
            </DialogHeader>
            <TaskForm
              contactId={contactId}
              tenantId={tenantId}
              agencyId={agencyId}
              task={editingTask}
              onSuccess={() => { setShowTaskForm(false); setEditingTask(undefined); void refetchSilent(); }}
              onCancel={() => { setShowTaskForm(false); setEditingTask(undefined); }}
            />
          </DialogContent>
        </Dialog>
      )}

      <ContactFormModal
        isOpen={showEditContactModal}
        onClose={() => setShowEditContactModal(false)}
        onSuccess={() => setShowEditContactModal(false)}
        agentId={user.id}
        tenantId={tenantId ?? undefined}
        agencyId={agencyId ?? undefined}
        editingContact={contact}
        defaultType={
          contact.type === ContactType.INVESTOR ? 'investor'
            : contact.type === ContactType.VENDOR ? 'vendor'
              : contact.category === ContactCategory.BOTH ? undefined
                : (contact.category === ContactCategory.EXTERNAL_BROKER
                  ? 'external-broker'
                  : contact.category?.toLowerCase()) as 'buyer' | 'seller' | 'tenant' | 'landlord' | 'investor' | 'vendor' | 'external-broker'
        }
      />
    </>
  );
};
