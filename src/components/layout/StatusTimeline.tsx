import React from 'react';
import { Check, Circle, Clock } from 'lucide-react';

export interface TimelineStage {
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
  description?: string;
}

export interface StatusTimelineProps {
  stages: TimelineStage[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * StatusTimeline - Visual timeline for status progression
 * 
 * Usage:
 * <StatusTimeline
 *   stages={[
 *     { label: 'Created', status: 'completed', date: 'Jan 15' },
 *     { label: 'In Progress', status: 'current', date: 'Jan 20' },
 *     { label: 'Completed', status: 'upcoming' }
 *   ]}
 *   orientation="horizontal"
 * />
 */
export function StatusTimeline({ 
  stages, 
  orientation = 'horizontal',
  className = ''
}: StatusTimelineProps) {
  const isHorizontal = orientation === 'horizontal';

  // Status colors
  const getStatusColor = (status: TimelineStage['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-blue-500 text-white border-blue-500';
      case 'upcoming':
        return 'bg-gray-200 text-gray-400 border-gray-300';
    }
  };

  const getLineColor = (status: TimelineStage['status']) => {
    return status === 'completed' ? 'bg-green-500' : 'bg-gray-200';
  };

  const getIcon = (status: TimelineStage['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-3 h-3" />;
      case 'current':
        return <Clock className="w-3 h-3" />;
      case 'upcoming':
        return <Circle className="w-3 h-3" />;
    }
  };

  if (isHorizontal) {
    return (
      <div className={`w-full ${className}`} role="progressbar" aria-label="Status timeline">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => (
            <React.Fragment key={index}>
              {/* Stage */}
              <div className="flex flex-col items-center flex-1">
                {/* Icon */}
                <div 
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2
                    ${getStatusColor(stage.status)}
                  `}
                  aria-label={`${stage.label}: ${stage.status}`}
                >
                  {getIcon(stage.status)}
                </div>
                
                {/* Label */}
                <div className="text-center">
                  <div className={`text-sm ${
                    stage.status === 'upcoming' ? 'text-gray-400' : 'text-[#030213]'
                  }`}>
                    {stage.label}
                  </div>
                  {stage.date && (
                    <div className="text-xs text-gray-500 mt-1">{stage.date}</div>
                  )}
                  {stage.description && (
                    <div className="text-xs text-gray-400 mt-1">{stage.description}</div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div 
                  className={`h-0.5 flex-1 mx-2 ${getLineColor(stage.status)}`}
                  style={{ marginTop: '-2rem' }}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={`${className}`} role="progressbar" aria-label="Status timeline">
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-start gap-3">
            {/* Icon Column */}
            <div className="flex flex-col items-center">
              <div 
                className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${getStatusColor(stage.status)}
                `}
                aria-label={`${stage.label}: ${stage.status}`}
              >
                {getIcon(stage.status)}
              </div>
              
              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div 
                  className={`w-0.5 h-12 mt-2 ${getLineColor(stage.status)}`}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Content Column */}
            <div className="flex-1 pt-1">
              <div className={`${
                stage.status === 'upcoming' ? 'text-gray-400' : 'text-[#030213]'
              }`}>
                {stage.label}
              </div>
              {stage.date && (
                <div className="text-xs text-gray-500 mt-1">{stage.date}</div>
              )}
              {stage.description && (
                <div className="text-sm text-gray-600 mt-1">{stage.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
