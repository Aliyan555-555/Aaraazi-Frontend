/**
 * useContactTabUrl
 * URL-synced tab hook for detail pages (contacts, properties, etc.).
 *
 * Behaviour:
 *  - On mount: reads `?tab=` from the URL (survives hard reload / sharing links).
 *  - On tab change: calls `router.push()` so each tab click gets a history entry
 *    and the browser Back button steps through tabs naturally.
 *  - On back/forward: `searchParams` changes trigger a state sync via useEffect.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export interface UseContactTabUrlReturn {
  /** The currently active tab id. */
  activeTab: string;
  /** Call this instead of setActiveTab — updates both state and URL. */
  handleTabChange: (tabId: string) => void;
}

/**
 * @param defaultTab - The fallback tab id when `?tab=` is absent. Defaults to `'overview'`.
 */
export function useContactTabUrl(
  defaultTab = "overview",
): UseContactTabUrlReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Lazily initialise from URL so the correct tab is selected immediately
  // without a render cycle (avoids flash of wrong tab on load).
  const [activeTab, setActiveTab] = useState<string>(
    () => searchParams?.get("tab") ?? defaultTab,
  );

  // Sync from URL changes (browser back / forward, or external navigation).
  useEffect(() => {
    const tabParam = searchParams?.get("tab") ?? defaultTab;
    setActiveTab(tabParam);
  }, [searchParams, defaultTab]);

  const handleTabChange = (tabId: string): void => {
    // Preserve any other existing query params (e.g. ?search=, ?page=).
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", tabId);
    // push() keeps history; replace() would not.
    router.push(`${pathname}?${params.toString()}`);
  };

  return { activeTab, handleTabChange };
}
