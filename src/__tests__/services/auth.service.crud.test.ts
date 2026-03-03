/**
 * Authentication Service - CRUD & Core Operations Test Suite
 * Professional-grade Jest tests for auth module
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

describe('Auth Service - CRUD & Core Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Create - Register', () => {
    const validRegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      tenantId: 'tenant-1',
      agencyId: 'agency-1',
    };

    const mockLoginResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
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

    it('should register user and return LoginResponse', async () => {
      mockPost.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.register(validRegisterDto);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith('/auth/register', validRegisterDto);
      expect(result).toEqual(mockLoginResponse);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw when registration API fails', async () => {
      mockPost.mockRejectedValue(new Error('Registration failed'));

      await expect(authService.register(validRegisterDto)).rejects.toThrow(
        'Registration failed'
      );
      expect(mockPost).toHaveBeenCalledWith('/auth/register', validRegisterDto);
    });
  });

  describe('Create - Login', () => {
    const validLoginDto = {
      tenantId: 'tenant-1',
      agencyId: 'agency-1',
      email: 'user@example.com',
      password: 'secret123',
    };

    const mockLoginResponse = {
      accessToken: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: {
        id: 'user-2',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'agent',
        status: 'active',
        agencyId: 'agency-1',
        tenantId: 'tenant-1',
        permissions: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    it('should login with credentials and return LoginResponse', async () => {
      mockPost.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login(validLoginDto);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith('/auth/login', validLoginDto);
      expect(result).toEqual(mockLoginResponse);
      expect(result.accessToken).toBe('jwt-access-token');
      expect(result.user.email).toBe('user@example.com');
    });

    it('should throw when login API fails (invalid credentials)', async () => {
      mockPost.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login(validLoginDto)).rejects.toThrow(
        'Invalid credentials'
      );
      expect(mockPost).toHaveBeenCalledWith('/auth/login', validLoginDto);
    });
  });

  describe('Read - Get Session', () => {
    const mockSessionResponse = {
      session: {
        id: 'session-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        agencyId: 'agency-1',
        sessionToken: 'session-token',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest',
        loginAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        isActive: true,
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
        tenant: { id: 'tenant-1', name: 'Tenant', domain: 'test.com', branding: {}, agencies: [] },
        agency: { id: 'agency-1', name: 'Agency', code: 'AG1', type: 'AGENCY', tenantId: 'tenant-1' },
      },
    };

    it('should fetch current session successfully', async () => {
      mockGet.mockResolvedValue({ data: mockSessionResponse });

      const result = await authService.getSession();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockSessionResponse);
      expect(result.session.user.email).toBe('test@example.com');
      expect(result.session.isActive).toBe(true);
    });

    it('should throw when get session API fails', async () => {
      mockGet.mockRejectedValue(new Error('Unauthorized'));

      await expect(authService.getSession()).rejects.toThrow('Unauthorized');
      expect(mockGet).toHaveBeenCalledWith('/auth/me');
    });
  });

  describe('Read - Validate Session', () => {
    it('should return true when token is valid', async () => {
      mockGet.mockResolvedValue({ status: 200 });

      const result = await authService.validateSession('valid-token');

      expect(mockGet).toHaveBeenCalledWith('/auth/me', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      expect(result).toBe(true);
    });

    it('should return false when token is invalid', async () => {
      mockGet.mockRejectedValue(new Error('Invalid token'));

      const result = await authService.validateSession('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('Delete - Logout', () => {
    it('should call logout endpoint successfully', async () => {
      mockPost.mockResolvedValue({ data: {} });

      await authService.logout();

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    });

    it('should not throw when logout API fails (clears local state anyway)', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(authService.logout()).resolves.not.toThrow();
      expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('Update - Refresh Session', () => {
    const mockSessionResponse = {
      session: {
        id: 'session-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        agencyId: 'agency-1',
        sessionToken: 'new-session-token',
        isActive: true,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          status: 'active',
        },
        tenant: {},
        agency: {},
      },
    };

    it('should refresh session via GET /auth/me', async () => {
      mockGet.mockResolvedValue({ data: mockSessionResponse });

      const result = await authService.refreshSession();

      expect(mockGet).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockSessionResponse);
    });

    it('should throw when refresh session API fails', async () => {
      mockGet.mockRejectedValue(new Error('Session expired'));

      await expect(authService.refreshSession()).rejects.toThrow('Session expired');
    });
  });
});
