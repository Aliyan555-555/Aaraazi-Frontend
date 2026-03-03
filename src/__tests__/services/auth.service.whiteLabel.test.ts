/**
 * Auth Service – agency white labeling (tenant lookup with branding)
 * Verifies lookupTenant returns TenantLookupResponse including branding for white labeling
 */

import { authService } from '@/services/auth.service';

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe('auth.service – agency white labeling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lookupTenant returns response with branding for white labeling', async () => {
    const branding = {
      companyName: 'Test Agency',
      primaryColor: '#1a1a1a',
      secondaryColor: '#f5f5f5',
      accentColor: '#00aaff',
      portalTitle: 'Agency Portal',
      logoUrl: 'https://agency.example.com/logo.png',
      iconUrl: 'https://agency.example.com/favicon.ico',
    };
    const agencies = [
      { id: 'agency-1', name: 'Main Agency', code: 'AG01', type: 'AGENCY', tenantId: 'tenant-1' },
    ];
    const lookupResponse = {
      id: 'tenant-1',
      name: 'Test Tenant',
      domain: 'agency.example.com',
      branding,
      agencies,
    };

    mockGet.mockResolvedValue({ data: lookupResponse });

    const result = await authService.lookupTenant({ domain: 'agency.example.com' });

    expect(mockGet).toHaveBeenCalledWith('/tenants/lookup', {
      params: { domain: 'agency.example.com' },
    });
    expect(result).toEqual(lookupResponse);
    expect(result.branding).toEqual(branding);
    expect(result.branding.companyName).toBe('Test Agency');
    expect(result.branding.primaryColor).toBe('#1a1a1a');
    expect(result.agencies).toEqual(agencies);
  });

  it('lookupTenant throws when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(authService.lookupTenant({ domain: 'bad.domain' })).rejects.toThrow(
      'Network error',
    );
    expect(mockGet).toHaveBeenCalledWith('/tenants/lookup', {
      params: { domain: 'bad.domain' },
    });
  });
});
