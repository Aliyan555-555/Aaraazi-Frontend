/**
 * Property Acquisition Wizard
 * Streamlined multi-step wizard for acquiring properties for agency or investor portfolios
 */

import React, { useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { formatPKR } from '../../lib/currency';
import { InvestorShare } from '../../types';
import { toast } from 'sonner';
import InvestorSelectionModal from '../InvestorSelectionModal';

interface PropertyAcquisitionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (acquisitionData: AcquisitionData) => void;
  propertyId?: string;
  propertyTitle?: string;
  propertyPrice?: number;
}

export interface AcquisitionData {
  purchaserType: 'agency' | 'investor';
  propertyId?: string;
  purchasePrice: number;
  downPayment: number;
  paymentPlanType: 'full' | 'instalment';
  instalmentMonths?: number;
  instalmentAmount?: number;
  investorShares?: InvestorShare[];
  acquisitionPurpose?: string;
  targetROI?: number;
  expectedHoldingPeriod?: number;
  notes?: string;
}

type WizardStep = 'purchaser' | 'pricing' | 'payment' | 'details' | 'review';

export default function PropertyAcquisitionWizard({
  isOpen,
  onClose,
  onComplete,
  propertyId,
  propertyTitle,
  propertyPrice = 0
}: PropertyAcquisitionWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('purchaser');
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);

  // Form state
  const [purchaserType, setPurchaserType] = useState<'agency' | 'investor'>('agency');
  const [purchasePrice, setPurchasePrice] = useState(propertyPrice.toString());
  const [downPayment, setDownPayment] = useState('');
  const [paymentPlanType, setPaymentPlanType] = useState<'full' | 'instalment'>('full');
  const [instalmentMonths, setInstalmentMonths] = useState('12');
  const [selectedInvestors, setSelectedInvestors] = useState<InvestorShare[]>([]);
  const [acquisitionPurpose, setAcquisitionPurpose] = useState('investment');
  const [targetROI, setTargetROI] = useState('');
  const [expectedHoldingPeriod, setExpectedHoldingPeriod] = useState('');
  const [notes, setNotes] = useState('');

  // Calculations
  const purchasePriceNum = parseFloat(purchasePrice) || 0;
  const downPaymentNum = parseFloat(downPayment) || 0;
  const remainingAmount = purchasePriceNum - downPaymentNum;
  const instalmentMonthsNum = parseInt(instalmentMonths) || 1;
  const monthlyInstalment = remainingAmount / instalmentMonthsNum;

  // Validation
  const canProceed = () => {
    switch (currentStep) {
      case 'purchaser':
        if (purchaserType === 'investor') {
          return selectedInvestors.length > 0;
        }
        return true;
      case 'pricing':
        return purchasePriceNum > 0;
      case 'payment':
        if (paymentPlanType === 'full') {
          return downPaymentNum === purchasePriceNum;
        }
        return downPaymentNum >= 0 && downPaymentNum < purchasePriceNum && instalmentMonthsNum > 0;
      case 'details':
        return true; // Optional fields
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // Navigation
  const steps: WizardStep[] = ['purchaser', 'pricing', 'payment', 'details', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (!canProceed()) {
      toast.error('Please complete all required fields');
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleComplete = () => {
    if (!canProceed()) {
      toast.error('Please complete all required fields');
      return;
    }

    const acquisitionData: AcquisitionData = {
      purchaserType,
      propertyId,
      purchasePrice: purchasePriceNum,
      downPayment: downPaymentNum,
      paymentPlanType,
      instalmentMonths: paymentPlanType === 'instalment' ? instalmentMonthsNum : undefined,
      instalmentAmount: paymentPlanType === 'instalment' ? monthlyInstalment : undefined,
      investorShares: purchaserType === 'investor' ? selectedInvestors : undefined,
      acquisitionPurpose: purchaserType === 'agency' ? acquisitionPurpose : undefined,
      targetROI: targetROI ? parseFloat(targetROI) : undefined,
      expectedHoldingPeriod: expectedHoldingPeriod ? parseInt(expectedHoldingPeriod) : undefined,
      notes: notes || undefined
    };

    onComplete(acquisitionData);
    handleReset();
  };

  const handleReset = () => {
    setCurrentStep('purchaser');
    setPurchaserType('agency');
    setPurchasePrice(propertyPrice.toString());
    setDownPayment('');
    setPaymentPlanType('full');
    setInstalmentMonths('12');
    setSelectedInvestors([]);
    setAcquisitionPurpose('investment');
    setTargetROI('');
    setExpectedHoldingPeriod('');
    setNotes('');
  };

  const handleInvestorSelection = (investors: InvestorShare[]) => {
    setSelectedInvestors(investors);
    setIsInvestorModalOpen(false);
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white' :
                  isCurrent ? 'border-primary text-primary' :
                    'border-gray-300 text-gray-400'
                }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <p className={`text-xs ${isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-primary' : 'bg-gray-300'
                }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Property Acquisition Wizard
            </DialogTitle>
            <DialogDescription>
              {propertyTitle ? `Acquiring: ${propertyTitle}` : 'Complete the steps to acquire this property'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <StepIndicator />

            {/* Step 1: Select Purchaser Type */}
            {currentStep === 'purchaser' && (
              <div className="space-y-4">
                <div>
                  <Label>Who is purchasing this property?</Label>
                  <RadioGroup value={purchaserType} onValueChange={(value: 'agency' | 'investor') => setPurchaserType(value)} className="mt-2">
                    <Card className={`cursor-pointer transition-all ${purchaserType === 'agency' ? 'border-primary bg-primary/5' : ''}`}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <RadioGroupItem value="agency" id="agency" />
                        <Label htmlFor="agency" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4" />
                            <span className="font-medium">Agency Portfolio</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Purchase property for the agency's own investment portfolio
                          </p>
                        </Label>
                      </CardContent>
                    </Card>

                    <Card className={`cursor-pointer transition-all ${purchaserType === 'investor' ? 'border-primary bg-primary/5' : ''}`}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <RadioGroupItem value="investor" id="investor" />
                        <Label htmlFor="investor" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">Investor Purchase</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Purchase on behalf of one or more investors with share allocation
                          </p>
                        </Label>
                      </CardContent>
                    </Card>
                  </RadioGroup>
                </div>

                {purchaserType === 'investor' && (
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setIsInvestorModalOpen(true)}
                      className="w-full"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {selectedInvestors.length === 0
                        ? 'Select Investors'
                        : `${selectedInvestors.length} Investor(s) Selected`
                      }
                    </Button>

                    {selectedInvestors.length > 0 && (
                      <Card className="mt-3">
                        <CardContent className="p-3 space-y-2">
                          {selectedInvestors.map(inv => (
                            <div key={inv.investorId} className="flex items-center justify-between text-sm">
                              <span>{inv.investorName}</span>
                              <Badge variant="outline">{inv.sharePercentage}%</Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Pricing */}
            {currentStep === 'pricing' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="0"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPKR(purchasePriceNum)}
                  </p>
                </div>

                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription className="text-sm">
                    This is the negotiated purchase price for the property acquisition.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 3: Payment Plan */}
            {currentStep === 'payment' && (
              <div className="space-y-4">
                <div>
                  <Label>Payment Plan</Label>
                  <RadioGroup value={paymentPlanType} onValueChange={(value: 'full' | 'instalment') => setPaymentPlanType(value)} className="mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="cursor-pointer">Full Payment</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="instalment" id="instalment" />
                      <Label htmlFor="instalment" className="cursor-pointer">Instalment Plan</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="downPayment">Down Payment</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="downPayment"
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      placeholder="0"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPKR(downPaymentNum)}
                  </p>
                </div>

                {paymentPlanType === 'instalment' && (
                  <>
                    <div>
                      <Label htmlFor="instalmentMonths">Instalment Period (Months)</Label>
                      <Select value={instalmentMonths} onValueChange={setInstalmentMonths}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                          <SelectItem value="18">18 Months</SelectItem>
                          <SelectItem value="24">24 Months</SelectItem>
                          <SelectItem value="36">36 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Purchase Price:</span>
                          <span className="font-medium">{formatPKR(purchasePriceNum)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Down Payment:</span>
                          <span className="font-medium">{formatPKR(downPaymentNum)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span className="font-medium">{formatPKR(remainingAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Payment:</span>
                          <span className="text-lg font-medium text-primary">{formatPKR(monthlyInstalment)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Additional Details */}
            {currentStep === 'details' && (
              <div className="space-y-4">
                {purchaserType === 'agency' && (
                  <div>
                    <Label htmlFor="purpose">Acquisition Purpose</Label>
                    <Select value={acquisitionPurpose} onValueChange={setAcquisitionPurpose}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investment">Investment / Hold</SelectItem>
                        <SelectItem value="resale">Quick Resale</SelectItem>
                        <SelectItem value="development">Development Project</SelectItem>
                        <SelectItem value="rental">Rental Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="targetROI">Target ROI (%)</Label>
                  <Input
                    id="targetROI"
                    type="number"
                    value={targetROI}
                    onChange={(e) => setTargetROI(e.target.value)}
                    placeholder="e.g., 15"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="holdingPeriod">Expected Holding Period (Months)</Label>
                  <Input
                    id="holdingPeriod"
                    type="number"
                    value={expectedHoldingPeriod}
                    onChange={(e) => setExpectedHoldingPeriod(e.target.value)}
                    placeholder="e.g., 24"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information about this acquisition..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 'review' && (
              <div className="space-y-4">
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Review your acquisition details before completing
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Purchaser Type</p>
                      <p className="font-medium capitalize">{purchaserType}</p>
                    </div>

                    {purchaserType === 'investor' && selectedInvestors.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Investors</p>
                        {selectedInvestors.map(inv => (
                          <div key={inv.investorId} className="flex items-center justify-between py-1">
                            <span className="text-sm">{inv.investorName}</span>
                            <Badge variant="outline">{inv.sharePercentage}%</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div>
                      <p className="text-sm text-muted-foreground">Purchase Price</p>
                      <p className="font-medium">{formatPKR(purchasePriceNum)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Payment Plan</p>
                      <p className="font-medium capitalize">{paymentPlanType}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Down Payment</p>
                      <p className="font-medium">{formatPKR(downPaymentNum)}</p>
                    </div>

                    {paymentPlanType === 'instalment' && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Instalment</p>
                          <p className="font-medium">{formatPKR(monthlyInstalment)} × {instalmentMonths} months</p>
                        </div>
                      </>
                    )}

                    {targetROI && (
                      <div>
                        <p className="text-sm text-muted-foreground">Target ROI</p>
                        <p className="font-medium">{targetROI}%</p>
                      </div>
                    )}

                    {notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm">{notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between mt-4">
            <div>
              {currentStepIndex > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {currentStepIndex < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={!canProceed()}>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Acquisition
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Investor Selection Modal */}
      <InvestorSelectionModal
        isOpen={isInvestorModalOpen}
        onClose={() => setIsInvestorModalOpen(false)}
        onConfirm={handleInvestorSelection}
        propertyPrice={purchasePriceNum}
      />
    </>
  );
}
