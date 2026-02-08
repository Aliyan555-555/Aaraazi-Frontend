/**
 * Timeline Visualization Component
 * Visual representation of deal progress through stages
 */

import React from 'react';
import { Deal, DealStage } from '../../types/deals';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface TimelineVisualizationProps {
  deal: Deal;
}

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({ deal }) => {
  const stages: Array<{
    key: keyof Deal['lifecycle']['timeline']['stages'];
    stage: DealStage;
    label: string;
    icon: React.ReactNode;
  }> = [
      {
        key: 'offerAccepted',
        stage: 'offer-accepted',
        label: 'Offer Accepted',
        icon: <CheckCircle2 className="h-5 w-5" />
      },
      {
        key: 'agreementSigning',
        stage: 'agreement-signing',
        label: 'Agreement Signing',
        icon: <CheckCircle2 className="h-5 w-5" />
      },
      {
        key: 'documentation',
        stage: 'documentation',
        label: 'Documentation',
        icon: <CheckCircle2 className="h-5 w-5" />
      },
      {
        key: 'paymentProcessing',
        stage: 'payment-processing',
        label: 'Payment Processing',
        icon: <CheckCircle2 className="h-5 w-5" />
      },
      {
        key: 'handoverPrep',
        stage: 'handover-prep',
        label: 'Handover Preparation',
        icon: <CheckCircle2 className="h-5 w-5" />
      },
      {
        key: 'transferRegistration',
        stage: 'transfer-registration',
        label: 'Transfer & Registration',
        icon: <CheckCircle2 className="h-5 w-5" />
      },
      {
        key: 'finalHandover',
        stage: 'final-handover',
        label: 'Final Handover',
        icon: <CheckCircle2 className="h-5 w-5" />
      },
    ];

  const getStageStatus = (key: keyof Deal['lifecycle']['timeline']['stages']) => {
    return deal.lifecycle.timeline.stages[key];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'not-started': return 'text-gray-400 bg-gray-100';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  const isCurrentStage = (stage: DealStage) => {
    return deal.lifecycle.stage === stage;
  };

  // Calculate overall completion
  const completedStages = stages.filter(s => getStageStatus(s.key).status === 'completed').length;
  const overallProgress = (completedStages / stages.length) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Deal Progress Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Completion</span>
            <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <div className="text-sm text-muted-foreground">Start Date</div>
              <div className="font-medium">
                {new Date(deal.lifecycle.timeline.offerAcceptedDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Expected Closing</div>
              <div className="font-medium">
                {new Date(deal.lifecycle.timeline.expectedClosingDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {deal.lifecycle.timeline.actualClosingDate && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">Actual Closing Date</div>
              <div className="font-medium text-green-600">
                {new Date(deal.lifecycle.timeline.actualClosingDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Stages */}
            <div className="space-y-6">
              {stages.map((stageInfo, index) => {
                const stageProgress = getStageStatus(stageInfo.key);
                const isCurrent = isCurrentStage(stageInfo.stage);
                const isCompleted = stageProgress.status === 'completed';
                const isInProgress = stageProgress.status === 'in-progress';
                const isNotStarted = stageProgress.status === 'not-started';

                return (
                  <div key={stageInfo.key} className="relative flex gap-4">
                    {/* Circle Indicator */}
                    <div className={`
                      relative z-10 flex items-center justify-center h-12 w-12 rounded-full border-4 border-background
                      ${getStatusColor(stageProgress.status)}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : isInProgress ? (
                        <Clock className="h-6 w-6 animate-pulse" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-6 ${isCurrent ? 'ring-2 ring-blue-500 rounded-lg p-4 bg-blue-50' : 'p-4'}`}>
                      {/* Stage Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{stageInfo.label}</h3>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Current Stage
                            </Badge>
                          )}
                        </div>
                        <Badge className={getStatusColor(stageProgress.status)}>
                          {stageProgress.status.replace('-', ' ')}
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      {(isInProgress || isCompleted) && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{stageProgress.completionPercentage}%</span>
                          </div>
                          <Progress value={stageProgress.completionPercentage} className="h-2" />
                        </div>
                      )}

                      {/* Tasks Info */}
                      {stageProgress.totalTasks > 0 && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Tasks: {stageProgress.tasksCompleted} / {stageProgress.totalTasks} completed
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {stageProgress.startedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Started: {new Date(stageProgress.startedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {stageProgress.completedAt && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Completed: {new Date(stageProgress.completedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      {stageProgress.startedAt && stageProgress.completedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Duration: {calculateDuration(stageProgress.startedAt, stageProgress.completedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">{completedStages}</div>
              <div className="text-sm text-muted-foreground mt-1">Stages Completed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">
                {stages.filter(s => getStageStatus(s.key).status === 'in-progress').length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">In Progress</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-600">
                {stages.filter(s => getStageStatus(s.key).status === 'not-started').length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Not Started</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper function to calculate duration
const calculateDuration = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  return `${Math.floor(diffDays / 30)} months`;
};
