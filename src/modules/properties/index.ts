/**
 * Properties Module - Professional-grade exports
 * Use these instead of direct API calls in components
 */

export { useProperties, useProperty, usePropertyMutations } from '@/hooks/useProperties';
export { propertiesService } from '@/services/properties.service';
export type {
  CreatePropertyData,
  UpdatePropertyData,
  PropertyQueryParams,
  PropertyListResponse,
  PropertyStatistics,
} from '@/services/properties.service';
