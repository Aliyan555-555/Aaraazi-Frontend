/**
 * Enhanced Match Card - V3.0
 * Rich property match card with offer tracking, status, and competitive intelligence
 */

import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  MapPin,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  Clock,
  Users,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { PropertyMatch } from '../lib/propertyMatching';
import { Offer } from '../types';
import { formatPKR } from '../lib/currency';
import { getMatchScoreColor } from '../lib/propertyMatching';
import { formatPropertyAddress } from '../lib/utils';

interface EnhancedMatchCardProps {
  match: PropertyMatch;
  latestOffer?: { offer: Offer; sellCycleId: string } | null;
  totalOffersOnProperty?: number;
  onSendOffer: () => void;
  onViewSellCycle: (sellCycleId: string) => void;
  onViewProperty: (propertyId: string) => void;
}

export function EnhancedMatchCard({
  match,
  latestOffer,
  totalOffersOnProperty = 0,
  onSendOffer,
  onViewSellCycle,
  onViewProperty,
}: EnhancedMatchCardProps) {
  const property = match.property;

  // Get display title - use formatted property address
  const displayTitle = formatPropertyAddress(property.address);

  const getOfferStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'accepted': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
      'countered': 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getOfferStatusIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle className="h-3 w-3" />;
    if (status === 'rejected') return <AlertCircle className="h-3 w-3" />;
    if (status === 'countered') return <TrendingUp className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  return (
    <Card className="hover:shadow-md transition-all border-l-4"
      style={{
        borderLeftColor: latestOffer ?
          (latestOffer.offer.status === 'accepted' ? '#22c55e' :
            latestOffer.offer.status === 'pending' ? '#eab308' : '#ef4444')
          : '#e5e7eb'
      }}
    >
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">{displayTitle}</h3>
              {latestOffer && (
                <Badge
                  className={`${getOfferStatusColor(latestOffer.offer.status)} flex items-center gap-1 text-xs border`}
                >
                  {getOfferStatusIcon(latestOffer.offer.status)}
                  {latestOffer.offer.status}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <Badge
              className={getMatchScoreColor(match.matchScore)}
              variant="secondary"
            >
              {match.matchScore}% Match
            </Badge>
          </div>
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <p className="text-muted-foreground">Price</p>
            <p className="font-medium">{formatPKR(match.askingPrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium capitalize">{property.propertyType}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Bedrooms</p>
            <p className="font-medium">{property.bedrooms}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Bathrooms</p>
            <p className="font-medium">{property.bathrooms}</p>
          </div>
        </div>

        {/* Offer Status Section (if offer exists) */}
        {latestOffer && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Your Offer</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(latestOffer.offer.offeredDate || latestOffer.offer.submittedDate || 0).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Offer Amount</p>
                <p className="font-bold">{formatPKR(latestOffer.offer.offerAmount || latestOffer.offer.amount || 0)}</p>
                <p className="text-xs text-muted-foreground">
                  {((((latestOffer.offer.offerAmount || latestOffer.offer.amount || 0) / (match.askingPrice || match.monthlyRent || (property.price as number) || 1)) * 100).toFixed(1))}% of asking
                </p>
              </div>
              {latestOffer.offer.counterOfferAmount && (
                <div>
                  <p className="text-muted-foreground">Counter Offer</p>
                  <p className="font-bold text-blue-600">{formatPKR(latestOffer.offer.counterOfferAmount)}</p>
                </div>
              )}
            </div>
            {latestOffer.offer.agentNotes && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">{latestOffer.offer.agentNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Competitive Intelligence */}
        {totalOffersOnProperty > 0 && (
          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              <strong>{totalOffersOnProperty}</strong> {totalOffersOnProperty === 1 ? 'offer' : 'offers'} on this property
              {!latestOffer && ' - Act fast!'}
            </span>
          </div>
        )}

        {/* Match Reasons */}
        {match.matchReasons && match.matchReasons.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Why this matches:
            </p>
            <div className="flex flex-wrap gap-2">
              {match.matchReasons.map((reason, idx) => (
                <Badge key={idx} className="bg-green-50 text-green-700" variant="outline">
                  {reason}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Mismatches */}
        {match.mismatches.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Considerations:
            </p>
            <div className="flex flex-wrap gap-2">
              {match.mismatches.map((mismatch, idx) => (
                <Badge key={idx} className="bg-yellow-50 text-yellow-700" variant="outline">
                  {mismatch}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t">
          {latestOffer ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onViewSellCycle(latestOffer.sellCycleId)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View in Sell Cycle
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewProperty(property.id)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </>
          ) : match.sellCycleId ? (
            <Button
              onClick={() => {
                console.log('🔵 Send Offer button clicked');
                console.log('   Match data:', match);
                console.log('   Has sellCycleId:', !!match.sellCycleId);
                console.log('   Has property:', !!match.property);
                console.log('   Calling onSendOffer...');
                onSendOffer();
              }}
              className="w-full"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Offer
            </Button>
          ) : (
            <div className="w-full text-center py-2 text-sm text-muted-foreground">
              No active sell cycle
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}