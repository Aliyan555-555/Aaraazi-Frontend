/**
 * Rent Cycle Management Service - V3.0
 * Handles all rental/leasing operations
 */

import { RentCycle, Property, SharingSettings, PrivacySettings, CollaborationData } from '../types';
import { getProperties, updateProperty } from './data';
import { syncPropertyStatusFromRentCycle } from './propertyStatusSync';
import { formatPKR } from './currency';
import { updateMatch } from './smartMatching';
import { createNotification } from './notifications';

const RENT_CYCLES_KEY = 'rent_cycles_v3';

/**
 * Get all rent cycles (with optional filtering by user)
 */
export function getRentCycles(userId?: string, userRole?: string): RentCycle[] {
  const json = localStorage.getItem(RENT_CYCLES_KEY);
  const cycles: RentCycle[] = json ? JSON.parse(json) : [];

  // Admin sees everything
  if (!userId || userRole === 'admin') {
    return cycles;
  }

  // Agents see:
  // 1. Their own cycles (regardless of sharing status)
  // 2. ALL shared cycles from other agents in the organization
  return cycles.filter((c: RentCycle) =>
    c.agentId === userId ||  // My own cycles
    c.sharing?.isShared === true  // All shared cycles from other agents
  );
}

/**
 * Get a specific rent cycle by ID
 */
export function getRentCycleById(id: string): RentCycle | undefined {
  const cycles = getRentCycles();
  return cycles.find(c => c.id === id);
}

/**
 * Get all rent cycles for a specific property
 * ASSET-CENTRIC: Returns ALL cycles including ended ones for full history
 */
export function getRentCyclesByProperty(propertyId: string): RentCycle[] {
  const cycles = getRentCycles();
  // Return ALL cycles for the property - never hide ended cycles
  // This preserves the complete rental history (Asset-Centric principle)
  return cycles.filter(c => c.propertyId === propertyId);
}

/**
 * Create a new rent cycle
 */
export function createRentCycle(data: Partial<RentCycle>): RentCycle {
  const cycles = getRentCycles();

  const newCycle: RentCycle = {
    id: `rent_${Date.now()}`,
    propertyId: data.propertyId!,

    // Landlord info
    landlordType: data.landlordType || 'client',
    landlordId: data.landlordId!,
    landlordName: data.landlordName!,

    // Rental terms
    monthlyRent: data.monthlyRent!,
    securityDeposit: data.securityDeposit!,
    leasePeriod: data.leasePeriod || 12,
    availableFrom: data.availableFrom || new Date().toISOString().split('T')[0],
    minimumLeasePeriod: data.minimumLeasePeriod,

    // Utilities
    utilitiesIncluded: data.utilitiesIncluded || [],
    maintenanceIncluded: data.maintenanceIncluded || false,
    maintenanceResponsibility: data.maintenanceResponsibility,

    // Agent/Manager
    agentId: data.agentId!,
    agentName: data.agentName!,
    propertyManagerId: data.propertyManagerId,
    propertyManagerName: data.propertyManagerName,

    // Status
    status: 'available',

    // Current lease
    rentDueDay: data.rentDueDay || 1,

    // History
    leaseHistory: [],
    applications: [],

    // Marketing
    title: data.title,
    description: data.description,
    images: data.images || [],
    isPublished: data.isPublished || false,
    publishedOn: data.publishedOn || [],

    // Rent collection
    rentPayments: [],

    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: data.agentId!,
  };

  cycles.push(newCycle);
  localStorage.setItem(RENT_CYCLES_KEY, JSON.stringify(cycles));

  // Update property to link this rent cycle
  const properties = getProperties();
  const property = properties.find(p => p.id === data.propertyId);
  if (property) {
    const updatedProperty: Partial<Property> = {
      activeRentCycleIds: [...(property.activeRentCycleIds || []), newCycle.id],
    };
    updateProperty(data.propertyId!, updatedProperty);
  }

  // Dispatch event so UI can update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cycleCreated', {
      detail: { propertyId: data.propertyId, cycleId: newCycle.id, cycleType: 'rent' }
    }));
  }

  return newCycle;
}

/**
 * Update an existing rent cycle
 */
