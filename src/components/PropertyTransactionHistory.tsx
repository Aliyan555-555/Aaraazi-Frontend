import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Transaction, Property, User, Contact } from '../types';
import { getTransactions } from '../lib/transactions';
// [STUBBED] import { getContacts } from '../lib/data';
import { formatPKR } from '../lib/currency';
import {
  Plus,
  Calendar,
  User as UserIcon,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  History,
  ArrowRight
} from 'lucide-react';

// ===== STUBS for removed prototype functions =====
const getContacts = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface PropertyTransactionHistoryProps {
  property: Property;
  user: User;
  onCreateNewDeal?: () => void;
}

export const PropertyTransactionHistory: React.FC<PropertyTransactionHistoryProps> = ({
  property,
  user,
  onCreateNewDeal
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    loadTransactions();
    loadContacts();
  }, [property.id]);

  const loadTransactions = () => {
    const allTransactions = getTransactions(property.id);
    // Sort by date, newest first
    const sorted = allTransactions.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setTransactions(sorted);
  };

  const loadContacts = () => {
    const allContacts = getContacts(user.id, user.role);
    setContacts(allContacts);
  };

  const getContactName = (contactId?: string) => {
    if (!contactId) return null;
    const contact = contacts.find(c => c.id === contactId);
    return contact?.name;
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const styles = {
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      active: <Clock className="h-3 w-3 mr-1" />,
      completed: <CheckCircle2 className="h-3 w-3 mr-1" />,
      cancelled: <XCircle className="h-3 w-3 mr-1" />
    };

    return (
      <Badge variant="outline" className={styles[status]}>
        <span className="flex items-center">
          {icons[status]}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalPaid = (transaction: Transaction) => {
    if (!transaction.paymentPlan) return 0;
    return transaction.paymentPlan.installments.reduce((sum, inst) =>
      sum + (inst.paidAmount || 0), 0
    );
  };

  const getTotalAmount = (transaction: Transaction) => {
    return transaction.acceptedOfferAmount || 0;
  };

  const viewTransactionDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const hasCompletedTransactions = transactions.some(t => t.status === 'completed');
  const activeTransaction = transactions.find(t => t.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl flex items-center gap-2">
            <History className="h-6 w-6" />
            Transaction History
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete lifecycle of all deals for this property
          </p>
        </div>

        {property.status !== 'sold' && (
          <Button onClick={onCreateNewDeal} className="gap-2">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Deals</p>
                <p className="text-2xl">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl">
                  {transactions.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl">
                  {transactions.filter(t => t.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ownership Timeline */}
      {property.ownershipHistory && property.ownershipHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Ownership Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {property.ownershipHistory.map((record, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {index < property.ownershipHistory!.length - 1 && (
                      <div className="w-0.5 h-12 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{record.contactName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(record.startDate)}
                          {record.endDate && (
                            <span> → {formatDate(record.endDate)}</span>
                          )}
                        </p>
                      </div>
                      {!record.endDate && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Current Owner
                        </Badge>
                      )}
                    </div>
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg mb-2">No Transactions Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create the first transaction for this property to start tracking its deal history.
              </p>
              {onCreateNewDeal && (
                <Button onClick={onCreateNewDeal} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Deal
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction, index) => {
                const contactName = getContactName(transaction.buyerContactId);
                const totalPaid = getTotalPaid(transaction);
                const totalAmount = getTotalAmount(transaction);
                const paymentProgress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

                return (
                  <div key={transaction.id}>
                    <div
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => viewTransactionDetail(transaction)}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                Deal #{transactions.length - index}
                              </h4>
                              {getStatusBadge(transaction.status)}
                              {transaction.status === 'active' && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <UserIcon className="h-3 w-3" />
                                {contactName || transaction.buyerName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(transaction.acceptedDate)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPKR(totalAmount)}</p>
                            {transaction.paymentPlan && (
                              <p className="text-sm text-muted-foreground">
                                Paid: {formatPKR(totalPaid)}
                              </p>
                            )}
                          </div>
                        </div>

                        {transaction.paymentPlan && transaction.status === 'active' && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Payment Progress</span>
                              <span>{Math.round(paymentProgress)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${paymentProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {transaction.status === 'completed' && transaction.paymentPlan && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Completed on {formatDate(transaction.expectedClosingDate)}</span>
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {index < transactions.length - 1 && <Separator className="my-4" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about this deal
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <ScrollArea className="max-h-[600px] pr-4">
              <div className="space-y-6">
                {/* Transaction Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {getContactName(selectedTransaction.buyerContactId) || selectedTransaction.buyerName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Created on {formatDate(selectedTransaction.createdAt)}
                    </p>
                  </div>
                  {getStatusBadge(selectedTransaction.status)}
                </div>

                <Separator />

                {/* Buyer Information */}
                <div>
                  <h4 className="font-medium mb-3">Buyer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{selectedTransaction.buyerName}</span>
                    </div>
                    {selectedTransaction.buyerContact && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <span>{selectedTransaction.buyerContact}</span>
                      </div>
                    )}
                    {selectedTransaction.buyerEmail && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedTransaction.buyerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Financial Information */}
                <div>
                  <h4 className="font-medium mb-3">Financial Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accepted Offer:</span>
                      <span className="font-medium">{formatPKR(selectedTransaction.acceptedOfferAmount)}</span>
                    </div>
                    {selectedTransaction.paymentPlan && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Paid:</span>
                          <span className="text-green-600 font-medium">
                            {formatPKR(getTotalPaid(selectedTransaction))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span className="text-orange-600 font-medium">
                            {formatPKR(getTotalAmount(selectedTransaction) - getTotalPaid(selectedTransaction))}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Closing:</span>
                      <span>{formatDate(selectedTransaction.expectedClosingDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Plan */}
                {selectedTransaction.paymentPlan && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Payment Plan</h4>
                      <div className="space-y-2">
                        {selectedTransaction.paymentPlan.installments.map((installment, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{installment.description}</p>
                              <p className="text-xs text-muted-foreground">
                                Due: {formatDate(installment.dueDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatPKR(installment.amount)}</p>
                              <div className="flex items-center gap-1">
                                {installment.status === 'paid' ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600">Paid</span>
                                  </>
                                ) : installment.status === 'overdue' ? (
                                  <>
                                    <XCircle className="h-3 w-3 text-red-600" />
                                    <span className="text-xs text-red-600">Overdue</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 text-orange-600" />
                                    <span className="text-xs text-orange-600">Pending</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
