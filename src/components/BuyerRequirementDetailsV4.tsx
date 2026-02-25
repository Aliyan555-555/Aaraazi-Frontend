/**
 * Buyer Requirement Details - V4.0 with DetailPageTemplate ✅
 * 
 * COMPLETE REDESIGN using DetailPageTemplate system:
 * - DetailPageTemplate for consistent structure
 * - ContactCard for buyer information
 * - QuickActionsPanel for sidebar actions
 * - MetricCardsGroup for statistics
 * - DataTable for matched properties
 * - NotesPanel for additional notes
 * - ActivityTimeline for viewing history
 * - All 5 UX Laws applied
 * - 8px grid system
 * - Responsive 2/3 + 1/3 layout
 * 
 * TABS:
 * 1. Overview - Summary + InfoPanels + Sidebar
 * 2. Criteria - Property search criteria
 * 3. Matches - Matched properties with offers
 * 4. Viewings - Viewing history and schedule
 * 5. Activity - Timeline of all activities
 * 
 * PHASE 4D: CROSS-AGENT MATCHES INTEGRATION ✅
 * - Show both "My Properties" and "Shared Properties" in Matches tab
 * - CrossAgentOfferCard for submitting offers to shared properties
 * - Smart filtering between own vs shared matches
 * - Direct offer submission to shared sell cycles
 */

import { useState, useEffect, useMemo } from 'react';
import { BuyerRequirement, User } from '../types';
import { Badge } from './ui/badge';

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

// Requirement-Specific Components
import { SendOfferToBuyerModal } from './SendOfferToBuyerModal';
import { EnhancedMatchCard } from './EnhancedMatchCard';

import { SubmitOfferModal } from './sharing/SubmitOfferModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Icons
import {
  DollarSign,
  Home,
  MapPin,
  Calendar,
  CheckCircle,
  Landmark,
  Phone,
  User as UserIcon,
  Clock,
  Search,
  UserCheck,
  Plus,
  Eye,
  Share2,
} from 'lucide-react';

// Business Logic
// [STUBBED] import {
// [STUBBED]   closeBuyerRequirement,
// [STUBBED]   deleteBuyerRequirement,
// [STUBBED] } from '../lib/buyerRequirements';
import { formatPKR } from '../lib/currency';
import { toast } from 'sonner';
// [STUBBED] import {
// [STUBBED]   findMatchingPropertiesForBuyer,
// [STUBBED]   PropertyMatch as InternalPropertyMatch,
// [STUBBED] } from '../lib/propertyMatching';
import { PropertyMatch } from '../types/sharing';
// [STUBBED] import {
// [STUBBED]   getLatestOfferForProperty,
// [STUBBED] } from '../lib/sellCycle';

// Phase 4D: Cross-agent matching functions
import {
  findSharedMatchesForBuyerRequirement,
} from '../lib/smartMatching';
// [STUBBED] import { submitCrossAgentOffer } from '../lib/sellCycle';

import { logger } from "../lib/logger";

// ===== STUBS for removed prototype functions =====
const closeBuyerRequirement = (..._args: any[]): any => { /* stub - prototype function removed */ };
const deleteBuyerRequirement = (..._args: any[]): any => { /* stub - prototype function removed */ };
const findMatchingPropertiesForBuyer = (..._args: any[]): any => { /* stub - prototype function removed */ };
type InternalPropertyMatch = any;
const getLatestOfferForProperty = (..._args: any[]): any => { /* stub - prototype function removed */ };
const submitCrossAgentOffer = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====

interface BuyerRequirementDetailsV4Props {
  requirement: BuyerRequirement;
  user: User;
  onBack: () => void;
  onUpdate: () => void;
  onNavigateToSellCycle?: (sellCycleId: string) => void;
  onNavigateToProperty?: (propertyId: string) => void;
}

