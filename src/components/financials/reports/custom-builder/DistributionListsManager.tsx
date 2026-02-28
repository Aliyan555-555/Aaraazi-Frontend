/**
 * DistributionListsManager Component
 * 
 * Manage email distribution lists for automated report delivery.
 * 
 * Features:
 * - Create distribution lists
 * - Add/remove recipients
 * - Edit list details
 * - Delete lists
 * - View usage statistics
 * 
 * Design System V4.1 Compliant
 */

import React, { useState, useEffect } from 'react';
import { User } from '../../../../types';
// [STUBBED] import {
// [STUBBED]   getDistributionLists,
// [STUBBED]   createDistributionList,
// [STUBBED]   updateDistributionList,
// [STUBBED]   deleteDistributionList,
// [STUBBED]   isValidEmail,
// [STUBBED]   DistributionList,
// [STUBBED] } from '../../../../lib/report-distribution';
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
  Users,
  Plus,
  X,
  Edit2,
  Trash2,
  Mail,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const getDistributionLists = (..._args: any[]): any => { /* stub - prototype function removed */ };
const createDistributionList = (..._args: any[]): any => { /* stub - prototype function removed */ };
const updateDistributionList = (..._args: any[]): any => { /* stub - prototype function removed */ };
const deleteDistributionList = (..._args: any[]): any => { /* stub - prototype function removed */ };
const isValidEmail = (..._args: any[]): any => { /* stub - prototype function removed */ };
type DistributionList = any;
// ===== END STUBS =====


interface DistributionListsManagerProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

export const DistributionListsManager: React.FC<DistributionListsManagerProps> = ({
  open,
  onClose,
  user,
}) => {
  const [lists, setLists] = useState<DistributionList[]>([]);
  const [editingList, setEditingList] = useState<DistributionList | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [listName, setListName] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');

  // Load lists
  useEffect(() => {
    if (open) {
      loadLists();
    }
  }, [open]);

  const loadLists = () => {
    setLists(getDistributionLists());
  };

  // Reset form
  const resetForm = () => {
    setListName('');
    setRecipients([]);
    setCurrentEmail('');
    setEditingList(null);
    setIsCreating(false);
  };

  // Start creating
  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  // Start editing
  const handleStartEdit = (list: DistributionList) => {
    setEditingList(list);
    setListName(list.name);
    setRecipients([...list.recipients]);
    setCurrentEmail('');
    setIsCreating(false);
  };

  // Add recipient
  const handleAddRecipient = () => {
    const email = currentEmail.trim();
    
    if (!email) {
      return;
    }
    
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (recipients.includes(email)) {
      toast.error('Email already added');
      return;
    }
    
    setRecipients([...recipients, email]);
    setCurrentEmail('');
  };

  // Remove recipient
  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  // Save list
  const handleSave = () => {
    if (!listName.trim()) {
      toast.error('Please enter a list name');
      return;
    }
    
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    
    try {
      if (editingList) {
        // Update existing list
        updateDistributionList(editingList.id, {
          name: listName,
          recipients,
        });
        toast.success('Distribution list updated');
      } else {
        // Create new list
        createDistributionList(listName, recipients, user.id);
        toast.success('Distribution list created');
      }
      
      loadLists();
      resetForm();
    } catch (error) {
      toast.error('Failed to save distribution list');
    }
  };

  // Delete list
  const handleDelete = (listId: string) => {
    if (!confirm('Are you sure you want to delete this distribution list?')) {
      return;
    }
    
    try {
      deleteDistributionList(listId);
      toast.success('Distribution list deleted');
      loadLists();
      
      if (editingList?.id === listId) {
        resetForm();
      }
    } catch (error) {
      toast.error('Failed to delete distribution list');
    }
  };

  const isEditing = editingList !== null || isCreating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Distribution Lists</DialogTitle>
          <DialogDescription>
            Manage email distribution lists for automated report delivery
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Lists Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900">Your Lists</h3>
              <Button
                size="sm"
                onClick={handleStartCreate}
                disabled={isEditing}
              >
                <Plus className="h-4 w-4 mr-2" />
                New List
              </Button>
            </div>

            {lists.length === 0 ? (
              <div className="p-8 text-center border border-gray-300 rounded-lg">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No distribution lists yet</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartCreate}
                  className="mt-3"
                >
                  Create First List
                </Button>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg divide-y divide-gray-300">
                {lists.map(list => (
                  <div
                    key={list.id}
                    className={`p-3 hover:bg-gray-50 ${
                      editingList?.id === list.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900">{list.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {list.recipients.length} recipient{list.recipients.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(list)}
                          disabled={isEditing && editingList?.id !== list.id}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(list.id)}
                          disabled={isEditing}
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

          {/* Edit/Create Form Column */}
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-900">
                    {editingList ? 'Edit List' : 'Create List'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4 p-4 border border-gray-300 rounded-lg">
                  {/* List Name */}
                  <div className="space-y-2">
                    <Label>List Name</Label>
                    <Input
                      placeholder="e.g., Finance Team, Executives"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                    />
                  </div>

                  {/* Recipients */}
                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter email address"
                        value={currentEmail}
                        onChange={(e) => setCurrentEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRecipient();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddRecipient}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Recipients List */}
                    {recipients.length > 0 && (
                      <div className="space-y-1 mt-2 max-h-64 overflow-y-auto">
                        {recipients.map(email => (
                          <div
                            key={email}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                          >
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-gray-500" />
                              <span className="text-sm text-gray-900">{email}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveRecipient(email)}
                              className="hover:bg-gray-200 rounded p-1"
                            >
                              <X className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!listName.trim() || recipients.length === 0}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingList ? 'Update List' : 'Create List'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center border border-gray-300 rounded-lg">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-900 mb-1">Select a list to edit</p>
                <p className="text-sm text-gray-600">
                  or create a new distribution list
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-300">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