export function updateRentCycle(id: string, updates: Partial<RentCycle>): void {
  const cycles = getRentCycles();
  const index = cycles.findIndex(c => c.id === id);

  if (index !== -1) {
    cycles[index] = {
      ...cycles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(RENT_CYCLES_KEY, JSON.stringify(cycles));

    // 🔄 AUTO-SYNC: Update property status if cycle status changed
    if (updates.status) {
      try {
        syncPropertyStatusFromRentCycle(id);
      } catch (error) {
        console.error('Error syncing property status from rent cycle:', error);
        // Don't throw - cycle update should succeed even if sync fails
      }
    }
  }
}

/**
 * Add a tenant application
 */
export function addTenantApplication(
  cycleId: string,
  tenantId: string,
  tenantName: string,
  tenantContact: string,
  notes?: string,
  fromRequirementId?: string
): void {
  const cycle = getRentCycleById(cycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  // Check for duplicate application from the same requirement
  if (fromRequirementId) {
    const existingApplication = (cycle.applications || []).find(
      (app: any) => app.fromRequirementId === fromRequirementId && app.tenantId === tenantId
    );
    
    if (existingApplication) {
      throw new Error('Application already submitted for this requirement');
    }
  }

  const application = {
    id: `app_${Date.now()}`,
    tenantId,
    tenantName,
    tenantContact,
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'pending' as const,
    notes,
    fromRequirementId, // Track which requirement this came from
  };

  const updatedApplications = [...(cycle.applications || []), application];
  updateRentCycle(cycleId, {
    applications: updatedApplications,
    status: 'application-received',
  });
  
  // Dispatch event so UI can update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('applicationCreated', {
      detail: { rentCycleId: cycleId, applicationId: application.id }
    }));
  }
}

/**
 * Approve a tenant application
 */
