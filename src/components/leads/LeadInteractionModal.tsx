/**
 * Lead Interaction Modal
 * 
 * Add interactions to leads:
 * - Phone calls (inbound/outbound)
 * - Emails (sent/received)
 * - WhatsApp messages
 * - Meetings
 * - Notes
 */

import React, { useState } from 'react';
import { Loader2, Phone, Mail, MessageSquare, Calendar, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { LeadInteractionType, LeadInteractionDirection } from '../../types/leads';
// [STUBBED] import { addLeadInteraction, getLeadById } from '../../lib/leads';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const addLeadInteraction = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getLeadById = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface LeadInteractionModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  user: {
    id: string;
    name: string;
  };
  onSuccess: () => void;
}

export function LeadInteractionModal({
  open,
  onClose,
  leadId,
  user,
  onSuccess
}: LeadInteractionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'call' as LeadInteractionType,
    direction: 'outbound' as LeadInteractionDirection,
    summary: '',
    notes: '',
    duration: '' as string,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const lead = getLeadById(leadId);

  if (!lead) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const newErrors: Record<string, string> = {};

    if (!formData.summary.trim()) {
      newErrors.summary = 'Summary is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      addLeadInteraction(leadId, {
        type: formData.type,
        direction: formData.direction,
        summary: formData.summary.trim(),
        notes: formData.notes.trim() || undefined,
        durationMinutes: formData.duration ? Number(formData.duration) : undefined,
        agentId: user.id,
        agentName: user.name,
      });

      toast.success('Interaction added successfully');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to add interaction:', error);
      toast.error('Failed to add interaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'call',
      direction: 'outbound',
      summary: '',
      notes: '',
      duration: '',
    });
    setErrors({});
    onClose();
  };

  // Interaction type options
  const interactionTypes = [
    { value: 'call', label: 'Phone Call', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'meeting', label: 'Meeting', icon: Calendar },
    { value: 'note', label: 'Note', icon: FileText },
  ];

  const selectedType = interactionTypes.find(t => t.value === formData.type);
  const TypeIcon = selectedType?.icon || FileText;

  // Show direction for applicable types
  const showDirection = ['call', 'email', 'whatsapp'].includes(formData.type);

  // Show duration for applicable types
  const showDuration = ['call', 'meeting'].includes(formData.type);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Interaction: {lead.name}</DialogTitle>
          <DialogDescription>
            Add a new interaction to track your communication with {lead.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Interaction Type */}
          <div>
            <Label htmlFor="type">
              Interaction Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as LeadInteractionType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interactionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Direction (for phone, email, whatsapp) */}
          {showDirection && (
            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={formData.direction}
                onValueChange={(value) => setFormData({ ...formData, direction: value as LeadInteractionDirection })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound (Received)</SelectItem>
                  <SelectItem value="outbound">Outbound (Initiated)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Summary */}
          <div>
            <Label htmlFor="summary">
              Summary <span className="text-red-500">*</span>
            </Label>
            <Input
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder={
                formData.type === 'call' ? 'Brief summary of the call...' :
                  formData.type === 'email' ? 'Email subject or key point...' :
                    formData.type === 'whatsapp' ? 'WhatsApp conversation summary...' :
                      formData.type === 'meeting' ? 'Meeting topic or purpose...' :
                        'Note summary...'
              }
              className={errors.summary ? 'border-red-500' : ''}
            />
            {errors.summary && (
              <p className="text-red-500 mt-1 text-sm">{errors.summary}</p>
            )}
          </div>

          {/* Duration (for phone calls and meetings) */}
          {showDuration && (
            <div>
              <Label htmlFor="duration">
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="15"
                min="1"
              />
            </div>
          )}

          {/* Detailed Notes */}
          <div>
            <Label htmlFor="notes">Detailed Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={
                formData.type === 'call' ? 'Call details, topics discussed, follow-up actions...' :
                  formData.type === 'email' ? 'Email content or key points discussed...' :
                    formData.type === 'whatsapp' ? 'WhatsApp conversation details...' :
                      formData.type === 'meeting' ? 'Meeting notes, decisions made, action items...' :
                        'Additional details...'
              }
              rows={5}
            />
          </div>

          {/* Quick Templates */}
          {formData.type === 'call' && (
            <div className="bg-gray-50 rounded-lg p-3">
              <Label className="mb-2 block text-sm">Quick Templates</Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => setFormData({
                    ...formData,
                    summary: 'Initial contact - Discussed requirements',
                    notes: 'Lead is interested. Scheduled follow-up call.'
                  })}
                >
                  Initial Contact
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => setFormData({
                    ...formData,
                    summary: 'Follow-up call',
                    notes: 'Discussed property options and next steps.'
                  })}
                >
                  Follow-up
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => setFormData({
                    ...formData,
                    summary: 'Property viewing scheduled',
                    notes: 'Scheduled property viewing. Send confirmation.'
                  })}
                >
                  Viewing Scheduled
                </Badge>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <TypeIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-blue-900 text-sm">
                {formData.type === 'note' ? (
                  <p>Notes are internal-only and won't trigger status changes.</p>
                ) : (
                  <p>
                    {formData.type === 'call' && 'This will count as first contact if this is the first interaction.'}
                    {formData.type === 'email' && 'Email interactions help track communication history.'}
                    {formData.type === 'whatsapp' && 'WhatsApp interactions are logged for follow-up tracking.'}
                    {formData.type === 'meeting' && 'Meeting interactions show engagement level.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <TypeIcon className="w-4 h-4 mr-2" />
              Add {selectedType?.label}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}