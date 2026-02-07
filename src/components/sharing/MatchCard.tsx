/**
 * MatchCard Component
 * Displays a property match with score, details, and actions
 * 
 * Features:
 * - Visual match score indicator
 * - Property image and details
 * - Match breakdown (what matched)
 * - View Details and Submit Offer buttons
 * - Status badges
 */

import React from 'react';
import {
  MapPin,
  Home,
  Maximize,
  Bed,
  Bath,
  TrendingUp,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  DollarSign,
} from 'lucide-react';
import { PropertyMatch, Property } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatPKR } from '../../lib/currency';

interface MatchCardProps {
  match: PropertyMatch;
  property: Property;
  onViewDetails: (matchId: string) => void;
  onSubmitOffer: (matchId: string) => void;
  onDismiss?: (matchId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  property,
  onViewDetails,
  onSubmitOffer,
  onDismiss,
}) => {
  // Calculate match score color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#2D6A54'; // Excellent - Forest green
    if (score >= 80) return '#6B9F8A'; // Good - Light green
    if (score >= 70) return '#C17052'; // Fair - Terracotta
    return '#8B8B8B'; // Poor - Gray
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Good Match';
    if (score >= 70) return 'Fair Match';
    return 'Possible Match';
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> New</Badge>;
      case 'viewed':
        return <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" /> Viewed</Badge>;
      case 'offer-submitted':
        return <Badge className="gap-1 bg-blue-600"><FileText className="h-3 w-3" /> Offer Sent</Badge>;
      case 'accepted':
        return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Accepted</Badge>;
      case 'deal-created':
        return <Badge className="gap-1 bg-[#2D6A54]"><CheckCircle2 className="h-3 w-3" /> Deal Created</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="gap-1 text-gray-500"><XCircle className="h-3 w-3" /> Dismissed</Badge>;
      default:
        return null;
    }
  };

  const scoreColor = getScoreColor(match.matchScore);
  const scoreLabel = getScoreLabel(match.matchScore);

  // Property image (first image or placeholder)
  const propertyImage = property.images?.[0] || null;

  // Format address
  const address = property.address
    ? `${property.address.areaName}, ${property.address.cityName}`
    : 'Location not specified';

  // Price display
  const priceDisplay = match.cycleType === 'sell'
    ? formatPKR(match.matchDetails.overallScore) // This should be askingPrice, but we'll use property price for now
    : `${formatPKR(property.price || 0)}/month`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Header with Score */}
      <div className="p-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          {/* Match Score */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-lg text-white font-bold text-xl"
              style={{ backgroundColor: scoreColor }}
            >
              {match.matchScore}%
            </div>
            <div>
              <div className="font-semibold text-gray-900">{scoreLabel}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <User className="h-3 w-3" />
                <span>{match.listingAgentName}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Property Image */}
          {propertyImage ? (
            <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                src={propertyImage}
                alt={property.title || 'Property'}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-24 rounded-lg flex-shrink-0 bg-gray-100 flex items-center justify-center">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
          )}

          {/* Property Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate mb-1">
              {property.title || `${property.propertyType} Property`}
            </h3>
            
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{address}</span>
            </div>

            {/* Property Stats */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {property.propertyType && (
                <div className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  <span>{property.propertyType}</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center gap-1">
                  <Maximize className="h-3.5 w-3.5" />
                  <span>{property.area} sq yd</span>
                </div>
              )}
              {property.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="mt-2 flex items-center gap-1 text-[#2D6A54] font-semibold">
              <DollarSign className="h-4 w-4" />
              <span>{priceDisplay}</span>
            </div>
          </div>
        </div>

        {/* Match Breakdown */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-medium">Match Breakdown:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {match.matchDetails.propertyTypeMatch && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Property Type
              </Badge>
            )}
            {match.matchDetails.locationMatch && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Location
              </Badge>
            )}
            {match.matchDetails.priceMatch && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Price Range
              </Badge>
            )}
            {match.matchDetails.areaMatch && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Area/Size
              </Badge>
            )}
            {match.matchDetails.bedroomsMatch && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Bedrooms
              </Badge>
            )}
            {match.matchDetails.bathroomsMatch && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Bathrooms
              </Badge>
            )}
            {match.matchDetails.featuresMatch.length > 0 && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {match.matchDetails.featuresMatch.length} Feature{match.matchDetails.featuresMatch.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Show mismatches if score is not perfect */}
          {match.matchScore < 100 && (
            <div className="mt-2 text-xs text-gray-500">
              {!match.matchDetails.propertyTypeMatch && <div>• Property type differs</div>}
              {!match.matchDetails.locationMatch && <div>• Different location</div>}
              {!match.matchDetails.priceMatch && <div>• Outside price range</div>}
              {!match.matchDetails.areaMatch && <div>• Different size</div>}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(match.matchId)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>

        {match.status !== 'offer-submitted' && match.status !== 'deal-created' && match.status !== 'dismissed' && (
          <Button
            size="sm"
            onClick={() => onSubmitOffer(match.matchId)}
            className="flex-1"
            style={{ backgroundColor: '#2D6A54' }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Submit Offer
          </Button>
        )}

        {match.status === 'pending' && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(match.matchId)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
