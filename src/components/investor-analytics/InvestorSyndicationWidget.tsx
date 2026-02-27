/**
 * Investor Syndication Widget
 * Dashboard widget showing key investor syndication metrics
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { User } from '../../types';
// [STUBBED] import { getProperties } from '../../lib/data';
// [STUBBED] import { getAllInvestorInvestments, getInvestors } from '../../lib/investors';
// [STUBBED] import { getAllInvestorDistributions } from '../../lib/saleDistribution';
import { formatPKR } from '../../lib/currency';
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  ArrowRight,
  Activity,
  FileText,
} from 'lucide-react';

// ===== STUBS for removed prototype functions =====
const getProperties = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getAllInvestorInvestments = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getInvestors = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getAllInvestorDistributions = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface InvestorSyndicationWidgetProps {
  user: User;
  onViewDetails?: () => void;
}

export function InvestorSyndicationWidget({ user, onViewDetails }: InvestorSyndicationWidgetProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    const allProperties = getProperties();
    const investorProperties = allProperties.filter(
      (p) => p.currentOwnerType === 'investor' && p.investorShares && p.investorShares.length > 0
    );

    const allInvestments = getAllInvestorInvestments();
    const activeInvestments = allInvestments.filter((inv) => inv.status === 'active');

    const allDistributions = getAllInvestorDistributions();
    const pendingDistributions = allDistributions.filter((d) => d.status === 'pending');

    const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const totalUnrealizedProfit = activeInvestments.reduce(
      (sum, inv) => sum + (inv.unrealizedProfit || 0),
      0
    );
    const pendingAmount = pendingDistributions.reduce((sum, d) => sum + d.amount, 0);

    const uniqueInvestors = new Set(allInvestments.map((inv) => inv.investorId));

    return {
      investorProperties: investorProperties.length,
      activeInvestments: activeInvestments.length,
      totalInvested,
      totalUnrealizedProfit,
      currentValue: totalInvested + totalUnrealizedProfit,
      pendingDistributions: pendingDistributions.length,
      pendingAmount,
      uniqueInvestors: uniqueInvestors.size,
    };
  }, []);

  if (metrics.investorProperties === 0 && metrics.activeInvestments === 0) {
    return null; // Don't show widget if no investor activity
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Investor Syndication
            </CardTitle>
            <CardDescription>Multi-investor property portfolio</CardDescription>
          </div>
          {onViewDetails && (
            <Button variant="ghost" size="sm" onClick={onViewDetails}>
              View Details
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Properties</p>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-blue-700">{metrics.investorProperties}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.activeInvestments} active positions
            </p>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Investors</p>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-purple-700">{metrics.uniqueInvestors}</p>
            <p className="text-xs text-muted-foreground mt-1">Active investors</p>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Portfolio Value</p>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{formatPKR(metrics.currentValue)}</p>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-muted-foreground">Invested: {formatPKR(metrics.totalInvested)}</span>
            <Badge
              variant={metrics.totalUnrealizedProfit >= 0 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {metrics.totalUnrealizedProfit >= 0 ? '+' : ''}
              {formatPKR(metrics.totalUnrealizedProfit)}
            </Badge>
          </div>
        </div>

        {/* Pending Distributions */}
        {metrics.pendingDistributions > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-900">Pending Distributions</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {metrics.pendingDistributions}
              </Badge>
            </div>
            <p className="text-xl font-bold text-yellow-700">{formatPKR(metrics.pendingAmount)}</p>
            <p className="text-xs text-yellow-800 mt-1">Awaiting payment processing</p>
          </div>
        )}

        {/* Quick Actions */}
        {onViewDetails && (
          <Button variant="outline" className="w-full" onClick={onViewDetails}>
            <Activity className="w-4 h-4 mr-2" />
            View Full Analytics
          </Button>
        )}
      </CardContent>
    </Card>
  );
}