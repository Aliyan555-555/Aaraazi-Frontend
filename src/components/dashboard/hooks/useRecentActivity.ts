import { useState, useEffect } from "react";
import { User, Property, Contact } from "../../../types";
import { DashboardLead } from "../../../types/leads";
import { CRMTask } from "../../../types";
const getProperties = (..._args: any[]): any[] => [];
const getContacts = (..._args: any[]): any[] => [];
const getDashboardLeads = (..._args: any[]): any[] => [];
const getAllTasks = (..._args: any[]): any[] => [];
interface Document {
  id: string;
  name?: string;
  createdAt?: string;
  uploadedAt?: string;
  uploadDate?: string;
}

export interface RecentActivityData {
  properties: Property[];
  leads: DashboardLead[];
  contacts: Contact[];
  tasks: CRMTask[];
  documents: Document[];
  payments: any[]; // TODO: Add proper payment type
  loading: boolean;
}

/**
 * useRecentActivity hook
 */
export function useRecentActivity(user: User): RecentActivityData {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    try {
      setLoading(true);

      const userId = user.role === "admin" ? undefined : user.id;
      const userRole = user.role;

      // Calculate date 7 days ago
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Load properties (last 7 days)
      const allProperties = getProperties(userId, userRole);
      const recentProperties = allProperties.filter(
        (p) => new Date(p.createdAt) >= oneWeekAgo,
      );
      setProperties(recentProperties);

      // Load leads (last 7 days)
      const allLeads = getDashboardLeads(userId, userRole);
      const recentLeads = allLeads.filter(
        (l) => new Date(l.createdAt) >= oneWeekAgo,
      );
      setLeads(recentLeads);

      // Load contacts (last 7 days)
      const allContacts = getContacts(userId, userRole);
      const recentContacts = allContacts.filter(
        (c) => new Date(c.createdAt) >= oneWeekAgo,
      );
      setContacts(recentContacts);

      // Load tasks (last 7 days)
      const allTasks = getAllTasks(userId, userRole);
      const recentTasks = allTasks.filter(
        (t) => new Date(t.createdAt) >= oneWeekAgo,
      );
      setTasks(recentTasks);

      // Load documents (last 7 days)
      // Note: getDocuments requires propertyId, so we get all documents directly
      const documentsKey = "estate_documents";
      const allDocuments = JSON.parse(
        localStorage.getItem(documentsKey) || "[]",
      ) as Document[];
      const recentDocuments = allDocuments.filter((d) => {
        const createdDate = new Date(
          d.createdAt || d.uploadedAt || d.uploadDate || 0,
        );
        return createdDate >= oneWeekAgo;
      });
      setDocuments(recentDocuments);

      // Load payments (last 7 days)
      // TODO: Implement when payment service is ready
      setPayments([]);

      setLoading(false);
    } catch (error) {
      console.error("Error loading recent activity:", error);
      setLoading(false);
    }
  }, [user.id, user.role]);

  return {
    properties,
    leads,
    contacts,
    tasks,
    documents,
    payments,
    loading,
  };
}
