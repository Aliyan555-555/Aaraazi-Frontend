/**
 * Permission Gate Component
 * Wraps components that require specific permissions
 * Shows appropriate UI based on user's role in the deal
 */

import React from 'react';
import { Deal, DealPermissions } from '../../types';
import { checkPermission, getPermissionErrorMessage } from '../../lib/dealPermissions';
import { Alert, AlertDescription } from '../ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  deal: Deal;
  userId: string;
  permission: keyof DealPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  deal,
  userId,
  permission,
  children,
  fallback,
  showMessage = true,
}) => {
  const hasPermission = checkPermission(userId, deal, permission);
  
  if (hasPermission) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showMessage) {
    return (
      <Alert className="bg-muted border-muted">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          {getPermissionErrorMessage(permission)}
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};

interface PermissionButtonProps {
  deal: Deal;
  userId: string;
  permission: keyof DealPermissions;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Button that is disabled based on permissions
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  deal,
  userId,
  permission,
  children,
  onClick,
  className = '',
  disabled = false,
}) => {
  const hasPermission = checkPermission(userId, deal, permission);
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || !hasPermission}
      className={className}
      title={!hasPermission ? getPermissionErrorMessage(permission) : undefined}
    >
      {children}
    </button>
  );
};
