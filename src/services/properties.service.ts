import { apiClient } from '@/lib/api/client';
import type { Property } from '@/types/properties';
import type { SellCycle, PurchaseCycle, RentCycle } from '@/types';
import type {
  PropertyListingApiResponse,
  CreatePropertyData,
  UpdatePropertyData,
  PropertyQueryParams,
  PropertyListResponse,
  PropertyStatistics,
} from '@/lib/api/properties';
import { transformPropertyListingToUI } from '@/lib/api/properties';

// Re-export types for consumers
export type {
  CreatePropertyData,
  UpdatePropertyData,
  PropertyQueryParams,
  PropertyListResponse,
  PropertyStatistics,
  PropertyListingApiResponse,
} from '@/lib/api/properties';

export { transformPropertyListingToUI } from '@/lib/api/properties';

// ============================================================================
// Properties Service Class
// ============================================================================

class PropertiesService {
  private readonly baseUrl = '/properties';

  /**
   * Create a new property
   */
  async create(data: CreatePropertyData): Promise<PropertyListingApiResponse> {
    try {
      const response = await apiClient.post<PropertyListingApiResponse>(
        this.baseUrl,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create property:', error);
      throw error;
    }
  }

  /**
   * List properties with filters and pagination
   */
  async findAll(params?: PropertyQueryParams): Promise<PropertyListResponse> {
    try {
      const response = await apiClient.get<PropertyListResponse>(
        this.baseUrl,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      throw error;
    }
  }

  /**
   * Get property by ID
   */
  async findOne(id: string): Promise<PropertyListingApiResponse> {
    try {
      const response = await apiClient.get<PropertyListingApiResponse>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update property
   */
  async update(
    id: string,
    data: UpdatePropertyData
  ): Promise<PropertyListingApiResponse> {
    try {
      const response = await apiClient.put<PropertyListingApiResponse>(
        `${this.baseUrl}/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete property (soft delete)
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    try {
      const response = await apiClient.delete<{ message: string; id: string }>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to delete property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Upload property image (backend uploads to Cloudinary)
   */
  async uploadImage(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post<{ url: string }>(
        `${this.baseUrl}/upload-image`,
        formData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to upload property image:', error);
      throw error;
    }
  }

  /**
   * Get property statistics
   */
  async getStatistics(): Promise<PropertyStatistics> {
    try {
      const response = await apiClient.get<PropertyStatistics>(
        `${this.baseUrl}/statistics`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch property statistics:', error);
      throw error;
    }
  }

  /**
   * Get property by ID and transform to UI format
   */
  async findOneAsUI(id: string): Promise<Property> {
    const listing = await this.findOne(id);
    return transformPropertyListingToUI(listing);
  }

  /**
   * Get property by ID with all cycles (sell, purchase, rent) in one API call.
   * Returns property and cycles as UI types.
   */
  async findOneWithCycles(id: string): Promise<{
    property: Property;
    sellCycles: SellCycle[];
    purchaseCycles: PurchaseCycle[];
    rentCycles: RentCycle[];
  }> {
    const listing = await this.findOne(id);
    const property = transformPropertyListingToUI(listing);
    const sellCycles = (listing.sellCycles ?? []).map((sc) =>
      this.mapSellCycleApiToUI(sc)
    );
    const purchaseCycles = (listing.purchaseCycles ?? []).map((pc) =>
      this.mapPurchaseCycleApiToUI(pc)
    );
    const rentCycles = (listing.rentCycles ?? []).map((rc) =>
      this.mapRentCycleApiToUI(rc)
    );
    return { property, sellCycles, purchaseCycles, rentCycles };
  }

  private mapSellCycleApiToUI(api: NonNullable<PropertyListingApiResponse['sellCycles']>[number]): SellCycle {
    const statusMap: Record<string, string> = {
      ACTIVE: 'listed',
      PENDING: 'pending',
      COMPLETED: 'sold',
      CANCELLED: 'cancelled',
      ON_HOLD: 'on-hold',
      LISTED: 'listed',
      OFFER_RECEIVED: 'offer-received',
      NEGOTIATION: 'negotiation',
      UNDER_CONTRACT: 'under-contract',
      SOLD: 'sold',
    };
    return {
      id: api.id,
      propertyId: api.propertyListingId,
      agentId: api.agentId,
      agentName: api.agent?.name,
      status: (statusMap[api.status] || api.status.toLowerCase()) as SellCycle['status'],
      createdAt: api.createdAt,
      updatedAt: api.updatedAt,
      createdBy: api.createdBy ?? api.agentId,
      sellerType: 'client',
      sellerId: '',
      sellerName: '',
      askingPrice: Number(api.askingPrice) || 0,
      commissionRate: 0,
      commissionType: 'percentage',
      title: `Sell cycle ${api.cycleNumber}`,
      listedDate: api.startDate,
      offers: [],
      sharedWith: [],
    };
  }

  private mapPurchaseCycleApiToUI(api: NonNullable<PropertyListingApiResponse['purchaseCycles']>[number]): PurchaseCycle {
    const statusMap: Record<string, string> = {
      ACTIVE: 'prospecting',
      PENDING: 'pending',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      ON_HOLD: 'on-hold',
      NEGOTIATION: 'negotiation',
      UNDER_CONTRACT: 'under-contract',
      OFFER_RECEIVED: 'offer-made',
      SOLD: 'acquired',
    };
    return {
      id: api.id,
      propertyId: api.propertyListingId ?? '',
      agentId: api.agentId,
      agentName: api.agent?.name,
      status: (statusMap[api.status] || api.status.toLowerCase().replace(/_/g, '-')) as PurchaseCycle['status'],
      createdAt: api.createdAt,
      updatedAt: api.updatedAt,
      createdBy: api.createdBy ?? api.agentId,
      title: `Purchase ${api.cycleNumber}`,
      buyerRequirementId: api.requirementId,
      purchaserName: api.requirement?.contact?.name ?? '',
      purchaserType: 'client',
      offerDate: api.startDate,
    };
  }

  private mapRentCycleApiToUI(api: NonNullable<PropertyListingApiResponse['rentCycles']>[number]): RentCycle {
    const statusMap: Record<string, string> = {
      ACTIVE: 'available',
      PENDING: 'pending',
      COMPLETED: 'ended',
      CANCELLED: 'cancelled',
      ON_HOLD: 'on-hold',
      LISTED: 'listed',
      LEASED: 'leased',
      ENDED: 'ended',
    };
    return {
      id: api.id,
      propertyId: api.propertyListingId,
      agentId: api.agentId,
      agentName: api.agent?.name,
      status: (statusMap[api.status] || api.status.toLowerCase()) as RentCycle['status'],
      createdAt: api.createdAt,
      updatedAt: api.updatedAt,
      createdBy: api.createdBy ?? api.agentId,
      monthlyRent: Number(api.monthlyRent) || 0,
      availableFrom: api.availableFrom,
      leasePeriod: String(api.leasePeriod ?? ''),
    };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const propertiesService = new PropertiesService();
export default propertiesService;
