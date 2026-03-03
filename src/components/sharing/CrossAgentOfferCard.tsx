/**
 * CrossAgentOfferCard Component
 * Displays an offer submitted by another agent on a shared listing
 * 
 * Features:
 * - Shows buyer/agent information (with privacy controls)
 * - Offer amount and details
 * - Accept/Reject actions
 * - Coordination options
 * - Status tracking
 */

import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { CrossAgentOffer } from '../../types/deals';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { formatPKR } from '../../lib/currency';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

interface CrossAgentOfferCardProps {
  offer: CrossAgentOffer;
  onAccept: (offerId: string, notes?: string) => void;
  onReject: (offerId: string, reason: string) => void;
  onScheduleMeeting: (offerId: string, date: string) => void;
  canRespond?: boolean; // If the current user can respond to this offer
  showBuyerContact?: boolean; // If buyer contact should be revealed
}

export const CrossAgentOfferCard: React.FC<CrossAgentOfferCardProps> = ({
  offer,
  onAccept,
  onReject,
  onScheduleMeeting,
  canRespond = true,
  showBuyerContact = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Status badge
  const getStatusBadge = () => {
    switch (offer.status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
      case 'accepted':
        return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="gap-1 text-red-600"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case 'countered':
        return <Badge className="gap-1 bg-blue-600"><MessageSquare className="h-3 w-3" /> Counter Offer Sent</Badge>;
      case 'withdrawn':
        return <Badge variant="outline" className="gap-1 text-gray-500"><XCircle className="h-3 w-3" /> Withdrawn</Badge>;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle accept
  const handleAccept = () => {
    if (!canRespond) {
      toast.error('You do not have permission to respond to this offer');
      return;
    }

    onAccept(offer.id, responseNotes);
    toast.success('Offer accepted! Creating deal...');
  };

  // Handle reject
  const handleReject = () => {
    if (!canRespond) {
      toast.error('You do not have permission to respond to this offer');
      return;
    }

    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    onReject(offer.id, rejectReason);
    setShowRejectForm(false);
    setRejectReason('');
    toast.success('Offer rejected and agent notified');
  };

  return (
    <Card className="p-6 border-2 border-gray-200 hover:border-[#2D6A54]/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#E8E2D5] rounded-lg">
            <User className="h-5 w-5 text-[#2D6A54]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1A1F1F]">Cross-Agent Offer</h3>
            <p className="text-sm text-gray-600">
              From: {offer.submittedByAgentName}
            </p>
            {offer.submittedByAgentContact && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" />
                {offer.submittedByAgentContact}
              </p>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Offer Amount */}
      <div className="bg-[#E8E2D5]/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Offer Amount</p>
            <p className="text-2xl font-bold text-[#2D6A54]">
              {formatPKR(offer.amount)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-[#C17052]" />
        </div>
      </div>

      {/* Buyer Information */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-gray-700">Buyer Information</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span>{showBuyerContact ? offer.buyerName : '****** (Protected)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{showBuyerContact ? offer.buyerContact : '****** (Protected)'}</span>
          </div>
        </div>
        {!showBuyerContact && (
          <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
            <AlertCircle className="h-3 w-3" />
            Buyer contact is protected until offer is accepted
          </p>
        )}
      </div>

      {/* Offer Details */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-gray-700">Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <span className="text-gray-600">Submitted: </span>
              <span>{formatDate(offer.submittedDate)}</span>
            </div>
          </div>
          {offer.expiryDate && (
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-600">Expires: </span>
                <span>{formatDate(offer.expiryDate)}</span>
              </div>
            </div>
          )}
          {offer.buyerNotes && (
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-600">Notes: </span>
                <span>{offer.buyerNotes}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Match Information */}
      {offer.matchId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            This offer was submitted through our smart matching system
            {offer.matchScore && ` (${offer.matchScore}% match)`}
          </p>
        </div>
      )}

      {/* Actions */}
      {canRespond && offer.status === 'pending' && (
        <div className="space-y-3 pt-4 border-t">
          {!showActions && (
            <Button
              onClick={() => setShowActions(true)}
              className="w-full bg-[#2D6A54] hover:bg-[#2D6A54]/90"
            >
              Respond to Offer
            </Button>
          )}

          {showActions && (
            <>
              {/* Response Notes */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Response Notes (Optional)
                </label>
                <Textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Add any notes or conditions..."
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>

              {showRejectForm && (
                <div className="space-y-2 p-3 bg-red-50 rounded-lg">
                  <label className="text-sm text-gray-700 font-medium">
                    Reason for Rejection *
                  </label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason (will be shared with the agent)..."
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReject}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Confirm Rejection
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setShowActions(false)}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      )}

      {/* Status Messages */}
      {offer.status === 'accepted' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-green-800 font-medium">
            ✓ Offer accepted on {formatDate(offer.responseDate || offer.updatedAt)}
          </p>
          {offer.listingAgentNotes && (
            <p className="text-sm text-green-700 mt-1">
              Note: {offer.listingAgentNotes}
            </p>
          )}
        </div>
      )}

      {offer.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-red-800 font-medium">
            ✗ Offer rejected on {formatDate(offer.responseDate || offer.updatedAt)}
          </p>
          {offer.listingAgentNotes && (
            <p className="text-sm text-red-700 mt-1">
              Reason: {offer.listingAgentNotes}
            </p>
          )}
        </div>
      )}

      {/* Coordination */}
      {offer.coordinationRequired && offer.status === 'accepted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Coordination Required
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Please coordinate with {offer.submittedByAgentName} to finalize the deal
          </p>
          {offer.meetingScheduled && (
            <p className="text-sm text-blue-700 mt-1">
              Meeting scheduled: {formatDate(offer.meetingScheduled)}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
