/**
 * Investor Portfolio Dashboard
 * Phase 2 Implementation - Individual investor's portfolio view
 */

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  Wallet,
  PieChart,
  Calendar,
  ExternalLink,
  Download,
  Filter,
  FileText
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { formatPKR } from '../lib/currency';
import { formatDate } from '../lib/validation';
import { formatPropertyAddress } from '../lib/utils';
import {
  getInvestorInvestments,
  calculateInvestorPortfolioValue,
  calculateInvestorROI,
  getInvestorPropertyDetails
} from '../lib/investors';
import { getProperties } from '../lib/data';
import { Investor, InvestorInvestment } from '../types';

interface InvestorPortfolioDashboardProps {
  investor: Investor;
  onBack: () => void;
  onNavigate: (view: string, data?: any) => void;
}

type StatusFilter = 'all' | 'active' | 'sold' | 'rented';

export default function InvestorPortfolioDashboard({
  investor,
  onBack,
  onNavigate
}: InvestorPortfolioDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Load investment data
  const investments = getInvestorInvestments(investor.id);
  const properties = getProperties();

  // Enrich investments with property details
  const enrichedInvestments = useMemo(() => {
    return investments.map(investment => {
      const property = properties.find(p => p.id === investment.propertyId);
      const details = property ? getInvestorPropertyDetails(investor.id, investment.propertyId) : null;

      return {
        ...investment,
        property,
        currentValue: details?.currentValue || 0,
        projectedROI: details?.projectedROI || 0,
        propertyStatus: property?.status || 'Unknown'
      };
    }).sort((a, b) => new Date(b.investmentDate).getTime() - new Date(a.investmentDate).getTime());
  }, [investments, properties, investor.id]);

  // Filter investments
  const filteredInvestments = useMemo(() => {
    if (statusFilter === 'all') return enrichedInvestments;

    return enrichedInvestments.filter(inv => {
      const status = inv.propertyStatus.toLowerCase();
      if (statusFilter === 'active') {
        return status.includes('available') || status.includes('listed') || status.includes('for sale');
      } else if (statusFilter === 'sold') {
        return status.includes('sold');
      } else if (statusFilter === 'rented') {
        return status.includes('rented');
      }
      return true;
    });
  }, [enrichedInvestments, statusFilter]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const portfolioValue = calculateInvestorPortfolioValue(investor.id);
    const roi = calculateInvestorROI(investor.id);
    const totalGain = portfolioValue - totalInvested;

    const propertyCount = investments.length;
    const activeProperties = enrichedInvestments.filter(inv => {
      const status = inv.propertyStatus.toLowerCase();
      return status.includes('available') || status.includes('listed') || status.includes('for sale');
    }).length;

    const avgSharePercentage = propertyCount > 0
      ? investments.reduce((sum, inv) => sum + inv.sharePercentage, 0) / propertyCount
      : 0;

    return {
      totalInvested,
      portfolioValue,
      totalGain,
      roi,
      propertyCount,
      activeProperties,
      avgSharePercentage
    };
  }, [investments, enrichedInvestments, investor.id]);

  const handlePropertyClick = (propertyId: string) => {
    onNavigate('property-details', { propertyId });
  };

  const handleExportPortfolio = () => {
    // TODO: Implement portfolio export to PDF/Excel
    console.log('Export portfolio for:', investor.name);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Investors
          </Button>
          <div>
            <h1 className="text-[var(--color-primary)]">{investor.name}</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Portfolio Overview & Investment Analysis
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExportPortfolio} className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Investor Info Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[var(--color-text-secondary)] mb-1">Contact Information</p>
            <div className="space-y-1">
              {investor.email && <p className="text-sm">{investor.email}</p>}
              {investor.phone && <p className="text-sm">{investor.phone}</p>}
              {investor.cnic && <p className="text-xs text-[var(--color-text-secondary)]">CNIC: {investor.cnic}</p>}
            </div>
          </div>

          {investor.address && (
            <div>
              <p className="text-[var(--color-text-secondary)] mb-1">Address</p>
              <p className="text-sm">{investor.address}</p>
              {investor.city && <p className="text-sm text-[var(--color-text-secondary)]">{investor.city}</p>}
            </div>
          )}

          <div>
            <p className="text-[var(--color-text-secondary)] mb-1">Member Since</p>
            <p className="text-sm">{formatDate(investor.createdAt)}</p>
          </div>

          {investor.notes && (
            <div>
              <p className="text-[var(--color-text-secondary)] mb-1">Notes</p>
              <p className="text-sm line-clamp-2">{investor.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text-secondary)]">Total Invested</p>
            <div className="p-2 rounded-lg bg-[var(--color-accent)]">
              <Wallet className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="text-xl">{formatPKR(portfolioMetrics.totalInvested)}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Across {portfolioMetrics.propertyCount} properties
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text-secondary)]">Portfolio Value</p>
            <div className="p-2 rounded-lg bg-[var(--color-accent)]">
              <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="text-xl">{formatPKR(portfolioMetrics.portfolioValue)}</p>
          <p className="text-xs text-green-600 mt-2">
            +{formatPKR(portfolioMetrics.totalGain)} gain
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text-secondary)]">ROI</p>
            <div className="p-2 rounded-lg bg-[var(--color-accent)]">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-xl text-green-600">{portfolioMetrics.roi.toFixed(2)}%</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Return on investment
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--color-text-secondary)]">Active Properties</p>
            <div className="p-2 rounded-lg bg-[var(--color-accent)]">
              <PieChart className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="text-xl">{portfolioMetrics.activeProperties}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Avg {portfolioMetrics.avgSharePercentage.toFixed(1)}% ownership
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--color-primary)]">Investment Portfolio</h3>
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Investment List */}
      {filteredInvestments.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" />
            <h3 className="mb-2">No Investments Found</h3>
            <p className="text-[var(--color-text-secondary)]">
              {statusFilter !== 'all'
                ? 'No properties match the selected filter'
                : 'This investor has not made any investments yet'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvestments.map(investment => (
            <InvestmentCard
              key={investment.id}
              investment={investment}
              onPropertyClick={handlePropertyClick}
            />
          ))}
        </div>
      )}

      {/* Investment Summary */}
      <Card className="p-6">
        <h3 className="text-[var(--color-primary)] mb-4">Investment Distribution</h3>
        <div className="space-y-4">
          {filteredInvestments.map(investment => {
            const shareOfTotal = portfolioMetrics.totalInvested > 0
              ? (investment.investmentAmount / portfolioMetrics.totalInvested) * 100
              : 0;

            // Format property address
            const propertyAddress = investment.property?.address
              ? (typeof investment.property.address === 'string'
                ? investment.property.address
                : formatPropertyAddress(investment.property.address))
              : 'Unknown Property';

            return (
              <div key={investment.id}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span>{propertyAddress}</span>
                    <Badge variant="secondary" className="text-xs">
                      {investment.sharePercentage}% share
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>{formatPKR(investment.investmentAmount)}</span>
                    <span className="text-[var(--color-text-secondary)]">
                      {shareOfTotal.toFixed(1)}% of portfolio
                    </span>
                  </div>
                </div>
                <Progress value={shareOfTotal} className="h-2" />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// Investment Card Component
interface InvestmentCardProps {
  investment: InvestorInvestment & {
    property?: any;
    currentValue: number;
    projectedROI: number;
    propertyStatus: string;
  };
  onPropertyClick: (propertyId: string) => void;
}

function InvestmentCard({ investment, onPropertyClick }: InvestmentCardProps) {
  const { property } = investment;

  const gain = investment.currentValue - investment.investmentAmount;
  const gainPercentage = investment.investmentAmount > 0
    ? (gain / investment.investmentAmount) * 100
    : 0;

  // Format property address
  const propertyAddress = property?.address
    ? (typeof property.address === 'string' ? property.address : formatPropertyAddress(property.address))
    : 'Property Details Unavailable';

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-[var(--color-primary)] mb-1">
                {propertyAddress}
              </h3>
              <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                {property && (
                  <>
                    <span>{property.propertyType}</span>
                    <span>•</span>
                    <span>{property.area} {property.areaUnit}</span>
                    {property.bedrooms && (
                      <>
                        <span>•</span>
                        <span>{property.bedrooms} beds</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <Badge variant={investment.propertyStatus.toLowerCase().includes('sold') ? 'secondary' : 'default'}>
              {investment.propertyStatus}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-1">Share Percentage</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg">{investment.sharePercentage}%</span>
            <span className="text-xs text-[var(--color-text-secondary)]">ownership</span>
          </div>
        </div>

        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-1">Invested Amount</p>
          <p className="text-lg">{formatPKR(investment.investmentAmount)}</p>
        </div>

        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-1">Current Value</p>
          <p className="text-lg">{formatPKR(investment.currentValue)}</p>
        </div>

        <div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-1">Gain/Loss</p>
          <div>
            <p className={`text-lg ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gain >= 0 ? '+' : ''}{formatPKR(gain)}
            </p>
            <p className={`text-xs ${gainPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gainPercentage >= 0 ? '+' : ''}{gainPercentage.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <Calendar className="w-4 h-4" />
          Invested on {formatDate(investment.investmentDate)}
        </div>

        {property && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPropertyClick(property.id)}
            className="ml-auto gap-2"
          >
            <FileText className="w-4 h-4" />
            View Property Details
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>

      {investment.notes && (
        <div className="mt-4 p-3 bg-[var(--color-muted)] rounded-lg text-sm">
          <p className="text-[var(--color-text-secondary)]">{investment.notes}</p>
        </div>
      )}
    </Card>
  );
}