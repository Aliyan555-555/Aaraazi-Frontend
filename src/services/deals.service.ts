/**
 * Deals Service
 * Fetches deals and maps API response to UI Deal type
 */

import { apiClient } from '@/lib/api/client';
import type { Deal } from '@/types/deals';
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

  const currentStage = STAGE_TO_UI[api.stage] ?? 'offer-accepted';
  const offerAccepted = stageMap.OFFER_ACCEPTED ?? defaultStageProgress();
  const agreementSigning = stageMap.AGREEMENT_SIGNING ?? defaultStageProgress();
  const documentation = stageMap.DOCUMENTATION ?? defaultStageProgress();
  const paymentProcessing = stageMap.PAYMENT_PROCESSING ?? stageMap.PAYMENT ?? defaultStageProgress();
  const handoverPrep = stageMap.HANDOVER_PREP ?? defaultStageProgress();
  const transferRegistration = stageMap.TRANSFER_REGISTRATION ?? stageMap.TRANSFER ?? defaultStageProgress();
  const finalHandover = stageMap.FINAL_HANDOVER ?? defaultStageProgress();

  const installments = (api.paymentSchedules?.[0]?.payments ?? payments).map((p, i) => ({
    id: p.id,
    amount: toNum(p.amount),
    dueDate: p.dueDate,
    status: (p.paidDate ? 'paid' : 'pending') as 'paid' | 'pending',
    paidDate: p.paidDate ?? undefined,
    sequence: i + 1,
  }));

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
      commission: {
        total: commissionTotal,
        rate: agreedPrice ? (commissionTotal / agreedPrice) * 100 : 0,
        split: {
          primaryAgent: { percentage: 100, amount: commissionTotal, status: 'pending' as const },
          agency: { percentage: 0, amount: 0 },
        },
      },
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
    tasks: [],
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
  const stage = STAGE_TO_UI[api.stage] ?? 'offer-accepted';
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
      paymentState: 'no-plan',
      totalPaid: 0,
      balanceRemaining: agreedPrice,
      payments: [],
      commission: { total: toNum(api.commissionTotal), rate: 0, split: { primaryAgent: { percentage: 100, amount: toNum(api.commissionTotal), status: 'pending' }, agency: { percentage: 0, amount: 0 } } },
      transferCosts: { stampDuty: 0, registrationFee: 0, legalFees: 0, societyFee: 0, other: 0, total: 0 },
    },
    lifecycle: {
      stage,
      status,
      timeline: {
        offerAcceptedDate: api.createdAt,
        expectedClosingDate: api.updatedAt,
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
