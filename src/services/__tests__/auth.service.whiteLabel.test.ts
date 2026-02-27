/**
 * Auth Service – agency white labeling (tenant lookup with branding)
 * Verifies lookupTenant returns TenantLookupResponse including branding for white labeling
 */

import { authService } from '../auth.service';

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

describe('auth.service – register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('register succeeds and returns LoginResponse', async () => {
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      tenantId: 'tenant-1',
      agencyId: 'agency-1',
    };
    const loginResponse = {
      accessToken: 'mock-access-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        agencyId: 'agency-1',
        tenantId: 'tenant-1',
        permissions: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    mockPost.mockResolvedValue({ data: loginResponse });

    const result = await authService.register(registerData);

    expect(mockPost).toHaveBeenCalledWith('/auth/register', registerData);
    expect(result).toEqual(loginResponse);
    expect(result.accessToken).toBe('mock-access-token');
    expect(result.user.email).toBe('test@example.com');
  });

  it('register throws when API fails', async () => {
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      tenantId: 'tenant-1',
    };

    mockPost.mockRejectedValue(new Error('Registration failed'));

    await expect(authService.register(registerData)).rejects.toThrow('Registration failed');
    expect(mockPost).toHaveBeenCalledWith('/auth/register', registerData);
  });
});

describe('auth.service – refreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('refreshToken posts to /auth/refresh-token with refreshToken payload', async () => {
    const refreshToken = 'mock-refresh-token-123';
    const loginResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        agencyId: 'agency-1',
        tenantId: 'tenant-1',
        permissions: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    mockPost.mockResolvedValue({ data: loginResponse });

    const result = await authService.refreshToken(refreshToken);

    expect(mockPost).toHaveBeenCalledWith('/auth/refresh-token', { refreshToken });
    expect(result).toEqual(loginResponse);
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
  });

  it('refreshToken propagates errors when API fails', async () => {
    mockPost.mockRejectedValue(new Error('Refresh token failed'));

    await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Refresh token failed');
    expect(mockPost).toHaveBeenCalledWith('/auth/refresh-token', { refreshToken: 'invalid-token' });
  });
});
