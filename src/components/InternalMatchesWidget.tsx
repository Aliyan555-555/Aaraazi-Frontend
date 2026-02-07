/**
 * Internal Matches Widget - V3.0
 * Dashboard widget showing properties with both sell and purchase cycles
 * Highlights potential internal deals
 */

import React, { useState, useEffect } from 'react';
import { User, Property } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Eye,
  Star,
  Zap,
} from 'lucide-react';
import { detectInternalMatches } from '../lib/cycleManager';
import { getProperties } from '../lib/data';
import { formatPKR } from '../lib/currency';

interface InternalMatchesWidgetProps {
  user: User;
  onViewMatch: (matchData: any) => void;
  onViewProperty: (propertyId: string) => void;
}

export function InternalMatchesWidget({
  user,
  onViewMatch,
  onViewProperty,
}: InternalMatchesWidgetProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load data
  useEffect(() => {
    const allProperties = getProperties(user.id, user.role);
    const allMatches = detectInternalMatches(user.id, user.role);
    
    setProperties(allProperties);
    setMatches(allMatches);
  }, [user.id, user.role]);

  const getProperty = (propertyId: string) => {
    return properties.find(p => p.id === propertyId);
  };

  const getMatchPriority = (match: any) => {
    // High priority if gap is small (within 10%)
    const gap = match.gap;
    const avgPrice = (match.sellAskingPrice + match.highestPurchaseOffer) / 2;
    const gapPercentage = (gap / avgPrice) * 100;
    
    if (gapPercentage <= 10) return 'high';
    if (gapPercentage <= 25) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Internal Matches
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="p-4 rounded-full bg-muted inline-flex mb-3">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No internal matches found yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Matches appear when you have both sell and purchase cycles on the same property
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show top 3 by default, all when expanded
  const displayedMatches = isExpanded ? matches : matches.slice(0, 3);

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Internal Matches
            <Badge className="bg-purple-600 text-white">{matches.length}</Badge>
          </CardTitle>
          {matches.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show Less' : 'View All'}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Properties where you represent both buyer and seller
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedMatches.map((match, idx) => {
          const property = getProperty(match.propertyId);
          const priority = getMatchPriority(match);
          
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-lg border-2 border-purple-200 bg-white p-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onViewMatch(match)}
            >
              {/* Priority Indicator */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className={`absolute transform rotate-45 ${getPriorityColor(priority)} text-white text-xs font-bold py-1 right-[-35px] top-[10px] w-[100px] text-center`}>
                  {priority}
                </div>
              </div>

              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between pr-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-purple-600" />
                      <p className="font-medium text-sm">
                        {property?.address || 'Unknown Property'}
                      </p>
                    </div>
                    {property && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {property.propertyType && (
                          <span className="capitalize">{property.propertyType}</span>
                        )}
                        {property.bedrooms && <span>{property.bedrooms} bed</span>}
                        {property.bathrooms && <span>{property.bathrooms} bath</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Comparison */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-green-50 rounded p-2">
                    <p className="text-muted-foreground mb-1">Selling For</p>
                    <p className="font-bold text-green-700">
                      {formatPKR(match.sellAskingPrice)}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-muted-foreground mb-1">Buying At</p>
                    <p className="font-bold text-blue-700">
                      {formatPKR(match.highestPurchaseOffer)}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <p className="text-muted-foreground mb-1">Gap</p>
                    <p className="font-bold text-purple-700">
                      {formatPKR(match.gap)}
                    </p>
                  </div>
                </div>

                {/* Potential Revenue */}
                {match.potentialRevenue > 0 && (
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Potential Revenue</p>
                        <p className="text-lg font-bold text-purple-700">
                          {formatPKR(match.potentialRevenue)}
                        </p>
                      </div>
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                )}

                {/* Dual Representation Warning */}
                {match.isDualRepresentation && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      <strong>Dual Representation:</strong> Same agent on both sides
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMatch(match);
                    }}
                  >
                    Review Match
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProperty(match.propertyId);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary */}
        {matches.length > 0 && (
          <div className="bg-purple-100 rounded-lg p-3 mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-purple-900">
                Total Potential Revenue
              </span>
              <span className="text-lg font-bold text-purple-700">
                {formatPKR(matches.reduce((sum, m) => sum + m.potentialRevenue, 0))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
