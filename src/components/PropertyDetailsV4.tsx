/**
 * Property Details - V4.0 with DetailPageTemplate ✅
 * 
 * COMPLETE REDESIGN using DetailPageTemplate system:
 * - DetailPageTemplate for consistent structure
 * - ContactCard for owner information
 * - QuickActionsPanel for sidebar actions
 * - MetricCardsGroup for statistics
 * - CyclesList for all property cycles
 * - OwnershipTimeline for ownership history
 * - All 5 UX Laws applied
 * - 8px grid system
 * - Responsive 2/3 + 1/3 layout
 * 
 * TABS:
 * 1. Overview - Summary + InfoPanels + Sidebar
 * 2. Cycles - Sell, Purchase, Rent cycles
 * 3. History - Ownership and transaction history
 * 4. Documents - Property documents
 * 5. Activity - Timeline of all activities
 */

import { useMemo, useState } from 'react';
import { Property, User, SellCycle, PurchaseCycle, RentCycle } from '../types';
import { PropertyAddressDisplay, useFormattedAddress } from './PropertyAddressDisplay';
import { Button } from './ui/button';

// DetailPageTemplate System
import {
  DetailPageTemplate,
  DetailPageTab,
  QuickActionsPanel,
  MetricCardsGroup,
  SummaryStatsPanel,
  ActivityTimeline,
  Activity,
  ContactCard,
} from './layout';

// Foundation Components
import { InfoPanel } from './ui/info-panel';
import { StatusTimeline } from './ui/status-timeline';
import { StatusBadge } from './layout/StatusBadge';
import { Badge } from './ui/badge';

// Investor Syndication Components
// TODO: MultiInvestorPurchaseModal and InvestorSharesCard need to be implemented
// import { MultiInvestorPurchaseModal, InvestorSharesCard } from './multi-investor-purchase';
import { RecordTransactionModal, PropertyTransactionHistory } from './transactions';
import { SaleDistributionModal, InvestorDistributionHistory } from './sale-distribution';
import { getInvestorById } from '../lib/investors';

// Temporary stub components until MultiInvestorPurchaseModal and InvestorSharesCard are implemented
const InvestorSharesCard = ({ property, onNavigateToInvestor }: any) => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <p className="text-sm text-gray-600">Investor shares feature coming soon</p>
    </div>
  );
};

// Icons
import {
  DollarSign,
  Home,
  Square,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Eye,
  FileText,
  Users,
  Clock,
  Bed,
  Bath,
  Building,
  MapPin,
  Plus,
  Key,
  Award,
} from 'lucide-react';

// Business Logic
import { formatPKR } from '../lib/currency';
import { formatAreaDisplay } from '../lib/areaUnits';
import { toast } from 'sonner';
import { getTasksByEntity, updateTask, TaskV4 } from '../lib/tasks';
import { TaskQuickAddWidget } from './tasks/TaskQuickAddWidget';
import { TaskListView } from './tasks/TaskListView';

interface PropertyDetailsV4Props {
  property: Property;
  sellCycles?: SellCycle[];
  purchaseCycles?: PurchaseCycle[];
  rentCycles?: RentCycle[];
  user: User;
  onBack: () => void;
  onEdit: () => void;
  onStartSellCycle: () => void;
  onStartPurchaseCycle: () => void;
  onStartRentCycle: () => void;
  onViewCycle: (cycleId: string, type: 'sell' | 'purchase' | 'rent') => void;
}

