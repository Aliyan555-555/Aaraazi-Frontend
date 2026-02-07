/**
 * Investor Management View - Main Hub for Investor Registry
 * Phase 2 Implementation - Full CRUD with Portfolio Integration
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Wallet,
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  PieChart,
  ArrowUpRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { formatPKR } from '../lib/currency';
import {
  getInvestors,
  deleteInvestor,
  getInvestorInvestments,
  calculateInvestorPortfolioValue,
  calculateInvestorROI
} from '../lib/investors';
import { Investor } from '../types';
import { toast } from 'sonner';
import CreateInvestorModal from './CreateInvestorModal';
import InvestorPortfolioDashboard from './InvestorPortfolioDashboard';

interface InvestorManagementViewProps {
  onNavigate: (view: string, data?: any) => void;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'active' | 'inactive';

export default function InvestorManagementView({ onNavigate }: InvestorManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger

  // Load data - will re-run when refreshTrigger changes
  const investors = getInvestors();

  // Calculate portfolio stats for each investor
  const investorsWithStats = useMemo(() => {
    return investors.map(investor => {
      const investments = getInvestorInvestments(investor.id);
      const portfolioValue = calculateInvestorPortfolioValue(investor.id);
      const roi = calculateInvestorROI(investor.id);

      return {
        ...investor,
        investmentCount: investments.length,
        totalInvested: investments.reduce((sum, inv) => sum + inv.investmentAmount, 0),
        portfolioValue,
        roi,
        isActive: investments.length > 0
      };
    });
  }, [investors, refreshTrigger]);

  // Filter and search
  const filteredInvestors = useMemo(() => {
    return investorsWithStats.filter(investor => {
      // Search filter
      const matchesSearch = !searchQuery ||
        investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.phone?.includes(searchQuery) ||
        investor.cnic?.includes(searchQuery);

      // Status filter
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && investor.isActive) ||
        (filterStatus === 'inactive' && !investor.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [investorsWithStats, searchQuery, filterStatus]);

  // Overall stats
  const stats = useMemo(() => {
    const totalInvestors = investorsWithStats.length;
    const activeInvestors = investorsWithStats.filter(i => i.isActive).length;
    const totalInvested = investorsWithStats.reduce((sum, i) => sum + i.totalInvested, 0);
    const totalPortfolioValue = investorsWithStats.reduce((sum, i) => sum + i.portfolioValue, 0);
    const totalProperties = investorsWithStats.reduce((sum, i) => sum + i.investmentCount, 0);

    return {
      totalInvestors,
      activeInvestors,
      totalInvested,
      totalPortfolioValue,
      totalProperties,
      avgROI: totalInvestors > 0
        ? investorsWithStats.reduce((sum, i) => sum + i.roi, 0) / totalInvestors
        : 0
    };
  }, [investorsWithStats]);

  const handleDelete = async (investorId: string) => {
    try {
      const investments = getInvestorInvestments(investorId);

      if (investments.length > 0) {
        toast.error('Cannot Delete', {
          description: 'This investor has active investments. Remove all investments first.'
        });
        return;
      }

      deleteInvestor(investorId);
      toast.success('Investor Deleted', {
        description: 'The investor has been removed from the registry.'
      });
      setDeleteConfirmId(null);
      setRefreshTrigger(prev => prev + 1); // Refresh data
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to delete investor. Please try again.'
      });
    }
  };

  const handleEdit = (investor: Investor) => {
    setEditingInvestor(investor);
    setIsCreateModalOpen(true);
  };

  const handleViewPortfolio = (investor: Investor) => {
    setSelectedInvestor(investor);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingInvestor(null);
  };

  // If viewing a specific investor portfolio
  if (selectedInvestor) {
    return (
      <InvestorPortfolioDashboard
        investor={selectedInvestor}
        onBack={() => setSelectedInvestor(null)}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--color-primary)]">Investor Management</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage investor registry and track portfolio performance
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Investor
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-text-secondary)]">Total Investors</p>
              <p className="mt-1">{stats.totalInvestors}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {stats.activeInvestors} active
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-accent)]">
              <Users className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-text-secondary)]">Total Invested</p>
              <p className="mt-1">{formatPKR(stats.totalInvested)}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                across {stats.totalProperties} properties
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-accent)]">
              <Wallet className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-text-secondary)]">Portfolio Value</p>
              <p className="mt-1">{formatPKR(stats.totalPortfolioValue)}</p>
              <p className="text-xs text-green-600 mt-1">
                +{formatPKR(stats.totalPortfolioValue - stats.totalInvested)} gain
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-accent)]">
              <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-text-secondary)]">Avg ROI</p>
              <p className="mt-1">{stats.avgROI.toFixed(2)}%</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                across all investors
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-accent)]">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <Input
              placeholder="Search by name, email, phone, or CNIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Investors</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>
      </Card>

      {/* Investors Grid/List */}
      {filteredInvestors.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Users className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" />
            <h3 className="mb-2">No Investors Found</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first investor'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Investor
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvestors.map(investor => (
            <InvestorCard
              key={investor.id}
              investor={investor}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteConfirmId(id)}
              onViewPortfolio={handleViewPortfolio}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-[var(--color-text-secondary)]">
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Investments</th>
                  <th className="p-4">Total Invested</th>
                  <th className="p-4">Portfolio Value</th>
                  <th className="p-4">ROI</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestors.map(investor => (
                  <tr key={investor.id} className="border-b last:border-0 hover:bg-[var(--color-muted)]">
                    <td className="p-4">
                      <div>
                        <p>{investor.name}</p>
                        {investor.cnic && (
                          <p className="text-xs text-[var(--color-text-secondary)]">{investor.cnic}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {investor.email && <p>{investor.email}</p>}
                        {investor.phone && <p className="text-[var(--color-text-secondary)]">{investor.phone}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">
                        {investor.investmentCount} {investor.investmentCount === 1 ? 'property' : 'properties'}
                      </Badge>
                    </td>
                    <td className="p-4">{formatPKR(investor.totalInvested)}</td>
                    <td className="p-4">{formatPKR(investor.portfolioValue)}</td>
                    <td className="p-4">
                      <span className={investor.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {investor.roi.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={investor.isActive ? 'default' : 'secondary'}>
                        {investor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPortfolio(investor)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Portfolio
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(investor)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirmId(investor.id)}
                            className="text-[var(--color-destructive)]"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <CreateInvestorModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        editingInvestor={editingInvestor}
        onInvestorCreated={() => {
          setRefreshTrigger(prev => prev + 1); // Refresh investor list
          handleModalClose();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this investor from your registry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-[var(--color-destructive)]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Investor Card Component
interface InvestorCardProps {
  investor: Investor & {
    investmentCount: number;
    totalInvested: number;
    portfolioValue: number;
    roi: number;
    isActive: boolean;
  };
  onEdit: (investor: Investor) => void;
  onDelete: (id: string) => void;
  onViewPortfolio: (investor: Investor) => void;
}

function InvestorCard({ investor, onEdit, onDelete, onViewPortfolio }: InvestorCardProps) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
            <Users className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="font-medium">{investor.name}</p>
            {investor.cnic && (
              <p className="text-xs text-[var(--color-text-secondary)]">{investor.cnic}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={investor.isActive ? 'default' : 'secondary'} className="text-xs">
            {investor.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewPortfolio(investor)}>
                <Eye className="w-4 h-4 mr-2" />
                View Portfolio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(investor)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(investor.id)}
                className="text-[var(--color-destructive)]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Investments</span>
          <span>{investor.investmentCount} properties</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Total Invested</span>
          <span>{formatPKR(investor.totalInvested)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Portfolio Value</span>
          <span>{formatPKR(investor.portfolioValue)}</span>
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t">
          <span className="text-[var(--color-text-secondary)]">ROI</span>
          <span className={investor.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
            {investor.roi.toFixed(2)}%
            {investor.roi >= 0 ? ' ↑' : ' ↓'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => onViewPortfolio(investor)}
        >
          <PieChart className="w-4 h-4" />
          View Full Portfolio
          <ArrowUpRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>

      {investor.email || investor.phone ? (
        <div className="mt-3 p-3 bg-[var(--color-muted)] rounded-lg text-xs space-y-1">
          {investor.email && <p className="text-[var(--color-text-secondary)]">{investor.email}</p>}
          {investor.phone && <p className="text-[var(--color-text-secondary)]">{investor.phone}</p>}
        </div>
      ) : null}
    </Card>
  );
}