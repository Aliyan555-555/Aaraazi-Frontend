import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Property, PropertyPayment, User } from '../types';
import { getPropertyPayments, addPropertyPayment, updatePropertyPaymentSummary } from '../lib/data';
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Receipt,
  PiggyBank,
  Banknote,
  FileText,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentTrackingProps {
  property: Property;
  user: User;
  onUpdate?: () => void;
}

export const PaymentTracking: React.FC<PaymentTrackingProps> = ({ 
  property, 
  user, 
  onUpdate 
}) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'wire' as PropertyPayment['paymentMethod'],
    description: '',
    receiptNumber: ''
  });

  const payments = useMemo(() => getPropertyPayments(property.id), [property.id]);
  
  const paymentSummary = useMemo(() => {
    const totalAmount = property.finalSalePrice || property.price;
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = totalAmount - paidAmount;
    const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
    
    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      progressPercentage,
      isFullyPaid: remainingAmount <= 0,
      paymentCount: payments.length
    };
  }, [payments, property.finalSalePrice, property.price]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPayment = async () => {
    const amount = parseFloat(paymentForm.amount);
    
    // Enhanced validation
    if (!paymentForm.amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!paymentForm.paymentDate) {
      toast.error('Please select a payment date');
      return;
    }

    // Check if payment exceeds remaining balance
    if (amount > paymentSummary.remainingAmount && paymentSummary.remainingAmount > 0) {
      toast.error(`Payment amount cannot exceed remaining balance of ${paymentSummary.remainingAmount.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const newPayment = await addPropertyPayment({
        propertyId: property.id,
        amount: amount,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        description: paymentForm.description,
        receiptNumber: paymentForm.receiptNumber || undefined,
        agentId: user.id
      });

      toast.success(`Payment of ${amount.toLocaleString()} recorded successfully! 🎉`);
      
      // Reset form
      setPaymentForm({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'wire',
        description: '',
        receiptNumber: ''
      });
      
      setShowAddPayment(false);
      onUpdate?.();
      
      // Update property payment summary
      updatePropertyPaymentSummary(property.id);
      
    } catch (error) {
      console.error('Payment recording error:', error);
      toast.error('Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentMethodIcon = (method: PropertyPayment['paymentMethod']) => {
    switch (method) {
      case 'cash': return Banknote;
      case 'check': return FileText;
      case 'wire': return CreditCard;
      case 'financing': return PiggyBank;
      default: return Receipt;
    }
  };

  const getPaymentMethodColor = (method: PropertyPayment['paymentMethod']) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'check': return 'bg-blue-100 text-blue-800';
      case 'wire': return 'bg-purple-100 text-purple-800';
      case 'financing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedPayments = payments.sort((a, b) => 
    new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Payment Progress</span>
                <span className="text-sm text-gray-600">
                  {paymentSummary.progressPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={paymentSummary.progressPercentage} className="h-3" />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">Total Sale Price</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  ${paymentSummary.totalAmount.toLocaleString()}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Amount Paid</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  ${paymentSummary.paidAmount.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {paymentSummary.paymentCount} payment{paymentSummary.paymentCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className={`rounded-lg p-4 ${
                paymentSummary.remainingAmount > 0 
                  ? 'bg-orange-50' 
                  : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {paymentSummary.remainingAmount > 0 ? (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-gray-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    paymentSummary.remainingAmount > 0 
                      ? 'text-orange-600' 
                      : 'text-gray-600'
                  }`}>
                    Remaining
                  </span>
                </div>
                <p className={`text-2xl font-bold ${
                  paymentSummary.remainingAmount > 0 
                    ? 'text-orange-900' 
                    : 'text-gray-900'
                }`}>
                  ${paymentSummary.remainingAmount.toLocaleString()}
                </p>
                {paymentSummary.isFullyPaid && (
                  <Badge className="mt-1 bg-green-100 text-green-800">
                    Fully Paid
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment History
            </CardTitle>
            <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Buyer Payment</DialogTitle>
                  <DialogDescription>
                    Track a payment received from the buyer for {property.title}
                  </DialogDescription>
                  {/* Mini Progress Indicator */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Payment Progress</span>
                      <span className="font-medium">{paymentSummary.progressPercentage.toFixed(1)}% Complete</span>
                    </div>
                    <Progress value={paymentSummary.progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Paid: ${paymentSummary.paidAmount.toLocaleString()}</span>
                      <span>Remaining: ${paymentSummary.remainingAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Payment Amount *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      />
                    </div>
                    {/* Quick Amount Buttons */}
                    {paymentSummary.remainingAmount > 0 && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setPaymentForm({...paymentForm, amount: paymentSummary.remainingAmount.toString()})}
                          className="text-xs"
                        >
                          Full Amount (${paymentSummary.remainingAmount.toLocaleString()})
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setPaymentForm({...paymentForm, amount: (paymentSummary.remainingAmount / 2).toString()})}
                          className="text-xs"
                        >
                          Half (${(paymentSummary.remainingAmount / 2).toLocaleString()})
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="payment-date">Payment Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="payment-date"
                        type="date"
                        className="pl-10"
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select 
                      value={paymentForm.paymentMethod} 
                      onValueChange={(value: PropertyPayment['paymentMethod']) => 
                        setPaymentForm({...paymentForm, paymentMethod: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Cash</SelectItem>
                        <SelectItem value="check">📝 Check</SelectItem>
                        <SelectItem value="wire">🏦 Wire Transfer</SelectItem>
                        <SelectItem value="financing">🏠 Financing</SelectItem>
                        <SelectItem value="other">📄 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="receipt-number">Receipt/Reference Number</Label>
                    <Input
                      id="receipt-number"
                      placeholder="Transaction ID, Check #, etc."
                      value={paymentForm.receiptNumber}
                      onChange={(e) => setPaymentForm({...paymentForm, receiptNumber: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Payment Notes</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional details about this payment..."
                      value={paymentForm.description}
                      onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleAddPayment} 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Record Payment
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddPayment(false)}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Receipt className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No payments recorded yet</h3>
              <p className="text-sm mb-4">
                Track all buyer payments to monitor progress and stay organized
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddPayment(true)}
                className="mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record First Payment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPayments.map((payment, index) => {
                const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod);
                
                // Calculate running balance (total paid up to this point in chronological order)
                const paymentsUpToThis = sortedPayments.slice(index);
                const runningTotal = paymentsUpToThis.reduce((sum, p) => sum + p.amount, 0);
                const remainingAtTime = paymentSummary.totalAmount - runningTotal;
                
                return (
                  <div key={payment.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${
                          payment.paymentMethod === 'cash' ? 'bg-green-100' :
                          payment.paymentMethod === 'check' ? 'bg-blue-100' :
                          payment.paymentMethod === 'wire' ? 'bg-purple-100' :
                          payment.paymentMethod === 'financing' ? 'bg-orange-100' :
                          'bg-gray-100'
                        }`}>
                          <PaymentIcon className={`h-5 w-5 ${
                            payment.paymentMethod === 'cash' ? 'text-green-600' :
                            payment.paymentMethod === 'check' ? 'text-blue-600' :
                            payment.paymentMethod === 'wire' ? 'text-purple-600' :
                            payment.paymentMethod === 'financing' ? 'text-orange-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">
                              ${payment.amount.toLocaleString()}
                            </span>
                            <Badge className={getPaymentMethodColor(payment.paymentMethod)}>
                              {payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {payment.receiptNumber && (
                              <>
                                <Separator orientation="vertical" className="h-3" />
                                <span className="font-mono">Ref: {payment.receiptNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">
                          Running Total
                        </div>
                        <div className="font-semibold text-green-700">
                          ${runningTotal.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          ${remainingAtTime.toLocaleString()} remaining
                        </div>
                      </div>
                    </div>
                    {payment.description && (
                      <div className="mt-3 pl-14">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            {payment.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};