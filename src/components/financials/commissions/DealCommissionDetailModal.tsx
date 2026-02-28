import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { formatPKR } from '../../../lib/currency';
// [STUBBED] import { getDealById } from '../../../lib/deals';
// [STUBBED] import { getPropertyById } from '../../../lib/data';
import { Eye, Building2, DollarSign, Users, User, Briefcase, CheckCircle, Clock } from 'lucide-react';
import type { Deal } from '../../../types/deals';

// ===== STUBS for removed prototype functions =====
const getDealById = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getPropertyById = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface DealCommissionDetailModalProps {
  open: boolean;
  onClose: () => void;
  dealId: string | null;
  onViewDeal?: (dealId: string) => void;
}

export const DealCommissionDetailModal: React.FC<DealCommissionDetailModalProps> = ({
  open,
  onClose,
  dealId,
  onViewDeal,
}) => {
  const deal = dealId ? (getDealById(dealId) as Deal | null) : null;

  const formatDate = (s: string | undefined) =>
    s ? new Date(s).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Deal Commission Details
          </DialogTitle>
          <DialogDescription>
            {deal ? `Full commission breakdown for ${deal.dealNumber}` : 'Commission details'}
          </DialogDescription>
        </DialogHeader>

        {!deal ? (
          <div className="py-8 text-center text-gray-500">Deal not found.</div>
        ) : dealId ? (
          <DealCommissionContent deal={deal} formatDate={formatDate} onViewDeal={onViewDeal} onClose={onClose} dealId={dealId} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

function DealCommissionContent({
  deal,
  formatDate,
  onViewDeal,
  onClose,
  dealId,
}: {
  deal: Deal;
  formatDate: (s: string | undefined) => string;
  onViewDeal?: (dealId: string) => void;
  onClose: () => void;
  dealId: string;
}) {
  const comm = deal.financial?.commission;
  const agreedPrice = deal.financial?.agreedPrice ?? 0;
  const totalCommission = comm?.total ?? 0;
  const rate = comm?.rate ?? 0;
  const split = comm?.split;
  const agents = (comm as { agents?: Array<{ id: string; name: string; percentage: number; amount: number; status: string; paidDate?: string; approvedAt?: string; approvedBy?: string }> })?.agents ?? [];
  const propertyId = deal.cycles?.sellCycle?.propertyId ?? (deal.cycles?.purchaseCycle as { propertyId?: string } | undefined)?.propertyId;
  const property = propertyId ? getPropertyById(propertyId) : null;
  const propertyTitle = property?.title ?? (propertyId ? `Property ${propertyId}` : '—');

  return (
    <div className="space-y-6 py-2">
          {/* Deal & Property */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-gray-50">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> Deal
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{deal.dealNumber}</p>
              <p className="text-sm text-gray-600">Status: {deal.lifecycle?.status ?? '—'}</p>
            </div>
            <div className="p-4 rounded-lg border bg-gray-50">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Building2 className="h-4 w-4" /> Property
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-1 truncate" title={propertyTitle}>
                {propertyTitle}
              </p>
            </div>
          </div>

          <Separator />

          {/* Agreed Price & Commission Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-green-200 bg-green-50">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Agreed Price
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatPKR(agreedPrice)}</p>
            </div>
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
              <p className="text-sm text-gray-600">Commission Rate</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{rate}%</p>
              <p className="text-sm text-gray-600 mt-0.5">Total commission: {formatPKR(totalCommission)}</p>
            </div>
          </div>

          <Separator />

          {/* Agency Commission */}
          {split?.agency && (
            <>
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Agency Commission
              </h4>
              <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Percentage</p>
                    <p className="font-semibold text-gray-900">{split.agency.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-semibold text-gray-900">{formatPKR(split.agency.amount ?? 0)}</p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Agents (split + agents array) */}
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4" /> Agent Commissions
          </h4>

          {split?.primaryAgent && deal.agents?.primary && (
            <div className="p-4 rounded-lg border bg-gray-50 space-y-2">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <User className="h-4 w-4" /> Primary Agent
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{deal.agents.primary.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Percentage</p>
                  <p className="font-medium text-gray-900">{split.primaryAgent.percentage}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-medium text-gray-900">{formatPKR(split.primaryAgent.amount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium capitalize">{split.primaryAgent.status}</p>
                </div>
              </div>
            </div>
          )}

          {split?.secondaryAgent && deal.agents?.secondary && (
            <div className="p-4 rounded-lg border bg-gray-50 space-y-2">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <User className="h-4 w-4" /> Secondary Agent
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{deal.agents.secondary.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Percentage</p>
                  <p className="font-medium text-gray-900">{split.secondaryAgent.percentage}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-medium text-gray-900">{formatPKR(split.secondaryAgent.amount ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium capitalize">{split.secondaryAgent.status}</p>
                </div>
              </div>
            </div>
          )}

          {agents.length > 0 && (
            <div className="space-y-3">
              {agents.map((a) => (
                <div key={a.id} className="p-4 rounded-lg border bg-gray-50 space-y-2">
                  <p className="text-sm font-medium text-gray-700">{a.name}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Percentage</p>
                      <p className="font-medium text-gray-900">{a.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-medium text-gray-900">{formatPKR(a.amount ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-medium capitalize">{a.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Approved</p>
                      <p className="font-medium text-gray-900">{formatDate(a.approvedAt)}</p>
                    </div>
                    {(a.paidDate || (a as { paidAt?: string }).paidAt) && (
                      <div>
                        <p className="text-xs text-gray-500">Paid</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(a.paidDate ?? (a as { paidAt?: string }).paidAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Received from client */}
          {comm?.receivedFromClient != null && (
            <>
              <Separator />
              <h4 className="text-sm font-semibold text-gray-700">Commission Received from Client</h4>
              <div className="p-4 rounded-lg border bg-gray-50 flex items-center gap-2">
                {comm.receivedFromClient ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {comm.receivedFromClient ? 'Yes' : 'Not yet received'}
                  </p>
                  {comm.receivedAt && (
                    <p className="text-sm text-gray-600">
                      {formatDate(comm.receivedAt)}
                      {comm.receivedByName && ` by ${comm.receivedByName}`}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {onViewDeal && dealId && (
            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={() => { onViewDeal(dealId); onClose(); }}>
                View full deal
              </Button>
            </div>
          )}
    </div>
  );
}
