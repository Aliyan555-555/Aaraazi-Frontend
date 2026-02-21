import React, { useMemo, useState } from 'react';
import { DetailPageTemplate } from '../layout/DetailPageTemplate';
import { User, Contact, CRMInteraction, CRMTask } from '../../types';
import { Deal } from '../../types/deals';
import { getContacts, getProperties, updateContact, getContactInteractions, getContactTasks, deleteInteraction, deleteTask as deleteLegacyTask, updateTask as updateLegacyTask } from '../../lib/data';
import { getDeals } from '../../lib/deals';
import { formatPKR } from '../../lib/currency';
import { formatPropertyAddress } from '../../lib/utils';
import { getInvestorInvestments } from '../../lib/investors';
import { InvestorPortfolioDashboard } from '../investor-portfolio/InvestorPortfolioDashboard';
import { InteractionForm } from './InteractionForm';
import { TaskForm } from './TaskForm';
import { getTasksByEntity, updateTask, deleteTask } from '../../lib/tasks';
import type { Task } from '../../types/tasks';

/** Contact with legacy UI/tracking fields not on schema Contact */
type ContactWithLegacy = Contact & {
  nextFollowUp?: string;
  totalCommissionEarned?: number;
  totalTransactions?: number;
  source?: string;
  notes?: string;
};

