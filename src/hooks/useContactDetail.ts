/**
 * useContactDetail
 * All data-fetching, derived state, and mutation handlers for the Contact Detail page.
 * Keeps ContactDetails.tsx as a thin layout-only orchestrator.
 */

"use client";

import { useMemo, useState } from "react";

import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useContactDetails, useUpdateContact } from "@/hooks/useContacts";
import { useDeleteInteraction } from "@/hooks/useInteractions";
import { useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import {
  getTagArray,
  tagsToApi,
  mergePreferences,
  resolveNextFollowUp,
  resolveLastContactDate,
  getFollowUpStatus,
  statusKeyToEnum,
  type FollowUpStatus,
  type ContactStatusKey,
} from "@/lib/contacts.utils";
import { formatPKR } from "@/lib/currency";
import type { Contact } from "@/types/schema";
import type { User } from "@/types";
import type { Deal } from "@/types/deals";
import type { Interaction } from "@/services/interactions.service";
import type { CRMInteraction } from "@/types/crm";
import type { Task } from "@/services/tasks.service";
import { Briefcase, Home, DollarSign, TrendingUp } from "lucide-react";
import React from "react";

/** Contact fields present in some legacy API responses but not in the schema type */
type ContactWithLegacy = Contact & {
  totalCommissionEarned?: number;
  totalTransactions?: number;
  source?: string;
  notes?: string;
};

/** Return type of useContactDetail. */
export interface UseContactDetailReturn {
  // ── Data ─────────────────────────────────────────────────────────────────
  contact: Contact | undefined;
  isLoading: boolean;
  error: unknown;

  interactions: (Interaction | CRMInteraction)[];
  contactTasks: Task[];

  // Derived values
  nextFollowUpValue: string | undefined;
  lastContactDateValue: string | undefined;
  followUpStatus: FollowUpStatus;
  metrics: { label: string; value: string | number; icon: React.ReactNode }[];

  // Placeholder data (until APIs exist)
  relatedProperties: RelatedProperty[];
  relatedDeals: Deal[];
  investorInvestments: { status: string }[];
  isInvestor: boolean;

  // Auth
  tenantId: string | null;
  agencyId: string | null;

  // ── Dialog State ─────────────────────────────────────────────────────────
  showTagDialog: boolean;
  setShowTagDialog: (v: boolean) => void;
  newTag: string;
  setNewTag: (v: string) => void;

  showFollowUpDialog: boolean;
  setShowFollowUpDialog: (v: boolean) => void;
  followUpDate: string;
  setFollowUpDate: (v: string) => void;
  followUpNotes: string;
  setFollowUpNotes: (v: string) => void;

  showInteractionForm: boolean;
  setShowInteractionForm: (v: boolean) => void;
  editingInteraction: Interaction | CRMInteraction | undefined;
  setEditingInteraction: (v: Interaction | CRMInteraction | undefined) => void;

  showTaskForm: boolean;
  setShowTaskForm: (v: boolean) => void;
  editingTask: Task | undefined;
  setEditingTask: (v: Task | undefined) => void;

  showEditContactModal: boolean;
  setShowEditContactModal: (v: boolean) => void;

  // ── Mutations (isPending flags) ───────────────────────────────────────────
  deleteInteractionMutation: ReturnType<typeof useDeleteInteraction>;
  deleteTaskMutation: ReturnType<typeof useDeleteTask>;
  createTaskMutation: ReturnType<typeof useCreateTask>;
  updateTaskMutation: ReturnType<typeof useUpdateTask>;

  // ── Action Handlers ───────────────────────────────────────────────────────
  handleCall: () => void;
  handleEmail: () => void;
  handleMessage: () => void;
  handleEditClick: (onEdit?: (c: Contact) => void) => void;
  handleDelete: (onDelete?: (id: string) => void, onBack?: () => void) => void;
  handleChangeStatus: (newStatus: ContactStatusKey) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  handleSetFollowUp: () => void;
  handleClearFollowUp: () => void;

  // ── Refetch helpers ───────────────────────────────────────────────────────
  refetchSilent: () => Promise<unknown>;
  refetchInteractions: () => void;
  refetchTasks: () => void;
}

export interface RelatedProperty {
  id: string;
  address?: string;
  propertyType?: string;
  area?: number;
  areaUnit?: string;
  status?: string;
}

export function useContactDetail(
  contactId: string,
  _user: User,
): UseContactDetailReturn {
  const { tenantId, agencyId } = useAuthStore();

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<
    Interaction | CRMInteraction | undefined
  >();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [showEditContactModal, setShowEditContactModal] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────
  const {
    data: detailsData,
    isLoading,
    error,
    refetchSilent,
  } = useContactDetails(contactId);

  const contact = detailsData?.contact;
  const apiTasks = detailsData?.tasks ?? [];
  const apiInteractions = detailsData?.interactions ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateContactMutation = useUpdateContact();
  const deleteInteractionMutation = useDeleteInteraction();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const refetchInteractions = (): void => {
    void refetchSilent();
  };
  const refetchTasks = (): void => {
    void refetchSilent();
  };

  // ── Placeholders (until APIs exist) ──────────────────────────────────────
  const relatedProperties: RelatedProperty[] = [];
  const relatedDeals: Deal[] = [];
  const investorInvestments: { status: string }[] = [];
  const isInvestor = false;

  // ── Derived state ─────────────────────────────────────────────────────────
  const interactions = useMemo(
    () =>
      [...apiInteractions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [apiInteractions],
  );

  const contactTasks = useMemo(
    () =>
      [...apiTasks].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      ),
    [apiTasks],
  );

  const nextFollowUpValue = useMemo(
    () => resolveNextFollowUp(contact),
    [contact],
  );
  const lastContactDateValue = useMemo(
    () => resolveLastContactDate(contact),
    [contact],
  );
  const followUpStatus = useMemo(
    () => getFollowUpStatus(nextFollowUpValue),
    [nextFollowUpValue],
  );

  const metrics = useMemo(() => {
    if (!contact) return [];
    const legacy = contact as ContactWithLegacy;
    const totalValue = relatedDeals.reduce(
      (sum, d) => sum + (d.financial?.agreedPrice ?? 0),
      0,
    );
    const commission = legacy.totalCommissionEarned ?? 0;
    return [
      {
        label: "Total Transactions",
        value: legacy.totalTransactions ?? relatedDeals.length,
        icon: React.createElement(Briefcase, { className: "h-5 w-5" }),
      },
      {
        label: "Properties",
        value: relatedProperties.length,
        icon: React.createElement(Home, { className: "h-5 w-5" }),
      },
      {
        label: "Total Value",
        value: formatPKR(totalValue),
        icon: React.createElement(DollarSign, { className: "h-5 w-5" }),
      },
      {
        label: "Commission",
        value: formatPKR(commission),
        icon: React.createElement(TrendingUp, { className: "h-5 w-5" }),
      },
    ];
  }, [contact, relatedDeals, relatedProperties]);

  // ── Action Handlers ───────────────────────────────────────────────────────
  const handleCall = (): void => {
    if (!contact?.phone) return;
    window.location.href = `tel:${contact.phone}`;
    toast.success(`Calling ${contact.name}...`);
    void updateContactMutation.mutateAsync({
      id: contact.id,
      data: {
        preferences: mergePreferences(contact.preferences, {
          lastContactDate: new Date().toISOString(),
        }),
      },
    });
  };

  const handleEmail = (): void => {
    if (!contact) return;
    if (!contact.email) {
      toast.error("No email address available");
      return;
    }
    window.location.href = `mailto:${contact.email}`;
    toast.success(`Opening email to ${contact.name}...`);
    void updateContactMutation.mutateAsync({
      id: contact.id,
      data: {
        preferences: mergePreferences(contact.preferences, {
          lastContactDate: new Date().toISOString(),
        }),
      },
    });
  };

  const handleMessage = (): void => {
    toast.info("Messaging feature coming soon");
  };

  const handleEditClick = (onEdit?: (c: Contact) => void): void => {
    if (!contact) return;
    setShowEditContactModal(true);
    onEdit?.(contact);
  };

  const handleDelete = (
    onDelete?: (id: string) => void,
    onBack?: () => void,
  ): void => {
    if (!contact) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
      )
    ) {
      onDelete?.(contact.id);
      onBack?.();
      toast.success("Contact deleted");
    }
  };

  const handleChangeStatus = (newStatus: ContactStatusKey): void => {
    if (!contact) return;
    void updateContactMutation
      .mutateAsync({
        id: contact.id,
        data: { status: statusKeyToEnum(newStatus) },
      })
      .then(() => toast.success(`Status changed to ${newStatus}`));
  };

  const handleAddTag = (): void => {
    if (!contact || !newTag.trim()) return;
    const currentTags = getTagArray(contact.tags);
    if (currentTags.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }
    const next = [...currentTags, newTag.trim()];
    void updateContactMutation
      .mutateAsync({
        id: contact.id,
        data: { tags: tagsToApi(next) },
      })
      .then(() => {
        toast.success(`Tag "${newTag}" added`);
        setNewTag("");
        setShowTagDialog(false);
      });
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    if (!contact) return;
    const next = getTagArray(contact.tags).filter((t) => t !== tagToRemove);
    void updateContactMutation
      .mutateAsync({
        id: contact.id,
        data: { tags: tagsToApi(next) },
      })
      .then(() => toast.success(`Tag "${tagToRemove}" removed`));
  };

  const handleSetFollowUp = (): void => {
    if (!contact || !followUpDate) return;
    void updateContactMutation
      .mutateAsync({
        id: contact.id,
        data: {
          preferences: mergePreferences(contact.preferences, {
            nextFollowUp: new Date(followUpDate).toISOString(),
          }),
        },
      })
      .then(() => {
        toast.success("Follow-up date set");
        setFollowUpDate("");
        setFollowUpNotes("");
        setShowFollowUpDialog(false);
      });
  };

  const handleClearFollowUp = (): void => {
    if (!contact) return;
    const prefs = {
      ...((contact.preferences as Record<string, unknown>) ?? {}),
    };
    delete prefs["nextFollowUp"];
    void updateContactMutation
      .mutateAsync({
        id: contact.id,
        data: { preferences: JSON.stringify(prefs) },
      })
      .then(() => toast.success("Follow-up cleared"));
  };

  return {
    contact,
    isLoading,
    error,
    interactions,
    contactTasks,
    nextFollowUpValue,
    lastContactDateValue,
    followUpStatus,
    metrics,
    relatedProperties,
    relatedDeals,
    investorInvestments,
    isInvestor,
    tenantId,
    agencyId,
    showTagDialog,
    setShowTagDialog,
    newTag,
    setNewTag,
    showFollowUpDialog,
    setShowFollowUpDialog,
    followUpDate,
    setFollowUpDate,
    followUpNotes,
    setFollowUpNotes,
    showInteractionForm,
    setShowInteractionForm,
    editingInteraction,
    setEditingInteraction,
    showTaskForm,
    setShowTaskForm,
    editingTask,
    setEditingTask,
    showEditContactModal,
    setShowEditContactModal,
    deleteInteractionMutation,
    deleteTaskMutation,
    createTaskMutation,
    updateTaskMutation,
    handleCall,
    handleEmail,
    handleMessage,
    handleEditClick,
    handleDelete,
    handleChangeStatus,
    handleAddTag,
    handleRemoveTag,
    handleSetFollowUp,
    handleClearFollowUp,
    refetchSilent,
    refetchInteractions,
    refetchTasks,
  };
}
