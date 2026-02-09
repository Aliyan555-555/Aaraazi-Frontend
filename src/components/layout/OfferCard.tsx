/**
 * OfferCard - Detailed offer display card
 * 
 * Features:
 * - Rich offer information display
 * - Accept/Reject actions
 * - Token money display
 * - Conditions and notes
 * - Expiry tracking
 * - Responsive layout
 * 
 * Usage:
 * <OfferCard
 *   offer={offer}
 *   askingPrice={5000000}
 *   isAccepted={offer.id === acceptedOfferId}
 *   canTakeAction={status !== 'sold'}
 *   onAccept={() => handleAccept(offer.id)}
 *   onReject={() => handleReject(offer.id)}
 *   onView={() => viewOffer(offer.id)}
 * />
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { StatusBadge } from './StatusBadge';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  DollarSign,
  Calendar,
  AlertCircle,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { formatPKR } from '../../lib/currency';

export interface OfferData {
  id: string;
  buyerName: string;
  buyerContact?: string;
  buyerEmail?: string;
  offerAmount: number;
  tokenAmount?: number;
  offeredDate: string;
  expiryDate?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  conditions?: string;
  notes?: string;
  agentNotes?: string;
}

export interface OfferCardProps {
  offer: OfferData;
  askingPrice: number;
  isAccepted?: boolean;
  canTakeAction?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onView?: () => void;
  onCounter?: () => void;
  className?: string;
}

export function OfferCard({
  offer,
  askingPrice,
  isAccepted = false,
  canTakeAction = true,
  onAccept,
  onReject,
  onView,
  onCounter,
  className = '',
}: OfferCardProps) {
  // Calculate percentage of asking price
  const percentageOfAsking = ((offer.offerAmount / askingPrice) * 100).toFixed(1);

  // Check if expired
  const isExpired = Boolean(
    offer.expiryDate && new Date(offer.expiryDate) < new Date() && offer.status === 'pending'
  );

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      className={`${isAccepted ? 'border-green-500 border-2' : ''} ${isExpired ? 'border-orange-300' : ''
        } ${className}`}
    >
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          {/* Buyer Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-400" />
              <h4 className="font-medium text-[#030213]">{offer.buyerName}</h4>
              <StatusBadge status={offer.status} size="sm" />
              {isAccepted && (
                <Badge variant="default" className="bg-green-600 text-white">
                  ACCEPTED
                </Badge>
              )}
              {isExpired && (
                <Badge variant="destructive" className="bg-orange-600">
                  EXPIRED
                </Badge>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-1 text-sm text-gray-600">
              {offer.buyerContact && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{offer.buyerContact}</span>
                </div>
              )}
              {offer.buyerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{offer.buyerEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount Display */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <DollarSign className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold text-[#030213]">
                {formatPKR(offer.offerAmount)}
              </p>
            </div>
            <p className="text-xs text-gray-500">{percentageOfAsking}% of asking price</p>
            {offer.offerAmount >= askingPrice && (
              <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                At or above asking
              </Badge>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Calendar className="h-3 w-3" />
              <span>Offered Date</span>
            </div>
            <p className="text-sm font-medium">{formatDate(offer.offeredDate)}</p>
          </div>

          {offer.tokenAmount && (
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <DollarSign className="h-3 w-3" />
                <span>Token Money</span>
              </div>
              <p className="text-sm font-medium">{formatPKR(offer.tokenAmount)}</p>
            </div>
          )}

          {offer.expiryDate && (
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Clock className="h-3 w-3" />
                <span>Expiry Date</span>
              </div>
              <p
                className={`text-sm font-medium ${isExpired ? 'text-orange-600' : ''
                  }`}
              >
                {formatDate(offer.expiryDate)}
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <AlertCircle className="h-3 w-3" />
              <span>Status</span>
            </div>
            <StatusBadge status={offer.status} size="sm" />
          </div>
        </div>

        {/* Conditions */}
        {offer.conditions && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">Conditions:</p>
            <p className="text-sm text-blue-800">{offer.conditions}</p>
          </div>
        )}

        {/* Buyer Notes */}
        {offer.notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-1">Buyer Notes:</p>
            <p className="text-sm text-gray-600">{offer.notes}</p>
          </div>
        )}

        {/* Agent Notes (Internal) */}
        {offer.agentNotes && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-medium text-yellow-900 mb-1">
              Internal Notes (Agent Only):
            </p>
            <p className="text-sm text-yellow-800">{offer.agentNotes}</p>
          </div>
        )}

        {/* Actions */}
        {(canTakeAction || onView) && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            {offer.status === 'pending' && canTakeAction && (
              <>
                {onAccept && (
                  <Button
                    size="sm"
                    onClick={onAccept}
                    className="flex-1"
                    disabled={isExpired}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Offer
                  </Button>
                )}
                {onCounter && (
                  <Button size="sm" variant="outline" onClick={onCounter}>
                    Counter
                  </Button>
                )}
                {onReject && (
                  <Button size="sm" variant="outline" onClick={onReject}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                )}
              </>
            )}
            {onView && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onView}
                className={offer.status !== 'pending' ? 'flex-1' : ''}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