export function PropertyDetailsV4({
  property,
  sellCycles,
  purchaseCycles,
  rentCycles,
  user,
  onBack,
  onEdit,
  onStartSellCycle,
  onStartPurchaseCycle,
  onStartRentCycle,
  onViewCycle,
}: PropertyDetailsV4Props) {
  // CRITICAL FIX: Use cycles from props, not from property object
  // The property object stores activeSellCycleIds (just IDs), not the actual cycle objects
  // App.tsx fetches the actual cycles and passes them as props
  const safeSellCycles = sellCycles || [];
  const safePurchaseCycles = purchaseCycles || [];
  const safeRentCycles = rentCycles || [];

  // CRITICAL FIX: Get display price - prioritize active sell cycle's askingPrice
  const getDisplayPrice = () => {
    // Find the first active (listed) sell cycle
    const activeSellCycle = safeSellCycles.find(
      cycle => cycle.status === 'listed' || 
               property.activeSellCycleIds?.includes(cycle.id)
    );
    
    // Use sell cycle asking price if available, otherwise fall back to property price
    if (activeSellCycle?.askingPrice) {
      return activeSellCycle.askingPrice;
    }
    
    return property.price || 0;
  };

  const displayPrice = getDisplayPrice();

  // ==================== INVESTOR SYNDICATION STATE ====================
  // const [showMultiInvestorModal, setShowMultiInvestorModal] = useState(false);
  const [showRecordTransactionModal, setShowRecordTransactionModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);

  // ==================== TASKS STATE ====================
  const [propertyTasks, setPropertyTasks] = useState<TaskV4[]>([]);

  // Load tasks for this property
  useMemo(() => {
    const tasks = getTasksByEntity('property', property.id);
    setPropertyTasks(tasks);
  }, [property.id]);

  // Check if property is investor-owned
  const isInvestorOwned = property.currentOwnerType === 'investor' && 
                          property.investorShares && 
                          property.investorShares.length > 0;

  const totalActiveCycles =
    safeSellCycles.length + safePurchaseCycles.length + safeRentCycles.length;

  // Calculate days on market
  const daysOnMarket = useMemo(() => {
    if (!property.createdAt) return 1;
    const created = new Date(property.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }, [property.createdAt]);

  // Get status - PropertyStatus type: 'available' | 'sold' | 'rented' | 'under-offer'
  const currentStatus = property.status || (property as any).currentStatus || 'available';

  // Determine property lifecycle stage based on status
  const getLifecycleStage = () => {
    if (currentStatus === 'sold' || currentStatus === 'rented') {
      return 'transaction-complete';
    } else if (currentStatus === 'under-offer' || currentStatus === 'under-contract' || currentStatus === 'under_contract') {
      // Support both 'under-offer' (correct PropertyStatus) and legacy values
      return 'under-contract';
    } else if (totalActiveCycles > 0) {
      return 'active-marketing';
    }
    return 'property-listed';
  };

  const lifecycleStage = getLifecycleStage();

  // Get ownership history
  const ownershipHistory = property.ownershipHistory || [];

  // All cycles for history
  const allCycles = useMemo(() => {
    const sells = safeSellCycles.map((c: any) => ({
      ...c,
      type: 'sell',
      date: c.listedDate || c.createdAt,
    }));
    const purchases = safePurchaseCycles.map((c: any) => ({
      ...c,
      type: 'purchase',
      date: c.offerDate || c.createdAt,
    }));
    const rents = safeRentCycles.map((c: any) => ({
      ...c,
      type: 'rent',
      date: c.availableFrom || c.createdAt,
    }));

    return [...sells, ...purchases, ...rents].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [safeSellCycles, safePurchaseCycles, safeRentCycles]);

  // ==================== PAGE HEADER ====================
  const formattedAddress = useFormattedAddress(property, 'full');
  
  const pageHeader = {
    title: property.title || formattedAddress,
    breadcrumbs: [
      { label: 'Dashboard', onClick: onBack },
      { label: 'Properties', onClick: onBack },
      { label: property.title || formattedAddress },
    ],
    description: formattedAddress,
    metrics: [
      {
        label: 'Price',
        value: formatPKR(displayPrice),
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Area',
        value: formatAreaDisplay(property.area, property.areaUnit),
        icon: <Square className="w-4 h-4" />,
      },
      {
        label: 'Days Listed',
        value: daysOnMarket.toString(),
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        label: 'Views',
        value: (property.viewCount || 0).toString(),
        icon: <Eye className="w-4 h-4" />,
      },
      {
        label: 'Cycles',
        value: totalActiveCycles.toString(),
        icon: <FileText className="w-4 h-4" />,
      },
    ],
    primaryActions: [
      {
        label: 'Edit',
        onClick: onEdit,
        variant: 'outline' as const,
      },
      {
        label: 'Start Sell Cycle',
        onClick: onStartSellCycle,
        variant: 'default' as const,
      },
    ],
    secondaryActions: [
      {
        label: 'Start Purchase Cycle',
        onClick: onStartPurchaseCycle,
      },
      {
        label: 'Start Rent Cycle',
        onClick: onStartRentCycle,
      },
    ],
    status: currentStatus ? { label: currentStatus } : undefined,
    onBack,
  };

  // ==================== CONNECTED ENTITIES ====================
  const connectedEntities = [
    {
      type: 'owner' as const,
      name: property.currentOwnerName || property.sellerName || 'Unknown Owner',
      icon: <Users className="h-3 w-3" />,
      onClick: () => {},
    },
    ...(property.agentName
      ? [
          {
            type: 'agent' as const,
            name: property.agentName,
            icon: <Users className="h-3 w-3" />,
            onClick: () => {},
          },
        ]
      : []),
  ];

  // ==================== OVERVIEW TAB - LEFT COLUMN ====================
  const overviewContent = (
    <>
      {/* Status Timeline */}
      <StatusTimeline
        steps={[
          {
            label: 'Property Listed',
            status: 'complete',
            date: property.createdAt,
            description: 'Initial listing',
          },
          {
            label: 'Active Marketing',
            status: lifecycleStage === 'property-listed' ? 'current' : 'complete',
            date: property.createdAt,
            description: `${totalActiveCycles} cycles created`,
          },
          {
            label: 'Under Contract',
            status:
              lifecycleStage === 'under-contract'
                ? 'current'
                : lifecycleStage === 'transaction-complete'
                ? 'complete'
                : 'pending',
            date: undefined,
          },
          {
            label: 'Transaction Complete',
            status: lifecycleStage === 'transaction-complete' ? 'complete' : 'pending',
            date: undefined,
          },
        ]}
      />

      {/* Primary Information */}
      <InfoPanel
        title="Primary Information"
        data={[
          {
            label: 'Address',
            value: <PropertyAddressDisplay property={property} />,
            icon: <MapPin className="h-4 w-4" />,
          },
          {
            label: 'Property Type',
            value: <span className="capitalize">{property.propertyType}</span>,
            icon: <Building className="h-4 w-4" />,
          },
          {
            label: 'Price',
            value: formatPKR(displayPrice),
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Area',
            value: formatAreaDisplay(property.area, property.areaUnit),
            icon: <Square className="h-4 w-4" />,
          },
          ...(property.bedrooms
            ? [
                {
                  label: 'Bedrooms',
                  value: property.bedrooms.toString(),
                  icon: <Bed className="h-4 w-4" />,
                },
              ]
            : []),
          ...(property.bathrooms
            ? [
                {
                  label: 'Bathrooms',
                  value: property.bathrooms.toString(),
                  icon: <Bath className="h-4 w-4" />,
                },
              ]
            : []),
          ...(property.constructionYear
            ? [
                {
                  label: 'Construction Year',
                  value: property.constructionYear.toString(),
                  icon: <Calendar className="h-4 w-4" />,
                },
              ]
            : []),
          ...(property.features && Array.isArray(property.features) && property.features.length > 0
            ? [
                {
                  label: 'Features',
                  value: (
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature, index) => {
                        if (!feature || typeof feature !== 'string') return null;
                        return (
                          <Badge key={index} variant="outline" className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200/50"
                          style={{ fontSize: 'var(--text-xs)' }}>
                            {feature}
                          </Badge>
                        );
                      })}
                    </div>
                  ),
                },
              ]
            : []),
          {
            label: 'Status',
            value: <StatusBadge status={currentStatus} />,
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Description */}
      {property.description && (
        <InfoPanel
          title="Description"
          data={[
            {
              label: 'Details',
              value: property.description,
            },
          ]}
          columns={1}
          density="comfortable"
          showDivider={false}
        />
      )}

      {/* People */}
      <InfoPanel
        title="People"
        data={[
          {
            label: 'Current Owner',
            value: property.currentOwnerName || property.sellerName || 'Unknown',
            icon: <Users className="h-4 w-4" />,
          },
          ...(property.agentId
            ? [
                {
                  label: 'Assigned Agent',
                  value: property.agentName || property.agentId,
                  icon: <Users className="h-4 w-4" />,
                },
              ]
            : []),
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Investor Shares Card - Only show for investor-owned properties */}
      {isInvestorOwned && (
        <InvestorSharesCard
          property={property}
          onNavigateToInvestor={(investorId) => {
            const investor = getInvestorById(investorId);
            if (investor) {
              toast.success(`Navigate to investor: ${investor.name}`);
              // In App.tsx, this should be: onNavigate('contact-detail', { contactId: investor.id });
            }
          }}
        />
      )}
    </>
  );

  // ==================== OVERVIEW TAB - RIGHT COLUMN ====================
  const overviewSidebar = (
    <>
      {/* Owner Contact Card */}
      <ContactCard
        name={property.currentOwnerName || property.sellerName || 'Unknown Owner'}
        role="owner"
        notes={`Owns ${property.title || formattedAddress}`}
        tags={['Owner', currentStatus]}
      />

      {/* Quick Actions */}
      <QuickActionsPanel
        title="Quick Actions"
        actions={[
          {
            label: 'Start Sell Cycle',
            icon: <TrendingUp className="h-4 w-4" />,
            onClick: onStartSellCycle,
          },
          {
            label: 'Start Purchase Cycle',
            icon: <ShoppingCart className="h-4 w-4" />,
            onClick: onStartPurchaseCycle,
          },
          {
            label: 'Start Rent Cycle',
            icon: <Home className="h-4 w-4" />,
            onClick: onStartRentCycle,
          },
          {
            label: 'Edit Property',
            icon: <FileText className="h-4 w-4" />,
            onClick: onEdit,
          },
        ]}
      />

      {/* Key Metrics */}
      <MetricCardsGroup
        metrics={[
          {
            label: 'Days on Market',
            value: daysOnMarket.toString(),
            icon: <Clock className="h-5 w-5" />,
            variant: 'info',
            description: 'since listing',
          },
          {
            label: 'Total Views',
            value: (property.viewCount || 0).toString(),
            icon: <Eye className="h-5 w-5" />,
            variant: 'info',
          },
          {
            label: 'Total Cycles',
            value: totalActiveCycles.toString(),
            icon: <FileText className="h-5 w-5" />,
            variant: 'info',
          },
        ]}
        columns={2}
      />

      {/* Cycle Breakdown */}
      <SummaryStatsPanel
        title="Cycle Breakdown"
        stats={[
          {
            icon: <TrendingUp className="h-4 w-4" />,
            label: 'Sell Cycles',
            value: safeSellCycles.length.toString(),
            color: 'green',
          },
          {
            icon: <ShoppingCart className="h-4 w-4" />,
            label: 'Purchase Cycles',
            value: safePurchaseCycles.length.toString(),
            color: 'blue',
          },
          {
            icon: <Home className="h-4 w-4" />,
            label: 'Rent Cycles',
            value: safeRentCycles.length.toString(),
            color: 'purple',
          },
        ]}
      />
    </>
  );

  // ==================== CYCLES TAB ====================
  const cyclesContent = (
    <div className="space-y-6">
      {/* Sell Cycles Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Sell Cycles ({safeSellCycles.length})
          </h3>
          <Button size="sm" onClick={onStartSellCycle}>
            <Plus className="h-4 w-4 mr-1" />
            Add Sell Cycle
          </Button>
        </div>
        {safeSellCycles.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">No sell cycles yet</p>
        ) : (
          <div className="space-y-3">
            {safeSellCycles.map((cycle) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">
                      {formatPKR(cycle.askingPrice || property.price)}
                    </h4>
                    <StatusBadge status={cycle.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    Listed {new Date(cycle.listedDate || cycle.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onViewCycle(cycle.id, 'sell')}>
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Cycles Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Purchase Cycles ({safePurchaseCycles.length})
          </h3>
          <Button size="sm" onClick={onStartPurchaseCycle}>
            <Plus className="h-4 w-4 mr-1" />
            Add Purchase Cycle
          </Button>
        </div>
        {safePurchaseCycles.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">No purchase cycles yet</p>
        ) : (
          <div className="space-y-3">
            {safePurchaseCycles.map((cycle) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{formatPKR((cycle as any).offerAmount || 0)}</h4>
                    <StatusBadge status={cycle.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    Offer made {new Date((cycle as any).offerDate || cycle.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewCycle(cycle.id, 'purchase')}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rent Cycles Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base flex items-center gap-2">
            <Home className="h-5 w-5 text-purple-600" />
            Rent Cycles ({safeRentCycles.length})
          </h3>
          <Button size="sm" onClick={onStartRentCycle}>
            <Plus className="h-4 w-4 mr-1" />
            Add Rent Cycle
          </Button>
        </div>
        {safeRentCycles.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">No rent cycles yet</p>
        ) : (
          <div className="space-y-3">
            {safeRentCycles.map((cycle) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{formatPKR(cycle.monthlyRent)}/mo</h4>
                    <StatusBadge status={cycle.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    Available from {new Date(cycle.availableFrom).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onViewCycle(cycle.id, 'rent')}>
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ==================== HISTORY TAB ====================
  const historyContent = (
    <div className="space-y-6">
      {/* Ownership History */}
      {ownershipHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-600" />
            Ownership History
          </h3>
          <div className="space-y-4">
            {ownershipHistory.map((owner, idx) => (
              <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-1">
                  <h4 className="font-medium">{owner.ownerName}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(owner.acquisitionDate).toLocaleDateString()} -{' '}
                    {owner.dispositionDate
                      ? new Date(owner.dispositionDate).toLocaleDateString()
                      : 'Present'}
                  </p>
                  {owner.acquisitionPrice && (
                    <p className="text-sm text-gray-600 mt-1">
                      Acquired for {formatPKR(owner.acquisitionPrice)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Cycles Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          All Cycles Timeline
        </h3>
        {allCycles.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">No cycles created yet</p>
        ) : (
          <div className="space-y-4">
            {allCycles.map((cycle, idx) => (
              <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 mt-1">
                  {cycle.type === 'sell' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {cycle.type === 'purchase' && (
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  )}
                  {cycle.type === 'rent' && <Home className="h-4 w-4 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{cycle.type} Cycle</span>
                    <StatusBadge status={cycle.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(cycle.date).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewCycle(cycle.id, cycle.type as any)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ==================== DOCUMENTS TAB ====================
  const documentsContent = (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-base mb-2">No Documents</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        Upload property documents like title deeds, inspection reports, and agreements.
      </p>
      <Button variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Upload Document
      </Button>
    </div>
  );

  // ==================== ACTIVITY TAB ====================
  const activities: Activity[] = useMemo(() => {
    const activityList: Activity[] = [];

    // Property created
    activityList.push({
      id: 'created',
      type: 'created',
      title: 'Property listed',
      description: `${property.title || formattedAddress} added to inventory`,
      date: property.createdAt || new Date().toISOString(),
      user: property.agentName || 'System',
      icon: <Plus className="h-5 w-5 text-blue-600" />,
    });

    // Cycles created
    allCycles.forEach((cycle, idx) => {
      let description = '';
      
      if (cycle.type === 'sell') {
        const sellCycle = cycle as any;
        const price = sellCycle.askingPrice || displayPrice || 0;
        description = `Listed for ${formatPKR(price)}`;
      } else if (cycle.type === 'purchase') {
        const purchaseCycle = cycle as any;
        const price = purchaseCycle.offerAmount || 0;
        description = `Offer made for ${formatPKR(price)}`;
      } else if (cycle.type === 'rent') {
        const rentCycle = cycle as any;
        const rent = rentCycle.monthlyRent || 0;
        description = `Available for rent at ${formatPKR(rent)}/mo`;
      }

      activityList.push({
        id: `cycle-${idx}`,
        type: cycle.type,
        title: `${cycle.type} cycle started`,
        description,
        date: cycle.date,
        icon:
          cycle.type === 'sell' ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : cycle.type === 'purchase' ? (
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          ) : (
            <Home className="h-5 w-5 text-purple-600" />
          ),
      });
    });

    // Sort by date descending
    return activityList.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [property, allCycles, formattedAddress]);

  const activityContent = (
    <ActivityTimeline
      title="Property Timeline"
      activities={activities}
      emptyMessage="No activities yet"
    />
  );

  // ==================== FINANCIALS TAB (Investor Properties Only) ====================
  const financialsContent = isInvestorOwned ? (
    <div className="space-y-6">
      {/* Record Transaction Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Transaction Management
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Record rental income and expenses for this investor-owned property
            </p>
          </div>
          <Button onClick={() => setShowRecordTransactionModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Transaction
          </Button>
        </div>
      </div>

      {/* Transaction History */}
      <PropertyTransactionHistory
        propertyId={property.id}
        user={user}
      />

      {/* Record Transaction Modal */}
      <RecordTransactionModal
        isOpen={showRecordTransactionModal}
        onClose={() => setShowRecordTransactionModal(false)}
        onSuccess={() => {
          setShowRecordTransactionModal(false);
          toast.success('Transaction recorded successfully');
        }}
        property={property}
        user={user}
      />
    </div>
  ) : null;

  // ==================== DISTRIBUTIONS TAB (Investor Properties Only) ====================
  const distributionsContent = isInvestorOwned ? (
    <div className="space-y-6">
      {/* Execute Distribution Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Sale Distribution
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Execute profit distribution when this property is sold
            </p>
          </div>
          <Button 
            onClick={() => setShowDistributionModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Award className="w-4 h-4 mr-2" />
            Execute Distribution
          </Button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-900">
          <strong>Note:</strong> Use this feature when the property is sold to calculate and distribute profits to all investors based on their ownership percentages.
        </div>
      </div>

      {/* Distribution History */}
      <InvestorDistributionHistory
        propertyId={property.id}
        user={user}
        onDistributionUpdated={() => {
          toast.success('Distribution updated');
        }}
      />

      {/* Sale Distribution Modal */}
      <SaleDistributionModal
        isOpen={showDistributionModal}
        onClose={() => setShowDistributionModal(false)}
        onSuccess={() => {
          setShowDistributionModal(false);
          toast.success('Distribution executed successfully');
        }}
        property={property}
        user={user}
        defaultSalePrice={displayPrice}
      />
    </div>
  ) : null;

  // ==================== TASKS TAB ====================
  const tasksContent = (
    <div className="space-y-6">
      {/* Quick Add Widget */}
      <TaskQuickAddWidget
        user={user}
        entityType="property"
        entityId={property.id}
        entityName={property.title || formattedAddress}
        onTaskCreated={() => {
          const updatedTasks = getTasksByEntity('property', property.id);
          setPropertyTasks(updatedTasks);
          toast.success('Task created successfully');
        }}
      />

      {/* Tasks List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          Property Tasks ({propertyTasks.length})
        </h3>
        {propertyTasks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No tasks for this property yet</p>
            <p className="text-sm text-gray-400 mt-1">Tasks will appear here when created</p>
          </div>
        ) : (
          <TaskListView
            tasks={propertyTasks}
            showSelection={false}
            onViewTask={(taskId) => {
              toast.info(`View task ${taskId}`);
              // In full app: onNavigate('task-details', taskId)
            }}
            onStatusChange={(taskId, status) => {
              updateTask(taskId, { status }, user);
              const updatedTasks = getTasksByEntity('property', property.id);
              setPropertyTasks(updatedTasks);
              toast.success('Task status updated');
            }}
          />
        )}
      </div>
    </div>
  );

  // ==================== TABS CONFIGURATION ====================
  const tabs: DetailPageTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: overviewContent,
      sidebar: overviewSidebar,
      layout: '2-1',
    },
    {
      id: 'cycles',
      label: `Cycles (${totalActiveCycles})`,
      content: cyclesContent,
      layout: '3-0',
    },
    {
      id: 'history',
      label: 'History',
      content: historyContent,
      layout: '3-0',
    },
    {
      id: 'documents',
      label: 'Documents',
      content: documentsContent,
      layout: '3-0',
    },
    {
      id: 'activity',
      label: 'Activity',
      content: activityContent,
      layout: '3-0',
    },
    ...(isInvestorOwned ? [
      {
        id: 'financials',
        label: 'Financials',
        content: financialsContent,
        layout: '3-0',
      },
      {
        id: 'distributions',
        label: 'Distributions',
        content: distributionsContent,
        layout: '3-0',
      },
    ] : []),
    {
      id: 'tasks',
      label: `Tasks (${propertyTasks.length})`,
      content: tasksContent,
      layout: '3-0',
    },
  ];

  // ==================== RENDER ====================
  return (
    <DetailPageTemplate
      pageHeader={pageHeader}
      connectedEntities={connectedEntities}
      tabs={tabs}
      defaultTab="overview"
    />
  );
}