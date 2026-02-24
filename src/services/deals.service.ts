/**
 * Deals Service
 * Fetches deals and maps API response to UI Deal type
 */

import { apiClient } from '@/lib/api/client';
import type { Deal, CommissionStatus, CommissionAgent } from '@/types/deals';
import type {
  DealListApiResponse,
  DealDetailApiResponse,
} from '@/lib/api/deals';

export type { DealListApiResponse, DealDetailApiResponse } from '@/lib/api/deals';

const STAGE_TO_UI: Record<string, Deal['lifecycle']['stage']> = {
  NEGOTIATION: 'offer-accepted',
  OFFER_ACCEPTED: 'offer-accepted',
  AGREEMENT_SIGNING: 'agreement-signing',
  DOCUMENTATION: 'documentation',
  PAYMENT_PROCESSING: 'payment-processing',
  PAYMENT: 'payment-processing',
  HANDOVER_PREP: 'handover-prep',
  TRANSFER_REGISTRATION: 'transfer-registration',
  TRANSFER: 'transfer-registration',
  FINAL_HANDOVER: 'final-handover',
  COMPLETED: 'completed',
};

const STATUS_TO_UI: Record<string, 'active' | 'on-hold' | 'cancelled' | 'completed'> = {
  ACTIVE: 'active',
  ON_HOLD: 'on-hold',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

const COMMISSION_STATUS_TO_UI: Record<string, CommissionStatus> = {
  PENDING: 'pending',
  PENDING_APPROVAL: 'pending-approval',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on-hold',
  PARTIALLY_PAID: 'pending',
};

function commissionStatusToSplitStatus(s: string): 'pending' | 'paid' | 'cancelled' {
  if (s === 'PAID') return 'paid';
  if (s === 'CANCELLED') return 'cancelled';
  return 'pending';
}

const TASK_STATUS_TO_UI: Record<string, 'not-started' | 'in-progress' | 'completed'> = {
  PENDING: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'completed',
  OVERDUE: 'in-progress',
};

const TASK_PRIORITY_TO_UI: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

function toNum(v: string | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatAddress(listing: DealDetailApiResponse['propertyListing']): string {
  if (!listing?.masterProperty?.address) {
    return listing?.title ?? 'Property';
  }
  const addr = listing.masterProperty.address;
  const parts = [addr.fullAddress, addr.area?.name, addr.city?.name].filter(Boolean);
  return parts.length ? parts.join(', ') : (listing.title ?? 'Property');
}

function defaultStageProgress(): Deal['lifecycle']['timeline']['stages'][keyof Deal['lifecycle']['timeline']['stages']] {
  return {
    status: 'not-started',
    completionPercentage: 0,
    tasksCompleted: 0,
    totalTasks: 0,
  };
}

/**
 * Map backend deal detail to UI Deal type
 */
export function mapDealApiToUI(api: DealDetailApiResponse): Deal {
  const agreedPrice = toNum(api.agreedPrice);
  const commissionTotal = toNum(api.commissionTotal);
  const payments = api.payments ?? [];
  const totalPaid = payments
    .filter((p) => p.paidDate)
    .reduce((sum, p) => sum + toNum(p.amount), 0);
  const balanceRemaining = Math.max(0, agreedPrice - totalPaid);

  const stageTrackings = api.stageTrackings ?? [];
  const stageMap: Record<string, ReturnType<typeof defaultStageProgress>> = {};
  stageTrackings.forEach((t) => {
    stageMap[t.stage] = {
      status: t.completedAt ? 'completed' : 'in-progress',
      completedAt: t.completedAt ?? undefined,
      startedAt: t.startedAt,
      completionPercentage: t.completedAt ? 100 : 50,
      tasksCompleted: t.completedAt ? 1 : 0,
      totalTasks: 1,
    };
  });

  // Completed deals show final-handover as last stage (per prototype); status indicates completion
  const isCompleted = (api.status && String(api.status).toUpperCase() === 'COMPLETED')
    || (api.stage && String(api.stage).toUpperCase() === 'COMPLETED');
  const currentStage = isCompleted ? 'final-handover' : (STAGE_TO_UI[api.stage] ?? 'offer-accepted');
  const offerAccepted = stageMap.OFFER_ACCEPTED ?? defaultStageProgress();
  const agreementSigning = stageMap.AGREEMENT_SIGNING ?? defaultStageProgress();
  const documentation = stageMap.DOCUMENTATION ?? defaultStageProgress();
  const paymentProcessing = stageMap.PAYMENT_PROCESSING ?? stageMap.PAYMENT ?? defaultStageProgress();
  const handoverPrep = stageMap.HANDOVER_PREP ?? defaultStageProgress();
  const transferRegistration = stageMap.TRANSFER_REGISTRATION ?? stageMap.TRANSFER ?? defaultStageProgress();
  const finalHandover = stageMap.FINAL_HANDOVER ?? defaultStageProgress();

  const schedulePayments = api.paymentSchedules?.[0]?.payments ?? payments;
  const installments = schedulePayments.map((p: { id: string; amount: string; dueDate: string; paidDate?: string | null; paymentNumber?: string }, i: number) => {
    const amt = toNum(p.amount);
    const paid = !!p.paidDate;
    return {
      id: p.id,
      amount: amt,
      dueDate: p.dueDate,
      status: (paid ? 'paid' : 'pending') as 'paid' | 'pending',
      paidDate: p.paidDate ?? undefined,
      paidAmount: paid ? amt : 0,
      amountPaid: paid ? amt : 0,
      sequence: i + 1,
      name: p.paymentNumber ?? `Installment #${i + 1}`,
      description: p.paymentNumber ?? `Installment #${i + 1}`,
    };
  });

  const deal: Deal = {
    id: api.id,
    dealNumber: api.dealNumber,
    tenantId: api.tenantId,
    agencyId: api.agencyId,
    notes: api.notes ?? '',
    cycles: {
      sellCycle: api.sellCycle
        ? { id: api.sellCycle.id, agentId: api.sellCycle.agentId, agentName: '', propertyId: '', offerId: '' }
        : undefined,
      purchaseCycle: api.purchaseCycle
        ? { id: api.purchaseCycle.id, agentId: api.purchaseCycle.agentId, agentName: '', buyerRequirementId: '' }
        : undefined,
    },
    agents: {
      primary: {
        id: api.primaryAgent?.id ?? '',
        name: api.primaryAgent?.name ?? 'Agent',
        role: 'seller-agent',
        permissions: {} as Deal['agents']['primary']['permissions'],
      },
      secondary: api.secondaryAgent
        ? { id: api.secondaryAgent.id, name: api.secondaryAgent.name, role: 'buyer-agent', permissions: {} as Deal['agents']['secondary'] extends { permissions: infer P } ? P : never }
        : undefined,
    },
    parties: {
      seller: {
        id: api.sellerContact?.id ?? '',
        name: api.sellerContact?.name ?? 'Seller',
        contact: api.sellerContact?.phone ?? '',
        email: api.sellerContact?.email ?? '',
      },
      buyer: {
        id: api.buyerContact?.id ?? '',
        name: api.buyerContact?.name ?? 'Buyer',
        contact: api.buyerContact?.phone ?? '',
        email: api.buyerContact?.email ?? '',
      },
    },
    property: {
      id: api.propertyListing?.id ?? '',
      title: api.propertyListing?.title,
      address: formatAddress(api.propertyListing ?? undefined),
    },
    financial: {
      agreedPrice,
      paymentState: totalPaid >= agreedPrice ? 'fully-paid' : totalPaid > 0 ? 'partially-paid' : 'no-plan',
      totalPaid,
      balanceRemaining,
      payments: payments.map((p) => ({
        id: p.id,
        amount: toNum(p.amount),
        status: p.paidDate ? ('paid' as const) : ('pending' as const),
        recordedBy: '',
        paidDate: p.paidDate ?? undefined,
      })),
      commission: (() => {
        const rawCommissions = api.commissions ?? [];
        const agents: CommissionAgent[] = rawCommissions.map((c) => ({
          id: c.agentId,
          commissionId: c.id,
          type: 'internal' as const,
          entityType: 'user' as const,
          name: c.agent?.name ?? 'Agent',
          email: c.agent?.email,
          percentage: toNum(c.splitPercentage ?? c.rate),
          amount: toNum(c.amount),
          status: COMMISSION_STATUS_TO_UI[c.status] ?? 'pending',
          paidDate: c.paidAt ?? undefined,
          approvedBy: c.approvedBy ?? undefined,
          approvedAt: c.approvedAt ?? undefined,
        }));
        const primaryId = api.primaryAgent?.id;
        const secondaryId = api.secondaryAgent?.id;
        const primaryComm = rawCommissions.find((c) => c.agentId === primaryId);
        const secondaryComm = rawCommissions.find((c) => c.agentId === secondaryId);
        const primaryPct = primaryComm ? toNum(primaryComm.splitPercentage ?? primaryComm.rate) : (agents.length === 0 ? 100 : 0);
        const secondaryPct = secondaryComm ? toNum(secondaryComm.splitPercentage ?? secondaryComm.rate) : 0;
        const agencyPct = Math.max(0, 100 - primaryPct - secondaryPct);
        const primaryAmt = primaryComm ? toNum(primaryComm.amount) : (agents.length === 0 ? commissionTotal : 0);
        const secondaryAmt = secondaryComm ? toNum(secondaryComm.amount) : 0;
        const agencyAmt = commissionTotal - primaryAmt - secondaryAmt;
        return {
          total: commissionTotal,
          rate: agreedPrice ? (commissionTotal / agreedPrice) * 100 : 0,
          agents: agents.length ? agents : undefined,
          split: {
            primaryAgent: {
              percentage: agents.length ? primaryPct : 100,
              amount: agents.length ? primaryAmt : commissionTotal,
              status: primaryComm ? commissionStatusToSplitStatus(primaryComm.status) : 'pending',
              paidDate: primaryComm?.paidAt ?? undefined,
              approvedBy: primaryComm?.approvedBy ?? undefined,
              approvedAt: primaryComm?.approvedAt ?? undefined,
            },
            secondaryAgent:
              secondaryComm || secondaryId
                ? {
                    percentage: secondaryPct,
                    amount: secondaryAmt,
                    status: secondaryComm ? commissionStatusToSplitStatus(secondaryComm.status) : 'pending',
                    paidDate: secondaryComm?.paidAt ?? undefined,
                    approvedBy: secondaryComm?.approvedBy ?? undefined,
                    approvedAt: secondaryComm?.approvedAt ?? undefined,
                  }
                : undefined,
            agency: { percentage: agencyPct, amount: Math.max(0, agencyAmt) },
          },
        };
      })(),
      transferCosts: {
        stampDuty: 0,
        registrationFee: 0,
        legalFees: 0,
        societyFee: 0,
        other: 0,
        total: 0,
      },
    },
    lifecycle: {
      stage: currentStage,
      status: STATUS_TO_UI[api.status] ?? 'active',
      timeline: {
        offerAcceptedDate: api.createdAt,
        expectedClosingDate: api.closingDate ?? api.createdAt,
        actualClosingDate: api.actualClosingDate ?? undefined,
        stages: {
          offerAccepted: offerAccepted && typeof offerAccepted === 'object' ? offerAccepted : defaultStageProgress(),
          agreementSigning: agreementSigning && typeof agreementSigning === 'object' ? agreementSigning : defaultStageProgress(),
          documentation: documentation && typeof documentation === 'object' ? documentation : defaultStageProgress(),
          paymentProcessing: paymentProcessing && typeof paymentProcessing === 'object' ? paymentProcessing : defaultStageProgress(),
          handoverPrep: handoverPrep && typeof handoverPrep === 'object' ? handoverPrep : defaultStageProgress(),
          transferRegistration: transferRegistration && typeof transferRegistration === 'object' ? transferRegistration : defaultStageProgress(),
          finalHandover: finalHandover && typeof finalHandover === 'object' ? finalHandover : defaultStageProgress(),
        },
      },
    },
    collaboration: {
      primaryAgentNotes: [],
      sharedNotes: (api.notesRel ?? []).map((n) => ({
        id: n.id,
        content: n.content,
        createdBy: n.createdBy ?? '',
        createdByName: '',
        createdAt: n.createdAt,
      })),
      secondaryAgentNotes: [],
      communications: [],
      lastUpdatedBy: { agentId: '', agentName: '', timestamp: api.updatedAt, action: '' },
    },
    tasks: (api.tasks ?? []).map((t) => ({
      id: t.id,
      dealId: api.id,
      title: t.title,
      description: t.description ?? undefined,
      stage: currentStage,
      assignedTo: t.assignedToId,
      assignedToName: t.assignedTo?.name ?? '',
      dueDate: t.dueDate,
      status: TASK_STATUS_TO_UI[t.status] ?? 'not-started',
      completedAt: t.completedAt ?? undefined,
      priority: TASK_PRIORITY_TO_UI[t.priority] ?? 'medium',
      automated: false,
      createdAt: t.createdAt ?? new Date().toISOString(),
    })),
    documents: (api.documents ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      category: (d.category?.toLowerCase() ?? 'other') as 'agreement' | 'payment' | 'legal' | 'transfer' | 'other',
      url: d.url,
      uploadedBy: d.uploadedBy ?? '',
      uploadedByName: '',
      uploadedAt: d.uploadedAt,
      required: false,
      status: (d.status?.toLowerCase() ?? 'uploaded') as 'pending' | 'uploaded' | 'verified' | 'rejected',
    })),
    sync: { lastSyncedAt: '', sellCycleLastUpdated: '', purchaseCycleLastUpdated: '', isInSync: true },
    metadata: { createdAt: api.createdAt, updatedAt: api.updatedAt, createdBy: '' },
  };

  if (api.sellCycle) (deal.cycles.sellCycle as any).agentName = api.primaryAgent?.name;
  if (api.purchaseCycle) (deal.cycles.purchaseCycle as any).agentName = api.secondaryAgent?.name ?? api.primaryAgent?.name;
  (deal.financial as any).paymentPlan = installments.length
    ? { id: api.paymentSchedules?.[0]?.id ?? 'plan', dealId: api.id, installments, totalAmount: agreedPrice, createdAt: api.createdAt, createdBy: '' }
    : undefined;

  return deal;
}

