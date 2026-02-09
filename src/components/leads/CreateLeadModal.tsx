/**
 * Create Lead Modal
 * 
 * Quick lead creation form with:
 * - Basic contact info (name, phone, email)
 * - Source & attribution
 * - Initial intent & timeline
 * - Optional initial message
 * - Template selection for quick creation
 */

import React, { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
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
import { LeadIntent, LeadTimeline, LeadSource } from '../../types/leads';
import { createLead, validateLeadData } from '../../lib/leads';
import { LEAD_TEMPLATES, createLeadFromTemplate } from '../../lib/leadUtils';
import { triggerAutomation } from '../../lib/tasks';
import { toast } from 'sonner';

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'agent';
  };
  workspaceId: string;
  onSuccess: (leadId: string) => void;
}

export function CreateLeadModal({
  open,
  onClose,
  user,
  workspaceId,
  onSuccess
}: CreateLeadModalProps) {
  // Form state
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    alternatePhone: '',
    source: '' as LeadSource,
    sourceDetails: '',
    campaign: '',
    referredBy: '',
    initialMessage: '',
    intent: 'unknown' as LeadIntent,
    timeline: 'unknown' as LeadTimeline,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = LEAD_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData({
        ...formData,
        source: template.source,
        intent: template.intent,
        timeline: template.defaultFields.timeline || 'unknown',
      });
      toast.success(`Applied template: ${template.name}`);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.source) {
      newErrors.source = 'Source is required';
    }

    // Additional validation
    const validation = validateLeadData({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
    });

    if (!validation.valid) {
      validation.errors.forEach(error => {
        if (error.includes('phone')) newErrors.phone = error;
        if (error.includes('email')) newErrors.email = error;
        if (error.includes('name')) newErrors.name = error;
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const lead = createLead({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        alternatePhone: formData.alternatePhone.trim() || undefined,
        source: formData.source,
        sourceDetails: formData.sourceDetails.trim() || undefined,
        campaign: formData.campaign.trim() || undefined,
        referredBy: formData.referredBy.trim() || undefined,
        initialMessage: formData.initialMessage.trim() || undefined,
        intent: formData.intent,
        timeline: formData.timeline,
        agentId: user.id,
        agentName: user.name,
        createdBy: user.id,
        workspaceId,
      });

      // Trigger task automation for new lead
      const createdTasks = triggerAutomation(
        {
          type: 'entity-created',
          entityType: 'lead',
        },
        lead,
        { id: user.id, name: user.name, role: user.role, email: user.email }
      );

      if (createdTasks.length > 0) {
        toast.success(`Lead created with ${createdTasks.length} automated task${createdTasks.length > 1 ? 's' : ''}`);
      } else {
        toast.success('Lead created successfully');
      }

      onSuccess(lead.id);
      handleClose();
    } catch (error) {
      console.error('Failed to create lead:', error);
      toast.error('Failed to create lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      alternatePhone: '',
      source: '' as LeadSource,
      sourceDetails: '',
      campaign: '',
      referredBy: '',
      initialMessage: '',
      intent: 'unknown' as LeadIntent,
      timeline: 'unknown' as LeadTimeline,
    });
    setSelectedTemplate(null);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new lead.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Templates */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              Quick Templates
            </Label>
            <div className="flex flex-wrap gap-2">
              {LEAD_TEMPLATES.map((template) => (
                <Badge
                  key={template.id}
                  variant={selectedTemplate === template.id ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  {template.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Contact Information</h3>

            <div>
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                <Input
                  id="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  placeholder="+92 321 9876543"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Source & Attribution */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Source & Attribution</h3>

            <div>
              <Label htmlFor="source">
                Lead Source <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value as LeadSource })}
              >
                <SelectTrigger className={errors.source ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="phone-call">Phone Call</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social-media">Social Media</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="property-sign">Property Sign</SelectItem>
                  <SelectItem value="olx">OLX</SelectItem>
                  <SelectItem value="zameen">Zameen</SelectItem>
                  <SelectItem value="coldcall">Cold Call</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.source && (
                <p className="text-red-500 mt-1">{errors.source}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sourceDetails">Source Details</Label>
              <Input
                id="sourceDetails"
                value={formData.sourceDetails}
                onChange={(e) => setFormData({ ...formData, sourceDetails: e.target.value })}
                placeholder="e.g., Facebook Ad, Contact Form, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign">Campaign</Label>
                <Input
                  id="campaign"
                  value={formData.campaign}
                  onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                  placeholder="e.g., Summer 2025"
                />
              </div>

              <div>
                <Label htmlFor="referredBy">Referred By</Label>
                <Input
                  id="referredBy"
                  value={formData.referredBy}
                  onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                  placeholder="Person or company name"
                />
              </div>
            </div>
          </div>

          {/* Intent & Timeline */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Intent & Timeline</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="intent">Lead Intent</Label>
                <Select
                  value={formData.intent}
                  onValueChange={(value) => setFormData({ ...formData, intent: value as LeadIntent })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="buying">Buying</SelectItem>
                    <SelectItem value="selling">Selling</SelectItem>
                    <SelectItem value="renting">Renting (as Tenant)</SelectItem>
                    <SelectItem value="leasing-out">Leasing Out (as Landlord)</SelectItem>
                    <SelectItem value="investing">Investing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeline">Timeline</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => setFormData({ ...formData, timeline: value as LeadTimeline })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="within-1-month">Within 1 Month</SelectItem>
                    <SelectItem value="within-3-months">Within 3 Months</SelectItem>
                    <SelectItem value="within-6-months">Within 6 Months</SelectItem>
                    <SelectItem value="long-term">Long Term (6+ months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Initial Message */}
          <div>
            <Label htmlFor="initialMessage">Initial Message / Notes</Label>
            <Textarea
              id="initialMessage"
              value={formData.initialMessage}
              onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
              placeholder="Any initial message or notes from the lead..."
              rows={4}
            />
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
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}