export function BuyerRequirementDetailsV4({
  requirement,
  user,
  onBack,
  onUpdate,
  onNavigateToSellCycle,
  onNavigateToProperty,
}: BuyerRequirementDetailsV4Props) {
  const [matchedProperties, setMatchedProperties] = useState<InternalPropertyMatch[]>([]);
  const [sharedMatches, setSharedMatches] = useState<PropertyMatch[]>([]);
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [showSubmitOfferModal, setShowSubmitOfferModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<InternalPropertyMatch | null>(null);
  const [selectedSharedMatch, setSelectedSharedMatch] = useState<PropertyMatch | null>(null);

  // Helper function to normalize propertyType to always be an array
  const getPropertyTypes = (): string[] => {
    if (!requirement.propertyType) return [];
    if (Array.isArray(requirement.propertyType)) return requirement.propertyType;
    // If it's a string, convert to array
    return [requirement.propertyType as string];
  };

  const propertyTypes = getPropertyTypes();

  // Navigation helper
  const handleNavigation = (page: string, id: string) => {
    if (page === 'sell-cycle' && onNavigateToSellCycle) {
      onNavigateToSellCycle(id);
    } else if (page === 'property' && onNavigateToProperty) {
      onNavigateToProperty(id);
    } else {
      toast.info('Navigate to ' + page);
    }
  };

  // Load matched properties
  useEffect(() => {
    const matches = findMatchingPropertiesForBuyer(requirement as any, user.id, user.role);
    setMatchedProperties(matches);
  }, [requirement, user.id, user.role]);

  // Load shared matches
  useEffect(() => {
    const sharedMatches = findSharedMatchesForBuyerRequirement(requirement, user.id, user.role);
    setSharedMatches(sharedMatches);
  }, [requirement, user.id, user.role]);

  // Calculate metrics
  const budgetRange = (requirement.budgetMax || 0) - (requirement.budgetMin || 0);
  const daysActive = Math.floor(
    (Date.now() - new Date(requirement.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Action handlers
  const handleClose = () => {
    if (confirm('Are you sure you want to close this requirement?')) {
      closeBuyerRequirement(requirement.id);
      toast.success('Requirement closed');
      onUpdate();
      onBack();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this requirement? This action cannot be undone.')) {
      deleteBuyerRequirement(requirement.id);
      toast.success('Requirement deleted');
      onUpdate();
      onBack();
    }
  };

  const handleSendOffer = (match: InternalPropertyMatch) => {
    logger.log('🔵 handleSendOffer called with match:', match);

    // Validation
    if (!match) {
      logger.error('❌ No match provided');
      toast.error('Invalid match data');
      return;
    }

    if (!match.sellCycleId) {
      logger.error('❌ No sellCycleId in match:', match);
      toast.error('This property does not have an active sell cycle');
      return;
    }

    if (!match.property) {
      logger.error('❌ No property in match:', match);
      toast.error('Property data is missing');
      return;
    }

    logger.log('✅ Validation passed. Opening modal...');
    setSelectedMatch(match);
    setShowSendOfferModal(true);
  };

  const handleCrossAgentOffer = (match: PropertyMatch) => {
    if (!match.cycleId) {
      toast.error('No sell cycle ID found for this property');
      return;
    }

    setSelectedSharedMatch(match);
    setShowSubmitOfferModal(true);
  };

  const handleCrossAgentOfferSubmit = async (offerData: any) => {
    if (!selectedSharedMatch?.cycleId) return;

    try {
      await submitCrossAgentOffer(selectedSharedMatch.cycleId, {
        ...offerData,
        buyerId: requirement.buyerId,
        buyerName: requirement.buyerName,
        buyerContact: requirement.buyerContact || '',
        buyerEmail: requirement.buyerEmail,
        submittedByAgentId: user.id,
        submittedByAgentName: user.name,
        submittedByAgentContact: user.contactNumber || '',
      });

      onUpdate();
    } catch (error) {
      logger.error('Error submitting cross-agent offer:', error);
      throw error; // Let modal handle error display
    }
  };

  // ==================== PAGE HEADER ====================
  const pageHeader = {
    title: `Buyer: ${requirement.buyerName}`,
    breadcrumbs: [
      { label: 'Buyer Requirements', onClick: onBack },
      { label: requirement.buyerName },
    ],
    description: `Managed by ${requirement.agentName} • Created ${new Date(
      requirement.createdAt
    ).toLocaleDateString()}`,
    metrics: [
      {
        label: 'Min Budget',
        value: formatPKR(requirement.budgetMin || 0),
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Max Budget',
        value: formatPKR(requirement.budgetMax || 0),
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Matches',
        value: String(matchedProperties.length || 0),
        icon: <Home className="w-4 h-4" />,
      },
      {
        label: 'Urgency',
        value: (requirement as any).urgency || 'Normal',
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        label: 'Status',
        value: requirement.status,
        icon: <UserCheck className="w-4 h-4" />,
      },
    ],
    primaryActions:
      (requirement as any).status !== 'fulfilled' && (requirement as any).status !== 'cancelled'
        ? [
          {
            label: 'Close Requirement',
            onClick: handleClose,
            variant: 'default' as const,
          },
        ]
        : [],
    secondaryActions:
      (requirement as any).status !== 'fulfilled' && (requirement as any).status !== 'cancelled'
        ? [
          {
            label: 'Delete',
            onClick: handleDelete,
          },
        ]
        : [],
    status: {
      label: requirement.status,
      variant: (requirement.status === 'active' ? 'success' :
        requirement.status === 'fulfilled' ? 'info' : 'destructive') as any
    },
    onBack,
  };

  // ==================== CONNECTED ENTITIES ====================
  const connectedEntities = [
    {
      type: 'buyer' as const,
      name: requirement.buyerName as string,
      icon: <UserCheck className="h-3 w-3" />,
      onClick: () => { },
    },
    {
      type: 'agent' as const,
      name: (requirement.agentName || 'Unknown') as string,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => { },
    },
  ];

  // ==================== OVERVIEW TAB - LEFT COLUMN ====================
  const overviewContent = (
    <>
      {/* Status Timeline */}
      <StatusTimeline
        steps={[
          {
            label: 'Created',
            status: 'complete',
            date: requirement.createdAt,
            description: `${formatPKR(requirement.budgetMax)} budget`,
          },
          {
            label: 'Searching',
            status:
              requirement.status === 'active'
                ? 'current'
                : ['fulfilled'].includes(requirement.status)
                  ? 'complete'
                  : 'pending',
          },
          {
            label: 'Matches Found',
            status: matchedProperties.length > 0 ? 'complete' : 'pending',
            description: `${matchedProperties.length} match${matchedProperties.length !== 1 ? 'es' : ''}`,
          },
          {
            label: 'Status',
            status: requirement.status === 'fulfilled' ? 'complete' : 'current',
          },
        ]}
      />

      {/* Buyer Information */}
      <InfoPanel
        title="Buyer Information"
        data={[
          {
            label: 'Name',
            value: requirement.buyerName,
            icon: <UserCheck className="h-4 w-4" />,
          },
          {
            label: 'Contact',
            value: requirement.buyerContact,
            icon: <Phone className="h-4 w-4" />,
            copyable: true,
          },
          {
            label: 'Agent',
            value: requirement.agentName,
            icon: <UserIcon className="h-4 w-4" />,
          },
          {
            label: 'Created',
            value: new Date(requirement.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            icon: <Calendar className="h-4 w-4" />,
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Budget & Requirements */}
      <InfoPanel
        title="Budget & Requirements"
        data={[
          {
            label: 'Min Budget',
            value: formatPKR(requirement.budgetMin || 0),
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Max Budget',
            value: formatPKR(requirement.budgetMax || 0),
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Budget Range',
            value: formatPKR(budgetRange),
          },
          {
            label: 'Property Types',
            value: propertyTypes
              .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1))
              .join(', ') || 'Not specified',
            icon: <Home className="h-4 w-4" />,
          },
          {
            label: 'Preferred Locations',
            value: (requirement.preferredAreas || []).join(', ') || 'Not specified',
            icon: <MapPin className="h-4 w-4" />,
          },
          {
            label: 'Bedrooms',
            value: requirement.maxBedrooms
              ? `${requirement.minBedrooms}-${requirement.maxBedrooms}`
              : `${requirement.minBedrooms}+`,
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Additional Info (Cast for non-existent properties) */}
      <InfoPanel
        title="Additional Details"
        data={[
          {
            label: 'Urgency',
            value: ((requirement as any).urgency || 'Normal') as string,
          },
          {
            label: 'Target Move Date',
            value: ((requirement as any).targetMoveDate || 'Flexible') as string,
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Financing Type',
            value: <span className="capitalize">{(requirement as any).financingType || 'Not specified'}</span>,
            icon: <Landmark className="h-4 w-4" />,
          },
          {
            label: 'Pre-Approved',
            value: (
              <Badge variant={(requirement as any).preApproved ? 'default' : 'secondary'}>
                {(requirement as any).preApproved ? 'Yes' : 'No'}
              </Badge>
            ),
          },
        ]}
        columns={2}
        density="comfortable"
      />

      {/* Additional Notes */}
      {requirement.additionalNotes && (
        <InfoPanel
          title="Additional Notes"
          data={[
            {
              label: 'Notes',
              value: requirement.additionalNotes,
            },
          ]}
          columns={1}
          density="comfortable"
          showDivider={false}
        />
      )}
    </>
  );

  // ==================== OVERVIEW TAB - RIGHT COLUMN ====================
  const overviewSidebar = (
    <>
      {/* Buyer Contact Card */}
      <ContactCard
        name={requirement.buyerName}
        role="buyer"
        phone={requirement.buyerContact}
        notes={`Looking for ${propertyTypes.join(', ')} in ${(requirement.preferredAreas || []).join(', ')}`}
        tags={['Buyer', (requirement as any).urgency === 'high' ? 'Urgent' : (requirement as any).urgency].filter(Boolean)}
        onCall={() => window.open(`tel:${requirement.buyerContact}`)}
      />

      {/* Quick Actions */}
      <QuickActionsPanel
        title="Quick Actions"
        actions={[
          {
            label: `View Matches (${matchedProperties.length})`,
            icon: <Search className="h-4 w-4" />,
            onClick: () => toast.info('Switch to Matches tab'),
          },
          {
            label: 'View Criteria',
            icon: <Home className="h-4 w-4" />,
            onClick: () => toast.info('Switch to Criteria tab'),
          },
          {
            label: `View Viewings (${requirement.viewings?.length || 0})`,
            icon: <Calendar className="h-4 w-4" />,
            onClick: () => toast.info('Switch to Viewings tab'),
          },
          ...(requirement.status !== 'fulfilled' && (requirement as any).status !== 'closed'
            ? [
              {
                label: 'Close Requirement',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: handleClose,
              },
            ]
            : []),
        ]}
      />

      {/* Key Metrics */}
      <MetricCardsGroup
        metrics={[
          {
            label: 'Budget Range',
            value: formatPKR(requirement.budgetMax),
            icon: <DollarSign className="h-5 w-5" />,
            variant: 'success',
          },
          {
            label: 'Matches Found',
            value: matchedProperties.length.toString(),
            icon: <Search className="h-5 w-5" />,
            variant: matchedProperties.length > 0 ? 'info' : 'default',
          },
          {
            label: 'Days Active',
            value: daysActive.toString(),
            icon: <Clock className="h-5 w-5" />,
            variant: 'default',
          },
        ]}
        columns={2}
      />

      {/* Quick Stats */}
      <SummaryStatsPanel
        title="Quick Stats"
        stats={[
          {
            icon: <Home className="h-4 w-4" />,
            label: 'Property Types',
            value: `${propertyTypes.length} type${propertyTypes.length !== 1 ? 's' : ''}`,
            color: 'blue',
          },
          {
            icon: <MapPin className="h-4 w-4" />,
            label: 'Locations',
            value: `${(requirement.preferredAreas || []).length} area${(requirement.preferredAreas || []).length !== 1 ? 's' : ''
              }`,
            color: 'green',
          },
          {
            icon: <Clock className="h-4 w-4" />,
            label: 'Status',
            value: requirement.status,
            color: requirement.status === 'active' ? 'green' : 'yellow',
          },
        ]}
      />
    </>
  );

  // ==================== CRITERIA TAB ====================
  const criteriaContent = (
    <>
      {/* Property Types */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Home className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-medium">Property Criteria</h3>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Property Types</p>
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map((type, idx) => (
                <Badge key={idx} variant="secondary" className="capitalize">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Min Bedrooms</p>
              <p className="font-medium">{requirement.minBedrooms}</p>
            </div>
            {requirement.maxBedrooms && (
              <div>
                <p className="text-sm text-gray-600">Max Bedrooms</p>
                <p className="font-medium">{requirement.maxBedrooms}</p>
              </div>
            )}
            {requirement.minBathrooms && (
              <div>
                <p className="text-sm text-gray-600">Min Bathrooms</p>
                <p className="font-medium">{requirement.minBathrooms}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-medium">Preferred Locations</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {(requirement.preferredAreas || []).map((loc, idx) => (
            <Badge key={idx} variant="outline">
              {loc}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );

  // ==================== MATCHES TAB ====================
  const matchesContent =
    matchedProperties && matchedProperties.length > 0 ? (
      <div className="space-y-4">
        {matchedProperties.map((match) => {
          const latestOffer = getLatestOfferForProperty(requirement.id, match.propertyId);
          return (
            <EnhancedMatchCard
              key={match.propertyId}
              match={match as any}
              latestOffer={latestOffer}
              onSendOffer={() => handleSendOffer(match)}
              onViewProperty={() => handleNavigation('property', match.propertyId)}
              onViewSellCycle={() =>
                match.sellCycleId && handleNavigation('sell-cycle', match.sellCycleId)
              }
            />
          );
        })}
      </div>
    ) : (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-base mb-2">No Matches Found</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          No properties currently match this buyer's requirements. We'll notify you when new matches
          become available.
        </p>
      </div>
    );

  const sharedMatchesContent =
    sharedMatches && sharedMatches.length > 0 ? (
      <div className="space-y-4">
        {sharedMatches.map((match) => {
          const propertyId = match.property?.id || '';
          const latestOffer = getLatestOfferForProperty(requirement.id, propertyId);

          // Map shared match to InternalPropertyMatch format for EnhancedMatchCard
          const mappedMatch: any = {
            ...match,
            propertyId,
            property: match.property,
            sellCycleId: match.cycleId,
            matchReasons: match.matchDetails?.featuresMatch || [],
            mismatches: [], // Mismatches not directly equivalent in sharing match
          };

          return (
            <EnhancedMatchCard
              key={match.matchId}
              match={mappedMatch}
              latestOffer={latestOffer}
              onSendOffer={() => handleCrossAgentOffer(match)}
              onViewProperty={() => propertyId && handleNavigation('property', propertyId)}
              onViewSellCycle={() =>
                match.cycleId && handleNavigation('sell-cycle', match.cycleId)
              }
            />
          );
        })}
      </div>
    ) : (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Share2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-base mb-2">No Shared Matches Found</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          No shared properties currently match this buyer's requirements. We'll notify you when new matches
          become available.
        </p>
      </div>
    );

  const matchesTabContent = (
    <Tabs defaultValue="my-properties">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="my-properties">My Properties</TabsTrigger>
        <TabsTrigger value="shared-properties">Shared Properties</TabsTrigger>
      </TabsList>
      <TabsContent value="my-properties">{matchesContent}</TabsContent>
      <TabsContent value="shared-properties">{sharedMatchesContent}</TabsContent>
    </Tabs>
  );

  // ==================== VIEWINGS TAB ====================
  const viewingsContent =
    requirement.viewings && requirement.viewings.length > 0 ? (
      <div className="space-y-4">
        {requirement.viewings.map((viewing, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-base font-medium mb-2">{viewing.propertyAddress}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(viewing.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{viewing.scheduledTime || 'Time TBD'}</span>
                  </div>
                  {viewing.notes && <p className="mt-2">{viewing.notes}</p>}
                </div>
              </div>
              <StatusBadge status={viewing.status || 'scheduled'} />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-base mb-2">No Viewings Scheduled</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          No property viewings have been scheduled yet.
        </p>
      </div>
    );

  // ==================== ACTIVITY TAB ====================
  const activities: Activity[] = useMemo(() => {
    const activityList: Activity[] = [];

    // Requirement created
    activityList.push({
      id: 'created',
      type: 'created',
      title: 'Requirement created',
      description: `Budget: ${formatPKR(requirement.budgetMin || 0)} - ${formatPKR(requirement.budgetMax || 0)}`,
      date: requirement.createdAt,
      user: requirement.agentName,
      icon: <Plus className="h-5 w-5 text-blue-600" />,
    });

    // Viewings
    (requirement.viewings || []).forEach((viewing, idx) => {
      activityList.push({
        id: `viewing-${idx}`,
        type: 'viewing',
        title: 'Viewing scheduled',
        description: viewing.propertyAddress,
        date: viewing.scheduledDate,
        icon: <Eye className="h-5 w-5 text-green-600" />,
      });
    });

    // Sort by date descending
    return activityList.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [requirement]);

  const activityContent = (
    <ActivityTimeline
      title="Requirement Timeline"
      activities={activities}
      emptyMessage="No activities yet"
    />
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
      id: 'criteria',
      label: 'Criteria',
      content: criteriaContent,
      layout: '3-0',
    },
    {
      id: 'matches',
      label: `Matches (${matchedProperties.length})`,
      content: matchesTabContent,
      layout: '3-0',
    },
    {
      id: 'viewings',
      label: `Viewings (${(requirement as any).viewings?.length || 0})`,
      content: viewingsContent,
      layout: '3-0',
    },
    {
      id: 'activity',
      label: 'Activity',
      content: activityContent,
      layout: '3-0',
    },
  ];

  // ==================== RENDER ====================
  return (
    <>
      <DetailPageTemplate
        pageHeader={pageHeader}
        connectedEntities={connectedEntities}
        tabs={tabs}
        defaultTab="overview"
      />

      {/* Send Internal Offer Modal (for own properties) */}
      {showSendOfferModal && selectedMatch && (
        <SendOfferToBuyerModal
          match={selectedMatch}
          buyerRequirement={requirement}
          user={user} // Passed user prop
          onClose={() => {
            setShowSendOfferModal(false);
            setSelectedMatch(null);
          }}
          onSuccess={() => {
            setShowSendOfferModal(false);
            setSelectedMatch(null);
            onUpdate();
            toast.success('Offer sent successfully');
          }}
        />
      )}

      {/* Submit Cross-Agent Offer Modal (for shared properties) */}
      {showSubmitOfferModal && selectedSharedMatch && (
        <SubmitOfferModal
          open={showSubmitOfferModal}
          onClose={() => {
            setShowSubmitOfferModal(false);
            setSelectedSharedMatch(null);
          }}
          match={selectedSharedMatch}
          property={selectedSharedMatch.property!}
          user={user}
          buyerRequirement={requirement}
          onSubmit={handleCrossAgentOfferSubmit}
        />
      )}
    </>
  );
}