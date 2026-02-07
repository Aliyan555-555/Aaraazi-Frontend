/**
 * Connected Entities Card - Phase 2
 * 
 * Shows all entities connected to current view with key details
 * Provides contextual information and navigation
 */

import React from 'react';
import { 
  Home, 
  Building2, 
  ShoppingCart, 
  FileText, 
  Search,
  ArrowRight,
  Calendar,
  User,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { TransactionGraph } from '../../lib/transaction-graph';
import { formatPKR } from '../../lib/currency';

interface ConnectedEntitiesCardProps {
  graph: TransactionGraph;
  currentEntityType: 'deal' | 'sellCycle' | 'purchaseCycle' | 'property';
  onNavigate: (page: string, id: string) => void;
}

export function ConnectedEntitiesCard({ 
  graph, 
  currentEntityType,
  onNavigate 
}: ConnectedEntitiesCardProps) {
  const { deal, sellCycle, purchaseCycle, property, buyerRequirement } = graph;

  // Don't show if only one entity exists (no connections)
  const entityCount = [deal, sellCycle, purchaseCycle, property, buyerRequirement].filter(Boolean).length;
  if (entityCount <= 1) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('completed') || status.includes('sold') || status.includes('acquired')) {
      return <CheckCircle2 className="size-4 text-green-600" />;
    }
    if (status.includes('cancelled')) {
      return <XCircle className="size-4 text-red-500" />;
    }
    return <Clock className="size-4 text-blue-500" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="flex items-center gap-2 text-[#030213]">
          <ArrowRight className="size-5" />
          Connected Entities
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          All entities linked to this transaction
        </p>
      </div>

      <div className="p-6 space-y-4">
        
        {/* Property */}
        {property && currentEntityType !== 'property' && (
          <div className="border border-gray-200 rounded-lg p-4 hover:border-[#030213] transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-[#ececf0] rounded-lg flex items-center justify-center">
                  <Home className="size-5 text-[#030213]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Property</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {property.propertyType}
                    </span>
                  </div>
                  <h4 className="text-[#030213] mt-0.5">{property.address}</h4>
                </div>
              </div>
              <button
                onClick={() => onNavigate('property-detail', property.id)}
                className="px-3 py-1.5 text-sm bg-[#030213] text-white rounded-md hover:bg-[#1a1a2e] transition-colors"
              >
                View Property
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block">Area</span>
                <span className="text-[#030213]">{property.area} {property.areaUnit}</span>
              </div>
              {property.bedrooms && (
                <div>
                  <span className="text-gray-500 block">Bedrooms</span>
                  <span className="text-[#030213]">{property.bedrooms} BR</span>
                </div>
              )}
              <div>
                <span className="text-gray-500 block">Owner</span>
                <span className="text-[#030213]">{property.currentOwnerName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sell Cycle */}
        {sellCycle && currentEntityType !== 'sellCycle' && (
          <div className="border border-gray-200 rounded-lg p-4 hover:border-[#030213] transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building2 className="size-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sell Cycle</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(sellCycle.status)}
                      <span className="text-xs text-gray-600 capitalize">
                        {sellCycle.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-[#030213] mt-0.5">{sellCycle.title}</h4>
                </div>
              </div>
              <button
                onClick={() => onNavigate('sell-cycle-detail', sellCycle.id)}
                className="px-3 py-1.5 text-sm bg-[#030213] text-white rounded-md hover:bg-[#1a1a2e] transition-colors"
              >
                View Sell Cycle
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block">Listed Date</span>
                <span className="text-[#030213]">{formatDate(sellCycle.listedDate)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Asking Price</span>
                <span className="text-[#030213]">{formatPKR(sellCycle.askingPrice)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Offers</span>
                <span className="text-[#030213]">{sellCycle.offers.length} received</span>
              </div>
            </div>

            {sellCycle.createdDealId && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="text-gray-600">Deal Created: </span>
                <span className="text-[#030213]">
                  {deal?.dealNumber || sellCycle.createdDealId.slice(0, 12) + '...'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Purchase Cycle */}
        {purchaseCycle && currentEntityType !== 'purchaseCycle' && (
          <div className="border border-gray-200 rounded-lg p-4 hover:border-[#030213] transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="size-5 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Purchase Cycle</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(purchaseCycle.status)}
                      <span className="text-xs text-gray-600 capitalize">
                        {purchaseCycle.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-[#030213] mt-0.5">
                    {purchaseCycle.purchaserName}'s Purchase
                  </h4>
                </div>
              </div>
              <button
                onClick={() => onNavigate('purchase-cycle-detail', purchaseCycle.id)}
                className="px-3 py-1.5 text-sm bg-[#030213] text-white rounded-md hover:bg-[#1a1a2e] transition-colors"
              >
                View Purchase
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block">Purchaser</span>
                <span className="text-[#030213] capitalize">{purchaseCycle.purchaserType}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Offer Amount</span>
                <span className="text-[#030213]">{formatPKR(purchaseCycle.offerAmount)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Financing</span>
                <span className="text-[#030213] capitalize">{purchaseCycle.financingType}</span>
              </div>
            </div>

            {purchaseCycle.buyerRequirementId && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-sm">
                <Search className="size-4 text-blue-600" />
                <span className="text-gray-600">From Buyer Requirement</span>
                <button
                  onClick={() => onNavigate('buyer-requirement-detail', purchaseCycle.buyerRequirementId!)}
                  className="text-blue-600 hover:underline"
                >
                  View Requirement
                </button>
              </div>
            )}
          </div>
        )}

        {/* Deal */}
        {deal && currentEntityType !== 'deal' && (
          <div className="border border-gray-200 rounded-lg p-4 hover:border-[#030213] transition-colors bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="size-5 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Deal</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(deal.lifecycle.status)}
                      <span className="text-xs text-gray-600 capitalize">
                        {deal.lifecycle.status}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-[#030213] mt-0.5">{deal.dealNumber}</h4>
                </div>
              </div>
              <button
                onClick={() => onNavigate('deal-detail', deal.id)}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                View Deal
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block">Agreed Price</span>
                <span className="text-[#030213]">{formatPKR(deal.financial.agreedPrice)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Current Stage</span>
                <span className="text-[#030213] capitalize">
                  {deal.lifecycle.stage.replace('-', ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Progress</span>
                <span className="text-[#030213]">
                  {Math.round((deal.financial.totalPaid / deal.financial.agreedPrice) * 100)}% paid
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-gray-500" />
                  <span className="text-gray-600">Primary Agent:</span>
                  <span className="text-[#030213]">{deal.agents.primary.name}</span>
                </div>
                {deal.agents.secondary && (
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-gray-500" />
                    <span className="text-gray-600">Buyer Agent:</span>
                    <span className="text-[#030213]">{deal.agents.secondary.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Buyer Requirement */}
        {buyerRequirement && (
          <div className="border border-gray-200 rounded-lg p-4 hover:border-[#030213] transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Search className="size-5 text-orange-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Buyer Requirement</span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded capitalize">
                      {buyerRequirement.status}
                    </span>
                  </div>
                  <h4 className="text-[#030213] mt-0.5">{buyerRequirement.buyerName}</h4>
                </div>
              </div>
              <button
                onClick={() => onNavigate('buyer-requirement-detail', buyerRequirement.id)}
                className="px-3 py-1.5 text-sm bg-[#030213] text-white rounded-md hover:bg-[#1a1a2e] transition-colors"
              >
                View Requirement
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block">Budget</span>
                <span className="text-[#030213]">
                  {formatPKR(buyerRequirement.minBudget)} - {formatPKR(buyerRequirement.maxBudget)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Locations</span>
                <span className="text-[#030213]">{buyerRequirement.preferredLocations.length} areas</span>
              </div>
              <div>
                <span className="text-gray-500 block">Urgency</span>
                <span className={`capitalize ${
                  buyerRequirement.urgency === 'high' ? 'text-red-600' : 
                  buyerRequirement.urgency === 'medium' ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {buyerRequirement.urgency}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Connection Summary */}
      <div className="border-t border-gray-200 px-6 py-3 bg-[#fafafa]">
        <p className="text-sm text-gray-600">
          <span className="text-[#030213]">{entityCount} connected entities</span> • 
          Complete transaction graph available
        </p>
      </div>
    </div>
  );
}
