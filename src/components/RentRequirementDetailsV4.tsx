/**
 * Rent Requirement Details - V4.0 with DetailPageTemplate ✅
 * 
 * COMPLETE REDESIGN using DetailPageTemplate system:
 * - DetailPageTemplate for consistent structure
 * - ContactCard for tenant information
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
 * 2. Criteria - Rental search criteria
 * 3. Matches - Matched rental properties
 * 4. Viewings - Viewing history and schedule
 * 5. Activity - Timeline of all activities
 * 
 * PHASE 4D: CROSS-AGENT MATCHES INTEGRATION ✅
 * - Show both "My Properties" and "Shared Properties" in Matches tab
 * - CrossAgentOfferCard for submitting applications to shared properties
 * - Smart filtering between own vs shared matches
 * - Direct application submission to shared rent cycles
 */

import React, { useState, useEffect, useMemo } from 'react';
import { RentRequirement, User } from '../types';
import { Button } from './ui/button';
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

// Phase 4D: Cross-Agent Matching Components
import { CrossAgentOfferCard } from './sharing/CrossAgentOfferCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Icons
import {
  DollarSign,
  Home,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Phone,
  User as UserIcon,
  Clock,
  Search,
  UserCheck,
  Key,
  FileCheck,
  Eye,
  Plus,
  Share2,
  Users,
} from 'lucide-react';

// Business Logic
// [STUBBED] import {
// [STUBBED]   updateRentRequirement,
// [STUBBED]   closeRentRequirement,
// [STUBBED]   deleteRentRequirement,
// [STUBBED]   getRentRequirement,
// [STUBBED] } from '../lib/rentRequirements';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';
import { toast } from 'sonner';
// [STUBBED] import {
// [STUBBED]   findMatchingPropertiesForRent,
// [STUBBED]   getMatchScoreColor,
// [STUBBED]   getMatchScoreLabel,
// [STUBBED]   PropertyMatch,
// [STUBBED] } from '../lib/propertyMatching';

// Phase 4D: Cross-agent matching functions
import {
  findSharedMatchesForRentRequirement,
  submitCrossAgentRentApplicationFromMatch,
} from '../lib/smartMatching';
// [STUBBED] import { addTenantApplication, getRentCycleById } from '../lib/rentCycle';

// ===== STUBS for removed prototype functions =====
const updateRentRequirement = (..._args: any[]): any => { /* stub - prototype function removed */ };
const closeRentRequirement = (..._args: any[]): any => { /* stub - prototype function removed */ };
const deleteRentRequirement = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getRentRequirement = (..._args: any[]): any => { /* stub - prototype function removed */ };
const findMatchingPropertiesForRent = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getMatchScoreColor = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getMatchScoreLabel = (..._args: any[]): any => { /* stub - prototype function removed */ };
type PropertyMatch = any;
const addTenantApplication = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getRentCycleById = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface RentRequirementDetailsV4Props {
  requirement: RentRequirement;
  user: User;
  onBack: () => void;
  onUpdate: () => void;
  onNavigateToRentCycle?: (rentCycleId: string) => void;
  onNavigateToProperty?: (propertyId: string) => void;
}

