/**
 * AuthProvider Session Persistence Tests
 * Verifies session initialization and validateSession invocation on mount
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/components/auth/AuthProvider';

jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: {
    persist: { hasHydrated: jest.fn(() => false), onFinishHydration: jest.fn() },
    setState: jest.fn(),
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
  useSessionRefresh: jest.fn(() => {}),
}));

const mockUseAuth = require('@/hooks/useAuth').useAuth;

describe('AuthProvider - Session Persistence', () => {
  const mockValidateSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateSession.mockResolvedValue(true);
    mockUseAuth.mockReturnValue({
      isInitialized: false,
      validateSession: mockValidateSession,
    });
  });

  it('renders children', () => {
    const { getByText } = render(
      <AuthProvider>
        <div>Child content</div>
      </AuthProvider>
    );
    expect(getByText('Child content')).toBeInTheDocument();
  });

  it('does not call validateSession when isInitialized is false', () => {
    mockUseAuth.mockReturnValue({
      isInitialized: false,
      validateSession: mockValidateSession,
    });

    render(
      <AuthProvider>
        <div>Child</div>
      </AuthProvider>
    );

    expect(mockValidateSession).not.toHaveBeenCalled();
  });

  it('calls validateSession when isInitialized becomes true', async () => {
    mockUseAuth.mockReturnValue({
      isInitialized: true,
      validateSession: mockValidateSession,
    });

    render(
      <AuthProvider>
        <div>Child</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockValidateSession).toHaveBeenCalledTimes(1);
    });
  });

  it('handles validateSession rejection gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockValidateSession.mockRejectedValue(new Error('Session invalid'));
    mockUseAuth.mockReturnValue({
      isInitialized: true,
      validateSession: mockValidateSession,
    });

    render(
      <AuthProvider>
        <div>Child</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockValidateSession).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Session validation failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('calls useSessionRefresh with 30 minute interval', () => {
    const useSessionRefresh = require('@/hooks/useAuth').useSessionRefresh;
    render(
      <AuthProvider>
        <div>Child</div>
      </AuthProvider>
    );
    expect(useSessionRefresh).toHaveBeenCalledWith(30);
  });
});
