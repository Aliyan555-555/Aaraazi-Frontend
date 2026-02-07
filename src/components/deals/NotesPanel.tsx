/**
 * Notes Panel Component
 * Communication and collaboration between agents
 */

import React, { useState } from 'react';
import { Deal, DealNote } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PermissionGate } from './PermissionGate';
import { 
  MessageSquare, 
  Lock, 
  Users,
  Send,
  Eye
} from 'lucide-react';
import { getUserRoleInDeal } from '../../lib/dealPermissions';

interface NotesPanelProps {
  deal: Deal;
  currentUserId: string;
  currentUserName: string;
  onAddNote?: (content: string, isPrivate: boolean) => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ 
  deal, 
  currentUserId,
  currentUserName,
  onAddNote
}) => {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState('shared');
  
  const userRole = getUserRoleInDeal(currentUserId, deal);
  const isPrimary = userRole === 'primary';
  
  // Get notes for each category
  const sharedNotes = deal.collaboration.sharedNotes || [];
  const primaryNotes = deal.collaboration.primaryAgentNotes || [];
  const secondaryNotes = deal.collaboration.secondaryAgentNotes || [];
  
  // Filter notes based on role
  const myPrivateNotes = isPrimary ? primaryNotes : secondaryNotes;
  
  const handleSubmitNote = (isPrivate: boolean) => {
    if (!newNoteContent.trim()) return;
    
    onAddNote?.(newNoteContent, isPrivate);
    setNewNoteContent('');
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes & Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shared" className="gap-2">
                <Users className="h-4 w-4" />
                Shared Notes ({sharedNotes.length})
              </TabsTrigger>
              <TabsTrigger value="private" className="gap-2">
                <Lock className="h-4 w-4" />
                My Private Notes ({myPrivateNotes.length})
              </TabsTrigger>
            </TabsList>
            
            {/* Shared Notes Tab */}
            <TabsContent value="shared" className="space-y-4 mt-4">
              {/* Add Note Form */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a shared note that both agents can see..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    💡 Shared notes are visible to both primary and secondary agents
                  </p>
                  <Button 
                    onClick={() => handleSubmitNote(false)}
                    disabled={!newNoteContent.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post Note
                  </Button>
                </div>
              </div>
              
              {/* Notes List */}
              <div className="space-y-3 mt-6">
                {sharedNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No shared notes yet</p>
                    <p className="text-sm mt-2">Start the conversation by adding a note above</p>
                  </div>
                ) : (
                  sharedNotes.map(note => (
                    <NoteItem 
                      key={note.id} 
                      note={note} 
                      currentUserId={currentUserId}
                      deal={deal}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            
            {/* Private Notes Tab */}
            <TabsContent value="private" className="space-y-4 mt-4">
              {/* Add Private Note Form */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a private note only you can see..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    🔒 Private notes are only visible to you
                  </p>
                  <Button 
                    onClick={() => handleSubmitNote(true)}
                    disabled={!newNoteContent.trim()}
                    size="sm"
                    variant="outline"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Add Private Note
                  </Button>
                </div>
              </div>
              
              {/* Private Notes List */}
              <div className="space-y-3 mt-6">
                {myPrivateNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No private notes yet</p>
                    <p className="text-sm mt-2">Add private reminders and observations</p>
                  </div>
                ) : (
                  myPrivateNotes.map(note => (
                    <NoteItem 
                      key={note.id} 
                      note={note} 
                      currentUserId={currentUserId}
                      deal={deal}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Communication Log */}
      {deal.collaboration.communications && deal.collaboration.communications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Communication Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deal.collaboration.communications.map(comm => (
                <div key={comm.id} className="p-3 border rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{comm.from.agentName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comm.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {comm.to && (
                    <div className="text-xs text-muted-foreground mb-2">
                      To: {comm.to.agentName}
                    </div>
                  )}
                  <p className="text-muted-foreground">{comm.message}</p>
                  {comm.type && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {comm.type}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Last Update Info */}
      {deal.collaboration.lastUpdatedBy && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>
                Last updated by {deal.collaboration.lastUpdatedBy.agentName} •{' '}
                {new Date(deal.collaboration.lastUpdatedBy.timestamp).toLocaleString()} •{' '}
                {deal.collaboration.lastUpdatedBy.action}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Note Item Component
interface NoteItemProps {
  note: DealNote;
  currentUserId: string;
  deal: Deal;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, currentUserId, deal }) => {
  const isMyNote = note.createdBy.agentId === currentUserId;
  
  return (
    <div className={`p-4 border rounded-lg ${isMyNote ? 'bg-blue-50 border-blue-200' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{note.createdBy.agentName}</span>
          {isMyNote && (
            <Badge variant="outline" className="text-xs">You</Badge>
          )}
          {note.isPrivate && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Lock className="h-3 w-3" />
              Private
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(note.createdAt).toLocaleString()}
        </span>
      </div>
      
      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
      
      {note.updatedAt !== note.createdAt && (
        <div className="text-xs text-muted-foreground mt-2">
          (Edited {new Date(note.updatedAt).toLocaleString()})
        </div>
      )}
    </div>
  );
};
