/**
 * Transaction Timeline - Phase 2
 * 
 * Visual timeline showing all events across all connected entities
 * Unified view of the complete transaction journey
 */

import React from 'react';
import { 
  Circle, 
  CheckCircle2, 
  Home, 
  Building2, 
  ShoppingCart, 
  FileText, 
  Search,
  TrendingUp,
  Handshake,
  FileCheck,
  DollarSign,
  Calendar
} from 'lucide-react';
import { TransactionTimeline as TimelineEvent } from '../../lib/transaction-graph';

interface TransactionTimelineProps {
  timeline: TimelineEvent[];
  onNavigate?: (entityType: string, entityId: string) => void;
}

export function TransactionTimeline({ timeline, onNavigate }: TransactionTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Calendar className="size-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No timeline events yet</p>
      </div>
    );
  }

  const getEventIcon = (event: string, entityType: string) => {
    // Entity-based icons
    if (entityType === 'property') return Home;
    if (entityType === 'sellCycle') return Building2;
    if (entityType === 'purchaseCycle') return ShoppingCart;
    if (entityType === 'deal') return FileText;
    if (entityType === 'buyerRequirement') return Search;

    // Event-based icons
    if (event.toLowerCase().includes('created')) return Circle;
    if (event.toLowerCase().includes('completed')) return CheckCircle2;
    if (event.toLowerCase().includes('accepted')) return Handshake;
    if (event.toLowerCase().includes('offer')) return TrendingUp;
    if (event.toLowerCase().includes('payment')) return DollarSign;
    if (event.toLowerCase().includes('document')) return FileCheck;
    
    return Circle;
  };

  const getEventColor = (event: string, entityType: string) => {
    if (event.toLowerCase().includes('completed')) return 'text-green-600 bg-green-50 border-green-200';
    if (event.toLowerCase().includes('cancelled')) return 'text-red-600 bg-red-50 border-red-200';
    if (event.toLowerCase().includes('accepted')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (event.toLowerCase().includes('offer')) return 'text-purple-600 bg-purple-50 border-purple-200';
    
    // Entity-based colors
    if (entityType === 'deal') return 'text-purple-600 bg-purple-50 border-purple-200';
    if (entityType === 'sellCycle') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (entityType === 'purchaseCycle') return 'text-green-600 bg-green-50 border-green-200';
    if (entityType === 'property') return 'text-gray-600 bg-gray-50 border-gray-200';
    if (entityType === 'buyerRequirement') return 'text-orange-600 bg-orange-50 border-orange-200';
    
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      'property': 'Property',
      'sellCycle': 'Sell Cycle',
      'purchaseCycle': 'Purchase Cycle',
      'deal': 'Deal',
      'buyerRequirement': 'Buyer Requirement',
    };
    return labels[entityType] || entityType;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="flex items-center gap-2 text-[#030213]">
          <Calendar className="size-5" />
          Transaction Timeline
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Complete journey across all connected entities ({timeline.length} events)
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {timeline.map((event, index) => {
            const Icon = getEventIcon(event.event, event.entityType);
            const colorClass = getEventColor(event.event, event.entityType);
            const { date, time } = formatDate(event.date);
            const isLast = index === timeline.length - 1;

            return (
              <div key={`${event.entityId}-${index}`} className="relative">
                {/* Timeline Line */}
                {!isLast && (
                  <div className="absolute left-[23px] top-12 bottom-0 w-0.5 bg-gray-200" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`size-12 rounded-lg border-2 ${colorClass} flex items-center justify-center flex-shrink-0 relative z-10`}>
                    <Icon className="size-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h4 className="text-[#030213] flex items-center gap-2">
                          {event.event}
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {getEntityLabel(event.entityType)}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm text-[#030213]">{date}</div>
                        <div className="text-xs text-gray-500">{time}</div>
                      </div>
                    </div>

                    {/* Navigate button */}
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate(event.entityType, event.entityId)}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View {getEntityLabel(event.entityType)} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="border-t border-gray-200 px-6 py-3 bg-[#fafafa]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Started: <span className="text-[#030213]">{formatDate(timeline[0].date).date}</span>
          </span>
          <span className="text-gray-600">
            Latest: <span className="text-[#030213]">{formatDate(timeline[timeline.length - 1].date).date}</span>
          </span>
          <span className="text-gray-600">
            Duration: <span className="text-[#030213]">
              {Math.ceil((new Date(timeline[timeline.length - 1].date).getTime() - new Date(timeline[0].date).getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
