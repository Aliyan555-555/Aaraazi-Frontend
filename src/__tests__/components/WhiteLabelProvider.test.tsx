/**
 * WhiteLabelProvider – agency white labeling unit tests
 * Verifies branding (theme, title, favicon) application and default theme on agency-code page
 */

import React from 'react';
import { render } from '@testing-library/react';
import { WhiteLabelProvider } from '@/components/WhiteLabelProvider';

const mockUsePathname = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: { branding: unknown }) => unknown) =>
    mockUseAuthStore(selector),
}));

describe('WhiteLabelProvider – agency white labeling', () => {
  const defaultTitle = 'Aaraazi';
  const defaultPrimary = '#A85D42';
  const defaultSecondary = '#C17052';
  const defaultAccent = '#E8E2D5';

  beforeEach(() => {
    jest.clearAllMocks();
    document.title = '';
    document.documentElement.style.cssText = '';
    // Remove any existing favicon
    const existingFavicon = document.querySelector("link[rel~='icon']");
    if (existingFavicon) existingFavicon.remove();

    mockUsePathname.mockReturnValue('/dashboard');
    mockUseAuthStore.mockImplementation((selector: (s: { branding: unknown }) => unknown) =>
      selector({ branding: null }),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children', () => {
    const { getByText } = render(
      <WhiteLabelProvider>
        <div>Child content</div>
      </WhiteLabelProvider>,
    );
    expect(getByText('Child content')).toBeInTheDocument();
  });

  it('applies default theme when on agency-code page even if branding is set', () => {
    mockUsePathname.mockReturnValue('/auth/agency-code');
    mockUseAuthStore.mockImplementation((selector: (s: { branding: unknown }) => unknown) =>
      selector({
        branding: {
          primaryColor: '#111',
          secondaryColor: '#222',
          portalTitle: 'Custom Portal',
        },
      }),
    );

    render(
      <WhiteLabelProvider>
        <div>Child</div>
      </WhiteLabelProvider>,
    );

    expect(document.title).toBe(defaultTitle);
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe(defaultPrimary);
    expect(document.documentElement.style.getPropertyValue('--secondary')).toBe(defaultSecondary);
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe(defaultAccent);
  });

  it('applies default theme when branding is null', () => {
    mockUseAuthStore.mockImplementation((selector: (s: { branding: unknown }) => unknown) =>
      selector({ branding: null }),
    );

    render(
      <WhiteLabelProvider>
        <div>Child</div>
      </WhiteLabelProvider>,
    );

    expect(document.title).toBe(defaultTitle);
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe(defaultPrimary);
    expect(document.documentElement.style.getPropertyValue('--secondary')).toBe(defaultSecondary);
  });

  it('applies agency branding (colors and portal title) when not on agency-code page', () => {
    const branding = {
      primaryColor: '#1a1a1a',
      secondaryColor: '#f5f5f5',
      accentColor: '#00aaff',
      portalTitle: 'Agency Portal',
    };
    mockUseAuthStore.mockImplementation((selector: (s: { branding: unknown }) => unknown) =>
      selector({ branding }),
    );

    render(
      <WhiteLabelProvider>
        <div>Child</div>
      </WhiteLabelProvider>,
    );

    expect(document.title).toBe('Agency Portal');
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#1a1a1a');
    expect(document.documentElement.style.getPropertyValue('--secondary')).toBe('#f5f5f5');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#00aaff');
  });

  it('applies backgroundColor from branding when provided', () => {
    const branding = {
      primaryColor: '#000',
      secondaryColor: '#fff',
      backgroundColor: '#f0f0f0',
    };
    mockUseAuthStore.mockImplementation((selector: (s: { branding: unknown }) => unknown) =>
      selector({ branding }),
    );

    render(
      <WhiteLabelProvider>
        <div>Child</div>
      </WhiteLabelProvider>,
    );

    expect(document.documentElement.style.getPropertyValue('--background')).toBe('#f0f0f0');
  });

  it('sets favicon from branding iconUrl when provided', () => {
    const branding = {
      primaryColor: '#000',
      secondaryColor: '#fff',
      iconUrl: 'https://agency.example.com/favicon.ico',
    };
    mockUseAuthStore.mockImplementation((selector: (s: { branding: unknown }) => unknown) =>
      selector({ branding }),
    );

    render(
      <WhiteLabelProvider>
        <div>Child</div>
      </WhiteLabelProvider>,
    );

    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    expect(link).toBeTruthy();
    expect(link.href).toBe('https://agency.example.com/favicon.ico');
  });

  it('calls useAuthStore with selector that returns branding', () => {
    const branding = { primaryColor: '#333', secondaryColor: '#ccc' };
    mockUseAuthStore.mockImplementation((selector: (s: { branding: unknown }) => unknown) =>
      selector({ branding }),
    );

    render(
      <WhiteLabelProvider>
        <div>Child</div>
      </WhiteLabelProvider>,
    );

    expect(mockUseAuthStore).toHaveBeenCalledWith(expect.any(Function));
    const selector = mockUseAuthStore.mock.calls[0][0];
    expect(selector({ branding })).toEqual(branding);
  });
});
