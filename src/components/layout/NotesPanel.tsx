/**
 * NotesPanel - Display and manage notes/comments
 * 
 * Features:
 * - Chronological note display
 * - Add new notes
 * - Edit/delete existing notes
 * - User attribution
 * - Timestamps
 * - Pin important notes
 * - Filter by user/date
 * 
 * Usage:
 * <NotesPanel
 *   notes={notes}
 *   currentUser={user}
 *   onAdd={handleAddNote}
 *   onEdit={handleEditNote}
 *   onDelete={handleDeleteNote}
 *   onPin={handlePinNote}
 * />
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Pin,
  User,
  Calendar,
  Send,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  type?: 'internal' | 'client' | 'general';
}

export interface NotesPanelProps {
  notes: Note[];
  currentUserId: string;
  currentUserName: string;
  title?: string;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canPin?: boolean;
  onAdd?: (content: string, type: 'internal' | 'client' | 'general') => void;
  onEdit?: (noteId: string, content: string) => void;
  onDelete?: (noteId: string) => void;
  onPin?: (noteId: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function NotesPanel({
  notes,
  currentUserId,
  currentUserName,
  title = 'Notes & Comments',
  canAdd = true,
  canEdit = true,
  canDelete = true,
  canPin = false,
  onAdd,
  onEdit,
  onDelete,
  onPin,
  placeholder = 'Add a note...',
  emptyMessage = 'No notes yet. Add your first note above.',
  className = '',
}: NotesPanelProps) {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'internal' | 'client' | 'general'>('general');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Handle add note
  const handleAddNote = () => {
    if (newNote.trim() && onAdd) {
      onAdd(newNote.trim(), noteType);
      setNewNote('');
      setNoteType('general');
    }
  };

  // Handle edit note
  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editingNoteId && onEdit) {
      onEdit(editingNoteId, editContent.trim());
      setEditingNoteId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  // Get type badge color
  const getTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      internal: 'bg-yellow-100 text-yellow-800',
      client: 'bg-blue-100 text-blue-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return type ? colors[type] : colors.general;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-400" />
          <h3 className="text-base font-medium text-[#030213]">{title}</h3>
          <Badge variant="secondary">{notes.length}</Badge>
        </div>
      </div>

      {/* Add New Note */}
      {canAdd && onAdd && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            {/* Note Type Selector */}
            <div className="flex gap-2">
              {(['general', 'internal', 'client'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNoteType(type)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    noteType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Text Area */}
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            {/* Add Button */}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`p-4 ${note.isPinned ? 'bg-yellow-50' : 'hover:bg-gray-50'} transition-colors`}
            >
              {/* Note Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-[#030213]">
                    {note.createdByName}
                  </span>
                  {note.type && (
                    <Badge className={getTypeColor(note.type)} variant="secondary">
                      {note.type}
                    </Badge>
                  )}
                  {note.isPinned && (
                    <Badge variant="default" className="bg-yellow-600">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {canPin && onPin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onPin(note.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Pin
                        className={`h-3 w-3 ${note.isPinned ? 'fill-yellow-600 text-yellow-600' : ''}`}
                      />
                    </Button>
                  )}
                  {canEdit && note.createdBy === currentUserId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(note)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  {canDelete && note.createdBy === currentUserId && onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(note.id)}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Note Content */}
              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                  {note.content}
                </p>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatRelativeTime(note.createdAt)}</span>
                {note.updatedAt && note.updatedAt !== note.createdAt && (
                  <span className="text-gray-400">(edited)</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
