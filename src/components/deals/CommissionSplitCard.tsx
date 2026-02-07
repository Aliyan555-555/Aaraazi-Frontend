/**
 * CommissionSplitCard Component
 * 
 * Displays individual commission split information
 * Supports: internal agents, external brokers, and agency splits
 */

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CommissionStatusBadge, CommissionStatus } from './CommissionStatusBadge';
import { formatPKR } from '../../lib/currency';
import { 
  User, 
  Users, 
  Building2, 
  Calendar,
  CheckCircle2,
  Info,
  Mail,
  Phone
} from 'lucide-react';

interface CommissionSplitCardProps {
  type: 'primary' | 'secondary' | 'agency' | 'internal' | 'external';
  name: string;
  percentage: number;
  amount: number;
  status: CommissionStatus;
  payoutTrigger?: string;
  paidDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  email?: string;
  phone?: string;
  isEditable?: boolean;
  onRemove?: () => void;
}

export function CommissionSplitCard({
  type,
  name,
  percentage,
  amount,
  status,
  payoutTrigger,
  paidDate,
  approvedBy,
  approvedAt,
  notes,
  email,
  phone,
  isEditable = false,
  onRemove
}: CommissionSplitCardProps) {
  const getTypeConfig = () => {
    switch (type) {
      case 'primary':
        return {
          label: 'Primary Agent',
          typeBadge: 'Internal Agent',
          icon: <User className="h-5 w-5 text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'secondary':
        return {
          label: 'Secondary Agent',
          typeBadge: 'Internal Agent',
          icon: <Users className="h-5 w-5 text-purple-600" />,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'internal':
        return {
          label: 'Internal Agent',
          typeBadge: 'Internal Agent',
          icon: <User className="h-5 w-5 text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'external':
        return {
          label: 'External Broker',
          typeBadge: 'External Broker',
          icon: <Building2 className="h-5 w-5 text-orange-600" />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'agency':
        return {
          label: 'Agency Split',
          typeBadge: null,
          icon: <Building2 className="h-5 w-5 text-gray-600" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getTypeConfig();

  const getPayoutTriggerLabel = (trigger?: string) => {
    if (!trigger) return null;
    
    switch (trigger) {
      case 'booking':
        return 'At Booking';
      case '50-percent':
        return 'At 50% Payment';
      case 'possession':
        return 'At Possession';
      case 'full-payment':
        return 'At Full Payment';
      default:
        return trigger;
    }
  };

  return (
    <Card className={`border ${config.borderColor} ${config.bgColor} p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-white rounded-lg border border-gray-200">
            {config.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {config.typeBadge && (
                <Badge 
                  variant="secondary" 
                  className={type === 'external' ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-blue-100 text-blue-800 border-blue-300'}
                >
                  {config.typeBadge}
                </Badge>
              )}
            </div>
            <h3 className="font-medium">{name}</h3>
            {(email || phone) && (
              <div className="flex flex-wrap gap-3 mt-1">
                {email && (
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {email}
                  </span>
                )}
                {phone && (
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {phone}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CommissionStatusBadge status={status} />
        </div>
      </div>

      {/* Amount & Percentage */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Amount</p>
          <p className="text-lg font-semibold text-gray-900">{formatPKR(amount)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Percentage</p>
          <p className="text-lg font-semibold text-gray-900">{percentage}%</p>
        </div>
      </div>

      {/* Additional Details */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        {payoutTrigger && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Payout: <span className="font-medium text-gray-900">{getPayoutTriggerLabel(payoutTrigger)}</span>
            </span>
          </div>
        )}

        {approvedAt && approvedBy && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-600">
              Approved by {approvedBy} on {new Date(approvedAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {paidDate && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-600">
              Paid on {new Date(paidDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {notes && (
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-gray-500 mt-0.5" />
            <span className="text-sm text-gray-600">{notes}</span>
          </div>
        )}
      </div>
    </Card>
  );
}