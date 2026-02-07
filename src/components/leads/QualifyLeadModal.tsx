/**
 * Qualify Lead Modal
 * 
 * Comprehensive lead qualification form that collects:
 * - Intent-specific details (budget, preferences, property info)
 * - Contact verification status
 * - Qualification notes
 * - Automatically updates qualification score
 */

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { LeadIntent, LeadTimeline, LeadDetails } from '../../types/leads';
import { getLeadById, updateLead, recalculateLeadScore } from '../../lib/leads';
import { triggerAutomation } from '../../lib/tasks';
import { toast } from 'sonner';

interface QualifyLeadModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  onSuccess: () => void;
}

export function QualifyLeadModal({ 
  open, 
  onClose, 
  leadId,
  onSuccess 
}: QualifyLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState(() => getLeadById(leadId));
  
  const [formData, setFormData] = useState({
    intent: lead?.intent || 'unknown' as LeadIntent,
    timeline: lead?.timeline || 'unknown' as LeadTimeline,
    phoneVerified: lead?.phoneVerified || false,
    emailVerified: lead?.emailVerified || false,
    notes: lead?.notes || '',
    details: {
      // Buying/Investing
      budgetMin: lead?.details?.budgetMin || undefined,
      budgetMax: lead?.details?.budgetMax || undefined,
      preferredAreas: lead?.details?.preferredAreas?.join(', ') || '',
      propertyTypes: lead?.details?.propertyTypes?.join(', ') || '',
      bedrooms: lead?.details?.bedrooms || undefined,
      bathrooms: lead?.details?.bathrooms || undefined,
      mustHaveFeatures: lead?.details?.mustHaveFeatures?.join(', ') || '',
      
      // Renting
      monthlyBudget: lead?.details?.monthlyBudget || undefined,
      leaseDuration: lead?.details?.leaseDuration || undefined,
      moveInDate: lead?.details?.moveInDate || '',
      
      // Selling
      propertyAddress: lead?.details?.propertyAddress || '',
      propertyType: lead?.details?.propertyType || '',
      propertyArea: lead?.details?.propertyArea || undefined,
      propertyAreaUnit: lead?.details?.propertyAreaUnit || 'sqft',
      expectedPrice: lead?.details?.expectedPrice || undefined,
      reasonForSelling: lead?.details?.reasonForSelling || '',
      
      // Leasing Out
      rentalPropertyAddress: lead?.details?.rentalPropertyAddress || '',
      expectedRent: lead?.details?.expectedRent || undefined,
      
      // Investing
      investmentBudget: lead?.details?.investmentBudget || undefined,
      investmentType: lead?.details?.investmentType || '',
      riskTolerance: lead?.details?.riskTolerance || '',
    },
  });

  useEffect(() => {
    if (open && leadId) {
      const currentLead = getLeadById(leadId);
      if (currentLead) {
        setLead(currentLead);
      }
    }
  }, [open, leadId]);

  if (!lead) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare details object
      const details: LeadDetails = {};

      // Common fields
      if (formData.details.preferredAreas) {
        details.preferredAreas = formData.details.preferredAreas
          .split(',')
          .map(a => a.trim())
          .filter(Boolean);
      }
      
      if (formData.details.propertyTypes) {
        details.propertyTypes = formData.details.propertyTypes
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }

      if (formData.details.mustHaveFeatures) {
        details.mustHaveFeatures = formData.details.mustHaveFeatures
          .split(',')
          .map(f => f.trim())
          .filter(Boolean);
      }

      details.bedrooms = formData.details.bedrooms;
      details.bathrooms = formData.details.bathrooms;

      // Intent-specific fields
      if (formData.intent === 'buying' || formData.intent === 'investing') {
        details.budgetMin = formData.details.budgetMin;
        details.budgetMax = formData.details.budgetMax;
      }

      if (formData.intent === 'investing') {
        details.investmentBudget = formData.details.investmentBudget;
        details.investmentType = formData.details.investmentType;
        details.riskTolerance = formData.details.riskTolerance;
      }

      if (formData.intent === 'renting') {
        details.monthlyBudget = formData.details.monthlyBudget;
        details.leaseDuration = formData.details.leaseDuration;
        details.moveInDate = formData.details.moveInDate;
      }

      if (formData.intent === 'selling') {
        details.propertyAddress = formData.details.propertyAddress;
        details.propertyType = formData.details.propertyType;
        details.propertyArea = formData.details.propertyArea;
        details.propertyAreaUnit = formData.details.propertyAreaUnit;
        details.expectedPrice = formData.details.expectedPrice;
        details.reasonForSelling = formData.details.reasonForSelling;
      }

      if (formData.intent === 'leasing-out') {
        details.rentalPropertyAddress = formData.details.rentalPropertyAddress;
        details.expectedRent = formData.details.expectedRent;
        details.propertyType = formData.details.propertyType;
      }

      // Update lead
      updateLead(leadId, {
        intent: formData.intent,
        timeline: formData.timeline,
        phoneVerified: formData.phoneVerified,
        emailVerified: formData.emailVerified,
        notes: formData.notes,
        details: Object.keys(details).length > 0 ? details : undefined,
        status: 'qualified', // Mark as qualified
      });

      // Recalculate score
      recalculateLeadScore(leadId);

      // Get updated lead for automation
      const updatedLead = getLeadById(leadId);
      if (updatedLead) {
        // Trigger task automation for qualified lead
        const createdTasks = triggerAutomation(
          {
            type: 'entity-status-changed',
            entityType: 'lead',
            statusChange: {
              to: 'qualified',
            },
          },
          updatedLead,
          { id: updatedLead.agentId, name: updatedLead.agentName, role: 'agent' }
        );

        if (createdTasks.length > 0) {
          toast.success(`Lead qualified with ${createdTasks.length} automated task${createdTasks.length > 1 ? 's' : ''} created`);
        } else {
          toast.success('Lead qualified successfully');
        }
      } else {
        toast.success('Lead qualified successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to qualify lead:', error);
      toast.error('Failed to qualify lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Qualify Lead: {lead.name}</DialogTitle>
          <DialogDescription>
            Fill in the details to qualify this lead.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Intent & Timeline */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Intent & Timeline</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="intent">
                  Lead Intent <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.intent}
                  onValueChange={(value) => setFormData({ ...formData, intent: value as LeadIntent })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buying">Buying</SelectItem>
                    <SelectItem value="selling">Selling</SelectItem>
                    <SelectItem value="renting">Renting (as Tenant)</SelectItem>
                    <SelectItem value="leasing-out">Leasing Out (as Landlord)</SelectItem>
                    <SelectItem value="investing">Investing</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeline">
                  Timeline <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => setFormData({ ...formData, timeline: value as LeadTimeline })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="within-1-month">Within 1 Month</SelectItem>
                    <SelectItem value="within-3-months">Within 3 Months</SelectItem>
                    <SelectItem value="within-6-months">Within 6 Months</SelectItem>
                    <SelectItem value="long-term">Long Term (6+ months)</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Contact Verification</h3>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="phoneVerified"
                  checked={formData.phoneVerified}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, phoneVerified: checked as boolean })
                  }
                />
                <Label htmlFor="phoneVerified" className="cursor-pointer">
                  Phone Verified
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="emailVerified"
                  checked={formData.emailVerified}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, emailVerified: checked as boolean })
                  }
                />
                <Label htmlFor="emailVerified" className="cursor-pointer">
                  Email Verified
                </Label>
              </div>
            </div>
          </div>

          {/* Intent-Specific Details */}
          {formData.intent !== 'unknown' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Qualification Details</h3>
              
              {/* Buying Intent */}
              {(formData.intent === 'buying' || formData.intent === 'investing') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Budget Min (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.details.budgetMin || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, budgetMin: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="5000000"
                      />
                    </div>
                    <div>
                      <Label>Budget Max (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.details.budgetMax || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, budgetMax: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="10000000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Areas (comma-separated)</Label>
                    <Input
                      value={formData.details.preferredAreas}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, preferredAreas: e.target.value }
                      })}
                      placeholder="DHA, Clifton, Gulshan"
                    />
                  </div>

                  <div>
                    <Label>Property Types (comma-separated)</Label>
                    <Input
                      value={formData.details.propertyTypes}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, propertyTypes: e.target.value }
                      })}
                      placeholder="House, Apartment, Plot"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bedrooms</Label>
                      <Input
                        type="number"
                        value={formData.details.bedrooms || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, bedrooms: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <Label>Bathrooms</Label>
                      <Input
                        type="number"
                        value={formData.details.bathrooms || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, bathrooms: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Must-Have Features (comma-separated)</Label>
                    <Input
                      value={formData.details.mustHaveFeatures}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, mustHaveFeatures: e.target.value }
                      })}
                      placeholder="Parking, Garden, Security"
                    />
                  </div>
                </div>
              )}

              {/* Investing Specific */}
              {formData.intent === 'investing' && (
                <div className="space-y-4">
                  <div>
                    <Label>Investment Budget (PKR)</Label>
                    <Input
                      type="number"
                      value={formData.details.investmentBudget || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, investmentBudget: e.target.value ? Number(e.target.value) : undefined }
                      })}
                      placeholder="50000000"
                    />
                  </div>

                  <div>
                    <Label>Investment Type</Label>
                    <Select
                      value={formData.details.investmentType}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        details: { ...formData.details, investmentType: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rental-income">Rental Income</SelectItem>
                        <SelectItem value="capital-appreciation">Capital Appreciation</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Risk Tolerance</Label>
                    <Select
                      value={formData.details.riskTolerance}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        details: { ...formData.details, riskTolerance: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tolerance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Renting Intent */}
              {formData.intent === 'renting' && (
                <div className="space-y-4">
                  <div>
                    <Label>Monthly Budget (PKR)</Label>
                    <Input
                      type="number"
                      value={formData.details.monthlyBudget || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, monthlyBudget: e.target.value ? Number(e.target.value) : undefined }
                      })}
                      placeholder="50000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Lease Duration (months)</Label>
                      <Input
                        type="number"
                        value={formData.details.leaseDuration || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, leaseDuration: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <Label>Move-in Date</Label>
                      <Input
                        type="date"
                        value={formData.details.moveInDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, moveInDate: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Areas (comma-separated)</Label>
                    <Input
                      value={formData.details.preferredAreas}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, preferredAreas: e.target.value }
                      })}
                      placeholder="DHA, Clifton, Gulshan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bedrooms</Label>
                      <Input
                        type="number"
                        value={formData.details.bedrooms || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, bedrooms: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <Label>Bathrooms</Label>
                      <Input
                        type="number"
                        value={formData.details.bathrooms || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, bathrooms: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Selling Intent */}
              {formData.intent === 'selling' && (
                <div className="space-y-4">
                  <div>
                    <Label>Property Address</Label>
                    <Input
                      value={formData.details.propertyAddress}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, propertyAddress: e.target.value }
                      })}
                      placeholder="123 Main Street, DHA Phase 5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Property Type</Label>
                      <Input
                        value={formData.details.propertyType}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, propertyType: e.target.value }
                        })}
                        placeholder="House, Apartment, Plot"
                      />
                    </div>
                    <div>
                      <Label>Expected Price (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.details.expectedPrice || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, expectedPrice: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="15000000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Label>Property Area</Label>
                      <Input
                        type="number"
                        value={formData.details.propertyArea || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, propertyArea: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="2000"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select
                        value={formData.details.propertyAreaUnit}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          details: { ...formData.details, propertyAreaUnit: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sqft">Sq Ft</SelectItem>
                          <SelectItem value="sqyd">Sq Yd</SelectItem>
                          <SelectItem value="marla">Marla</SelectItem>
                          <SelectItem value="kanal">Kanal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Reason for Selling</Label>
                    <Textarea
                      value={formData.details.reasonForSelling}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, reasonForSelling: e.target.value }
                      })}
                      placeholder="Relocating, upgrading, financial reasons, etc."
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* Leasing Out Intent */}
              {formData.intent === 'leasing-out' && (
                <div className="space-y-4">
                  <div>
                    <Label>Rental Property Address</Label>
                    <Input
                      value={formData.details.rentalPropertyAddress}
                      onChange={(e) => setFormData({
                        ...formData,
                        details: { ...formData.details, rentalPropertyAddress: e.target.value }
                      })}
                      placeholder="123 Main Street, DHA Phase 5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Property Type</Label>
                      <Input
                        value={formData.details.propertyType}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, propertyType: e.target.value }
                        })}
                        placeholder="House, Apartment"
                      />
                    </div>
                    <div>
                      <Label>Expected Rent (PKR/month)</Label>
                      <Input
                        type="number"
                        value={formData.details.expectedRent || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          details: { ...formData.details, expectedRent: e.target.value ? Number(e.target.value) : undefined }
                        })}
                        placeholder="75000"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Qualification Notes */}
          <div>
            <Label htmlFor="notes">Qualification Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this lead, conversation highlights, concerns, etc."
              rows={4}
            />
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-blue-900">
                <p className="font-medium mb-1">Qualification Score Auto-Update</p>
                <p className="text-blue-700">
                  The lead's qualification score will be automatically recalculated based on the information provided.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Qualify Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}