/**
 * Agency-Owned Properties Dashboard
 * Phase 2 Implementation - View and manage properties owned by the agency
 */

import React, { useState, useMemo } from 'react';
import { Property, User } from '../types';
import { getProperties } from '../lib/data';
import { createSellCycle as addSellCycle, getSellCyclesByProperty } from '../lib/sellCycle';
import { getAgencyOwnedProperties, getRelistableProperties } from '../lib/portfolio';
import { formatPKR } from '../lib/currency';
import { PropertyAddressDisplay } from './PropertyAddressDisplay';
import RelistPropertyModal from './RelistPropertyModal';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import {
  MapPin,
  Calendar,
  Tag,
  MoreVertical,
  Eye,
  RefreshCw,
  Trash2,
  Building2,
  DollarSign,
  Package,
  Filter,
  Search,
  ArrowUpRight
} from 'lucide-react';
import { formatDate } from '../lib/validation';

interface AgencyOwnedPropertiesDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

type PropertyFilter = 'all' | 'available' | 'listed' | 'rented' | 'relistable';

export default function AgencyOwnedPropertiesDashboard({ onNavigate }: AgencyOwnedPropertiesDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('all');
  const [relistModalOpen, setRelistModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [user] = useState<User>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : { id: 'system', name: 'System', email: '', role: 'admin' };
  });

  // Load agency properties
  const agencyProperties = getAgencyOwnedProperties();
  const relistableProperties = getRelistableProperties();

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalProperties = agencyProperties.length;
    const totalValue = agencyProperties.reduce((sum, p) => {
      // Get the most recent purchase price from ownership history
      const history = p.ownershipHistory || [];
      const lastOwnership = history.length > 0 ? history[history.length - 1] : null;
      return sum + (lastOwnership?.salePrice || 0);
    }, 0);

    const availableForSale = agencyProperties.filter(p =>
      (p.activeSellCycleIds || []).length > 0
    ).length;

    const rented = agencyProperties.filter(p =>
      (p.activeRentCycleIds || []).length > 0
    ).length;

    const relistableCount = relistableProperties.length;

    return {
      totalProperties,
      totalValue,
      availableForSale,
      rented,
      relistableCount
    };
  }, [agencyProperties, relistableProperties]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    let filtered = agencyProperties;

    // Apply status filter
    if (propertyFilter === 'available') {
      filtered = filtered.filter(p =>
        (p.activeSellCycleIds || []).length === 0 &&
        (p.activeRentCycleIds || []).length === 0 &&
        (p.activePurchaseCycleIds || []).length === 0
      );
    } else if (propertyFilter === 'listed') {
      filtered = filtered.filter(p => (p.activeSellCycleIds || []).length > 0);
    } else if (propertyFilter === 'rented') {
      filtered = filtered.filter(p => (p.activeRentCycleIds || []).length > 0);
    } else if (propertyFilter === 'relistable') {
      filtered = relistableProperties;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.address.toLowerCase().includes(query) ||
        p.propertyType.toLowerCase().includes(query) ||
        p.status.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [agencyProperties, relistableProperties, propertyFilter, searchQuery]);

  const handlePropertyClick = (propertyId: string) => {
    onNavigate('property-details', { propertyId });
  };

  const handleRelistProperty = (propertyId: string) => {
    // Open relist modal
    const property = agencyProperties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setRelistModalOpen(true);
    }
  };

  const handleSellProperty = (propertyId: string) => {
    onNavigate('start-sell-cycle', { propertyId });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--color-primary)]">Agency Portfolio</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Properties owned and managed by the agency
          </p>
        </div>
        <Button onClick={() => onNavigate('add-property', { acquisitionType: 'agency-purchase' })} className="gap-2">
          <Package className="w-4 h-4" />
          Purchase Property
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text-secondary)]">Total Properties</p>
            <div className="p-2 rounded-lg bg-[var(--color-accent)]">
              <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="text-xl">{metrics.totalProperties}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            In agency portfolio
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text-secondary)]">Portfolio Value</p>
            <div className="p-2 rounded-lg bg-[var(--color-accent)]">
              <DollarSign className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="text-xl">{formatPKR(metrics.totalValue)}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Total investment
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text-secondary)]">Listed for Sale</p>
            <div className="p-2 rounded-lg bg-[var(--color-accent)]">
              <Tag className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-xl">{metrics.availableForSale}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Active listings
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text-secondary)]">Rented Out</p>
            <div className="p-2 rounded-lg bg-[var(--color-accent)]">
              <Building2 className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-xl">{metrics.rented}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Generating income
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text-secondary)]">Re-listable</p>
            <div className="p-2 rounded-lg bg-[var(--color-accent)]">
              <RefreshCw className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="text-xl">{metrics.relistableCount}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Can be re-acquired
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <Input
              placeholder="Search by address, type, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={propertyFilter} onValueChange={(value: PropertyFilter) => setPropertyFilter(value)}>
            <SelectTrigger className="w-full md:w-[220px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              <SelectItem value="available">Available (No Cycles)</SelectItem>
              <SelectItem value="listed">Listed for Sale</SelectItem>
              <SelectItem value="rented">Rented Out</SelectItem>
              <SelectItem value="relistable">Re-listable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" />
            <h3 className="mb-2">No Properties Found</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {searchQuery || propertyFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'The agency does not own any properties yet'}
            </p>
            {!searchQuery && propertyFilter === 'all' && (
              <Button onClick={() => onNavigate('add-property', { acquisitionType: 'agency-purchase' })} className="gap-2">
                <Package className="w-4 h-4" />
                Purchase First Property
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              onView={handlePropertyClick}
              onSell={handleSellProperty}
              onRelist={handleRelistProperty}
              isRelistable={relistableProperties.some(p => p.id === property.id)}
            />
          ))}
        </div>
      )}

      {/* Quick Stats Summary */}
      {filteredProperties.length > 0 && (
        <Card className="p-6">
          <h3 className="text-[var(--color-primary)] mb-4">Filtered Properties Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[var(--color-text-secondary)] mb-2">Property Types</p>
              <div className="space-y-2">
                {Object.entries(
                  filteredProperties.reduce((acc, p) => {
                    acc[p.propertyType] = (acc[p.propertyType] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[var(--color-text-secondary)] mb-2">Status Distribution</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Listed for Sale</span>
                  <Badge variant="secondary">
                    {filteredProperties.filter(p => (p.activeSellCycleIds || []).length > 0).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Rented Out</span>
                  <Badge variant="secondary">
                    {filteredProperties.filter(p => (p.activeRentCycleIds || []).length > 0).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Available</span>
                  <Badge variant="secondary">
                    {filteredProperties.filter(p =>
                      (p.activeSellCycleIds || []).length === 0 &&
                      (p.activeRentCycleIds || []).length === 0
                    ).length}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[var(--color-text-secondary)] mb-2">Total Value</p>
              <p className="text-2xl mb-2">
                {formatPKR(
                  filteredProperties.reduce((sum, p) => {
                    const history = p.ownershipHistory || [];
                    const lastOwnership = history.length > 0 ? history[history.length - 1] : null;
                    return sum + (lastOwnership?.salePrice || 0);
                  }, 0)
                )}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Across {filteredProperties.length} properties
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Relist Property Modal */}
      {relistModalOpen && selectedProperty && (
        <RelistPropertyModal
          open={relistModalOpen}
          property={selectedProperty}
          user={user}
          onClose={() => {
            setRelistModalOpen(false);
            setSelectedProperty(null);
          }}
          onSuccess={() => {
            setRelistModalOpen(false);
            setSelectedProperty(null);
            // Reload the page to show updated property data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// Property Card Component
interface PropertyCardProps {
  property: Property;
  onView: (id: string) => void;
  onSell: (id: string) => void;
  onRelist: (id: string) => void;
  isRelistable: boolean;
}

function PropertyCard({ property, onView, onSell, onRelist, isRelistable }: PropertyCardProps) {
  const history = property.ownershipHistory || [];
  const lastOwnership = history.length > 0 ? history[history.length - 1] : null;
  const purchasePrice = lastOwnership?.salePrice || 0;
  const purchaseDate = lastOwnership?.acquiredDate;

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      {/* Property Image */}
      {property.images && property.images.length > 0 ? (
        <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-[var(--color-muted)]">
          <img
            src={property.images[0]}
            alt={property.address}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 mb-4 rounded-lg bg-[var(--color-muted)] flex items-center justify-center">
          <Building2 className="w-12 h-12 text-[var(--color-text-secondary)]" />
        </div>
      )}

      {/* Property Details */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-[var(--color-primary)] mb-1 line-clamp-1">
              <PropertyAddressDisplay property={property} format="short" />
            </h3>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <span className="capitalize">{property.propertyType}</span>
              <span>•</span>
              <span>{property.area} {property.areaUnit}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(property.id)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {(property.activeSellCycleIds || []).length === 0 && !isRelistable && (
                <DropdownMenuItem onClick={() => onSell(property.id)}>
                  <Tag className="w-4 h-4 mr-2" />
                  List for Sale
                </DropdownMenuItem>
              )}
              {isRelistable && (
                <DropdownMenuItem onClick={() => onRelist(property.id)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-list Property
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] mb-1">Purchase Price</p>
            <p className="text-sm">{formatPKR(purchasePrice)}</p>
          </div>
          {purchaseDate && (
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">Acquired On</p>
              <p className="text-sm">{formatDate(purchaseDate)}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant={
              (property.activeSellCycleIds || []).length > 0 ? 'default' :
                (property.activeRentCycleIds || []).length > 0 ? 'default' :
                  'secondary'
            }
          >
            {property.status}
          </Badge>
          {isRelistable && (
            <Badge variant="secondary" className="text-orange-600">
              Re-listable
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 mt-2"
          onClick={() => onView(property.id)}
        >
          <Eye className="w-4 h-4" />
          View Full Details
          <ArrowUpRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </Card>
  );
}