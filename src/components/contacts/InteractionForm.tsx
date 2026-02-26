/**
 * InteractionForm Component
 * Form for creating and editing contact interactions
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CRMInteraction, User } from '../../types';
// import { addInteraction, updateInteraction, getProperties } from '../../lib/data';
// [STUBBED] import { getProperties } from '../../lib/data';
const getProperties = (..._args: any[]): any[] => [];
import { formatPropertyAddress } from '../../lib/utils';
import { Phone, Mail, MessageSquare, Video, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface InteractionFormProps {
  contactId: string;
  user: User;
  interaction?: CRMInteraction;
  onSuccess: () => void;
  onCancel: () => void;
}

export const InteractionForm: React.FC<InteractionFormProps> = ({
  contactId,
  user,
  interaction,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    type: interaction?.type || 'call' as CRMInteraction['type'],
    subject: interaction?.subject || '',
    notes: interaction?.notes || '',
    date: interaction?.date ? (typeof interaction.date === 'string' ? interaction.date : interaction.date.toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    outcome: interaction?.outcome || '',
    propertyId: '', // CRMInteraction doesn't have propertyId in schema
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const properties = getProperties(user.id, user.role);

  const interactionTypes = [
    { value: 'call', label: 'Phone Call', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'meeting', label: 'Meeting', icon: Video },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'viewing', label: 'Property Viewing', icon: Eye },
    { value: 'note', label: 'Note', icon: FileText },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (interaction) {
        // Update existing interaction
        // TODO: Implement updateInteraction API call
        const success = false; // updateInteraction(interaction.id, formData);
        if (success) {
          toast.success('Interaction updated successfully');
          onSuccess();
        } else {
          toast.error('Failed to update interaction');
        }
      } else {
        // Create new interaction
        // TODO: Implement addInteraction API call
        const newInteraction = null; // addInteraction({ ...formData, contactId, agentId: user.id });

        if (newInteraction) {
          toast.success('Interaction logged successfully');
          onSuccess();
        } else {
          toast.error('Failed to log interaction');
        }
      }
    } catch (error) {
      console.error('Error saving interaction:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Interaction Type*</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CRMInteraction['type'] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {interactionTypes.map(type => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date*</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject*</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="Brief description of the interaction"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes*</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Detailed notes about this interaction..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outcome">Outcome</Label>
        <Input
          id="outcome"
          value={formData.outcome}
          onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
          placeholder="Result or next steps (optional)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="propertyId">Related Property</Label>
        <Select
          value={formData.propertyId || 'none'}
          onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value === 'none' ? '' : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select property (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {properties.map(property => (
              <SelectItem key={property.id} value={property.id}>
                {property.title || formatPropertyAddress(property.address) || 'Untitled Property'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : interaction ? 'Update Interaction' : 'Log Interaction'}
        </Button>
      </div>
    </form>
  );
};
