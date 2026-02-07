/**
 * Dual Agent Header Component
 * Shows agent roles and permissions in a deal
 */

import React from 'react';
import { Deal } from '../../types';
import { getUserRoleInDeal, getRoleDisplayName } from '../../lib/dealPermissions';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Users, Shield, Eye, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface DualAgentHeaderProps {
  deal: Deal;
  currentUserId: string;
}

export const DualAgentHeader: React.FC<DualAgentHeaderProps> = ({ deal, currentUserId }) => {
  const userRole = getUserRoleInDeal(currentUserId, deal);
  const isPrimary = userRole === 'primary';
  const isSecondary = userRole === 'secondary';
  
  return (
    <Card className="p-4 bg-accent/50 border-accent">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Agent Roles */}
        <div className="flex items-center gap-4 flex-1">
          <Users className="h-5 w-5 text-primary" />
          
          <div className="space-y-2 flex-1">
            {/* Primary Agent */}
            <div className="flex items-center gap-2">
              <Badge variant={isPrimary ? "default" : "secondary"} className="gap-1">
                <Shield className="h-3 w-3" />
                Primary Agent
              </Badge>
              <span className="text-sm">{deal.agents.primary.name}</span>
              {isPrimary && (
                <Badge variant="outline" className="text-xs">
                  You - Full Control
                </Badge>
              )}
            </div>
            
            {/* Secondary Agent */}
            {deal.agents.secondary && (
              <div className="flex items-center gap-2">
                <Badge variant={isSecondary ? "default" : "secondary"} className="gap-1">
                  <Eye className="h-3 w-3" />
                  Secondary Agent
                </Badge>
                <span className="text-sm">{deal.agents.secondary.name}</span>
                {isSecondary && (
                  <Badge variant="outline" className="text-xs">
                    You - View Only
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Your Role & Sync Status */}
        <div className="flex items-center gap-3">
          {/* Sync Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md border">
                  <RefreshCw className={`h-3.5 w-3.5 ${deal.sync.isInSync ? 'text-green-600' : 'text-orange-600'}`} />
                  <span className="text-xs">
                    {deal.sync.isInSync ? 'Synced' : 'Syncing...'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p>Last synced: {new Date(deal.sync.lastSyncedAt).toLocaleString()}</p>
                  {deal.cycles.purchaseCycle && (
                    <p>Both agents see the same real-time data</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Your Role */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Your Role</div>
            <div className="text-sm font-medium">
              {isPrimary && 'Managing Deal'}
              {isSecondary && 'Tracking Only'}
              {!isPrimary && !isSecondary && 'No Access'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Permission Info */}
      {isSecondary && (
        <div className="mt-3 pt-3 border-t border-accent-foreground/10">
          <p className="text-xs text-muted-foreground">
            💡 You have view-only access. {deal.agents.primary.name} manages payments, documents, and stage progression. 
            All updates are synced to you in real-time.
          </p>
        </div>
      )}
      
      {isPrimary && deal.agents.secondary && (
        <div className="mt-3 pt-3 border-t border-accent-foreground/10">
          <p className="text-xs text-muted-foreground">
            💡 You have full control. {deal.agents.secondary.name} can view all updates but cannot make changes. 
            All your actions are automatically synced.
          </p>
        </div>
      )}
    </Card>
  );
};
