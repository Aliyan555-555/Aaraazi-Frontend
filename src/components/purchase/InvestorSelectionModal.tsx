/**
 * Investor Selection Modal - Multi-Investor Purchase
 * Allows selection of multiple investors with percentage allocation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { InvestorShare, Investor, User } from '../../types';
// [STUBBED] import { getInvestors } from '../../lib/investors';
import { formatPKR } from '../../lib/currency';
import { 
  Search, 
  Plus, 
  X, 
  Users, 
  TrendingUp, 
  Briefcase, 
  MapPin,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import CreateInvestorModal from '../CreateInvestorModal';

// ===== STUBS for removed prototype functions =====
const getInvestors = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface InvestorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (investors: InvestorShare[]) => void;
  totalPrice: number;
  user: User;
}

export function InvestorSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  totalPrice,
  user,
}: InvestorSelectionModalProps) {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvestors, setSelectedInvestors] = useState<Map<string, InvestorShare>>(new Map());
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load investors
  useEffect(() => {
    if (isOpen) {
      loadInvestors();
    }
  }, [isOpen, user.id]);

  const loadInvestors = () => {
    const allInvestors = getInvestors().filter(inv => inv.status === 'active');
    setInvestors(allInvestors);
  };

  // Filter investors based on search
  const filteredInvestors = useMemo(() => {
    if (!searchQuery.trim()) return investors;
    
    const query = searchQuery.toLowerCase();
    return investors.filter(inv =>
      inv.name.toLowerCase().includes(query) ||
      inv.email?.toLowerCase().includes(query) ||
      inv.phone.includes(query) ||
      inv.investorType.toLowerCase().includes(query)
    );
  }, [investors, searchQuery]);

  // Calculate totals
  const totalPercentage = useMemo(() => {
    return Array.from(selectedInvestors.values()).reduce(
      (sum, share) => sum + share.sharePercentage, 
      0
    );
  }, [selectedInvestors]);

  const isValidSelection = totalPercentage >= 99.99 && totalPercentage <= 100.01;

  // Handle investor selection
  const toggleInvestor = (investor: Investor) => {
    const newMap = new Map(selectedInvestors);
    
    if (newMap.has(investor.id)) {
      // Remove investor
      newMap.delete(investor.id);
    } else {
      // Add investor with default percentage
      const remainingPercentage = Math.max(0, 100 - totalPercentage);
      const defaultPercentage = remainingPercentage > 0 ? remainingPercentage : 0;
      
      newMap.set(investor.id, {
        investorId: investor.id,
        investorName: investor.name,
        sharePercentage: defaultPercentage,
        investmentAmount: (totalPrice * defaultPercentage) / 100,
      });
    }
    
    setSelectedInvestors(newMap);
  };

  // Handle percentage change
  const handlePercentageChange = (investorId: string, value: string) => {
    const percentage = parseFloat(value) || 0;
    
    if (percentage < 0 || percentage > 100) {
      toast.error('Percentage must be between 0 and 100');
      return;
    }
    
    const newMap = new Map(selectedInvestors);
    const share = newMap.get(investorId);
    
    if (share) {
      newMap.set(investorId, {
        ...share,
        sharePercentage: percentage,
        investmentAmount: (totalPrice * percentage) / 100,
      });
      setSelectedInvestors(newMap);
    }
  };

  // Auto-distribute evenly
  const distributeEvenly = () => {
    if (selectedInvestors.size === 0) {
      toast.error('Please select at least one investor first');
      return;
    }
    
    const evenPercentage = 100 / selectedInvestors.size;
    const newMap = new Map(selectedInvestors);
    
    newMap.forEach((share, id) => {
      newMap.set(id, {
        ...share,
        sharePercentage: evenPercentage,
        investmentAmount: (totalPrice * evenPercentage) / 100,
      });
    });
    
    setSelectedInvestors(newMap);
    toast.success('Percentages distributed evenly');
  };

  // Handle confirm
  const handleConfirm = () => {
    if (selectedInvestors.size === 0) {
      toast.error('Please select at least one investor');
      return;
    }
    
    if (!isValidSelection) {
      toast.error(`Total percentage must equal 100% (currently ${totalPercentage.toFixed(2)}%)`);
      return;
    }
    
    const investorShares = Array.from(selectedInvestors.values());
    onConfirm(investorShares);
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setSearchQuery('');
    setSelectedInvestors(new Map());
    onClose();
  };

  // Handle investor created
  const handleInvestorCreated = () => {
    setShowCreateModal(false);
    loadInvestors();
    toast.success('Investor added successfully');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Investors for Purchase
            </DialogTitle>
            <DialogDescription>
              Choose one or more investors and allocate ownership percentages. Total must equal 100%.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Search & Add */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search investors by name, email, phone, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setShowCreateModal(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Investor
              </Button>
            </div>

            {/* Selected Investors Summary */}
            {selectedInvestors.size > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">
                          {selectedInvestors.size} Investor{selectedInvestors.size !== 1 ? 's' : ''} Selected
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={distributeEvenly}
                        className="text-xs"
                      >
                        Distribute Evenly
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Allocation</span>
                        <span className={`font-medium ${isValidSelection ? 'text-green-600' : 'text-orange-600'}`}>
                          {totalPercentage.toFixed(2)}%
                        </span>
                      </div>
                      <Progress 
                        value={totalPercentage} 
                        className={`h-2 ${isValidSelection ? '[&>div]:bg-green-500' : '[&>div]:bg-orange-500'}`}
                      />
                      {isValidSelection ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Ready to proceed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            {totalPercentage < 100 
                              ? `${(100 - totalPercentage).toFixed(2)}% remaining to allocate`
                              : `${(totalPercentage - 100).toFixed(2)}% over-allocated`
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Selected Investors List */}
                    <div className="space-y-2">
                      {Array.from(selectedInvestors.entries()).map(([id, share]) => {
                        const investor = investors.find(inv => inv.id === id);
                        return (
                          <div key={id} className="flex items-center gap-3 bg-white rounded-lg p-3 border">
                            <div className="flex-1">
                              <p className="font-medium">{share.investorName}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatPKR(share.investmentAmount || 0)}
                              </p>
                            </div>
                            <div className="w-32">
                              <Input
                                type="number"
                                value={share.sharePercentage}
                                onChange={(e) => handlePercentageChange(id, e.target.value)}
                                className="text-right"
                                step="0.01"
                                min="0"
                                max="100"
                              />
                            </div>
                            <div className="text-sm font-medium w-12 text-right">
                              %
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleInvestor(investor!)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Available Investors Grid */}
            <div>
              <h3 className="font-medium mb-3">Available Investors ({filteredInvestors.length})</h3>
              
              {filteredInvestors.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No investors found</p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Investor
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInvestors.map((investor) => {
                    const isSelected = selectedInvestors.has(investor.id);
                    
                    return (
                      <Card
                        key={investor.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => toggleInvestor(investor)}
                      >
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{investor.name}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {investor.investorType}
                                </p>
                              </div>
                              {isSelected && (
                                <Badge variant="default" className="bg-primary">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Selected
                                </Badge>
                              )}
                            </div>

                            {/* Contact */}
                            <div className="text-sm space-y-1">
                              {investor.email && (
                                <p className="text-muted-foreground truncate">{investor.email}</p>
                              )}
                              {investor.phone && (
                                <p className="text-muted-foreground">{investor.phone}</p>
                              )}
                            </div>

                            <Separator />

                            {/* Investment Profile */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  Capacity
                                </span>
                                <span className="font-medium">
                                  {investor.totalInvestmentCapacity 
                                    ? formatPKR(investor.totalInvestmentCapacity)
                                    : 'Not set'
                                  }
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  Risk Profile
                                </span>
                                <Badge variant="outline" className="capitalize">
                                  {investor.riskProfile}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  Active Properties
                                </span>
                                <span className="font-medium">{investor.activeProperties || 0}</span>
                              </div>
                            </div>

                            {/* Preferences */}
                            {investor.preferredLocations && investor.preferredLocations.length > 0 && (
                              <>
                                <Separator />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    Preferred Locations
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {investor.preferredLocations.slice(0, 2).map(loc => (
                                      <Badge key={loc} variant="secondary" className="text-xs">
                                        {loc}
                                      </Badge>
                                    ))}
                                    {investor.preferredLocations.length > 2 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{investor.preferredLocations.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Total Purchase Price: <span className="font-medium text-foreground">{formatPKR(totalPrice)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={!isValidSelection || selectedInvestors.size === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Selection ({selectedInvestors.size})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Investor Modal */}
      {showCreateModal && (
        <CreateInvestorModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onInvestorCreated={handleInvestorCreated}
        />
      )}
    </>
  );
}