/** Map list item to minimal Deal for workspace (list/cards) */
export function mapDealListApiToUI(api: DealListApiResponse): Deal {
  const agreedPrice = toNum(api.agreedPrice);
  const totalPaid = (api.payments ?? [])
    .filter((p) => p.paidDate)
    .reduce((sum, p) => sum + toNum(p.amount), 0);
  const balanceRemaining = Math.max(0, agreedPrice - totalPaid);
  const paymentState =
    totalPaid >= agreedPrice ? 'fully-paid' : totalPaid > 0 ? 'partially-paid' : 'no-plan';
  const isCompleted =
    (api.status && String(api.status).toUpperCase() === 'COMPLETED') ||
    (api.stage && String(api.stage).toUpperCase() === 'COMPLETED');
  const stage = isCompleted ? 'final-handover' : (STAGE_TO_UI[api.stage] ?? 'offer-accepted');
  const status = STATUS_TO_UI[api.status] ?? 'active';
  const def = defaultStageProgress();
  return {
    id: api.id,
    dealNumber: api.dealNumber,
    tenantId: api.tenantId,
    agencyId: api.agencyId,
    notes: '',
    cycles: {},
    agents: { primary: { id: api.primaryAgent?.id ?? '', name: api.primaryAgent?.name ?? '', role: 'seller-agent', permissions: {} as any } },
    parties: {
      seller: { id: api.sellerContact?.id ?? '', name: api.sellerContact?.name ?? 'Seller', contact: api.sellerContact?.phone ?? '', email: api.sellerContact?.email ?? '' },
      buyer: { id: api.buyerContact?.id ?? '', name: api.buyerContact?.name ?? 'Buyer', contact: api.buyerContact?.phone ?? '', email: api.buyerContact?.email ?? '' },
    },
    property: { id: api.propertyListing?.id ?? '', title: api.propertyListing?.title, address: formatAddress(api.propertyListing ?? undefined) },
    financial: {
      agreedPrice,
      paymentState,
      totalPaid,
      balanceRemaining,
      payments: (api.payments ?? []).map((p) => ({
        id: '',
        amount: toNum(p.amount),
        status: (p.paidDate ? 'paid' : 'pending') as 'paid' | 'pending',
        recordedBy: '',
        paidDate: p.paidDate ?? undefined,
      })),
      commission: { total: toNum(api.commissionTotal), rate: 0, split: { primaryAgent: { percentage: 100, amount: toNum(api.commissionTotal), status: 'pending' }, agency: { percentage: 0, amount: 0 } } },
      transferCosts: { stampDuty: 0, registrationFee: 0, legalFees: 0, societyFee: 0, other: 0, total: 0 },
    },
    lifecycle: {
      stage,
      status,
      timeline: {
        offerAcceptedDate: api.createdAt,
        expectedClosingDate: api.closingDate ?? api.updatedAt,
        stages: { offerAccepted: def, agreementSigning: def, documentation: def, paymentProcessing: def, handoverPrep: def, transferRegistration: def, finalHandover: def },
      },
    },
    collaboration: { primaryAgentNotes: [], sharedNotes: [], secondaryAgentNotes: [], communications: [], lastUpdatedBy: { agentId: '', agentName: '', timestamp: api.updatedAt, action: '' } },
    tasks: [],
    documents: [],
    sync: { lastSyncedAt: '', sellCycleLastUpdated: '', purchaseCycleLastUpdated: '', isInSync: true },
    metadata: { createdAt: api.createdAt, updatedAt: api.updatedAt, createdBy: '' },
  } as Deal;
}

