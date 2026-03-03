/**
 * Auth Store Session Persistence Tests
 * Verifies that session data persists across page reloads and user sessions
 */

import { act, waitFor } from '@testing-library/react';
import { useAuthStore, selectBranding, selectTenant } from '@/store/useAuthStore';
import { AUTH_STORAGE_KEY } from '@/lib/auth-storage';

const mockSetAuthToken = jest.fn();
const mockClearAuthToken = jest.fn();
const mockSetAuthCookie = jest.fn();
const mockClearAuthCookie = jest.fn();

jest.mock('@/services/auth.service', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getSession: jest.fn(),
    validateSession: jest.fn(),
  },
}));

jest.mock('@/lib/api/client', () => ({
  setAuthToken: (...args: unknown[]) => mockSetAuthToken(...args),
  clearAuthToken: (...args: unknown[]) => mockClearAuthToken(...args),
}));

jest.mock('@/lib/auth-storage', () => ({
  AUTH_STORAGE_KEY: 'aaraazi-auth-storage',
  setAuthCookie: (...args: unknown[]) => mockSetAuthCookie(...args),
  clearAuthCookie: (...args: unknown[]) => mockClearAuthCookie(...args),
}));

describe('useAuthStore - Session Persistence', () => {
  const mockUser = {
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
  };

  const mockBranding = {
    companyName: 'Test Agency',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
  };

  const mockAgency = {
    id: 'agency-1',
    name: 'Test Agency',
    code: 'TEST',
    type: 'agency',
    tenantId: 'tenant-1',
  };

  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    localStorageMock = {};
    mockSetAuthToken.mockClear();
    mockClearAuthToken.mockClear();
    mockSetAuthCookie.mockClear();
    mockClearAuthCookie.mockClear();
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return localStorageMock[key] ?? null;
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete localStorageMock[key];
    });
    jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      localStorageMock = {};
    });

    act(() => {
      useAuthStore.persist.clearStorage();
      useAuthStore.getState().reset();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('persists auth state to localStorage on login', async () => {
    const { authService } = require('@/services/auth.service');
    const mockAccessToken = 'mock-access-token-123';
    authService.login.mockResolvedValue({
      accessToken: mockAccessToken,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: mockUser,
    });
    authService.getSession.mockRejectedValue(new Error('skip session fetch'));

    await act(async () => {
      useAuthStore.getState().setTenant('tenant-1', mockBranding, [mockAgency]);
    });

    await act(async () => {
      await useAuthStore.getState().login({
        tenantId: 'tenant-1',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    const stored = localStorageMock[AUTH_STORAGE_KEY];
    expect(stored).toBeDefined();

    const parsed = JSON.parse(stored!);
    expect(parsed.state).toBeDefined();
    expect(parsed.state.user).toEqual(mockUser);
    expect(parsed.state.accessToken).toBe(mockAccessToken);
    expect(parsed.state.tenantId).toBe('tenant-1');
    expect(parsed.state.isAuthenticated).toBe(true);

    expect(mockSetAuthCookie).toHaveBeenCalledWith(
      mockAccessToken,
      mockUser,
      'tenant-1',
      'agency-1'
    );
  });

  it('calls clearAuthCookie on logout', async () => {
    const { authService } = require('@/services/auth.service');
    authService.login.mockResolvedValue({
      accessToken: 'logout-test-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: mockUser,
    });
    authService.getSession.mockRejectedValue(new Error('skip'));
    authService.logout.mockResolvedValue(undefined);

    await act(async () => {
      useAuthStore.getState().setTenant('tenant-1', mockBranding, [mockAgency]);
    });
    await act(async () => {
      await useAuthStore.getState().login({
        tenantId: 'tenant-1',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockSetAuthCookie).toHaveBeenCalled();

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    expect(mockClearAuthCookie).toHaveBeenCalled();
  });

  it('calls clearAuthCookie on reset', () => {
    act(() => {
      useAuthStore.getState().reset();
    });
    expect(mockClearAuthCookie).toHaveBeenCalled();
  });

  it('rehydrates persisted state from localStorage on rehydrate', async () => {
    const persistedState = {
      state: {
        user: mockUser,
        accessToken: 'persisted-token-456',
        tenantId: 'tenant-1',
        agencyId: 'agency-1',
        branding: mockBranding,
        agencies: [mockAgency],
        currentModule: null,
        isAuthenticated: true,
      },
      version: 0,
    };

    localStorageMock[AUTH_STORAGE_KEY] = JSON.stringify(persistedState);

    await act(async () => {
      await useAuthStore.persist.rehydrate();
    });

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('persisted-token-456');
      expect(state.tenantId).toBe('tenant-1');
      expect(state.agencyId).toBe('agency-1');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
    });
  });

  it('calls setAuthToken when rehydrating with accessToken', async () => {
    const persistedState = {
      state: {
        user: mockUser,
        accessToken: 'rehydration-token',
        tenantId: 'tenant-1',
        agencyId: 'agency-1',
        branding: mockBranding,
        agencies: [mockAgency],
        currentModule: null,
        isAuthenticated: true,
      },
      version: 0,
    };

    localStorageMock[AUTH_STORAGE_KEY] = JSON.stringify(persistedState);

    await act(async () => {
      await useAuthStore.persist.rehydrate();
    });

    await waitFor(() => {
      expect(mockSetAuthToken).toHaveBeenCalledWith('rehydration-token');
    });
  });

  it('clears persisted state on logout', async () => {
    const { authService } = require('@/services/auth.service');
    authService.login.mockResolvedValue({
      accessToken: 'login-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: mockUser,
    });
    authService.getSession.mockRejectedValue(new Error('skip'));
    authService.logout.mockResolvedValue(undefined);

    await act(async () => {
      useAuthStore.getState().setTenant('tenant-1', mockBranding, [mockAgency]);
    });
    await act(async () => {
      await useAuthStore.getState().login({
        tenantId: 'tenant-1',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const stored = localStorageMock[AUTH_STORAGE_KEY];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.isAuthenticated).toBe(false);
    expect(parsed.state.user).toBeNull();
    expect(parsed.state.accessToken).toBeNull();
  });

  describe('agency white labeling – branding persistence', () => {
    const fullWhiteLabelBranding = {
      companyName: 'White Label Agency',
      logoUrl: 'https://agency.example.com/logo.png',
      iconUrl: 'https://agency.example.com/favicon.ico',
      loginBannerUrl: 'https://agency.example.com/banner.png',
      primaryColor: '#1a1a1a',
      secondaryColor: '#f5f5f5',
      accentColor: '#00aaff',
      backgroundColor: '#ffffff',
      portalTitle: 'Agency Portal',
    };

    it('setTenant with full branding persists branding to localStorage', async () => {
      await act(async () => {
        useAuthStore.getState().setTenant('tenant-1', fullWhiteLabelBranding, [mockAgency]);
      });

      const stored = localStorageMock[AUTH_STORAGE_KEY];
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.branding).toEqual(fullWhiteLabelBranding);
      expect(parsed.state.tenantId).toBe('tenant-1');
      expect(parsed.state.agencies).toEqual([mockAgency]);
    });

    it('rehydration restores branding and selectBranding returns it', async () => {
      const persistedState = {
        state: {
          user: null,
          accessToken: null,
          tenantId: 'tenant-1',
          agencyId: null,
          branding: fullWhiteLabelBranding,
          agencies: [mockAgency],
          currentModule: null,
          isAuthenticated: false,
        },
        version: 0,
      };

      localStorageMock[AUTH_STORAGE_KEY] = JSON.stringify(persistedState);

      await act(async () => {
        await useAuthStore.persist.rehydrate();
      });

      await waitFor(() => {
        const branding = selectBranding(useAuthStore.getState());
        expect(branding).toEqual(fullWhiteLabelBranding);
        const tenantSelection = selectTenant(useAuthStore.getState());
        expect(tenantSelection.branding).toEqual(fullWhiteLabelBranding);
        expect(tenantSelection.tenantId).toBe('tenant-1');
        expect(tenantSelection.agencies).toEqual([mockAgency]);
      });
    });

    it('setTenant with branding clears error state', async () => {
      useAuthStore.getState().setError({ message: 'Previous error', statusCode: 500 });

      await act(async () => {
        useAuthStore.getState().setTenant('tenant-1', fullWhiteLabelBranding, [mockAgency]);
      });

      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().branding).toEqual(fullWhiteLabelBranding);
    });
  });
});
