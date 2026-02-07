import React, { useState } from 'react';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  Eye,
  Share2,
  Copy,
  Edit,
  Archive,
  Trash2,
  MoreVertical,
  Star,
  AlertCircle,
  Flame,
  Snowflake,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import { Property } from '../../types';
import { formatPKR } from '../../lib/currency';
import { formatAreaDisplay } from '../../lib/areaUnits';
import { isPropertyFeatured, isPropertyExpired } from '../../lib/phase3Enhancements';
import { PropertyAddressDisplay } from '../PropertyAddressDisplay';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { toast } from 'sonner';

interface EnhancedPropertyCardProps {
  property: Property;
  leadsCount: number;
  offersCount: number;
  daysOnMarket: number;
  isSelected?: boolean;
  onSelect?: (propertyId: string) => void;
  onClick: () => void;
  onQuickEdit?: (property: Property) => void;
  onArchive?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onDuplicate?: (property: Property) => void;
}

export function EnhancedPropertyCard({
  property,
  leadsCount,
  offersCount,
  daysOnMarket,
  isSelected = false,
  onSelect,
  onClick,
  onQuickEdit,
  onArchive,
  onDelete,
  onDuplicate
}: EnhancedPropertyCardProps) {
  const [imageError, setImageError] = useState(false);

  // Calculate performance indicators
  const isHot = leadsCount >= 3 && daysOnMarket <= 30;
  const isCold = leadsCount === 0 && daysOnMarket > 90;
  const hasNoOffers = offersCount === 0 && daysOnMarket > 30;
  const isExpiringSoon = daysOnMarket > 150; // Arbitrary threshold
  const isFeatured = isPropertyFeatured(property);
  const isExpired = isPropertyExpired(property);

  // Price trend (would be calculated from price history in real implementation)
  const priceTrend = 'stable' as 'up' | 'down' | 'stable';

  // Quality score based on completeness
  const qualityScore = calculateQualityScore(property);

  // View count
  const viewCount = property.viewCount || 0;

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'available': { variant: 'default', label: 'Available' },
      'negotiation': { variant: 'secondary', label: 'In Negotiation' },
      'under-contract': { variant: 'secondary', label: 'Under Contract' },
      'sold': { variant: 'outline', label: 'Sold' },
      'withdrawn': { variant: 'outline', label: 'Withdrawn' },
      'rented': { variant: 'outline', label: 'Rented' },
      'lease-signed': { variant: 'secondary', label: 'Lease Signed' }
    };

    const config = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Copy property link to clipboard
    const link = `${window.location.origin}/property/${property.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Property link copied to clipboard');
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(property);
  };

  const handleQuickEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickEdit?.(property);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(property);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(property);
  };

  const handleSelectToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(property.id);
  };

  return (
    <Card
      className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
      onClick={onClick}
    >
      {/* Image Section with Overlays */}
      <div className="relative h-48 bg-gray-100">
        {/* Selection Checkbox */}
        {onSelect && (
          <div
            className="absolute top-2 left-2 z-10"
            onClick={handleSelectToggle}
          >
            <div className="bg-white rounded p-1 shadow-md">
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        )}

        {/* Performance Indicators */}
        <div className="absolute top-2 right-2 z-10 flex gap-1 flex-wrap max-w-[180px] justify-end">
          {isFeatured && (
            <Badge className="gap-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
              <Sparkles className="w-3 h-3" />
              Featured
            </Badge>
          )}
          {isHot && (
            <Badge variant="destructive" className="gap-1">
              <Flame className="w-3 h-3" />
              Hot
            </Badge>
          )}
          {isCold && (
            <Badge variant="secondary" className="gap-1">
              <Snowflake className="w-3 h-3" />
              Cold
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="gap-1 bg-white text-red-600">
              <AlertCircle className="w-3 h-3" />
              Expired
            </Badge>
          )}
          {!isExpired && isExpiringSoon && (
            <Badge variant="outline" className="gap-1 bg-white">
              <AlertCircle className="w-3 h-3" />
              Expiring
            </Badge>
          )}
        </div>

        {/* Image */}
        {property.images && property.images.length > 0 && !imageError ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Quick Actions Overlay (shown on hover) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 gap-1"
              onClick={handleShare}
            >
              <Share2 className="w-3 h-3" />
              Share
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 gap-1"
              onClick={handleQuickEdit}
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="secondary">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quality Score */}
        <div className="absolute bottom-2 left-2 z-10">
          <Badge
            variant={qualityScore >= 80 ? 'default' : qualityScore >= 50 ? 'secondary' : 'outline'}
            className="gap-1"
          >
            <Star className="w-3 h-3" />
            {qualityScore}%
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium line-clamp-1">{property.title}</h3>
            {getStatusBadge(property.status)}
          </div>

          <PropertyAddressDisplay property={property} showIcon format="short" className="text-sm text-gray-600" />
        </div>

        {/* Price and Trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatPKR(property.price || 0)}</span>
            {priceTrend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
            {priceTrend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
          </div>
          <span className="text-sm text-gray-600">
            {formatAreaDisplay(Number(property.area || 0), property.areaUnit)}
          </span>
        </div>

        {/* Property Features */}
        {(property.bedrooms || property.bathrooms) && (
          <div className="flex gap-4 text-sm text-gray-600">
            {property.bedrooms && (
              <span>{property.bedrooms} BD</span>
            )}
            {property.bathrooms && (
              <span>{property.bathrooms} BA</span>
            )}
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t">
          <div className="flex flex-col items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{leadsCount}</span>
            <span className="text-xs text-gray-600">Leads</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{offersCount}</span>
            <span className="text-xs text-gray-600">Offers</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Eye className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{viewCount}</span>
            <span className="text-xs text-gray-600">Views</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{daysOnMarket}</span>
            <span className="text-xs text-gray-600">Days</span>
          </div>
        </div>

        {/* Warning Indicators */}
        {hasNoOffers && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <AlertCircle className="w-3 h-3" />
            No offers yet after {daysOnMarket} days
          </div>
        )}

        {/* Agent Info */}
        {property.assignedAgentName && (
          <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              {property.assignedAgentName.charAt(0).toUpperCase()}
            </div>
            <span>{property.assignedAgentName}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// Helper function to calculate quality score
function calculateQualityScore(property: Property): number {
  let score = 0;
  const maxScore = 100;

  // Title (10 points)
  if (property.title && property.title.length >= 10) score += 10;

  // Description (15 points)
  if (property.description && property.description.length >= 50) score += 15;
  else if (property.description && property.description.length >= 20) score += 8;

  // Images (25 points)
  if (property.images && property.images.length >= 5) score += 25;
  else if (property.images && property.images.length >= 3) score += 15;
  else if (property.images && property.images.length >= 1) score += 5;

  // Price (10 points)
  if (property.price && property.price > 0) score += 10;

  // Area (10 points)
  if (property.area && Number(property.area) > 0) score += 10;

  // Address (10 points)
  if (property.address && property.address.length >= 10) score += 10;

  // Features (20 points)
  if (property.bedrooms) score += 5;
  if (property.bathrooms) score += 5;
  if (property.features && property.features.length > 0) score += 10;

  return Math.round((score / maxScore) * 100);
}