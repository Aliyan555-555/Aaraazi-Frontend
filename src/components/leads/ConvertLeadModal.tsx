/**
 * Convert Lead Modal
 * 
 * Handles lead conversion to Contact + Requirements/Property
 * Shows preview of what will be created
 * Displays duplicate detection warnings
 * Confirms conversion action
 */

import React, { useState, useMemo } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, User, FileText, Home, ArrowRight, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
// [STUBBED] import { getLeadById } from '../../lib/leads';
// [STUBBED] import { convertLead, previewLeadConversion } from '../../lib/leadConversion';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const getLeadById = (..._args: any[]): any => { /* stub - prototype function removed */ };
const convertLead = (..._args: any[]): any => { /* stub - prototype function removed */ };
const previewLeadConversion = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface ConvertLeadModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  user: {
    id: string;
    name: string;
  };
  onSuccess: (contactId: string, requirementId?: string, propertyId?: string) => void;
}

export function ConvertLeadModal({ 
  open, 
  onClose, 
  leadId,
  user,
  onSuccess 
}: ConvertLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Load lead and preview
  const lead = useMemo(() => getLeadById(leadId), [leadId]);
  const preview = useMemo(() => previewLeadConversion(leadId), [leadId]);

  if (!lead || !preview) {
    return null;
  }

  const hasErrors = preview.validation.errors && preview.validation.errors.length > 0;
  const hasWarnings = preview.validation.warnings && preview.validation.warnings.length > 0;
  const hasDuplicate = preview.duplicateCheck.hasDuplicate;

  const handleConvert = async () => {
    if (hasErrors) {
      toast.error('Cannot convert lead - please fix validation errors first');
      return;
    }

    setLoading(true);

    try {
      const result = await convertLead(leadId, {
        convertedBy: user.id,
        convertedByName: user.name,
        additionalNotes: additionalNotes.trim() || undefined,
      });

      if (result.success) {
        toast.success('Lead converted successfully!');
        onSuccess(
          result.contactId!,
          result.buyerRequirementId || result.rentRequirementId,
          result.propertyId
        );
        onClose();
      } else {
        toast.error('Conversion failed: ' + (result.errors?.join(', ') || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to convert lead:', error);
      toast.error('Failed to convert lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead: {lead.name}</DialogTitle>
          <DialogDescription>
            This will convert the lead into a contact and optionally create a requirement or property listing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Errors */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Cannot convert lead - validation errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {preview.validation.errors!.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {hasWarnings && !hasErrors && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Warnings:</div>
                <ul className="list-disc list-inside space-y-1">
                  {preview.validation.warnings!.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicate Detection */}
          {hasDuplicate && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Potential Duplicate Contact Detected</div>
                <p>
                  A contact with similar information already exists (Match Confidence: {preview.duplicateCheck.matchConfidence}).
                </p>
                <p className="mt-2">
                  Contact ID: <code className="bg-gray-100 px-2 py-1 rounded">{preview.duplicateCheck.duplicateId}</code>
                </p>
                <p className="mt-2 text-red-600 font-medium">
                  Please review the existing contact before proceeding with conversion.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Conversion Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              This conversion will create:
            </h3>

            <div className="space-y-3">
              {/* Contact (always created) */}
              <div className="flex items-start gap-3 bg-white rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Contact</div>
                  <div className="text-gray-600">
                    {lead.name} - {lead.phone}
                  </div>
                  <div className="mt-1">
                    <Badge variant="outline">Always Created</Badge>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              {(preview.willCreate.investor || preview.willCreate.buyerRequirement || preview.willCreate.rentRequirement || preview.willCreate.property) && (
                <div className="flex justify-center">
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              )}

              {/* Investor (for investing intent) */}
              {preview.willCreate.investor && (
                <div className="flex items-start gap-3 bg-white rounded-lg p-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Investor Profile</div>
                    <div className="text-gray-600">
                      {lead.details?.investmentBudget 
                        ? `Investment Capacity: PKR ${lead.details.investmentBudget.toLocaleString()}`
                        : 'Investment capacity to be determined'}
                    </div>
                    {lead.details?.riskTolerance && (
                      <div className="text-gray-500 mt-1">
                        Risk Profile: {lead.details.riskTolerance}
                      </div>
                    )}
                    <div className="mt-2">
                      <Badge variant="outline" className="bg-purple-50">Portfolio Management</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer Requirement */}
              {preview.willCreate.buyerRequirement && (
                <div className="flex items-start gap-3 bg-white rounded-lg p-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {lead.intent === 'investing' ? 'Investor Requirement' : 'Buyer Requirement'}
                    </div>
                    <div className="text-gray-600">
                      {lead.details?.budgetMin && lead.details?.budgetMax 
                        ? `Budget: PKR ${lead.details.budgetMin.toLocaleString()} - ${lead.details.budgetMax.toLocaleString()}`
                        : 'Budget to be determined'}
                    </div>
                    {lead.details?.preferredAreas && lead.details.preferredAreas.length > 0 && (
                      <div className="text-gray-500 mt-1">
                        Areas: {lead.details.preferredAreas.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rent Requirement */}
              {preview.willCreate.rentRequirement && (
                <div className="flex items-start gap-3 bg-white rounded-lg p-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Rent Requirement</div>
                    <div className="text-gray-600">
                      {lead.details?.monthlyBudget 
                        ? `Monthly Budget: PKR ${lead.details.monthlyBudget.toLocaleString()}`
                        : 'Budget to be determined'}
                    </div>
                    {lead.details?.leaseDuration && (
                      <div className="text-gray-500 mt-1">
                        Lease Duration: {lead.details.leaseDuration} months
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property Listing */}
              {preview.willCreate.property && (
                <div className="flex items-start gap-3 bg-white rounded-lg p-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Home className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Property Listing {lead.intent === 'selling' ? '(For Sale)' : '(For Rent)'}
                    </div>
                    <div className="text-gray-600">
                      {lead.details?.propertyAddress || lead.details?.rentalPropertyAddress || 'Address to be determined'}
                    </div>
                    {lead.intent === 'selling' && lead.details?.expectedPrice && (
                      <div className="text-gray-500 mt-1">
                        Expected Price: PKR {lead.details.expectedPrice.toLocaleString()}
                      </div>
                    )}
                    {lead.intent === 'leasing-out' && lead.details?.expectedRent && (
                      <div className="text-gray-500 mt-1">
                        Expected Rent: PKR {lead.details.expectedRent.toLocaleString()}/month
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lead Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Lead Summary</h3>
            
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Intent</dt>
                <dd className="text-gray-900 font-medium capitalize">
                  {lead.intent.replace(/-/g, ' ')}
                </dd>
              </div>
              
              <div>
                <dt className="text-gray-500">Timeline</dt>
                <dd className="text-gray-900 font-medium capitalize">
                  {lead.timeline.replace(/-/g, ' ')}
                </dd>
              </div>
              
              <div>
                <dt className="text-gray-500">Source</dt>
                <dd className="text-gray-900 font-medium capitalize">
                  {lead.source.replace(/-/g, ' ')}
                </dd>
              </div>
              
              <div>
                <dt className="text-gray-500">Qualification Score</dt>
                <dd className="text-gray-900 font-medium">
                  {lead.qualificationScore}/100
                </dd>
              </div>
            </dl>

            {lead.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <dt className="text-gray-500 mb-1">Notes</dt>
                <dd className="text-gray-900 whitespace-pre-wrap">{lead.notes}</dd>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="additionalNotes">Additional Conversion Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add any additional notes about this conversion..."
              rows={3}
            />
          </div>

          {/* Post-Conversion Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">After Conversion</h4>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>• Lead will be marked as "Converted"</li>
              <li>• Lead will be linked to all created entities</li>
              <li>• Lead will be automatically archived after 30 days</li>
              <li>• All lead history and notes will be preserved</li>
              <li>• You'll be redirected to the new contact</li>
            </ul>
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
            <Button
              onClick={handleConvert}
              disabled={loading || hasErrors}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Convert Lead
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}