/**
 * Deals Module - Professional-grade exports
 * Use these instead of direct API or store access in components
 */

export { useDeals, useDeal, useDealMutations } from '@/hooks/useDeals';
export { useDealTimeline } from '@/hooks/useDealTimeline';
export { dealsService } from '@/services/deals.service';
export type {
  UpdateDealPayload,
  ProgressStagePayload,
  RecordPaymentPayload,
  CancelDealPayload,
  CreatePaymentSchedulePayload,
  DealListApiResponse,
  DealDetailApiResponse,
} from '@/services/deals.service';
export type { Deal } from '@/types/deals';
