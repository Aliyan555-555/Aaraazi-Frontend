/**
 * Workflow Definitions
 * 
 * Defines common workflows for Quick Launch section.
 * 
 * WORKFLOWS:
 * 1. Create Property - Add new property listing
 * 2. Add Lead - Capture new inquiry
 * 3. Create Sell Cycle - Start selling property
 * 4. Log Interaction - Quick CRM note
 * 5. Schedule Task - Create follow-up task
 * 6. Add Contact - Create new contact
 * 7. Record Payment - Log payment received
 * 8. Upload Document - Add document
 * 
 * Each workflow includes:
 * - Title, description
 * - Icon and colors
 * - Keyboard shortcut (optional)
 * - Navigation route
 */

import {
  Home,
  UserPlus,
  TrendingUp,
  MessageSquare,
  Calendar,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  ClipboardList,
  Building2,
  Handshake,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type WorkflowId =
  | 'create-property'
  | 'add-lead'
  | 'create-sell-cycle'
  | 'log-interaction'
  | 'schedule-task'
  | 'add-contact'
  | 'record-payment'
  | 'upload-document'
  | 'view-reports'
  | 'manage-inventory'
  | 'create-deal'
  | 'investor-syndication';

export interface WorkflowDefinition {
  id: WorkflowId;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  route: string;                 // Navigation route
  action?: 'navigate' | 'modal';  // How to launch
  keyboardShortcut?: string;
  category: 'sales' | 'crm' | 'finance' | 'reports' | 'admin';
  order: number;                 // Display order
}

/**
 * All available workflows
 */
export const WORKFLOW_DEFINITIONS: Record<WorkflowId, WorkflowDefinition> = {
  'create-property': {
    id: 'create-property',
    title: 'Create Property',
    description: 'Add a new property listing to your inventory',
    icon: Home,
    iconColor: 'text-[#2D6A54]',
    iconBgColor: 'bg-[#2D6A54]/10',
    route: 'properties/new',
    action: 'navigate',
    keyboardShortcut: 'Ctrl+P',
    category: 'sales',
    order: 1,
  },

  'add-lead': {
    id: 'add-lead',
    title: 'Add Lead',
    description: 'Capture a new inquiry or potential client',
    icon: UserPlus,
    iconColor: 'text-[#C17052]',
    iconBgColor: 'bg-[#C17052]/10',
    route: 'leads/new',
    action: 'navigate',
    keyboardShortcut: 'Ctrl+L',
    category: 'crm',
    order: 2,
  },

  'create-sell-cycle': {
    id: 'create-sell-cycle',
    title: 'Create Sell Cycle',
    description: 'Start a new sales cycle for a property',
    icon: TrendingUp,
    iconColor: 'text-[#2D6A54]',
    iconBgColor: 'bg-[#2D6A54]/10',
    route: 'sell-cycles/new',
    action: 'navigate',
    keyboardShortcut: 'Ctrl+S',
    category: 'sales',
    order: 3,
  },

  'log-interaction': {
    id: 'log-interaction',
    title: 'Log Interaction',
    description: 'Record a call, meeting, or note with a contact',
    icon: MessageSquare,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-600/10',
    route: 'contacts',
    action: 'navigate',
    keyboardShortcut: 'Ctrl+I',
    category: 'crm',
    order: 4,
  },

  'schedule-task': {
    id: 'schedule-task',
    title: 'Schedule Task',
    description: 'Create a follow-up task or appointment',
    icon: Calendar,
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-600/10',
    route: 'tasks/new',
    action: 'navigate',
    keyboardShortcut: 'Ctrl+T',
    category: 'crm',
    order: 5,
  },

  'add-contact': {
    id: 'add-contact',
    title: 'Add Contact',
    description: 'Create a new contact in your CRM',
    icon: Users,
    iconColor: 'text-[#C17052]',
    iconBgColor: 'bg-[#C17052]/10',
    route: 'contacts/new',
    action: 'navigate',
    keyboardShortcut: 'Ctrl+K',
    category: 'crm',
    order: 6,
  },

  'record-payment': {
    id: 'record-payment',
    title: 'Record Payment',
    description: 'Log a payment or transaction',
    icon: DollarSign,
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-600/10',
    route: 'financials/payments/new',
    action: 'navigate',
    category: 'finance',
    order: 7,
  },

  'upload-document': {
    id: 'upload-document',
    title: 'Upload Document',
    description: 'Add contracts, agreements, or files',
    icon: FileText,
    iconColor: 'text-orange-600',
    iconBgColor: 'bg-orange-600/10',
    route: 'documents/new',
    action: 'navigate',
    category: 'admin',
    order: 8,
  },

  'view-reports': {
    id: 'view-reports',
    title: 'View Reports',
    description: 'Access financial and performance reports',
    icon: BarChart3,
    iconColor: 'text-[#363F47]',
    iconBgColor: 'bg-[#363F47]/10',
    route: 'financials/reports',
    action: 'navigate',
    category: 'reports',
    order: 9,
  },

  'manage-inventory': {
    id: 'manage-inventory',
    title: 'Manage Inventory',
    description: 'View and update property inventory',
    icon: ClipboardList,
    iconColor: 'text-[#2D6A54]',
    iconBgColor: 'bg-[#2D6A54]/10',
    route: 'properties',
    action: 'navigate',
    category: 'sales',
    order: 10,
  },

  'create-deal': {
    id: 'create-deal',
    title: 'Create Deal',
    description: 'Record a new transaction or agreement',
    icon: Handshake,
    iconColor: 'text-[#C17052]',
    iconBgColor: 'bg-[#C17052]/10',
    route: 'deals/new',
    action: 'navigate',
    category: 'sales',
    order: 11,
  },

  'investor-syndication': {
    id: 'investor-syndication',
    title: 'Investor Syndication',
    description: 'Manage investment opportunities',
    icon: Building2,
    iconColor: 'text-indigo-600',
    iconBgColor: 'bg-indigo-600/10',
    route: 'syndication',
    action: 'navigate',
    category: 'finance',
    order: 12,
  },
};

/**
 * Get workflows by category
 */
export function getWorkflowsByCategory(category: WorkflowDefinition['category']): WorkflowDefinition[] {
  return Object.values(WORKFLOW_DEFINITIONS)
    .filter(w => w.category === category)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get top workflows (most common)
 */
export function getTopWorkflows(count: number = 8): WorkflowDefinition[] {
  return Object.values(WORKFLOW_DEFINITIONS)
    .sort((a, b) => a.order - b.order)
    .slice(0, count);
}

/**
 * Get workflow by ID
 */
export function getWorkflow(id: WorkflowId): WorkflowDefinition | undefined {
  return WORKFLOW_DEFINITIONS[id];
}

/**
 * Get personalized workflows based on user role
 */
export function getPersonalizedWorkflows(
  userRole: 'admin' | 'agent' | 'viewer'
): WorkflowDefinition[] {
  const baseWorkflows = getTopWorkflows(8);

  // Admins get all workflows
  if (userRole === 'admin') {
    return baseWorkflows;
  }

  // Agents get sales and CRM focused workflows
  if (userRole === 'agent') {
    return baseWorkflows.filter(w =>
      ['sales', 'crm'].includes(w.category)
    );
  }

  // Viewers get read-only workflows
  return baseWorkflows.filter(w =>
    ['reports'].includes(w.category)
  );
}

/**
 * Calculate recent activity count for a workflow
 */
export function calculateRecentCount(
  workflowId: WorkflowId,
  data: {
    properties?: any[];
    leads?: any[];
    contacts?: any[];
    tasks?: any[];
    payments?: any[];
    documents?: any[];
  }
): number {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  switch (workflowId) {
    case 'create-property':
      return (data.properties || []).filter(
        p => new Date(p.createdAt) >= oneWeekAgo
      ).length;

    case 'add-lead':
      return (data.leads || []).filter(
        l => new Date(l.createdAt) >= oneWeekAgo
      ).length;

    case 'add-contact':
      return (data.contacts || []).filter(
        c => new Date(c.createdAt) >= oneWeekAgo
      ).length;

    case 'schedule-task':
      return (data.tasks || []).filter(
        t => new Date(t.createdAt) >= oneWeekAgo
      ).length;

    case 'record-payment':
      return (data.payments || []).filter(
        p => new Date(p.createdAt || p.date) >= oneWeekAgo
      ).length;

    case 'upload-document':
      return (data.documents || []).filter(
        d => new Date(d.createdAt || d.uploadDate) >= oneWeekAgo
      ).length;

    default:
      return 0;
  }
}
