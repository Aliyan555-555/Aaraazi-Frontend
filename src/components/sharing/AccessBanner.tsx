/**
 * AccessBanner Component
 * Shows access level banner for shared cycles
 * 
 * Displays when an agent is viewing another agent's cycle
 * Shows what information is visible/hidden due to privacy controls
 */

import React from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

type AccessLevel = 'owner' | 'shared-full' | 'shared-limited' | 'none';

interface AccessBannerProps {
  accessLevel: AccessLevel;
  ownerName: string;
  cycleType: 'sell' | 'rent';
  protectedFields?: string[]; // Fields that are hidden
  visibleFields?: string[]; // Fields that are visible
  className?: string;
}

export const AccessBanner: React.FC<AccessBannerProps> = ({
  accessLevel,
  ownerName,
  cycleType,
  protectedFields = [],
  visibleFields = [],
  className = '',
}) => {
  // Don't show banner if user is owner
  if (accessLevel === 'owner') {
    return null;
  }

  // Access level configuration
  const getAccessConfig = () => {
    switch (accessLevel) {
      case 'shared-full':
        return {
          variant: 'default' as const,
          icon: <Eye className="h-4 w-4" />,
          title: 'Full Access',
          description: `You have full access to this ${cycleType} cycle shared by ${ownerName}`,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
        };
      case 'shared-limited':
        return {
          variant: 'default' as const,
          icon: <Shield className="h-4 w-4" />,
          title: 'Limited Access',
          description: `You have limited access to this ${cycleType} cycle. Some information is protected by ${ownerName}`,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
        };
      case 'none':
        return {
          variant: 'destructive' as const,
          icon: <Lock className="h-4 w-4" />,
          title: 'No Access',
          description: `You don't have permission to view this ${cycleType} cycle`,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
        };
      default:
        return {
          variant: 'default' as const,
          icon: <AlertCircle className="h-4 w-4" />,
          title: 'Unknown Access',
          description: 'Access level unknown',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
        };
    }
  };

  const config = getAccessConfig();

  // Field icons mapping
  const fieldIcons: Record<string, React.ReactNode> = {
    'seller-contact': <Phone className="h-3 w-3" />,
    'seller-name': <User className="h-3 w-3" />,
    'seller-email': <Mail className="h-3 w-3" />,
    'buyer-contact': <Phone className="h-3 w-3" />,
    'buyer-name': <User className="h-3 w-3" />,
    'buyer-email': <Mail className="h-3 w-3" />,
    'owner-contact': <Phone className="h-3 w-3" />,
    'owner-name': <User className="h-3 w-3" />,
    'tenant-contact': <Phone className="h-3 w-3" />,
    'tenant-name': <User className="h-3 w-3" />,
  };

  // Field labels mapping
  const fieldLabels: Record<string, string> = {
    'seller-contact': 'Seller Contact',
    'seller-name': 'Seller Name',
    'seller-email': 'Seller Email',
    'buyer-contact': 'Buyer Contact',
    'buyer-name': 'Buyer Name',
    'buyer-email': 'Buyer Email',
    'owner-contact': 'Owner Contact',
    'owner-name': 'Owner Name',
    'tenant-contact': 'Tenant Contact',
    'tenant-name': 'Tenant Name',
    'financial-details': 'Financial Details',
    'commission-details': 'Commission Info',
  };

  return (
    <div className={className}>
      <Alert className={`${config.bgColor} ${config.borderColor} border-2`}>
        <div className="flex items-start gap-3">
          <div className={`${config.textColor} mt-0.5`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold ${config.textColor}`}>
                {config.title}
              </h4>
              <Badge variant="outline" className="text-xs">
                Shared by {ownerName}
              </Badge>
            </div>
            <AlertDescription className={`${config.textColor} text-sm`}>
              {config.description}
            </AlertDescription>

            {/* Protected Fields */}
            {accessLevel === 'shared-limited' && protectedFields.length > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <div className="flex items-start gap-2">
                  <EyeOff className="h-4 w-4 text-amber-700 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 mb-2">
                      Protected Information:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {protectedFields.map((field) => (
                        <Badge
                          key={field}
                          variant="outline"
                          className="text-xs bg-white/50 border-amber-300 text-amber-800 gap-1"
                        >
                          {fieldIcons[field] || <Lock className="h-3 w-3" />}
                          {fieldLabels[field] || field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Visible Fields */}
            {accessLevel === 'shared-full' && visibleFields.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-700 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      You can view:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {visibleFields.slice(0, 5).map((field) => (
                        <Badge
                          key={field}
                          variant="outline"
                          className="text-xs bg-white/50 border-blue-300 text-blue-800 gap-1"
                        >
                          {fieldIcons[field] || <Eye className="h-3 w-3" />}
                          {fieldLabels[field] || field}
                        </Badge>
                      ))}
                      {visibleFields.length > 5 && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-white/50 border-blue-300 text-blue-800"
                        >
                          +{visibleFields.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Call to Action */}
            {accessLevel === 'shared-limited' && (
              <div className="mt-3 text-xs text-amber-700">
                💡 Tip: Submit an offer to get access to protected contact information
              </div>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
};