/** Deal with legacy UI fields not on schema Deal */
type DealWithLegacy = Deal & {
  propertyAddress?: string;
  finalPrice?: number;
  createdAt?: string;
  status?: string;
};
import { TaskQuickAddWidget } from '../tasks/TaskQuickAddWidget';
import { TaskListView } from '../tasks/TaskListView';
import {
  Phone,
  Mail,
  Edit,
  Trash2,
  MessageSquare,
  Home,
  DollarSign,
  Calendar,
  Tag,
  MapPin,
  Building2,
  TrendingUp,
  FileText,
  Clock,
  User as UserIcon,
  Briefcase,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  X,
  Archive,
  Bell,
  BellOff,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { toast } from 'sonner';

export interface ContactDetailsEnhancedProps {
  contactId: string;
  user: User;
  onBack: () => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
  onNavigate?: (page: string, data?: unknown) => void;
}

export const ContactDetailsEnhanced: React.FC<ContactDetailsEnhancedProps> = ({
  contactId,
  user,
  onBack,
  onEdit,
  onDelete,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Interactions & Tasks state
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<CRMInteraction | undefined>();
  const [editingTask, setEditingTask] = useState<CRMTask | undefined>();

  // Tasks Module state
  const [contactTasks, setContactTasks] = useState<Task[]>([]);

  // Load tasks for this contact (Tasks Module)
  useMemo(() => {
    const tasks = getTasksByEntity('contact', contactId);
    setContactTasks(tasks);
  }, [contactId, refreshTrigger]);

  // Version indicator for debugging
  React.useEffect(() => {
    console.log('🎉 ContactDetailsEnhanced loaded - Version 2.0.0');
    console.log('✅ Features: Tag Management, Follow-up Tracking, Status Controls');
  }, []);

  // Helper functions to handle tags (can be string or array)
  const getTagArray = (tags: string | string[] | undefined | null): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string' && tags.trim() !== '') {
      try {
        const parsed = JSON.parse(tags) as unknown;
        if (Array.isArray(parsed)) return parsed as string[];
        return tags.split(',').map(t => t.trim()).filter(t => t);
      } catch {
        return tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }
    return [];
  };

  const serializeTags = (tags: string[]): string[] => {
    return tags; // Use array directly as it's the expected type now
  };

  // ============================================================================
  // Data Loading
  // ============================================================================

  const contact = useMemo(() => {
    const contacts = getContacts(user.role === 'admin' ? undefined : user.id, user.role);
    return contacts.find(c => c.id === contactId);
  }, [contactId, user.id, user.role, refreshTrigger]);

  const relatedProperties = useMemo(() => {
    if (!contact) return [];
    const allProperties = getProperties(user.role === 'admin' ? undefined : user.id, user.role);
    const interestedIds = (contact as Contact & { interestedProperties?: string[] }).interestedProperties;
    return allProperties.filter(p =>
      interestedIds?.includes(p.id) ||
      p.currentOwnerId === contact.id
    );
  }, [contact, user.id, user.role]);

  const relatedDeals = useMemo(() => {
    if (!contact) return [];
    const allDeals = getDeals(user.role === 'admin' ? undefined : user.id, user.role);
    return allDeals.filter((d: Deal): boolean => {
      const buyerId = d.parties?.buyer?.id;
      const sellerId = d.parties?.seller?.id;
      const primaryId = d.agents?.primary?.id;
      const secondaryId = d.agents?.secondary?.id;

      return buyerId === contact.id || sellerId === contact.id || primaryId === contact.id || secondaryId === contact.id;
    });
  }, [contact, user.id, user.role]);

  const interactions = useMemo(() => {
    if (!contact) return [];
    return getContactInteractions(contact.id).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [contact, refreshTrigger]);

  const tasks = useMemo(() => {
    if (!contact) return [];
    return getContactTasks(contact.id).sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [contact, refreshTrigger]);

  // Check if contact is an investor (has investments)
  const investorInvestments = useMemo(() => {
    if (!contact) return [];
    return getInvestorInvestments(contact.id);
  }, [contact, refreshTrigger]);

  const isInvestor = investorInvestments.length > 0;

  // Check if follow-up is due
  const followUpStatus = useMemo(() => {
    const nextFollowUp = (contact as ContactWithLegacy)?.nextFollowUp;
    if (!nextFollowUp) return null;

    const followUpDate = new Date(nextFollowUp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    followUpDate.setHours(0, 0, 0, 0);

    if (followUpDate < today) return 'overdue';
    if (followUpDate.getTime() === today.getTime()) return 'due';
    if (followUpDate > today) return 'upcoming';
    return null;
  }, [contact]);

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Contact Not Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The contact you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={onBack}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // Calculations
  // ============================================================================

  const metrics = useMemo(() => {
    const legacy = contact as ContactWithLegacy;
    const totalValue = relatedDeals.reduce((sum, d) => sum + (d.financial?.agreedPrice || 0), 0);
    const commission = legacy.totalCommissionEarned || 0;

    return [
      {
        label: 'Total Transactions',
        value: legacy.totalTransactions ?? relatedDeals.length,
        icon: <Briefcase className="h-5 w-5" />,
      },
      {
        label: 'Properties',
        value: relatedProperties.length,
        icon: <Home className="h-5 w-5" />,
      },
      {
        label: 'Total Value',
        value: formatPKR(totalValue),
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: 'Commission',
        value: formatPKR(commission),
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ];
  }, [contact, relatedDeals, relatedProperties]);

  // ============================================================================
  // Actions
  // ============================================================================

  const handleCall = () => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
      toast.success(`Calling ${contact.name}...`);

      // Update last contact date
      updateContact(contact.id, {
        lastContactDate: new Date().toISOString(),
      });
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
      toast.success(`Opening email to ${contact.name}...`);

      // Update last contact date
      updateContact(contact.id, {
        lastContactDate: new Date().toISOString(),
      });
      setRefreshTrigger(prev => prev + 1);
    } else {
      toast.error('No email address available');
    }
  };

  const handleMessage = () => {
    toast.info('Messaging feature coming soon');
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(contact);
    } else {
      toast.info('Edit functionality not available');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}? This action cannot be undone.`)) {
      if (onDelete) {
        onDelete(contact.id);
        onBack();
      }
      toast.success('Contact deleted');
    }
  };

  const handleChangeStatus = (newStatus: 'active' | 'inactive' | 'archived') => {
    updateContact(contact.id, { status: newStatus });
    toast.success(`Contact status changed to ${newStatus}`);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = getTagArray(contact.tags);
      if (!currentTags.includes(newTag.trim())) {
        updateContact(contact.id, {
          tags: serializeTags([...currentTags, newTag.trim()]),
        });
        toast.success(`Tag "${newTag}" added`);
        setNewTag('');
        setShowTagDialog(false);
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.error('Tag already exists');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = getTagArray(contact.tags);
    updateContact(contact.id, {
      tags: serializeTags(currentTags.filter((t: string) => t !== tagToRemove)),
    });
    toast.success(`Tag "${tagToRemove}" removed`);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSetFollowUp = () => {
    if (followUpDate) {
      updateContact(contact.id, {
        nextFollowUp: new Date(followUpDate).toISOString(),
      });
      toast.success('Follow-up date set');
      setFollowUpDate('');
      setFollowUpNotes('');
      setShowFollowUpDialog(false);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleClearFollowUp = () => {
    updateContact(contact.id, {
      nextFollowUp: undefined,
    });
    toast.success('Follow-up cleared');
    setRefreshTrigger(prev => prev + 1);
  };

  // ============================================================================
  // Breadcrumbs
  // ============================================================================

  const breadcrumbs = [
    { label: 'Contacts', onClick: onBack },
    { label: contact.name },
  ];

  // ============================================================================
  // Primary Actions
  // ============================================================================

  const primaryActions = [
    {
      label: 'Call',
      icon: <Phone className="h-4 w-4" />,
      onClick: handleCall,
      variant: 'default' as const,
    },
    {
      label: 'Email',
      icon: <Mail className="h-4 w-4" />,
      onClick: handleEmail,
      variant: 'outline' as const,
      disabled: !contact.email,
    },
  ];

  // ============================================================================
  // Secondary Actions
  // ============================================================================

  const secondaryActions = [
    {
      label: 'Message',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: handleMessage,
    },
    {
      label: 'Set Follow-up',
      icon: <Bell className="h-4 w-4" />,
      onClick: () => setShowFollowUpDialog(true),
    },
    {
      label: (contact as ContactWithLegacy).nextFollowUp ? 'Clear Follow-up' : 'No Follow-up',
      icon: <BellOff className="h-4 w-4" />,
      onClick: handleClearFollowUp,
      disabled: !(contact as ContactWithLegacy).nextFollowUp,
    },
    {
      label: 'Edit Contact',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditClick,
    },
    {
      label: contact.status === 'active' ? 'Mark Inactive' : 'Mark Active',
      icon: contact.status === 'active' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />,
      onClick: () => handleChangeStatus(contact.status === 'active' ? 'inactive' : 'active'),
    },
    {
      label: contact.status === 'archived' ? 'Unarchive' : 'Archive',
      icon: <Archive className="h-4 w-4" />,
      onClick: () => handleChangeStatus(contact.status === 'archived' ? 'active' : 'archived'),
    },
    {
      label: 'Delete Contact',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: 'destructive' as const,
    },
  ];

  // ============================================================================
  // Tab Content Components
  // ============================================================================

  const OverviewTab = () => (
    <div className="p-6 space-y-6">
      {/* Follow-up Alert */}
      {followUpStatus && (
        <Card className={`border-2 ${followUpStatus === 'overdue' ? 'border-red-500 bg-red-50' :
          followUpStatus === 'due' ? 'border-yellow-500 bg-yellow-50' :
            'border-blue-500 bg-blue-50'
          }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bell className={`h-5 w-5 ${followUpStatus === 'overdue' ? 'text-red-600' :
                followUpStatus === 'due' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
              <div>
                <p className="font-medium">
                  {followUpStatus === 'overdue' ? 'Overdue Follow-up' :
                    followUpStatus === 'due' ? 'Follow-up Due Today' :
                      'Upcoming Follow-up'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Scheduled for {new Date((contact as ContactWithLegacy).nextFollowUp!).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => setShowFollowUpDialog(true)}
              >
                Reschedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contact Information</CardTitle>
          <Button variant="outline" size="sm" onClick={handleEditClick}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{contact.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{contact.phone}</p>
              </div>
            </div>

            {contact.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{contact.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline">
                  {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                </Badge>
              </div>
            </div>

            {contact.category && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge variant="secondary">
                    {contact.category.charAt(0).toUpperCase() + contact.category.slice(1)}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={
                  contact.status === 'active' ? 'default' :
                    contact.status === 'inactive' ? 'secondary' :
                      'outline'
                }>
                  {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                </Badge>
              </div>
            </div>

            {(contact as ContactWithLegacy).source && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium">{(contact as ContactWithLegacy).source}</p>
                </div>
              </div>
            )}

            {contact.lastContactDate && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Contact</p>
                  <p className="font-medium">
                    {new Date(contact.lastContactDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            {(contact as ContactWithLegacy).nextFollowUp && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Next Follow-up</p>
                  <p className="font-medium">
                    {new Date((contact as ContactWithLegacy).nextFollowUp!).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tags Section */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Tags</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTagDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tag
              </Button>
            </div>
            {getTagArray(contact.tags).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {getTagArray(contact.tags).map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags yet</p>
            )}
          </div>

          {(contact as ContactWithLegacy).notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-sm">{(contact as ContactWithLegacy).notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-2xl font-bold">{relatedProperties.length}</p>
              </div>
              <Home className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{relatedDeals.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission</p>
                <p className="text-2xl font-bold">
                  {formatPKR((contact as ContactWithLegacy).totalCommissionEarned || 0).replace('PKR ', '')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const PropertiesTab = () => (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Related Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {relatedProperties.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No related properties</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relatedProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onNavigate?.('property-detail', property)}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{formatPropertyAddress(property.address)}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.propertyType} • {property.area} {property.areaUnit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{property.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const TransactionsTab = () => (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {relatedDeals.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relatedDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${deal.lifecycle?.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                      {deal.lifecycle?.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{deal.cycles?.sellCycle?.propertyId || (deal as DealWithLegacy).propertyAddress || 'Property'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(deal.metadata?.createdAt || (deal as DealWithLegacy).createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPKR((deal as DealWithLegacy).finalPrice || deal.financial?.agreedPrice || 0)}</p>
                    <Badge variant={deal.lifecycle?.status === 'completed' ? 'default' : 'secondary'}>
                      {deal.lifecycle?.status || 'active'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const ActivityTab = () => (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Follow-up Reminder */}
            {(contact as ContactWithLegacy).nextFollowUp && (
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${followUpStatus === 'overdue' ? 'bg-red-100' :
                    followUpStatus === 'due' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                    <Bell className={`h-4 w-4 ${followUpStatus === 'overdue' ? 'text-red-600' :
                      followUpStatus === 'due' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Follow-up Scheduled</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date((contact as ContactWithLegacy).nextFollowUp!).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Contact Created */}
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Contact Created</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(contact.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Last Contact */}
            {contact.lastContactDate && (
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Last Contact</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(contact.lastContactDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Transactions */}
            {relatedDeals.map((deal) => (
              <div key={deal.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Transaction: {(deal as DealWithLegacy).propertyAddress || deal.cycles?.sellCycle?.propertyId || 'Property'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPKR((deal as DealWithLegacy).finalPrice || deal.financial?.agreedPrice || 0)} • {deal.lifecycle?.status || (deal as DealWithLegacy).status || 'active'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(deal.metadata?.createdAt || (deal as DealWithLegacy).createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {relatedDeals.length === 0 && !contact.lastContactDate && (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const InteractionsTab = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Interactions History</h3>
        <Button onClick={() => { setEditingInteraction(undefined); setShowInteractionForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Log Interaction
        </Button>
      </div>

      {interactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No interactions recorded yet</p>
            <Button variant="outline" onClick={() => { setEditingInteraction(undefined); setShowInteractionForm(true); }}>
              Log Your First Interaction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <Card key={interaction.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {interaction.type === 'call' && <Phone className="h-4 w-4 text-blue-500" />}
                      {interaction.type === 'email' && <Mail className="h-4 w-4 text-green-500" />}
                      {interaction.type === 'meeting' && <Users className="h-4 w-4 text-purple-500" />}
                      {interaction.type === 'sms' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                      {interaction.type === 'note' && <FileText className="h-4 w-4 text-gray-500" />}
                      <span className="font-medium">{interaction.subject}</span>
                      <Badge variant="outline" className="text-xs">
                        {interaction.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{interaction.notes}</p>
                    {interaction.outcome && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Outcome:</span> {interaction.outcome}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(interaction.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingInteraction(interaction);
                        setShowInteractionForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this interaction?')) {
                          deleteInteraction(interaction.id);
                          setRefreshTrigger(prev => prev + 1);
                          toast.success('Interaction deleted');
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const TasksTab = () => {
    return (
      <div className="space-y-6">
        {/* Quick Add Widget - Tasks Module */}
        <TaskQuickAddWidget
          user={user}
          entityType="contact"
          entityId={contactId}
          entityName={contact.name}
          onTaskCreated={() => {
            const updatedTasks = getTasksByEntity('contact', contactId);
            setContactTasks(updatedTasks);
            setRefreshTrigger(prev => prev + 1);
            toast.success('Task created successfully');
          }}
        />

        {/* Tasks List - Tasks Module */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Contact Tasks ({contactTasks.length})
          </h3>
          {contactTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No tasks for this contact yet</p>
              <p className="text-sm text-gray-400 mt-1">Tasks will appear here when created</p>
            </div>
          ) : (
            <TaskListView
              tasks={contactTasks}
              showSelection={false}
              onViewTask={(taskId) => {
                toast.info(`View task ${taskId}`);
                // In full app: onNavigate('task-details', taskId)
              }}
              onStatusChange={(taskId, status) => {
                updateTask(taskId, { status }, user);
                const updatedTasks = getTasksByEntity('contact', contactId);
                setContactTasks(updatedTasks);
                setRefreshTrigger(prev => prev + 1);
                toast.success('Task status updated');
              }}
            />
          )}
        </div>

        {/* Legacy CRM Tasks Section - Keep for backwards compatibility */}
        {tasks.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h3 className="text-base text-amber-900">
                Legacy CRM Tasks ({tasks.length})
              </h3>
            </div>
            <p className="text-sm text-amber-800 mb-4">
              These are old-style tasks. New tasks should be created using the widget above.
            </p>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white border border-amber-300 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-gray-600">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={task.status === 'pending' ? 'default' : 'secondary'}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // Tabs Configuration
  // ============================================================================

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: <OverviewTab />,
    },
    {
      id: 'properties',
      label: 'Properties',
      badge: relatedProperties.length > 0 ? relatedProperties.length : undefined,
      content: <PropertiesTab />,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      badge: relatedDeals.length > 0 ? relatedDeals.length : undefined,
      content: <TransactionsTab />,
    },
    {
      id: 'activity',
      label: 'Activity',
      content: <ActivityTab />,
    },
    {
      id: 'interactions',
      label: 'Interactions',
      badge: interactions.length > 0 ? interactions.length : undefined,
      content: <InteractionsTab />,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      badge: contactTasks.length > 0 ? contactTasks.length : undefined,
      content: <TasksTab />,
    },
    // Conditionally add Investment Portfolio tab for investors
    ...(isInvestor ? [{
      id: 'investment-portfolio',
      label: 'Investment Portfolio',
      badge: investorInvestments.filter(inv => inv.status === 'active').length > 0 ? investorInvestments.filter(inv => inv.status === 'active').length : undefined,
      content: (
        <div className="p-6">
          <InvestorPortfolioDashboard
            investor={contact}
            user={user}
            onNavigateToProperty={(propertyId) => {
              onNavigate?.('property-detail', { propertyId });
            }}
          />
        </div>
      ),
    }] : []),
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <DetailPageTemplate
        pageHeader={{
          title: contact.name,
          breadcrumbs,
          onBack,
          metrics,
          primaryActions,
          secondaryActions,
        }}
        tabs={tabs}
        defaultTab="overview"
      />

      {/* Add Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
            <DialogDescription>
              Add a tag to organize and categorize this contact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tag">Tag Name</Label>
              <Input
                id="tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g., VIP, Hot Lead, Investor"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTag} disabled={!newTag.trim()}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Follow-up Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Follow-up Reminder</DialogTitle>
            <DialogDescription>
              Schedule a follow-up date to stay on top of your contacts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="followUpDate">Follow-up Date</Label>
              <Input
                id="followUpDate"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="followUpNotes">Notes (Optional)</Label>
              <Input
                id="followUpNotes"
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Reminder notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetFollowUp} disabled={!followUpDate}>
              Set Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interaction Form Dialog */}
      <Dialog open={showInteractionForm} onOpenChange={setShowInteractionForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingInteraction ? 'Edit Interaction' : 'Log New Interaction'}</DialogTitle>
            <DialogDescription>
              {editingInteraction ? 'Update the interaction details' : 'Record a new interaction with this contact'}
            </DialogDescription>
          </DialogHeader>
          <InteractionForm
            contactId={contactId}
            user={user}
            interaction={editingInteraction}
            onSuccess={() => {
              setShowInteractionForm(false);
              setEditingInteraction(undefined);
              setRefreshTrigger(prev => prev + 1);
            }}
            onCancel={() => {
              setShowInteractionForm(false);
              setEditingInteraction(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Task Form Dialog */}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update the task details' : 'Create a new task for this contact'}
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            contactId={contactId}
            user={user}
            task={editingTask}
            onSuccess={() => {
              setShowTaskForm(false);
              setEditingTask(undefined);
              setRefreshTrigger(prev => prev + 1);
            }}
            onCancel={() => {
              setShowTaskForm(false);
              setEditingTask(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactDetailsEnhanced;