export function approveTenantApplication(cycleId: string, applicationId: string): void {
  const cycle = getRentCycleById(cycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  const updatedApplications = cycle.applications.map(app => ({
    ...app,
    status: app.id === applicationId ? 'approved' as const : 'rejected' as const,
  }));

  updateRentCycle(cycleId, { applications: updatedApplications });
}

/**
 * Reject a tenant application
 */
export function rejectTenantApplication(cycleId: string, applicationId: string): void {
  const cycle = getRentCycleById(cycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  const updatedApplications = cycle.applications.map(app => ({
    ...app,
    status: app.id === applicationId ? 'rejected' as const : app.status,
  }));

  updateRentCycle(cycleId, { applications: updatedApplications });
}

/**
 * Sign a lease with a tenant
 * Can be called with either applicationId or tenant details directly
 */
export function signLease(
  cycleId: string,
  applicationIdOrTenantId: string,
  startDateOrTenantName: string,
  endDateOrTenantContact?: string,
  tenantContact?: string
): { success: boolean; error?: string } {
  try {
    const cycle = getRentCycleById(cycleId);
    if (!cycle) {
      return { success: false, error: 'Rent cycle not found' };
    }

    let tenantId: string;
    let tenantName: string;
    let tenantContactInfo: string;
    let leaseStart: string;
    let leaseEnd: string;

    // Check if first parameter is an applicationId (by checking if it starts with 'app_')
    // or if we have 5 parameters (old signature)
    if (applicationIdOrTenantId.startsWith('app_') || applicationIdOrTenantId.startsWith('tenant_')) {
      // New signature: signLease(cycleId, applicationId, startDate, endDate)
      const applicationId = applicationIdOrTenantId;
      const application = (cycle.applications || []).find((app: any) => app.id === applicationId);
      
      if (!application) {
        return { success: false, error: 'Application not found' };
      }

      tenantId = application.tenantId;
      tenantName = application.tenantName;
      tenantContactInfo = application.tenantContact || '';
      leaseStart = startDateOrTenantName; // startDate
      leaseEnd = endDateOrTenantContact || ''; // endDate
    } else {
      // Old signature: signLease(cycleId, tenantId, tenantName, tenantContact, startDate?)
      tenantId = applicationIdOrTenantId;
      tenantName = startDateOrTenantName;
      tenantContactInfo = endDateOrTenantContact || '';
      leaseStart = tenantContact || new Date().toISOString().split('T')[0];
      
      // Calculate end date from lease period if not provided
      const leaseEndDate = new Date(leaseStart);
      leaseEndDate.setMonth(leaseEndDate.getMonth() + (cycle.leasePeriod || 12));
      leaseEnd = leaseEndDate.toISOString().split('T')[0];
    }

    if (!leaseStart) {
      return { success: false, error: 'Lease start date is required' };
    }

    if (!leaseEnd) {
      // Calculate end date from lease period
      const leaseEndDate = new Date(leaseStart);
      leaseEndDate.setMonth(leaseEndDate.getMonth() + (cycle.leasePeriod || 12));
      leaseEnd = leaseEndDate.toISOString().split('T')[0];
    }

    updateRentCycle(cycleId, {
      status: 'active',
      currentTenantId: tenantId,
      currentTenantName: tenantName,
      currentTenantContact: tenantContactInfo,
      leaseStartDate: leaseStart,
      leaseEndDate: leaseEnd,
    });

    // Initialize rent payments for the lease period
    const payments = [];
    const currentDate = new Date(leaseStart);
    const leasePeriodMonths = Math.ceil(
      (new Date(leaseEnd).getTime() - new Date(leaseStart).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    for (let i = 0; i < leasePeriodMonths; i++) {
      const month = currentDate.toISOString().slice(0, 7); // "YYYY-MM"
      payments.push({
        month,
        amount: cycle.monthlyRent,
        status: 'pending' as const,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    updateRentCycle(cycleId, { rentPayments: payments });

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sign lease' 
    };
  }
}

/**
 * Record rent payment
 */
export function recordRentPayment(
  cycleId: string,
  month: string,
  amountPaid: number,
  paidDate?: string,
  notes?: string
): void {
  const cycle = getRentCycleById(cycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  const updatedPayments = (cycle.rentPayments || []).map(payment => {
    if (payment.month === month) {
      return {
        ...payment,
        paidDate: paidDate || new Date().toISOString().split('T')[0],
        status: amountPaid >= payment.amount ? 'paid' as const : 'partial' as const,
        notes,
      };
    }
    return payment;
  });

  updateRentCycle(cycleId, { rentPayments: updatedPayments });
}

/**
 * End a lease
 */
export function endLease(
  cycleId: string,
  moveOutDate: string,
  depositReturned: number,
  deductions?: { reason: string; amount: number }[]
): void {
  const cycle = getRentCycleById(cycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  // Add to lease history
  const leaseRecord = {
    id: `lease_${Date.now()}`,
    tenantId: cycle.currentTenantId!,
    tenantName: cycle.currentTenantName!,
    startDate: cycle.leaseStartDate!,
    endDate: cycle.leaseEndDate!,
    monthlyRent: cycle.monthlyRent,
    securityDeposit: cycle.securityDeposit,
    moveOutDate,
    depositReturned,
    deductions,
  };

  const updatedHistory = [...cycle.leaseHistory, leaseRecord];

  updateRentCycle(cycleId, {
    status: 'available', // Back to available
    currentTenantId: undefined,
    currentTenantName: undefined,
    currentTenantContact: undefined,
    leaseStartDate: undefined,
    leaseEndDate: undefined,
    leaseHistory: updatedHistory,
    rentPayments: [], // Clear for next tenant
  });
}

/**
 * Renew a lease
 */
export function renewLease(
  cycleId: string,
  newMonthlyRent?: number,
  newLeasePeriod?: number
): void {
  const cycle = getRentCycleById(cycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  // Archive current lease
  const currentLeaseRecord = {
    id: `lease_${Date.now()}`,
    tenantId: cycle.currentTenantId!,
    tenantName: cycle.currentTenantName!,
    startDate: cycle.leaseStartDate!,
    endDate: cycle.leaseEndDate!,
    monthlyRent: cycle.monthlyRent,
    securityDeposit: cycle.securityDeposit,
  };

  const updatedHistory = [...cycle.leaseHistory, currentLeaseRecord];

  // Start new lease period
  const newStartDate = new Date().toISOString().split('T')[0];
  const leasePeriod = newLeasePeriod || cycle.leasePeriod;
  const leaseEndDate = new Date(newStartDate);
  leaseEndDate.setMonth(leaseEndDate.getMonth() + leasePeriod);

  const rentAmount = newMonthlyRent || cycle.monthlyRent;

  updateRentCycle(cycleId, {
    monthlyRent: rentAmount,
    leasePeriod,
    leaseStartDate: newStartDate,
    leaseEndDate: leaseEndDate.toISOString().split('T')[0],
    leaseHistory: updatedHistory,
    status: 'active',
  });

  // Initialize new rent payments
  const payments = [];
  const currentDate = new Date(newStartDate);

  for (let i = 0; i < leasePeriod; i++) {
    const month = currentDate.toISOString().slice(0, 7);
    payments.push({
      month,
      amount: rentAmount,
      status: 'pending' as const,
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  updateRentCycle(cycleId, { rentPayments: payments });
}

/**
 * End/Close a rent cycle
 */
export function closeRentCycle(id: string): void {
  updateRentCycle(id, { status: 'ended' });

  const cycle = getRentCycleById(id);
  if (cycle) {
    // Remove from property's active cycles
    const properties = getProperties();
    const property = properties.find(p => p.id === cycle.propertyId);
    if (property) {
      const updatedActiveRentCycles = (property.activeRentCycleIds || [])
        .filter((cId: string) => cId !== id);
      const updatedProperty: Partial<Property> = {
        activeRentCycleIds: updatedActiveRentCycles,
        cycleHistory: {
          ...property.cycleHistory,
          rentCycles: [...(property.cycleHistory?.rentCycles || []), id],
        },
      };
      updateProperty(cycle.propertyId, updatedProperty);
    }
  }
}

/**
 * Get rent cycle statistics
 */
export function getRentCycleStats(userId?: string, userRole?: string) {
  const cycles = getRentCycles(userId, userRole);

  const activeCycles = cycles.filter(c => c.status === 'active');
  const totalRentCollected = activeCycles.reduce((sum, c) => {
    const paidPayments = (c.rentPayments || []).filter(p => p.status === 'paid');
    return sum + paidPayments.reduce((pSum, p) => pSum + p.amount, 0);
  }, 0);

  const pendingPayments = activeCycles.reduce((sum, c) => {
    const pending = (c.rentPayments || []).filter(p => p.status === 'pending');
    return sum + pending.reduce((pSum, p) => pSum + p.amount, 0);
  }, 0);

  return {
    total: cycles.length,
    available: cycles.filter(c => c.status === 'available').length,
    showing: cycles.filter(c => c.status === 'showing').length,
    applicationReceived: cycles.filter(c => c.status === 'application-received').length,
    leased: cycles.filter(c => c.status === 'leased').length,
    active: cycles.filter(c => c.status === 'active').length,
    renewalPending: cycles.filter(c => c.status === 'renewal-pending').length,
    ending: cycles.filter(c => c.status === 'ending').length,
    ended: cycles.filter(c => c.status === 'ended').length,
    totalApplications: cycles.reduce((sum, c) => sum + c.applications.length, 0),
    totalRentCollected,
    pendingPayments,
    occupancyRate: cycles.length > 0
      ? (activeCycles.length / cycles.length) * 100
      : 0,
  };
}

// ============================================
// SHARING FUNCTIONALITY (Phase 1)
// ============================================

/**
 * Toggle sharing for a rent cycle
 */
export function toggleRentCycleSharing(
  id: string,
  isShared: boolean,
  userId: string,
  userName: string
): void {
  const cycle = getRentCycleById(id);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  const now = new Date().toISOString();

  const sharing: SharingSettings = {
    isShared,
    sharedAt: isShared ? now : undefined,
    shareLevel: isShared ? 'organization' : 'none',
    shareHistory: [
      ...(cycle.sharing?.shareHistory || []),
      {
        action: isShared ? 'shared' : 'unshared',
        timestamp: now,
        userId,
        userName,
      },
    ],
  };

  const privacy: PrivacySettings = {
    hideOwnerDetails: true,
    hideNegotiations: true,
    hideCommissions: true,
    allowManagerView: true,
  };

  const collaboration: CollaborationData = cycle.collaboration || {
    viewCount: 0,
    viewedBy: [],
    inquiries: [],
  };

  updateRentCycle(id, {
    sharing,
    privacy,
    collaboration,
  });
}

/**
 * Track view of a shared rent cycle
 */
export function trackRentCycleView(id: string, viewerId: string): void {
  const cycle = getRentCycleById(id);
  if (!cycle || !cycle.sharing?.isShared) {
    return; // Only track views for shared cycles
  }

  const viewedBy = cycle.collaboration?.viewedBy || [];
  if (!viewedBy.includes(viewerId) && viewerId !== cycle.agentId) {
    updateRentCycle(id, {
      collaboration: {
        ...cycle.collaboration,
        viewCount: (cycle.collaboration?.viewCount || 0) + 1,
        viewedBy: [...viewedBy, viewerId],
        lastViewedAt: new Date().toISOString(),
      },
    });
  }
}

// ============================================
// CROSS-AGENT OFFER FUNCTIONALITY (Phase 2)
// ============================================

/**
 * Submit a cross-agent rental application (from another agent's tenant)
 * RENAME: submitCrossAgentRentOffer for consistency
 */
export function submitCrossAgentRentOffer(
  rentCycleId: string,
  applicationData: {
    amount: number; // Proposed rent
    tenantId: string;
    tenantName: string;
    tenantContact: string;
    tenantEmail?: string;
    submittedByAgentId: string;
    submittedByAgentName: string;
    submittedByAgentContact?: string;
    fromRequirementId?: string;
    matchId?: string;
    matchScore?: number;
    tenantNotes?: string;
    agentNotes?: string;
    coordinationRequired?: boolean;
  }
): string {
  const cycle = getRentCycleById(rentCycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  // Verify cycle is shared
  if (!cycle.sharing?.isShared) {
    throw new Error('Cannot submit application - cycle is not shared');
  }

  const applicationId = `app_${Date.now()}`;
  const now = new Date().toISOString();

  const newApplication = {
    id: applicationId,
    tenantId: applicationData.tenantId,
    tenantName: applicationData.tenantName,
    tenantContact: applicationData.tenantContact,
    tenantEmail: applicationData.tenantEmail,
    proposedRent: applicationData.amount,
    status: 'pending' as const,
    submittedDate: now.split('T')[0],
    notes: applicationData.tenantNotes,

    // Cross-agent tracking
    submittedByAgentId: applicationData.submittedByAgentId,
    submittedByAgentName: applicationData.submittedByAgentName,
    submittedByAgentContact: applicationData.submittedByAgentContact,
    fromRequirementId: applicationData.fromRequirementId,
    matchId: applicationData.matchId,
    matchScore: applicationData.matchScore,
    submittedVia: 'match' as const,
    agentNotes: applicationData.agentNotes,
    coordinationRequired: applicationData.coordinationRequired,
  };

  // Check for duplicate application from the same requirement
  if (applicationData.fromRequirementId) {
    const existingApplication = (cycle.applications || []).find(
      (app: any) => app.fromRequirementId === applicationData.fromRequirementId
    );
    
    if (existingApplication) {
      throw new Error('Application already submitted for this requirement');
    }
  }

  // Add application to cycle
  const updatedApplications = [...(cycle.applications || []), newApplication];
  updateRentCycle(rentCycleId, {
    applications: updatedApplications,
    status: 'applications-received', // Move to applications-received status
  });

  // Update match status if this was from a match
  if (applicationData.matchId) {
    try {
      updateMatch(applicationData.matchId, {
        status: 'offer-submitted',
        offerId: applicationId,
      });
    } catch (error) {
      console.error('Error updating match status:', error);
      // Don't fail the application submission if match update fails
    }
  }

  // Send notification to listing agent
  if (typeof window !== 'undefined') {
    try {
      createNotification({
        userId: cycle.agentId,
        type: 'application-received',
        title: 'New Cross-Agent Application Received',
        message: `${applicationData.submittedByAgentName} submitted a rental application with proposed rent of ${formatPKR(applicationData.amount)}/month for ${cycle.title || 'your listing'}`,
        priority: 'high',
        entityType: 'rentCycle',
        entityId: rentCycleId,
        actionUrl: `/rent-cycles/${rentCycleId}`,
        metadata: {
          applicationId,
          proposedRent: applicationData.amount,
          fromAgent: applicationData.submittedByAgentName,
          matchScore: applicationData.matchScore,
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't fail the application submission if notification fails
    }
  }

  return applicationId;
}

/**
 * Update a rental application within a cycle
 */
export function updateRentalApplication(
  rentCycleId: string,
  applicationId: string,
  updates: any
): void {
  const cycle = getRentCycleById(rentCycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  const applicationIndex = cycle.applications?.findIndex(a => a.id === applicationId);
  if (applicationIndex === undefined || applicationIndex === -1) {
    throw new Error('Application not found');
  }

  const updatedApplications = cycle.applications.map((app, index) => {
    if (index === applicationIndex) {
      return {
        ...app,
        ...updates,
      };
    }
    return app;
  });

  updateRentCycle(rentCycleId, {
    applications: updatedApplications,
  });
}

/**
 * Accept a cross-agent rental application
 */
export function acceptCrossAgentOffer(
  rentCycleId: string,
  applicationId: string,
  acceptedBy: string
): void {
  const cycle = getRentCycleById(rentCycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  const application = cycle.applications?.find(a => a.id === applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  // Update application status
  updateRentalApplication(rentCycleId, applicationId, {
    status: 'accepted',
    responseDate: new Date().toISOString().split('T')[0],
  });

  // Update match if this was from a match
  if (application.matchId) {
    try {
      updateMatch(application.matchId, {
        status: 'accepted',
      });
    } catch (error) {
      console.error('Error updating match status:', error);
    }
  }

  // Send notification to submitting agent
  if (application.submittedByAgentId && typeof window !== 'undefined') {
    try {
      createNotification({
        userId: application.submittedByAgentId,
        type: 'application-accepted',
        title: '🎉 Application Accepted!',
        message: `Your rental application with proposed rent of ${formatPKR(application.proposedRent)}/month for ${cycle.title || 'the property'} was accepted`,
        priority: 'high',
        entityType: 'rentCycle',
        entityId: rentCycleId,
        actionUrl: `/rent-cycles/${rentCycleId}`,
        metadata: {
          applicationId,
          proposedRent: application.proposedRent,
          listingAgent: cycle.agentName,
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
}

/**
 * Reject a cross-agent rental application
 */
export function rejectCrossAgentOffer(
  rentCycleId: string,
  applicationId: string,
  reason?: string
): void {
  const cycle = getRentCycleById(rentCycleId);
  if (!cycle) {
    throw new Error('Rent cycle not found');
  }

  const application = cycle.applications?.find(a => a.id === applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  // Update application status
  updateRentalApplication(rentCycleId, applicationId, {
    status: 'rejected',
    responseDate: new Date().toISOString().split('T')[0],
    landlordNotes: reason,
  });

  // Send notification to submitting agent
  if (application.submittedByAgentId && typeof window !== 'undefined') {
    try {
      createNotification({
        userId: application.submittedByAgentId,
        type: 'application-rejected',
        title: 'Application Not Accepted',
        message: `Your rental application with proposed rent of ${formatPKR(application.proposedRent)}/month for ${cycle.title || 'the property'} was not accepted`,
        priority: 'medium',
        entityType: 'rentCycle',
        entityId: rentCycleId,
        actionUrl: `/rent-cycles/${rentCycleId}`,
        metadata: {
          applicationId,
          proposedRent: application.proposedRent,
          reason: reason || 'No reason provided',
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
}

/**
 * Get all rental applications submitted by a specific agent across all rent cycles
 */
export function getOffersSubmittedByAgent(agentId: string): any[] {
  const cycles = getRentCycles();
  const applicationsWithCycles: any[] = [];

  cycles.forEach(cycle => {
    const agentApplications = (cycle.applications || []).filter(
      app => app.submittedByAgentId === agentId
    );

    agentApplications.forEach(application => {
      applicationsWithCycles.push({
        ...application,
        cycleId: cycle.id,
        cycleType: 'rent',
        cycleTitle: cycle.title,
        propertyId: cycle.propertyId,
        listingAgentId: cycle.agentId,
        listingAgentName: cycle.agentName,
        amount: application.proposedRent, // Normalize to 'amount' for compatibility
      });
    });
  });

  return applicationsWithCycles.sort((a, b) =>
    new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
  );
}

// End of file
