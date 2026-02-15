/**
 * Investor Selection Modal
 * Used during purchase cycle to select investor(s) and allocate ownership shares
 * Supports single and multi-investor scenarios with real-time validation
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  AlertCircle,
  X,
  Check,
  TrendingUp,
  Building2,
  Wallet,
  UserPlus,
  ArrowRight,
  Percent
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { formatPKR } from '../lib/currency';
// [STUBBED] import { getInvestors, calculateInvestorPortfolioValue, getInvestorInvestments } from '../lib/investors';
import { Investor, InvestorShare } from '../types';
import { toast } from 'sonner';
import CreateInvestorModal from './CreateInvestorModal';

// ===== STUBS for removed prototype functions =====
const getInvestors = (..._args: any[]): any => { /* stub - prototype function removed */ };
const calculateInvestorPortfolioValue = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getInvestorInvestments = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface InvestorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedInvestors: InvestorShare[]) => void;
  propertyPrice: number;
  multiSelect?: boolean;
  title?: string;
  description?: string;
}

interface SelectedInvestorWithShare extends InvestorShare {
  investor: Investor;
}

export default function InvestorSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  propertyPrice,
  multiSelect = true,
  title = 'Select Investor(s)',
  description = 'Choose one or more investors and allocate ownership shares'
}: InvestorSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvestors, setSelectedInvestors] = useState<SelectedInvestorWithShare[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareInputs, setShareInputs] = useState<Record<string, string>>({});

  // Load investors
  const allInvestors = getInvestors();

  // Calculate investor stats
  const investorsWithStats = useMemo(() => {
    return allInvestors.map(investor => {
      const investments = getInvestorInvestments(investor.id);
      const portfolioValue = calculateInvestorPortfolioValue(investor.id);
      const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);

      return {
        ...investor,
        activeInvestments: investments.filter(inv => inv.status === 'active').length,
        totalInvested,
        portfolioValue
      };
    });
  }, [allInvestors]);

  // Filter investors
  const filteredInvestors = useMemo(() => {
    if (!searchQuery.trim()) return investorsWithStats;

    const query = searchQuery.toLowerCase();
    return investorsWithStats.filter(investor =>
      investor.name.toLowerCase().includes(query) ||
      investor.email?.toLowerCase().includes(query) ||
      investor.phone?.toLowerCase().includes(query) ||
      investor.cnic?.toLowerCase().includes(query)
    );
  }, [investorsWithStats, searchQuery]);

  // Calculate total share percentage
  const totalSharePercentage = useMemo(() => {
    return selectedInvestors.reduce((sum, si) => sum + si.sharePercentage, 0);
  }, [selectedInvestors]);

  // Validation
  const isValid = useMemo(() => {
    if (selectedInvestors.length === 0) return false;
    if (multiSelect && totalSharePercentage !== 100) return false;
    if (!multiSelect && totalSharePercentage !== 100) return false;
    return selectedInvestors.every(si => si.sharePercentage > 0 && si.sharePercentage <= 100);
  }, [selectedInvestors, totalSharePercentage, multiSelect]);

  // Calculate investment amount for each investor
  const investmentAmounts = useMemo(() => {
    const amounts: Record<string, number> = {};
    selectedInvestors.forEach(si => {
      amounts[si.investorId] = (propertyPrice * si.sharePercentage) / 100;
    });
    return amounts;
  }, [selectedInvestors, propertyPrice]);

  // Handle investor selection
  const handleToggleInvestor = (investor: Investor & { activeInvestments: number; totalInvested: number; portfolioValue: number }) => {
    const isSelected = selectedInvestors.some(si => si.investorId === investor.id);

    if (isSelected) {
      // Remove investor
      setSelectedInvestors(prev => prev.filter(si => si.investorId !== investor.id));
      setShareInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[investor.id];
        return newInputs;
      });
    } else {
      // Add investor
      if (!multiSelect && selectedInvestors.length > 0) {
        // Single select mode - replace existing
        setSelectedInvestors([{
          investorId: investor.id,
          investorName: investor.name,
          sharePercentage: 100,
          investor
        }]);
        setShareInputs({ [investor.id]: '100' });
      } else {
        // Multi-select mode - add with equal distribution
        const newCount = selectedInvestors.length + 1;
        const equalShare = Math.floor(100 / newCount);
        const remainder = 100 - (equalShare * newCount);

        // Redistribute shares equally
        const updatedSelected = selectedInvestors.map((si, idx) => ({
          ...si,
          sharePercentage: equalShare + (idx === 0 ? remainder : 0)
        }));

        updatedSelected.push({
          investorId: investor.id,
          investorName: investor.name,
          sharePercentage: equalShare,
          investor
        });

        setSelectedInvestors(updatedSelected);

        // Update inputs
        const newInputs: Record<string, string> = {};
        updatedSelected.forEach(si => {
          newInputs[si.investorId] = si.sharePercentage.toString();
        });
        setShareInputs(newInputs);
      }
    }
  };

  // Handle share percentage change
  const handleShareChange = (investorId: string, value: string) => {
    // Allow empty or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setShareInputs(prev => ({ ...prev, [investorId]: value }));

      // Update the actual share if valid number
      if (value !== '' && !isNaN(parseFloat(value))) {
        const numValue = parseFloat(value);
        if (numValue >= 0 && numValue <= 100) {
          setSelectedInvestors(prev => prev.map(si =>
            si.investorId === investorId
              ? { ...si, sharePercentage: numValue }
              : si
          ));
        }
      }
    }
  };

  // Handle auto-distribute
  const handleAutoDistribute = () => {
    if (selectedInvestors.length === 0) return;

    const equalShare = Math.floor(100 / selectedInvestors.length);
    const remainder = 100 - (equalShare * selectedInvestors.length);

    const distributed = selectedInvestors.map((si, idx) => ({
      ...si,
      sharePercentage: equalShare + (idx === 0 ? remainder : 0)
    }));

    setSelectedInvestors(distributed);

    const newInputs: Record<string, string> = {};
    distributed.forEach(si => {
      newInputs[si.investorId] = si.sharePercentage.toString();
    });
    setShareInputs(newInputs);

    toast.success('Shares distributed equally');
  };

  // Handle confirm
  const handleConfirm = () => {
    if (!isValid) {
      toast.error('Please allocate exactly 100% of shares');
      return;
    }

    const investorShares: InvestorShare[] = selectedInvestors.map(si => ({
      investorId: si.investorId,
      investorName: si.investorName,
      sharePercentage: si.sharePercentage
    }));

    onConfirm(investorShares);
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setSearchQuery('');
    setSelectedInvestors([]);
    setShareInputs({});
    onClose();
  };

  // Handle investor created
  const handleInvestorCreated = (newInvestor: Investor) => {
    setIsCreateModalOpen(false);
    toast.success(`Investor "${newInvestor.name}" created successfully`);

    // Auto-select the newly created investor
    setTimeout(() => {
      const investorWithStats = {
        ...newInvestor,
        activeInvestments: 0,
        totalInvested: 0,
        portfolioValue: 0
      };
      handleToggleInvestor(investorWithStats);
    }, 100);
  };

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedInvestors([]);
      setShareInputs({});
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Left: Available Investors */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search investors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>

              <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-2 pr-3">
                  {filteredInvestors.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        {searchQuery ? 'No investors found' : 'No investors registered'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Investor
                      </Button>
                    </Card>
                  ) : (
                    filteredInvestors.map(investor => {
                      const isSelected = selectedInvestors.some(si => si.investorId === investor.id);

                      return (
                        <Card
                          key={investor.id}
                          className={`p-3 cursor-pointer transition-all hover:border-primary/50 ${isSelected ? 'border-primary bg-primary/5' : ''
                            }`}
                          onClick={() => handleToggleInvestor(investor)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleInvestor(investor)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <p className="font-medium">{investor.name}</p>
                                  <p className="text-xs text-muted-foreground">{investor.email || investor.phone}</p>
                                </div>
                                {investor.activeInvestments > 0 && (
                                  <Badge variant="outline" className="shrink-0">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {investor.activeInvestments}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Wallet className="w-3 h-3" />
                                  {formatPKR(investor.totalInvested)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {formatPKR(investor.portfolioValue)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Selected Investors & Share Allocation */}
            <div className="w-96 flex flex-col gap-3 border-l pl-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Share Allocation</h3>
                {selectedInvestors.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAutoDistribute}
                  >
                    <Percent className="w-4 h-4 mr-2" />
                    Auto-distribute
                  </Button>
                )}
              </div>

              {selectedInvestors.length === 0 ? (
                <Card className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Select investor(s) to allocate shares
                  </p>
                </Card>
              ) : (
                <>
                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-3">
                      {selectedInvestors.map((si, idx) => (
                        <Card key={si.investorId} className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{si.investorName}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {si.investor.email || si.investor.phone}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleInvestor(si.investor as any)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Share Percentage</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="text"
                                  value={shareInputs[si.investorId] || si.sharePercentage.toString()}
                                  onChange={(e) => handleShareChange(si.investorId, e.target.value)}
                                  className="text-right"
                                  placeholder="0"
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Investment: {formatPKR(investmentAmounts[si.investorId] || 0)}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator />

                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Share</span>
                      <span className={`font-medium ${totalSharePercentage === 100 ? 'text-green-600' :
                          totalSharePercentage > 100 ? 'text-red-600' :
                            'text-yellow-600'
                        }`}>
                        {totalSharePercentage.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Property Price</span>
                      <span className="font-medium">{formatPKR(propertyPrice)}</span>
                    </div>

                    {totalSharePercentage !== 100 && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription className="text-xs">
                          {totalSharePercentage < 100
                            ? `Remaining ${(100 - totalSharePercentage).toFixed(2)}% to allocate`
                            : `Over-allocated by ${(totalSharePercentage - 100).toFixed(2)}%`
                          }
                        </AlertDescription>
                      </Alert>
                    )}

                    {isValid && (
                      <Alert className="py-2 border-green-200 bg-green-50">
                        <Check className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-xs text-green-600">
                          Share allocation is valid
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Selection
              {selectedInvestors.length > 0 && ` (${selectedInvestors.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Investor Modal */}
      <CreateInvestorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onInvestorCreated={handleInvestorCreated}
      />
    </>
  );
}
