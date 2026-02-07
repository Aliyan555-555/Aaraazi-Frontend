/**
 * ShareReportModal Component
 * 
 * Allows users to share report templates with other users
 * Supports user selection, permission levels, and access management
 * 
 * @version 2.0.0
 */

import React, { useState, useMemo } from 'react';
import {
  Share2,
  Users,
  X,
  Check,
  Search,
  UserPlus,
  Lock,
  Globe,
  Trash2,
  AlertCircle,
  Mail
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Avatar } from '../ui/avatar';
import { ReportTemplate } from '../../types/reports';
import { toast } from 'sonner';
import { saveReportTemplate } from '../../lib/reports';
import { getCurrentUser } from '../../lib/auth';
import { getContacts } from '../../lib/data';

interface ShareReportModalProps {
  open: boolean;
  onClose: () => void;
  template: ReportTemplate;
  onTemplateUpdate: (template: ReportTemplate) => void;
}

interface ShareRecipient {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function ShareReportModal({
  open,
  onClose,
  template,
  onTemplateUpdate
}: ShareReportModalProps) {
  const user = getCurrentUser();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>(template.sharedWith || []);
  const [isPublic, setIsPublic] = useState(template.isShared || false);
  const [isSaving, setIsSaving] = useState(false);

  // Get all available users (from contacts or team members)
  const allUsers = useMemo((): ShareRecipient[] => {
    const contacts = getContacts();

    // Convert contacts to share recipients
    const recipients: ShareRecipient[] = contacts
      .filter(c => c.email) // Only contacts with email
      .map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        role: c.type || 'Contact'
      }));

    // Add current user's team members if in SaaS mode
    if (saasUser?.organizationId) {
      // TODO: Fetch team members from organization
      // For now, we'll just use contacts
    }

    return recipients;
  }, [saasUser]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers;

    const query = searchQuery.toLowerCase();
    return allUsers.filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);

  // Get selected user details
  const sharedWithUsers = useMemo(() => {
    return selectedUsers
      .map(id => allUsers.find(u => u.id === id))
      .filter(Boolean) as ShareRecipient[];
  }, [selectedUsers, allUsers]);

  // Toggle user selection
  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Remove user from shared list
  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(id => id !== userId));
  };

  // Handle save
  const handleSave = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setIsSaving(true);

    try {
      const updatedTemplate: ReportTemplate = {
        ...template,
        isShared: isPublic || selectedUsers.length > 0,
        sharedWith: selectedUsers,
        updatedAt: new Date().toISOString(),
      };

      saveReportTemplate(updatedTemplate);
      onTemplateUpdate(updatedTemplate);

      toast.success(
        selectedUsers.length > 0
          ? `Report shared with ${selectedUsers.length} user(s)`
          : 'Report sharing updated'
      );

      onClose();
    } catch (error) {
      console.error('Error sharing report:', error);
      toast.error('Failed to share report');
    } finally {
      setIsSaving(false);
    }
  };

  // Get user initials
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if user is owner
  const isOwner = user?.id === template.createdBy;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
            Share Report
          </DialogTitle>
          <DialogDescription>
            Share "{template.name}" with other users in your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Owner Info */}
          {!isOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Shared with you
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This report was shared with you. Only the owner can modify sharing settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isOwner && (
            <>
              {/* Public Access Toggle */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-heading)' }}>
                        Make report public
                      </p>
                      <p className="text-sm text-gray-600">
                        Anyone in your organization can view this report
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </Card>

              {/* Currently Shared With */}
              {sharedWithUsers.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                    <h3 className="font-medium" style={{ color: 'var(--color-heading)' }}>
                      Shared with ({sharedWithUsers.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {sharedWithUsers.map(recipient => (
                      <div
                        key={recipient.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            {getInitials(recipient.name)}
                          </div>
                          <div>
                            <p className="font-medium">{recipient.name}</p>
                            <p className="text-sm text-gray-600">{recipient.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUser(recipient.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Add People */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                  <h3 className="font-medium" style={{ color: 'var(--color-heading)' }}>
                    Add people
                  </h3>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* User List */}
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No users found</p>
                    </div>
                  ) : (
                    filteredUsers.map(recipient => {
                      const isSelected = selectedUsers.includes(recipient.id);

                      return (
                        <button
                          key={recipient.id}
                          onClick={() => toggleUser(recipient.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isSelected
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-5'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${isSelected ? '' : 'bg-gray-400'
                                }`}
                              style={isSelected ? { backgroundColor: 'var(--color-primary)' } : undefined}
                            >
                              {getInitials(recipient.name)}
                            </div>
                            <div className="text-left">
                              <p className="font-medium">{recipient.name}</p>
                              <p className="text-sm text-gray-600">{recipient.email}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Info Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Sharing Permissions
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Users you share with can view and run this report template, but cannot
                      edit or delete it. Only you (the owner) can modify the template or
                      sharing settings.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
