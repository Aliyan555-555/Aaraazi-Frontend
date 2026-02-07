/**
 * Unified Transaction Header - Phase 2
 * 
 * Shows complete transaction context at the top of any related page
 * Provides quick navigation between all connected entities
 */

import React from 'react';
import { Building2, FileText, ShoppingCart, Home, ArrowRight, ExternalLink } from 'lucide-react';
import { TransactionGraph } from '../../lib/transaction-graph';
import { formatPKR } from '../../lib/currency';

interface UnifiedTransactionHeaderProps {
  graph: TransactionGraph;
  currentPage: 'deal' | 'sellCycle' | 'purchaseCycle' | 'property';
  onNavigate: (page: string, id: string) => void;
}

export function UnifiedTransactionHeader({ 
  graph, 
  currentPage,
  onNavigate 
}: UnifiedTransactionHeaderProps) {
  const { deal, sellCycle, purchaseCycle, property, buyerRequirement } = graph;

  // Determine status and color
  const getStatusInfo = () => {
    if (deal) {
      const statusMap: Record<string, { label: string; color: string }> = {
        'active': { label: 'IN PROGRESS', color: 'bg-blue-500' },
        'completed': { label: 'COMPLETED', color: 'bg-green-600' },
        'cancelled': { label: 'CANCELLED', color: 'bg-red-500' },
        'on-hold': { label: 'ON HOLD', color: 'bg-yellow-500' },
      };
      return statusMap[deal.lifecycle.status] || { label: deal.lifecycle.status.toUpperCase(), color: 'bg-gray-500' };
    }
    if (sellCycle) {
      const statusMap: Record<string, { label: string; color: string }> = {
        'listed': { label: 'LISTED', color: 'bg-blue-500' },
        'offer-received': { label: 'OFFERS RECEIVED', color: 'bg-purple-500' },
        'negotiation': { label: 'NEGOTIATING', color: 'bg-yellow-500' },
        'under-contract': { label: 'UNDER CONTRACT', color: 'bg-orange-500' },
        'sold': { label: 'SOLD', color: 'bg-green-600' },
        'cancelled': { label: 'CANCELLED', color: 'bg-red-500' },
      };
      return statusMap[sellCycle.status] || { label: sellCycle.status.toUpperCase(), color: 'bg-gray-500' };
    }
    if (purchaseCycle) {
      const statusMap: Record<string, { label: string; color: string }> = {
        'prospecting': { label: 'PROSPECTING', color: 'bg-blue-400' },
        'offer-made': { label: 'OFFER MADE', color: 'bg-purple-500' },
        'accepted': { label: 'ACCEPTED', color: 'bg-green-500' },
        'acquired': { label: 'ACQUIRED', color: 'bg-green-600' },
        'cancelled': { label: 'CANCELLED', color: 'bg-red-500' },
      };
      return statusMap[purchaseCycle.status] || { label: purchaseCycle.status.toUpperCase(), color: 'bg-gray-500' };
    }
    return { label: 'ACTIVE', color: 'bg-blue-500' };
  };

  const statusInfo = getStatusInfo();

  // Get primary price
  const getPrice = () => {
    if (deal) return formatPKR(deal.financial.agreedPrice);
    if (sellCycle) return formatPKR(sellCycle.askingPrice);
    if (purchaseCycle && purchaseCycle.negotiatedPrice) return formatPKR(purchaseCycle.negotiatedPrice);
    if (purchaseCycle) return formatPKR(purchaseCycle.offerAmount);
    return null;
  };

  const price = getPrice();

  // Get seller and buyer names
  const sellerName = deal ? deal.parties.seller.name : sellCycle?.sellerName || purchaseCycle?.sellerName;
  const buyerName = deal ? deal.parties.buyer.name : purchaseCycle?.purchaserName;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
      {/* Top Section - Property & Status */}
      <div className="bg-gradient-to-r from-[#030213] to-[#1a1a2e] text-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Home className="size-5 text-[#ececf0]" />
              <h2 className="text-white">
                {property?.address || 'Property Information'}
              </h2>
            </div>
            
            {/* Entity IDs Row */}
            <div className="flex items-center gap-4 text-sm text-[#ececf0] flex-wrap">
              {deal && (
                <span className="flex items-center gap-1.5">
                  <FileText className="size-4" />
                  {deal.dealNumber}
                </span>
              )}
              {sellCycle && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4" />
                  Sell: {sellCycle.id.slice(0, 12)}...
                </span>
              )}
              {purchaseCycle && (
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="size-4" />
                  Purchase: {purchaseCycle.id.slice(0, 12)}...
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className={`${statusInfo.color} text-white px-4 py-2 rounded-lg flex items-center gap-2`}>
            <div className="size-2 bg-white rounded-full animate-pulse" />
            <span className="tracking-wide">{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Transaction Flow */}
      <div className="border-b border-gray-200 bg-[#fafafa] px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Seller */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 mb-1">Seller</span>
            <span className="font-medium text-[#030213]">{sellerName || 'Not Set'}</span>
          </div>

          {/* Arrow */}
          <ArrowRight className="size-6 text-gray-400 mt-4" />

          {/* Price */}
          {price && (
            <>
              <div className="flex flex-col items-center bg-white border-2 border-[#030213] rounded-lg px-4 py-2">
                <span className="text-xs text-gray-500 mb-1">Price</span>
                <span className="font-medium text-[#030213]">{price}</span>
              </div>

              <ArrowRight className="size-6 text-gray-400 mt-4" />
            </>
          )}

          {/* Buyer */}
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-500 mb-1">Buyer</span>
            <span className="font-medium text-[#030213]">{buyerName || 'Not Set'}</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Pills */}
      <div className="px-6 py-4 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 mr-2">Quick Access:</span>
          
          {property && (
            <button
              onClick={() => onNavigate('property-detail', property.id)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                currentPage === 'property'
                  ? 'bg-[#030213] text-white'
                  : 'bg-[#ececf0] text-[#030213] hover:bg-[#e1e1e5]'
              }`}
            >
              <Home className="size-3.5" />
              Property
            </button>
          )}

          {sellCycle && (
            <button
              onClick={() => onNavigate('sell-cycle-detail', sellCycle.id)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                currentPage === 'sellCycle'
                  ? 'bg-[#030213] text-white'
                  : 'bg-[#ececf0] text-[#030213] hover:bg-[#e1e1e5]'
              }`}
            >
              <Building2 className="size-3.5" />
              Sell Cycle
              <span className="text-xs opacity-75">({sellCycle.status})</span>
            </button>
          )}

          {purchaseCycle && (
            <button
              onClick={() => onNavigate('purchase-cycle-detail', purchaseCycle.id)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                currentPage === 'purchaseCycle'
                  ? 'bg-[#030213] text-white'
                  : 'bg-[#ececf0] text-[#030213] hover:bg-[#e1e1e5]'
              }`}
            >
              <ShoppingCart className="size-3.5" />
              Purchase Cycle
              <span className="text-xs opacity-75">({purchaseCycle.status})</span>
            </button>
          )}

          {deal && (
            <button
              onClick={() => onNavigate('deal-detail', deal.id)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                currentPage === 'deal'
                  ? 'bg-[#030213] text-white'
                  : 'bg-[#ececf0] text-[#030213] hover:bg-[#e1e1e5]'
              }`}
            >
              <FileText className="size-3.5" />
              Deal
              <span className="text-xs opacity-75">{deal.dealNumber}</span>
            </button>
          )}

          {buyerRequirement && (
            <button
              onClick={() => onNavigate('buyer-requirement-detail', buyerRequirement.id)}
              className="px-3 py-1.5 rounded-md text-sm bg-[#ececf0] text-[#030213] hover:bg-[#e1e1e5] flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="size-3.5" />
              Buyer Requirement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
