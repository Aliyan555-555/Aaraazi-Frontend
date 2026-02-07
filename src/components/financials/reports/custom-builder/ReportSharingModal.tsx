/**
 * ReportSharingModal Component
 * 
 * Share custom report templates with team members.
 * 
 * Features:
 * - Select users to share with
 * - Set view/edit permissions
 * - Manage existing shares
 * - Revoke access
 * - View sharing statistics
 * 
 * Design System V4.1 Compliant
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../../../types';
import { CustomReportTemplate } from '../../../../types/custom-reports';
import {
  shareReport,
  revokeShare,
  updateSharePermission,
  getTemplateShares,
  ReportShare,
  SharePermission,
} from '../../../../lib/report-sharing';
import { getContacts } from '../../../../lib/data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Badge } from '../../../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/select';
import {
  Share2,
  Users,
  Eye,
  Edit2,
  X,
  Search,
  UserPlus,
  Trash2,
  Crown,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportSharingModalProps {
  open: boolean;
  onClose: () => void;
  template: CustomReportTemplate;
  user: User;
  onUpdate?: () => void;
}

export const ReportSharingModal: React.FC<ReportSharingModalProps> = ({
  open,
  onClose,
  template,
  user,
  onUpdate,
}) => {
  const [shares, setShares] = useState<ReportShare[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<SharePermission>('view');
  
  // Load contacts and shares
  const contacts = useMemo(() => {
    return getContacts().filter(contact => 
      contact.type === 'agent' && contact.id !== user.id
    );
  }, [user.id]);

  // Load shares
  useEffect(() => {
    if (open) {
      loadShares();
    }
  }, [open, template.id]);

  const loadShares = () => {
    setShares(getTemplateShares(template.id));
  };

  // Get available users to share with (not already shared)
  const availableUsers = useMemo(() => {
    const sharedUserIds = new Set(shares.map(s => s.sharedWith));
    return contacts.filter(contact => !sharedUserIds.has(contact.id));
  }, [contacts, shares]);

  // Filter available users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return availableUsers;
    
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [availableUsers, searchQuery]);

  // Handle share
  const handleShare = () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }
    
    const selectedUser = contacts.find(c => c.id === selectedUserId);
    if (!selectedUser) {
      toast.error('User not found');
      return;
    }
    
    try {
      shareReport(
        template,
        user.id,
        selectedUserId,
        selectedUser.name,
        selectedPermission
      );
      
      toast.success(`Shared with ${selectedUser.name}`);
      loadShares();
      setSelectedUserId('');
      setSearchQuery('');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to share report');
      console.error(error);
    }
  };

  // Handle update permission
  const handleUpdatePermission = (shareId: string, permission: SharePermission) => {
    try {
      updateSharePermission(shareId, permission);
      toast.success('Permission updated');
      loadShares();
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update permission');
    }
  };

  // Handle revoke
  const handleRevoke = (share: ReportShare) => {
    if (!confirm(`Revoke access for ${share.sharedWithName}?`)) {
      return;
    }
    
    try {
      revokeShare(share.id);
      toast.success('Access revoked');
      loadShares();
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to revoke access');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            Share Report Template
          </DialogTitle>
          <DialogDescription>
            Share "{template.name}" with team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Owner Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-900">
                You are the owner of this report template
              </span>
            </div>
          </div>

          {/* Add User */}
          <div className="space-y-3 p-4 border border-gray-300 rounded-lg">
            <Label>Share with User</Label>
            
            <div className="space-y-3">
              {/* User Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* User Selection */}
              {searchQuery && (
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No users found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => {
                            setSelectedUserId(contact.id);
                            setSearchQuery('');
                          }}
                          className="w-full p-3 hover:bg-gray-50 text-left transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                              <span className="text-sm text-blue-600">
                                {contact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900">{contact.name}</div>
                              {contact.email && (
                                <div className="text-xs text-gray-500 truncate">
                                  {contact.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected User & Permission */}
              {selectedUserId && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {contacts.find(c => c.id === selectedUserId)?.name}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Permission</Label>
                      <Select
                        value={selectedPermission}
                        onValueChange={(value: SharePermission) => setSelectedPermission(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View Only
                            </div>
                          </SelectItem>
                          <SelectItem value="edit">
                            <div className="flex items-center gap-2">
                              <Edit2 className="h-4 w-4" />
                              Can Edit
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-end">
                      <Button onClick={handleShare} className="w-full">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Shares */}
          <div className="space-y-3">
            <Label>Shared With ({shares.length})</Label>
            
            {shares.length === 0 ? (
              <div className="p-8 text-center border border-gray-300 rounded-lg">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Not shared with anyone yet
                </p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg divide-y divide-gray-300">
                {shares.map(share => (
                  <div
                    key={share.id}
                    className="p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                          <span className="text-sm text-blue-600">
                            {share.sharedWithName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900">
                            {share.sharedWithName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              Shared {new Date(share.sharedAt).toLocaleDateString()}
                            </span>
                            {share.lastAccessed && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  Last used {new Date(share.lastAccessed).toLocaleDateString()}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={share.permission}
                          onValueChange={(value: SharePermission) =>
                            handleUpdatePermission(share.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View
                              </div>
                            </SelectItem>
                            <SelectItem value="edit">
                              <div className="flex items-center gap-2">
                                <Edit2 className="h-4 w-4" />
                                Edit
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(share)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-300">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
