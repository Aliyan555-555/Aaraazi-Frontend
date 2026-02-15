import React, { useMemo, useState } from 'react';
import { useConfirmStore } from '@/store/useConfirmStore';
import { DetailPageTemplate } from '../layout/DetailPageTemplate';
// Import types from schema to match backend/prisma exactly
import { Contact, ContactStatus, ContactType, ContactCategory } from '@/types/schema';
import { User } from '../../types'; // User might still be in legacy types
import { formatPKR } from '../../lib/currency';
import { useContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts';
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
  AlertCircle,
  Plus,
  X,
  Archive,
  Bell,
  BellOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { toast } from 'sonner';

// Helper for parsing JSON preferences
const getContactPreferences = (contact: Contact) => {
  if (!contact.preferences) return {};
  if (typeof contact.preferences === 'string') {
    try {
      return JSON.parse(contact.preferences);
    } catch {
      return {};
    }
  }
  return contact.preferences as Record<string, any>;
};

export interface ContactDetailsProps {
  contactId: string;
  user: User;
  onBack: () => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
}

export const ContactDetails: React.FC<ContactDetailsProps> = ({
  contactId,
  user,
  onBack,
  onEdit,
  onDelete,
}) => {
  // State for UI interactions
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  // Hooks
  const { data: contact, isLoading, error } = useContact(contactId);
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();

  // Derived state
  const preferences = useMemo(() => contact ? getContactPreferences(contact) : {}, [contact]);
  const notes = preferences.notes || '';
  const company = preferences.company || '';

  // Tag handling
  const tags = useMemo(() => {
    if (!contact?.tags) return [];
    if (typeof contact.tags === 'string') {
      const t = contact.tags.split(',').map(s => s.trim()).filter(Boolean);
      return t;
    }
    return [];
  }, [contact?.tags]);

  // Check follow-up status
  const followUpStatus = useMemo(() => {
    // Check both potential locations for nextFollowUp
    const dateStr = contact?.nextFollowUp || preferences.nextFollowUp;
    if (!dateStr) return null;

    const followUp = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    followUp.setHours(0, 0, 0, 0);

    if (followUp < today) return 'overdue';
    if (followUp.getTime() === today.getTime()) return 'due';
    return 'upcoming';
  }, [contact?.nextFollowUp, preferences.nextFollowUp]);

  // Handle Actions
  const handleCall = () => {
    if (contact?.phone) {
      window.location.href = `tel:${contact.phone}`;
      toast.success(`Calling ${contact.name}...`);

      // Attempt to update lastContactDate if backend supports it, otherwise ignore
      // Since it's marked frontend-only, we might store it in preferences?
      // For now, skipping to avoid errors.
    }
  };

  const handleEmail = () => {
    if (contact?.email) {
      window.location.href = `mailto:${contact.email}`;
      toast.success(`Opening email to ${contact.name}...`);
    } else {
      toast.error('No email address available');
    }
  };

  const handleEditClick = () => {
    if (contact && onEdit) onEdit(contact);
  };

  const handleDelete = async () => {
    if (!contact) return;

    useConfirmStore.getState().ask({
      title: 'Delete Contact',
      description: `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteContactMutation.mutateAsync(contact.id);
          if (onDelete) onDelete(contact.id);
          onBack();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const handleChangeStatus = async (newStatus: ContactStatus) => {
    if (!contact) return;
    await updateContactMutation.mutateAsync({
      id: contact.id,
      data: { status: newStatus }
    });
  };

  const handleAddTag = async () => {
    if (!contact || !newTag.trim()) return;
    const currentTags = tags;
    if (!currentTags.includes(newTag.trim())) {
      const updatedTags = [...currentTags, newTag.trim()].join(',');
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: { tags: updatedTags }
      });
      setNewTag('');
      setShowTagDialog(false);
    } else {
      toast.error('Tag already exists');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!contact) return;
    const currentTags = tags;
    const updatedTags = currentTags.filter(t => t !== tagToRemove).join(',');
    await updateContactMutation.mutateAsync({
      id: contact.id,
      data: { tags: updatedTags }
    });
    toast.success('Tag removed');
  };

  const handleSetFollowUp = async () => {
    if (contact && followUpDate) {
      // Store in preferences as backup for frontend-only field
      const newPrefs = { ...getContactPreferences(contact), nextFollowUp: followUpDate };
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: { preferences: JSON.stringify(newPrefs) }
      });
      setShowFollowUpDialog(false);
      setFollowUpDate('');
    }
  };

  const handleClearFollowUp = async () => {
    if (!contact) return;
    const newPrefs = { ...getContactPreferences(contact) };
    delete newPrefs.nextFollowUp;
    await updateContactMutation.mutateAsync({
      id: contact.id,
      data: { preferences: JSON.stringify(newPrefs) }
    });
    toast.success('Follow-up cleared');
  };

  const effectiveFollowUp = contact?.nextFollowUp || preferences.nextFollowUp;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !contact) {
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

  // Calculate stats (Mocked as 0 since backend doesn't provide them yet)
  const metrics = [
    {
      label: 'Total Transactions',
      value: 0,
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      label: 'Properties',
      value: 0,
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: 'Total Value',
      value: formatPKR(0),
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      label: 'Commission',
      value: formatPKR(0),
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

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

  const secondaryActions = [
    {
      label: 'Message',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => toast.info('Coming soon'),
    },
    {
      label: 'Set Follow-up',
      icon: <Bell className="h-4 w-4" />,
      onClick: () => setShowFollowUpDialog(true),
    },
    {
      label: effectiveFollowUp ? 'Clear Follow-up' : 'No Follow-up',
      icon: <BellOff className="h-4 w-4" />,
      onClick: handleClearFollowUp,
      disabled: !effectiveFollowUp,
    },
    {
      label: 'Edit Contact',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditClick,
    },
    {
      label: contact.status === ContactStatus.ACTIVE ? 'Mark Inactive' : 'Mark Active',
      icon: contact.status === ContactStatus.ACTIVE ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />,
      onClick: () => handleChangeStatus(contact.status === ContactStatus.ACTIVE ? ContactStatus.INACTIVE : ContactStatus.ACTIVE),
    },
    {
      label: contact.status === ContactStatus.ARCHIVED ? 'Unarchive' : 'Archive',
      icon: <Archive className="h-4 w-4" />,
      onClick: () => handleChangeStatus(contact.status === ContactStatus.ARCHIVED ? ContactStatus.ACTIVE : ContactStatus.ARCHIVED),
    },
    {
      label: 'Delete Contact',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: 'destructive' as const,
    },
  ];

  const OverviewTab = () => {
    let fStatus: 'overdue' | 'due' | 'upcoming' | null = null;
    if (effectiveFollowUp) {
      const fuDate = new Date(effectiveFollowUp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      fuDate.setHours(0, 0, 0, 0);
      if (fuDate < today) fStatus = 'overdue';
      else if (fuDate.getTime() === today.getTime()) fStatus = 'due';
      else fStatus = 'upcoming';
    }

    return (
      <div className="p-6 space-y-6">
        {/* Follow-up Alert */}
        {fStatus && (
          <Card className={`border-2 ${fStatus === 'overdue' ? 'border-red-500 bg-red-50' :
            fStatus === 'due' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Bell className={`h-5 w-5 ${fStatus === 'overdue' ? 'text-red-600' :
                  fStatus === 'due' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                <div>
                  <p className="font-medium">
                    {fStatus === 'overdue' ? 'Overdue Follow-up' :
                      fStatus === 'due' ? 'Follow-up Due Today' :
                        'Upcoming Follow-up'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Scheduled for {new Date(effectiveFollowUp!).toLocaleDateString('en-US', {
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
              {/* Name */}
              <div className="flex items-start gap-3">
                <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{contact?.name}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{contact?.phone}</p>
                </div>
              </div>

              {/* Email */}
              {contact?.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{contact.email}</p>
                  </div>
                </div>
              )}

              {/* Company */}
              {company && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{company}</p>
                  </div>
                </div>
              )}

              {/* Type */}
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">
                    {contact?.type} / {contact?.category}
                  </Badge>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{contact?.status}</Badge>
                </div>
              </div>

              {/* Last Contact */}
              {contact?.lastContactDate && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Contact</p>
                    <p className="font-medium">
                      {new Date(contact.lastContactDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Address */}
              {contact?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{contact.address}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Tags */}
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
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
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

            {/* Notes */}
            {notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const PropertiesTab = () => (
    <div className="p-12 text-center text-muted-foreground">
      <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>Related properties will appear here.</p>
    </div>
  );

  const TransactionsTab = () => (
    <div className="p-12 text-center text-muted-foreground">
      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>Transaction history will appear here.</p>
    </div>
  );

  const ActivityTab = () => (
    <div className="p-12 text-center text-muted-foreground">
      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>Activity logs will appear here.</p>
    </div>
  );

  return (
    <>
      <DetailPageTemplate
        pageHeader={{
          title: contact.name,
          subtitle: contact.type.toString(), // Ensure string if enum
          status: { label: contact.status.toString(), variant: contact.status === ContactStatus.ACTIVE ? 'success' : 'default' },
          onBack: onBack,
          primaryActions: primaryActions,
          secondaryActions: secondaryActions,
          metrics: metrics
        }}
        tabs={[
          { id: 'overview', label: 'Overview', content: <OverviewTab /> },
          { id: 'properties', label: 'Properties', content: <PropertiesTab /> },
          { id: 'transactions', label: 'Transactions', content: <TransactionsTab /> },
          { id: 'activity', label: 'Activity', content: <ActivityTab /> },
        ]}
      />

      {/* Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tag</DialogTitle>
            <DialogDescription>
              Add a tag to organize your contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="e.g. Lead, VIP, Referral"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTag}>Add Tag</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Follow Up Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Follow-up Date</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>Cancel</Button>
            <Button onClick={handleSetFollowUp} disabled={!followUpDate}>Set Date</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};