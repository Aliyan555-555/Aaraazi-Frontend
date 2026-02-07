'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

const DEFAULT_THEME = {
    primary: '#A85D42',
    secondary: '#C17052',
    accent: '#E8E2D5',
    background: '#ffffff',
    foreground: '#171717',
};

function applyDefaultTheme() {
    const root = document.documentElement.style;
    root.setProperty('--primary', DEFAULT_THEME.primary);
    root.setProperty('--secondary', DEFAULT_THEME.secondary);
    root.setProperty('--accent', DEFAULT_THEME.accent);
    root.setProperty('--background', DEFAULT_THEME.background);
    root.setProperty('--foreground', DEFAULT_THEME.foreground);
    document.title = 'Aaraazi';
}

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const branding = useAuthStore((state) => state.branding);

    // Apply white labeling only after user has submitted agency code (we're past /auth/agency-code).
    // On agency-code page always use default theme to avoid flash and enforce correct flow.
    const isAgencyCodePage = pathname === '/auth/agency-code';
    const shouldApplyBranding = !isAgencyCodePage && branding;

    useEffect(() => {
        if (!shouldApplyBranding) {
            applyDefaultTheme();
            return;
        }

        if (branding!.primaryColor) {
            document.documentElement.style.setProperty('--primary', branding!.primaryColor);
        }
        if (branding!.secondaryColor) {
            document.documentElement.style.setProperty('--secondary', branding!.secondaryColor.trim());
        }
        if (branding!.accentColor) {
            document.documentElement.style.setProperty('--accent', branding!.accentColor.trim());
        }
        if (branding!.backgroundColor) {
            document.documentElement.style.setProperty('--background', branding!.backgroundColor.trim());
        }
        if (branding!.portalTitle) {
            document.title = branding!.portalTitle;
        }
        if (branding!.iconUrl) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = branding!.iconUrl;
        }
    }, [shouldApplyBranding, branding]);

    return <>{children}</>;
}
