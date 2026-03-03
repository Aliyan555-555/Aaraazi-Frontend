/**
 * Deal Timeline Service
 * Builds timeline events from deal data for Activity tab display.
 * Supports future API-based timeline when backend exposes /deals/:id/timeline
 */

import type { Deal } from '@/types/deals';
import { formatPKR } from '@/lib/currency';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  sortOrder: number; // Tiebreaker when dates are equal
  type: 'property-added' | 'property-listed' | 'offer-accepted' | 'deal-created' | 'stage' | 'payment' | 'document' | 'note' | 'deal-closed';
}

function formatPropertyDisplay(deal: Deal): string {
  const prop = deal?.property;
  if (!prop) return 'Property';
  if (prop.title) return prop.title;
  if (typeof prop.address === 'string') return prop.address;
  if (prop.address && typeof prop.address === 'object') {
    const addr = prop.address as Record<string, unknown>;
    const parts: string[] = [];
    if (addr.plotNumber) parts.push(`Plot ${addr.plotNumber}`);
    if (addr.block) parts.push(`Block ${addr.block}`);
    if (addr.areaName) parts.push(String(addr.areaName));
    if (addr.cityName) parts.push(String(addr.cityName));
    if (addr.fullAddress) parts.push(String(addr.fullAddress));
    return parts.length > 0 ? parts.join(', ') : 'Property';
  }
  return 'Property';
}

/**
 * Build timeline events from deal for display in Activity tab.
 * Events match the expected flow: Property Added → Property Listed → Offer Accepted → Deal Created → Stages → Payments → etc.
 * Sorted chronologically (oldest first), with sortOrder for tiebreaking.
 */
export function buildDealTimeline(deal: Deal | null): TimelineEvent[] {
  if (!deal) return [];

  const events: TimelineEvent[] = [];
  const agreedPrice = deal.financial?.agreedPrice ?? 0;
  const buyerName = deal.parties?.buyer?.name ?? 'Buyer';
  const propertyDisplay = formatPropertyDisplay(deal);
  const tl = deal.lifecycle?.timeline;
  const metadata = deal.metadata;

  const createdAt = metadata?.createdAt ?? tl?.offerAcceptedDate;
  const offerAcceptedDate = tl?.offerAcceptedDate ?? createdAt;

  // 1. Property Added (earliest)
  if (createdAt) {
    events.push({
      id: 'property-added',
      date: createdAt,
      title: 'Property Added',
      description: `Property "${propertyDisplay}" added to system`,
      sortOrder: 1,
      type: 'property-added',
    });
  }

  // 2. Property Listed
  if (createdAt) {
    events.push({
      id: 'property-listed',
      date: createdAt,
      title: 'Property Listed',
      description: `Listed for sale at ${formatPKR(agreedPrice)}`,
      sortOrder: 2,
      type: 'property-listed',
    });
  }

  // 3. Offer Accepted
  if (offerAcceptedDate) {
    events.push({
      id: 'offer-accepted',
      date: offerAcceptedDate,
      title: 'Offer Accepted',
      description: `${buyerName} offered ${formatPKR(agreedPrice)}`,
      sortOrder: 3,
      type: 'offer-accepted',
    });
  }

  // 4. Deal Created
  const dealCreatedDate = metadata?.updatedAt ?? metadata?.createdAt ?? offerAcceptedDate;
  if (dealCreatedDate) {
    events.push({
      id: 'deal-created',
      date: dealCreatedDate,
      title: 'Deal Created',
      description: `Deal ${deal.dealNumber} created for ${formatPKR(agreedPrice)}`,
      sortOrder: 4,
      type: 'deal-created',
    });
  }

  // 5. Completed stages
  const stages = deal.lifecycle?.timeline?.stages;
  if (stages) {
    const stageLabels: Record<string, string> = {
      agreementSigning: 'Agreement Signing',
      documentation: 'Documentation',
      paymentProcessing: 'Payment Processing',
      handoverPrep: 'Handover Preparation',
      transferRegistration: 'Transfer Registration',
      finalHandover: 'Final Handover',
      offerAccepted: 'Offer Accepted',
    };
    let stageOrder = 10;
    for (const [key, stage] of Object.entries(stages)) {
      const prog = stage as { completedAt?: string };
      if (prog?.completedAt) {
        const label = stageLabels[key] ?? key.replace(/([A-Z])/g, ' $1').trim();
        events.push({
          id: `stage-${key}`,
          date: prog.completedAt,
          title: `${label} Completed`,
          description: `${label} stage completed`,
          sortOrder: stageOrder++,
          type: 'stage',
        });
      }
    }
  }

  // 6. Payment recorded events (from financial.payments)
  const payments = deal.financial?.payments ?? [];
  payments
    .filter((p) => p.paidDate)
    .forEach((p, i) => {
      events.push({
        id: `payment-${p.id}`,
        date: p.paidDate!,
        title: 'Payment Recorded',
        description: `${formatPKR(p.amount)} received`,
        sortOrder: 20 + i,
        type: 'payment',
      });
    });

  // 7. Document uploads
  const documents = deal.documents ?? [];
  documents.forEach((d, i) => {
    const uploadedAt = (d as { uploadedAt?: string }).uploadedAt;
    if (uploadedAt) {
      events.push({
        id: `doc-${d.id}`,
        date: uploadedAt,
        title: 'Document Added',
        description: d.name,
        sortOrder: 30 + i,
        type: 'document',
      });
    }
  });

  // 8. Notes (most recent first in timeline order)
  const notes = [
    ...(deal.collaboration?.primaryAgentNotes ?? []),
    ...(deal.collaboration?.sharedNotes ?? []),
  ];
  notes.forEach((n, i) => {
    const createdAtNote = (n as { createdAt?: string }).createdAt;
    if (createdAtNote) {
      events.push({
        id: `note-${(n as { id?: string }).id ?? i}`,
        date: createdAtNote,
        title: 'Note Added',
        description: ((n as { content?: string }).content ?? '').slice(0, 80) + (((n as { content?: string }).content?.length ?? 0) > 80 ? '...' : ''),
        sortOrder: 40 + i,
        type: 'note',
      });
    }
  });

  // 9. Deal closed
  if (tl?.actualClosingDate) {
    events.push({
      id: 'deal-closed',
      date: tl.actualClosingDate,
      title: 'Deal Closed',
      description: 'Deal completed and closed',
      sortOrder: 100,
      type: 'deal-closed',
    });
  }

  // Sort by date ascending, then by sortOrder
  events.sort((a, b) => {
    const tA = new Date(a.date).getTime();
    const tB = new Date(b.date).getTime();
    if (tA !== tB) return tA - tB;
    return a.sortOrder - b.sortOrder;
  });

  // Deduplicate by id
  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}
