/**
 * Smart Breadcrumbs - Phase 2
 * 
 * Context-aware breadcrumbs that show entity relationships
 * Helps users understand where they are in the transaction graph
 */

import React from 'react';
import { ChevronRight, Home, Building2, ShoppingCart, FileText, Search } from 'lucide-react';
import { TransactionGraph } from '../../lib/transaction-graph';

interface SmartBreadcrumbsProps {
  currentPage: string;
  currentEntityId?: string;
  graph?: TransactionGraph;
  onNavigate: (page: string, id?: string) => void;
}

export function SmartBreadcrumbs({ 
  currentPage, 
  currentEntityId,
  graph,
  onNavigate 
}: SmartBreadcrumbsProps) {
  const breadcrumbs: Array<{
    label: string;
    page: string;
    id?: string;
    icon?: React.ElementType;
    isCurrent?: boolean;
  }> = [];

  // Base breadcrumb
  breadcrumbs.push({
    label: 'Agency',
    page: 'agency-workspace',
    icon: Building2,
  });

  // Build context-aware breadcrumbs based on current page and graph
  if (currentPage === 'property-detail' && graph?.property) {
    breadcrumbs.push({
      label: 'Properties',
      page: 'properties',
    });
    breadcrumbs.push({
      label: graph.property.address,
      page: 'property-detail',
      id: graph.property.id,
      icon: Home,
      isCurrent: true,
    });

    // Show related deal if exists
    if (graph.deal) {
      breadcrumbs.push({
        label: `→ Deal: ${graph.deal.dealNumber}`,
        page: 'deal-detail',
        id: graph.deal.id,
      });
    }
  }

  else if (currentPage === 'sell-cycle-detail' && graph?.sellCycle) {
    breadcrumbs.push({
      label: 'Properties',
      page: 'properties',
    });
    
    if (graph.property) {
      breadcrumbs.push({
        label: graph.property.address,
        page: 'property-detail',
        id: graph.property.id,
        icon: Home,
      });
    }

    breadcrumbs.push({
      label: `Sell Cycle: ${graph.sellCycle.id.slice(0, 12)}...`,
      page: 'sell-cycle-detail',
      id: graph.sellCycle.id,
      icon: Building2,
      isCurrent: true,
    });

    // Show created deal if exists
    if (graph.deal) {
      breadcrumbs.push({
        label: `→ ${graph.deal.dealNumber}`,
        page: 'deal-detail',
        id: graph.deal.id,
      });
    }
  }

  else if (currentPage === 'purchase-cycle-detail' && graph?.purchaseCycle) {
    breadcrumbs.push({
      label: 'Purchase Cycles',
      page: 'purchase-cycles',
    });

    breadcrumbs.push({
      label: `${graph.purchaseCycle.purchaserName}'s Purchase`,
      page: 'purchase-cycle-detail',
      id: graph.purchaseCycle.id,
      icon: ShoppingCart,
      isCurrent: true,
    });

    // Show property context
    if (graph.property) {
      breadcrumbs.push({
        label: `→ ${graph.property.address}`,
        page: 'property-detail',
        id: graph.property.id,
      });
    }

    // Show created deal if exists
    if (graph.deal) {
      breadcrumbs.push({
        label: `→ ${graph.deal.dealNumber}`,
        page: 'deal-detail',
        id: graph.deal.id,
      });
    }
  }

  else if (currentPage === 'deal-detail' && graph?.deal) {
    breadcrumbs.push({
      label: 'Deals',
      page: 'deals',
    });

    breadcrumbs.push({
      label: graph.deal.dealNumber,
      page: 'deal-detail',
      id: graph.deal.id,
      icon: FileText,
      isCurrent: true,
    });

    // Show source cycles
    if (graph.sellCycle || graph.purchaseCycle) {
      const sources = [];
      if (graph.sellCycle) sources.push(`Sell: ${graph.sellCycle.id.slice(0, 8)}...`);
      if (graph.purchaseCycle) sources.push(`Purchase: ${graph.purchaseCycle.id.slice(0, 8)}...`);
      
      breadcrumbs.push({
        label: `→ From ${sources.join(' + ')}`,
        page: 'deal-detail',
        id: graph.deal.id,
      });
    }
  }

  else if (currentPage === 'buyer-requirement-detail' && graph?.buyerRequirement) {
    breadcrumbs.push({
      label: 'Buyer Requirements',
      page: 'buyer-requirements',
    });

    breadcrumbs.push({
      label: graph.buyerRequirement.buyerName,
      page: 'buyer-requirement-detail',
      id: graph.buyerRequirement.id,
      icon: Search,
      isCurrent: true,
    });
  }

  // Fallback breadcrumbs for pages without graph
  else {
    const pageLabels: Record<string, { label: string; parent?: string }> = {
      'properties': { label: 'Properties' },
      'sell-cycles': { label: 'Sell Cycles' },
      'purchase-cycles': { label: 'Purchase Cycles' },
      'deals': { label: 'Deals' },
      'buyer-requirements': { label: 'Buyer Requirements' },
      'rent-cycles': { label: 'Rent Cycles' },
      'contacts': { label: 'Contacts' },
    };

    const pageInfo = pageLabels[currentPage];
    if (pageInfo) {
      breadcrumbs.push({
        label: pageInfo.label,
        page: currentPage,
        isCurrent: true,
      });
    }
  }

  return (
    <nav className="flex items-center gap-2 text-sm mb-6 overflow-x-auto">
      {breadcrumbs.map((crumb, index) => {
        const Icon = crumb.icon;
        const isLast = index === breadcrumbs.length - 1;
        const isCurrent = crumb.isCurrent || isLast;

        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="size-4 text-gray-400 flex-shrink-0" />}
            
            <button
              onClick={() => !isCurrent && onNavigate(crumb.page, crumb.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors flex-shrink-0 ${
                isCurrent
                  ? 'text-[#030213] bg-[#ececf0] cursor-default'
                  : 'text-gray-600 hover:text-[#030213] hover:bg-[#f5f5f5]'
              }`}
              disabled={isCurrent}
            >
              {Icon && <Icon className="size-4" />}
              <span className={isCurrent ? '' : 'hover:underline'}>
                {crumb.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