export function RentRequirementDetailsV4({
  requirement,
  user,
  onBack,
  onUpdate,
  onNavigateToRentCycle,
  onNavigateToProperty,
}: RentRequirementDetailsV4Props) {
  const [matchedProperties, setMatchedProperties] = useState<PropertyMatch[]>([]);
  const [sharedMatches, setSharedMatches] = useState<PropertyMatch[]>([]);

  // Navigation helper
  const handleNavigation = (page: string, id: string) => {
    if (page === 'rent-cycle' && onNavigateToRentCycle) {
      onNavigateToRentCycle(id);
    } else if (page === 'property' && onNavigateToProperty) {
      onNavigateToProperty(id);
    } else {
      toast.info('Navigate to ' + page);
    }
  };

  // Load matched properties
  useEffect(() => {
    const matches = findMatchingPropertiesForRent(requirement, user.id, user.role);
    setMatchedProperties(matches);
  }, [requirement, user.id, user.role]);

  // Load shared matches
  useEffect(() => {
    const sharedMatches = findSharedMatchesForRentRequirement(requirement, user.id, user.role);
    setSharedMatches(sharedMatches);
  }, [requirement, user.id, user.role]);

  // Calculate metrics
  const budgetRange = (requirement.budgetMax || 0) - (requirement.budgetMin || 0);
  const daysActive = Math.floor(
    (Date.now() - new Date(requirement.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Helper functions
  const getLeaseDurationDisplay = (duration: string) => {
    const labels: Record<string, string> = {
      '3-months': '3 Months',
      '6-months': '6 Months',
      '1-year': '1 Year',
      '2-years': '2 Years',
      'flexible': 'Flexible',
    };
    return labels[duration] || duration;
  };

  // Action handlers
  const handleClose = () => {
    if (!requirement.rentedPropertyId) {
      toast.error('Please specify the rented property before closing');
      return;
    }
    if (confirm('Are you sure you want to close this requirement?')) {
      closeRentRequirement(requirement.id, requirement.rentedPropertyId);
      toast.success('Rent requirement closed');
      onUpdate();
      onBack();
    }
  };

  const handleDelete = () => {
    if (
      confirm('Are you sure you want to delete this requirement? This action cannot be undone.')
    ) {
      deleteRentRequirement(requirement.id);
      toast.success('Rent requirement deleted');
      onUpdate();
      onBack();
    }
  };

  const handleMarkAsMatched = () => {
    updateRentRequirement(requirement.id, { status: 'matched' });
    toast.success('Marked as matched');
    onUpdate();
  };

  const handleCrossAgentApplication = async (match: PropertyMatch) => {
    if (!match.rentCycleId) {
      toast.error('No rent cycle ID found for this property');
      return;
    }

    // Check if application already exists
    const rentCycle = getRentCycleById(match.rentCycleId);
    if (rentCycle?.applications) {
      const existingApp = rentCycle.applications.find(
        (app: any) => app.fromRequirementId === requirement.id
      );
      
      if (existingApp) {
        toast.error('Application already submitted for this property');
        onUpdate(); // Refresh to show updated status
        return;
      }
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Submitting application to shared property...');
      
      submitCrossAgentRentApplicationFromMatch(
        match.rentCycleId,
        requirement.id,
        user.id,
        user.name || 'Unknown User',
        user.contact
      );
      
      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success('Application submitted successfully! The listing agent will be notified.');
      
      // Refresh data
      onUpdate();
    } catch (error) {
      console.error('Error submitting cross-agent application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
      toast.error(errorMessage);
      
      // If it's a duplicate error, refresh to show updated status
      if (errorMessage.includes('already submitted') || errorMessage.includes('already exists')) {
        onUpdate();
      }
    }
  };

  // Helper function to check if application already exists
  const getApplicationStatus = (match: PropertyMatch): 'none' | 'pending' | 'accepted' | 'rejected' => {
    if (!match.rentCycleId) return 'none';
    
    const rentCycle = getRentCycleById(match.rentCycleId);
    if (!rentCycle || !rentCycle.applications) return 'none';
    
    const existingApp = rentCycle.applications.find(
      (app: any) => app.fromRequirementId === requirement.id && 
      app.tenantId === requirement.renterId
    );
    
    if (!existingApp) return 'none';
    return existingApp.status || 'pending';
  };

  const handleSubmitApplication = (match: PropertyMatch) => {
    if (!match.rentCycleId) {
      toast.error('No rent cycle ID found for this property');
      return;
    }

    // Check if application already exists
    const existingStatus = getApplicationStatus(match);
    if (existingStatus !== 'none') {
      toast.error('Application already submitted for this property');
      return;
    }

    try {
      // Add tenant application to the rent cycle
      addTenantApplication(
        match.rentCycleId,
        requirement.renterId || `tenant_${Date.now()}`,
        requirement.renterName,
        requirement.renterContact || '',
        `Application submitted from rent requirement ${requirement.id}`,
        requirement.id // Pass requirement ID to track duplicates
      );
      
      toast.success('Application submitted successfully!');
      
      // Refresh data
      onUpdate();
    } catch (error) {
      console.error('Error submitting application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application. Please try again.';
      toast.error(errorMessage);
      
      // If it's a duplicate error, refresh to show updated status
      if (errorMessage.includes('already submitted')) {
        onUpdate();
      }
    }
  };

  // ==================== PAGE HEADER ====================
  const pageHeader = {
    title: `Tenant: ${requirement.renterName}`,
    breadcrumbs: [
      { label: 'Rent Requirements', onClick: onBack },
      { label: requirement.renterName },
    ],
    description: `Managed by ${requirement.agentName} • Created ${new Date(
      requirement.createdAt
    ).toLocaleDateString()}`,
    metrics: [
      {
        label: 'Min Budget',
        value: formatPKR(requirement.budgetMin || 0) + '/mo',
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Max Budget',
        value: formatPKR(requirement.budgetMax || 0) + '/mo',
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        label: 'Lease Term',
        value: 'Flexible',
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        label: 'Urgency',
        value: <StatusBadge status={requirement.urgency} />,
        icon: <Clock className="w-4 h-4" />,
      },
      {
        label: 'Status',
        value: <StatusBadge status={requirement.status} />,
        icon: <Key className="w-4 h-4" />,
      },
    ],
    primaryActions:
      requirement.status !== 'closed'
        ? [
            {
              label: 'Mark as Matched',
              onClick: handleMarkAsMatched,
              variant: 'default' as const,
            },
          ]
        : [],
    secondaryActions:
      requirement.status !== 'closed'
        ? [
            {
              label: 'Close Requirement',
              onClick: handleClose,
            },
            {
              label: 'Delete',
              onClick: handleDelete,
            },
          ]
        : [],
    status: requirement.status,
    onBack,
  };

  // ==================== CONNECTED ENTITIES ====================
  const connectedEntities = [
    {
      type: 'tenant' as const,
      name: requirement.renterName,
      icon: <UserCheck className="h-3 w-3" />,
      onClick: () => {},
    },
    {
      type: 'agent' as const,
      name: requirement.agentName,
      icon: <UserIcon className="h-3 w-3" />,
      onClick: () => {},
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
            description: `${formatPKR(requirement.budgetMax || 0)}/mo budget`,
          },
          {
            label: 'Searching',
            status:
              requirement.status === 'active'
                ? 'current'
                : ['matched', 'viewing', 'negotiating', 'satisfied'].includes(requirement.status)
                ? 'complete'
                : 'pending',
          },
          {
            label: 'Matches Found',
            status: matchedProperties.length > 0 ? 'complete' : 'pending',
            description: `${matchedProperties.length} match${matchedProperties.length !== 1 ? 'es' : ''}`,
          },
          {
            label: 'Viewing',
            status:
              requirement.status === 'viewing'
                ? 'current'
                : ['negotiating', 'satisfied'].includes(requirement.status)
                ? 'complete'
                : 'pending',
          },
          {
            label: 'Negotiating',
            status:
              requirement.status === 'negotiating'
                ? 'current'
                : requirement.status === 'satisfied'
                ? 'complete'
                : 'pending',
          },
          {
            label: 'Satisfied',
            status:
              requirement.status === 'satisfied'
                ? 'complete'
                : requirement.status === 'closed'
                ? 'complete'
                : 'pending',
          },
        ]}
      />

      {/* Tenant Information */}
      <InfoPanel
        title="Tenant Information"
        data={[
          {
            label: 'Name',
            value: requirement.renterName,
            icon: <UserCheck className="h-4 w-4" />,
          },
          {
            label: 'Contact',
            value: requirement.tenantContact,
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
            label: 'Min Monthly Rent',
            value: formatPKR(requirement.budgetMin || 0) + '/mo',
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Max Monthly Rent',
            value: formatPKR(requirement.budgetMax || 0) + '/mo',
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            label: 'Budget Range',
            value: formatPKR(budgetRange) + '/mo',
          },
          {
            label: 'Property Types',
            value: requirement.propertyType && requirement.propertyType.length > 0
              ? requirement.propertyType
                  .map((t) => String(t).charAt(0).toUpperCase() + String(t).slice(1))
                  .join(', ')
              : 'Any',
            icon: <Home className="h-4 w-4" />,
          },
          {
            label: 'Preferred Locations',
            value: requirement.preferredAreas && requirement.preferredAreas.length > 0
              ? requirement.preferredAreas.join(', ')
              : 'Any location',
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

      {/* Rental Preferences */}
      <InfoPanel
        title="Rental Preferences"
        data={[
          {
            label: 'Urgency',
            value: <StatusBadge status={requirement.urgency} />,
          },
          {
            label: 'Move-in Date',
            value: requirement.moveInDate || 'Flexible',
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Lease Duration',
            value: 'Flexible',
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Furnished',
            value: <span className="capitalize">{requirement.furnished}</span>,
            icon: <Home className="h-4 w-4" />,
          },
          ...(requirement.petsAllowed !== undefined
            ? [
                {
                  label: 'Pets Allowed',
                  value: (
                    <Badge variant={requirement.petsAllowed ? 'default' : 'secondary'}>
                      {requirement.petsAllowed ? 'Yes' : 'No'}
                    </Badge>
                  ),
                },
              ]
            : []),
          ...(requirement.employmentVerified !== undefined
            ? [
                {
                  label: 'Employment Verified',
                  value: (
                    <Badge variant={requirement.employmentVerified ? 'default' : 'secondary'}>
                      {requirement.employmentVerified ? 'Yes' : 'No'}
                    </Badge>
                  ),
                  icon: <FileCheck className="h-4 w-4" />,
                },
              ]
            : []),
          ...(requirement.hasGuarantor !== undefined
            ? [
                {
                  label: 'Has Guarantor',
                  value: (
                    <Badge variant={requirement.hasGuarantor ? 'default' : 'secondary'}>
                      {requirement.hasGuarantor ? 'Yes' : 'No'}
                    </Badge>
                  ),
                },
              ]
            : []),
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
      {/* Tenant Contact Card */}
      <ContactCard
        name={requirement.renterName}
        role="tenant"
        phone={requirement.tenantContact}
        notes={`Looking for rental property in ${requirement.preferredAreas && requirement.preferredAreas.length > 0 ? requirement.preferredAreas.join(', ') : 'any location'}`}
        tags={['Tenant', requirement.urgency === 'high' ? 'Urgent' : requirement.urgency]}
        onCall={() => window.open(`tel:${requirement.tenantContact}`)}
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
          ...(requirement.status !== 'closed' && requirement.status !== 'satisfied'
            ? [
                {
                  label: 'Mark as Matched',
                  icon: <CheckCircle className="h-4 w-4" />,
                  onClick: handleMarkAsMatched,
                },
              ]
            : []),
        ]}
      />

      {/* Key Metrics */}
      <MetricCardsGroup
        metrics={[
          {
            label: 'Monthly Rent Range',
            value: formatPKR(requirement.budgetMax || 0) + '/mo',
            icon: <DollarSign className="h-5 w-5" />,
            variant: 'success',
            description: `${formatPKR(requirement.budgetMin || 0)}/mo min`,
          },
          {
            label: 'Matches Found',
            value: matchedProperties.length.toString(),
            icon: <Search className="h-5 w-5" />,
            variant: matchedProperties.length > 0 ? 'info' : 'default',
            description: matchedProperties.length > 0 ? 'Available' : 'Searching',
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
            value: `${requirement.propertyType?.length || 0} type${
              (requirement.propertyType?.length || 0) !== 1 ? 's' : ''
            }`,
            color: 'blue',
          },
          {
            icon: <MapPin className="h-4 w-4" />,
            label: 'Locations',
            value: `${requirement.preferredAreas?.length || 0} area${
              (requirement.preferredAreas?.length || 0) !== 1 ? 's' : ''
            }`,
            color: 'green',
          },
          {
            icon: <Calendar className="h-4 w-4" />,
            label: 'Lease Duration',
            value: 'Flexible',
            color: 'yellow',
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
              {requirement.propertyType && requirement.propertyType.map((type, idx) => (
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

          {(requirement.minArea || requirement.maxArea) && (
            <div className="grid grid-cols-2 gap-4">
              {requirement.minArea && (
                <div>
                  <p className="text-sm text-gray-600">Min Area</p>
                  <p className="font-medium">{requirement.minArea} sq ft</p>
                </div>
              )}
              {requirement.maxArea && (
                <div>
                  <p className="text-sm text-gray-600">Max Area</p>
                  <p className="font-medium">{requirement.maxArea} sq ft</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Locations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-medium">Preferred Locations</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {requirement.preferredAreas && requirement.preferredAreas.map((loc, idx) => (
            <Badge key={idx} variant="outline">
              {loc}
            </Badge>
          ))}
        </div>
      </div>

      {/* Must-Have Features */}
      {requirement.features && requirement.features.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-medium mb-4">Must-Have Features</h3>
          <div className="flex flex-wrap gap-2">
            {requirement.features.map((feature, idx) => (
              <Badge key={idx} className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Nice-to-Have Features */}
      {false && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-medium mb-4">Nice-to-Have Features</h3>
          <div className="flex flex-wrap gap-2">
            {[].map((feature: string, idx: number) => (
              <Badge key={idx} variant="outline">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Rental Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-medium mb-4">Rental Preferences</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Furnished</p>
            <p className="font-medium capitalize">{requirement.furnished}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Lease Duration</p>
            <p className="font-medium">Flexible</p>
          </div>
          {requirement.petsAllowed !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Pets Allowed</p>
              <p className="font-medium">{requirement.petsAllowed ? 'Yes' : 'No'}</p>
            </div>
          )}
          {requirement.employmentVerified !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Employment Verified</p>
              <p className="font-medium">{requirement.employmentVerified ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ==================== MATCHES TAB ====================
  const matchesContent =
    matchedProperties && matchedProperties.length > 0 ? (
      <div className="space-y-4">
        {matchedProperties.map((match) => (
          <div
            key={match.propertyId}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-base font-medium mb-2">{match.property.title}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {formatPropertyAddress(match.property.address)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {match.matchScore}% Match
                  </Badge>
                  <Badge variant="secondary">
                    {formatPKR(match.property.price)}/mo
                  </Badge>
                </div>
              </div>
              {(() => {
                const appStatus = getApplicationStatus(match);
                if (appStatus === 'none') {
                  return (
                    <Button
                      size="sm"
                      onClick={() => handleSubmitApplication(match)}
                    >
                      Submit Application
                    </Button>
                  );
                } else if (appStatus === 'pending') {
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="bg-yellow-50 text-yellow-700 border-yellow-300"
                    >
                      Pending
                    </Button>
                  );
                } else if (appStatus === 'accepted') {
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="bg-green-50 text-green-700 border-green-300"
                    >
                      Accepted
                    </Button>
                  );
                } else {
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="bg-red-50 text-red-700 border-red-300"
                    >
                      Rejected
                    </Button>
                  );
                }
              })()}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-base mb-2">No Matches Found</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          No rental properties currently match this tenant's requirements. We'll notify you when
          new matches become available.
        </p>
      </div>
    );

  const sharedMatchesContent =
    sharedMatches && sharedMatches.length > 0 ? (
      <div className="space-y-4">
        {sharedMatches.map((match) => (
          <div
            key={match.propertyId}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-medium">{match.property.title}</h3>
                  <Badge variant="outline" className="bg-[#E8E2D5] text-[#2D6A54] border-[#2D6A54]">
                    Shared Property
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {match.property.address?.areaName}, {match.property.address?.cityName}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {match.matchScore}% Match
                  </Badge>
                  <Badge variant="secondary">
                    {formatPKR(match.property.price)}/mo
                  </Badge>
                </div>
              </div>
              {(() => {
                // Check if application already exists for shared matches
                const rentCycle = match.rentCycleId ? getRentCycleById(match.rentCycleId) : null;
                const existingApp = rentCycle?.applications?.find(
                  (app: any) => app.fromRequirementId === requirement.id
                );
                
                if (existingApp) {
                  const status = existingApp.status || 'pending';
                  if (status === 'pending') {
                    return (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="bg-yellow-50 text-yellow-700 border-yellow-300"
                      >
                        Pending
                      </Button>
                    );
                  } else if (status === 'accepted') {
                    return (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="bg-green-50 text-green-700 border-green-300"
                      >
                        Accepted
                      </Button>
                    );
                  } else {
                    return (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="bg-red-50 text-red-700 border-red-300"
                      >
                        Rejected
                      </Button>
                    );
                  }
                }
                
                return (
                  <Button
                    size="sm"
                    onClick={() => handleCrossAgentApplication(match)}
                  >
                    Submit Application
                  </Button>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Share2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-base mb-2">No Shared Matches Found</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          No shared properties currently match this tenant's requirements. We'll notify you when new matches
          become available.
        </p>
      </div>
    );

  const matchesTabContent = (
    <Tabs defaultValue="my-properties">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="my-properties">My Properties ({matchedProperties.length})</TabsTrigger>
        <TabsTrigger value="shared-properties">Shared Properties ({sharedMatches.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="my-properties" className="mt-6">{matchesContent}</TabsContent>
      <TabsContent value="shared-properties" className="mt-6">{sharedMatchesContent}</TabsContent>
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
      description: `Budget: ${formatPKR(requirement.budgetMin || 0)} - ${formatPKR(requirement.budgetMax || 0)}/mo`,
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
      label: `Viewings (${requirement.viewings?.length || 0})`,
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
    <DetailPageTemplate
      pageHeader={pageHeader}
      connectedEntities={connectedEntities}
      tabs={tabs}
      defaultTab="overview"
    />
  );
}