import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Star, 
  MapPin, 
  Home, 
  TrendingUp,
  Eye,
  FileText,
  CheckCircle2 
} from 'lucide-react';
import { Property } from '../types';
import { PropertyMatch } from '../lib/buyCycle';
import { formatPKR } from '../lib/currency';

interface PropertyMatchCardProps {
  match: PropertyMatch;
  requirement: Property;
  onShortlist: (propertyId: string) => void;
  onViewingFeedback: (property: Property) => void;
  onDraftOffer: (property: Property) => void;
}

export function PropertyMatchCard({
  match,
  requirement,
  onShortlist,
  onViewingFeedback,
  onDraftOffer,
}: PropertyMatchCardProps) {
  const { property, matchScore, matchReasons } = match;
  const isShortlisted = requirement.shortlistedProperties?.includes(property.id);
  const hasFeedback = requirement.viewingFeedback?.some(
    (f) => f.propertyId === property.id
  );

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Possible Match';
  };

  return (
    <Card className="border-[#e9ebef] hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Property Image */}
          <div className="flex-shrink-0">
            {property.images && property.images[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-48 h-36 object-cover rounded-lg"
              />
            ) : (
              <div className="w-48 h-36 bg-[#ececf0] rounded-lg flex items-center justify-center">
                <Home className="h-12 w-12 text-[#666]" />
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[#030213]">{property.title}</h3>
                  {isShortlisted && (
                    <CheckCircle2 className="h-5 w-5 text-[#fb8500]" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[#666] text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}</span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-[#030213]">{formatPKR(property.price)}</p>
                <Badge variant="outline" className="mt-1">
                  {property.status}
                </Badge>
              </div>
            </div>

            {/* Match Score */}
            <div className="bg-[#f8f9fa] p-3 rounded-lg mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#666] text-sm">Match Score</span>
                <span className={`${getMatchColor(matchScore)}`}>
                  {matchScore}% - {getMatchLabel(matchScore)}
                </span>
              </div>
              <Progress value={matchScore} className="h-2" />
              
              {/* Match Reasons */}
              <div className="flex flex-wrap gap-1 mt-2">
                {matchReasons.slice(0, 3).map((reason, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {reason}
                  </Badge>
                ))}
                {matchReasons.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{matchReasons.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Property Specs */}
            <div className="flex items-center gap-4 text-sm text-[#666] mb-3">
              {property.propertyType && (
                <div className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>{property.propertyType}</span>
                </div>
              )}
              {property.bedrooms && (
                <span>{property.bedrooms} Beds</span>
              )}
              {property.bathrooms && (
                <span>{property.bathrooms} Baths</span>
              )}
              {property.area && (
                <span>{property.area} {property.areaUnit || 'sqft'}</span>
              )}
            </div>

            {/* Feedback Badge */}
            {hasFeedback && (
              <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg mb-3">
                <p className="text-blue-700 text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Viewing feedback recorded
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!isShortlisted ? (
                <Button
                  size="sm"
                  onClick={() => onShortlist(property.id)}
                  className="gap-2"
                  variant="outline"
                >
                  <Star className="h-4 w-4" />
                  Add to Shortlist
                </Button>
              ) : (
                <Badge className="bg-[#fb8500] text-white gap-1">
                  <Star className="h-3 w-3 fill-white" />
                  Shortlisted
                </Badge>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewingFeedback(property)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {hasFeedback ? 'Update' : 'Add'} Feedback
              </Button>

              <Button
                size="sm"
                onClick={() => onDraftOffer(property)}
                className="bg-[#fb8500] hover:bg-[#fb8500]/90 text-white gap-2"
              >
                <FileText className="h-4 w-4" />
                Draft Offer
              </Button>
            </div>

            {/* Agent Info */}
            {property.agentName && (
              <div className="mt-3 pt-3 border-t border-[#e9ebef] text-xs text-[#666]">
                Listing Agent: {property.agentName}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
