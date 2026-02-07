/**
 * CRM (Customer Relationship Management) Types
 * 
 * Types for CRM tasks, interactions, and related entities.
 */

/**
 * CRM Task
 * Represents a to-do item or action for an agent
 */
export interface CRMTask {
  id: string;
  title: string;
  description?: string;
  type?: 'follow-up' | 'viewing' | 'meeting' | 'document' | 'call' | 'other';
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  agentId: string;  // Assigned to
  dueDate: Date | string;
  completed: boolean;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high';
  contactId?: string;  // Optional link to contact
  propertyId?: string;  // Optional link to property
  leadId?: string;  // Optional link to lead
  createdAt: Date | string;
  updatedAt?: Date | string;
}

/**
 * CRM Interaction
 * Represents a communication or touchpoint with a contact
 */
export interface CRMInteraction {
  id: string;
  contactId: string;
  agentId: string;  // Who made the interaction
  type: 'call' | 'email' | 'meeting' | 'note' | 'sms';
  date: Date | string;
  subject?: string;
  notes?: string;
  outcome?: string;
  nextSteps?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}