export interface UpdateDealPayload {
  notes?: string;
  secondaryAgentId?: string;
  sellerContactId?: string;
  buyerContactId?: string;
}

export interface ProgressStagePayload {
  stage: string;
  notes?: string;
}

export interface RecordPaymentPayload {
  amount: number;
  paymentType: string;
  paidAt?: string;
  notes?: string;
  reference?: string;
  method?: string;
  installmentId?: string;
}

export interface CancelDealPayload {
  reason: string;
}

export interface CreatePaymentSchedulePayload {
  totalAmount: number;
  downPaymentAmount: number;
  downPaymentDate: string;
  numberOfInstallments: number;
  frequency: 'MONTHLY' | 'QUARTERLY';
  firstInstallmentDate: string;
}

export interface UpsertCommissionsPayload {
  agents: Array<{ agentId: string; amount: number; rate?: number; splitPercentage?: number }>;
  agencyAmount?: number;
  agencyPercentage?: number;
}

export interface UpdateCommissionStatusPayload {
  status: string;
  paidAt?: string;
  notes?: string;
}

export interface CreateDealTaskPayload {
  title: string;
  description?: string;
  assignedToId: string;
  dueDate: string;
  priority?: string;
  type?: string;
}

export interface UpdateDealTaskPayload {
  status?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
}

