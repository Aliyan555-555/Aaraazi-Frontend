'use client';

import { useMemo } from 'react';
import type { Deal } from '@/types/deals';
import type { Activity } from '@/components/layout';
import { buildDealTimeline } from '@/services/dealTimeline.service';
import { FileText } from 'lucide-react';


function timelineEventsToActivities(events: ReturnType<typeof buildDealTimeline>): Activity[] {
  return events.map((e, idx) => ({
    id: e.id || `timeline-${idx}`,
    type: 'activity',
    title: e.title,
    description: e.description,
    date: e.date,
    icon: <FileText className="h-5 w-5 text-blue-600" />,
  }));
}


export function useDealTimeline(deal: Deal | null): Activity[] {
  return useMemo(() => {
    const events = buildDealTimeline(deal);
    return timelineEventsToActivities(events);
  }, [deal]);
}
