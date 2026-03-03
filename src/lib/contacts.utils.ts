/**
 * contacts.utils.ts
 * Shared pure utility functions for the Contacts domain.
 * Used by ContactDetails, ContactsWorkspace, and any future contact consumers.
 * Zero React dependencies — fully unit-testable.
 */

import type { Contact } from "@/types/schema";

// ─── Tag Utilities ────────────────────────────────────────────────────────────

/**
 * Normalises the `tags` field which can arrive from the API as:
 *  - a string[]     → returned as-is
 *  - a JSON string  → parsed and returned
 *  - a CSV string   → split on commas and trimmed
 *  - null/undefined → empty array
 */
export function getTagArray(
  tags: string | string[] | undefined | null,
): string[] {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string" && tags.trim() !== "") {
    try {
      const parsed = JSON.parse(tags) as unknown;
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      // Not JSON — fall through to CSV split
    }
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Serialises a tag array back into the comma-separated string the API expects.
 */
export function tagsToApi(tags: string[]): string {
  return tags.join(",").trim();
}

// ─── Preferences Utilities ────────────────────────────────────────────────────

/**
 * Safely parse the `preferences` field which can arrive as a JSON string or object.
 */
export function parsePreferences(
  preferences: Contact["preferences"],
): Record<string, unknown> {
  if (!preferences) return {};
  if (typeof preferences === "string") {
    try {
      return JSON.parse(preferences) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof preferences === "object") {
    return preferences as Record<string, unknown>;
  }
  return {};
}

/**
 * Merges partial updates into the current preferences object and serialises
 * the result back into the JSON string the API expects.
 */
export function mergePreferences(
  currentPreferences: Contact["preferences"],
  updates: Record<string, unknown>,
): string {
  const current = parsePreferences(currentPreferences);
  return JSON.stringify({ ...current, ...updates });
}

// ─── Follow-up Utilities ──────────────────────────────────────────────────────

export type FollowUpStatus = "overdue" | "due" | "upcoming" | null;

/**
 * Resolves the next-follow-up date from either the top-level `nextFollowUp`
 * field or from inside the serialised `preferences` blob.
 */
export function resolveNextFollowUp(
  contact: Contact | null | undefined,
): string | undefined {
  if (!contact) return undefined;
  const legacy = contact as Contact & { nextFollowUp?: string };
  if (legacy.nextFollowUp) return legacy.nextFollowUp;
  const prefs = parsePreferences(contact.preferences);
  return typeof prefs["nextFollowUp"] === "string"
    ? prefs["nextFollowUp"]
    : undefined;
}

/**
 * Resolves the last-contact date from either the top-level field or preferences.
 */
export function resolveLastContactDate(
  contact: Contact | null | undefined,
): string | undefined {
  if (!contact) return undefined;
  if (contact.lastContactDate) return contact.lastContactDate;
  const prefs = parsePreferences(contact.preferences);
  return typeof prefs["lastContactDate"] === "string"
    ? prefs["lastContactDate"]
    : undefined;
}

/**
 * Calculates a human-readable follow-up status relative to today.
 */
export function getFollowUpStatus(
  nextFollowUpIso: string | undefined,
): FollowUpStatus {
  if (!nextFollowUpIso) return null;
  const followUpDate = new Date(nextFollowUpIso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  followUpDate.setHours(0, 0, 0, 0);
  if (followUpDate < today) return "overdue";
  if (followUpDate.getTime() === today.getTime()) return "due";
  return "upcoming";
}

// ─── Status Utilities ─────────────────────────────────────────────────────────

import { ContactStatus } from "@/types/schema";

export type ContactStatusKey = "active" | "inactive" | "archived";

/** Maps a plain string key to the ContactStatus enum value. */
export function statusKeyToEnum(key: ContactStatusKey): ContactStatus {
  const map: Record<ContactStatusKey, ContactStatus> = {
    active: ContactStatus.ACTIVE,
    inactive: ContactStatus.INACTIVE,
    archived: ContactStatus.ARCHIVED,
  };
  return map[key];
}