export interface AddInstallmentPayload {
  amount: number;
  dueDate: string;
  description?: string;
  type?: string;
}

class DealsService {
  private readonly baseUrl = '/deals';

  async findAll(): Promise<Deal[]> {
    const response = await apiClient.get<DealListApiResponse[]>(this.baseUrl);
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(mapDealListApiToUI);
  }

  async findOne(id: string): Promise<Deal | null> {
    try {
      const response = await apiClient.get<DealDetailApiResponse>(`${this.baseUrl}/${id}`);
      return mapDealApiToUI(response.data);
    } catch {
      return null;
    }
  }

  async updateDeal(id: string, payload: UpdateDealPayload): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/${id}`, payload);
  }

  async progressStage(id: string, payload: ProgressStagePayload): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${id}/progress-stage`, payload);
  }

  async recordPayment(id: string, payload: RecordPaymentPayload): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${id}/payments`, payload);
  }

  async createNote(dealId: string, content: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${dealId}/notes`, { content });
  }

  async createDocument(
    dealId: string,
    payload: { name: string; url: string; type: string; category: string },
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${dealId}/documents`, payload);
  }

  async createPaymentSchedule(
    dealId: string,
    payload: CreatePaymentSchedulePayload,
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${dealId}/payment-schedules`, payload);
  }

  async upsertCommissions(
    dealId: string,
    payload: UpsertCommissionsPayload,
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${dealId}/commissions`, payload);
  }

  async updateCommissionStatus(
    dealId: string,
    commissionId: string,
    payload: UpdateCommissionStatusPayload,
  ): Promise<void> {
    await apiClient.patch(
      `${this.baseUrl}/${dealId}/commissions/${commissionId}`,
      payload,
    );
  }

  async createDealTask(
    dealId: string,
    payload: CreateDealTaskPayload,
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${dealId}/tasks`, payload);
  }

  async updateDealTask(
    dealId: string,
    taskId: string,
    payload: UpdateDealTaskPayload,
  ): Promise<void> {
    await apiClient.patch(
      `${this.baseUrl}/${dealId}/tasks/${taskId}`,
      payload,
    );
  }

  async addInstallment(
    dealId: string,
    scheduleId: string,
    payload: AddInstallmentPayload,
  ): Promise<void> {
    await apiClient.post(
      `${this.baseUrl}/${dealId}/payment-schedules/${scheduleId}/installments`,
      payload,
    );
  }

  async completeDeal(id: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${id}/complete`, {});
  }

  async cancelDeal(id: string, reason: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  async findBySellCycle(sellCycleId: string): Promise<DealListApiResponse[]> {
    const response = await apiClient.get<DealListApiResponse[]>(
      `${this.baseUrl}/by-sell-cycle/${sellCycleId}`,
    );
    return Array.isArray(response.data) ? response.data : [];
  }
}

export const dealsService = new DealsService();
