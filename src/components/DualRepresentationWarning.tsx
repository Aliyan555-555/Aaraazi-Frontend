/**
 * Dual Representation Warning - V3.0
 * Warning component displayed when same agent represents both sides
 * Ensures compliance and disclosure requirements
 */

import React from 'react';
import { AlertTriangle, Info, Shield, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DualRepresentationWarningProps {
  agentName: string;
  propertyAddress: string;
  sellCycleId?: string;
  purchaseCycleId?: string;
  severity?: 'warning' | 'info' | 'critical';
  onViewDetails?: () => void;
  onAcknowledge?: () => void;
  showActions?: boolean;
}

export function DualRepresentationWarning({
  agentName,
  propertyAddress,
  sellCycleId,
  purchaseCycleId,
  severity = 'warning',
  onViewDetails,
  onAcknowledge,
  showActions = true,
}: DualRepresentationWarningProps) {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-300',
          icon: 'text-red-600',
          title: 'text-red-900',
          text: 'text-red-800',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-300',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          text: 'text-yellow-800',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-300',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          text: 'text-blue-800',
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <Alert className={`${styles.container} border-2`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 mt-0.5 ${styles.icon}`} />
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div>
            <AlertTitle className={`flex items-center gap-2 ${styles.title}`}>
              Dual Representation Detected
              {severity === 'critical' && (
                <Badge variant="destructive">Action Required</Badge>
              )}
            </AlertTitle>
            <AlertDescription className={`mt-2 ${styles.text}`}>
              <strong>{agentName}</strong> is representing both the buyer and seller for{' '}
              <strong>{propertyAddress}</strong>.
            </AlertDescription>
          </div>

          {/* Important Notice */}
          <div className="bg-white/60 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Shield className={`h-4 w-4 mt-0.5 ${styles.icon}`} />
              <div>
                <p className={`font-medium ${styles.title}`}>
                  Disclosure Required
                </p>
                <p className={`text-xs ${styles.text} mt-1`}>
                  Both parties must be informed of the dual representation and provide written consent.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Info className={`h-4 w-4 mt-0.5 ${styles.icon}`} />
              <div>
                <p className={`font-medium ${styles.title}`}>
                  Impartiality Required
                </p>
                <p className={`text-xs ${styles.text} mt-1`}>
                  Agent must remain neutral and cannot favor either party in negotiations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FileText className={`h-4 w-4 mt-0.5 ${styles.icon}`} />
              <div>
                <p className={`font-medium ${styles.title}`}>
                  Documentation
                </p>
                <p className={`text-xs ${styles.text} mt-1`}>
                  Maintain detailed records of all communications and ensure transparency throughout the transaction.
                </p>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-white/60 rounded-lg p-3">
            <p className={`text-xs font-medium ${styles.title} mb-2`}>
              Recommended Actions:
            </p>
            <ul className={`text-xs ${styles.text} space-y-1`}>
              <li>✓ Obtain written consent from both parties</li>
              <li>✓ Disclose any conflicts of interest</li>
              <li>✓ Consider involving supervising broker</li>
              <li>✓ Document all decisions and communications</li>
              <li>✓ Advise parties to seek independent legal counsel</li>
            </ul>
          </div>

          {/* Cycle Information */}
          {(sellCycleId || purchaseCycleId) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {sellCycleId && (
                <div className="bg-white/60 rounded p-2">
                  <p className="text-muted-foreground">Sell Cycle ID</p>
                  <p className={`font-mono ${styles.title} truncate`}>{sellCycleId}</p>
                </div>
              )}
              {purchaseCycleId && (
                <div className="bg-white/60 rounded p-2">
                  <p className="text-muted-foreground">Purchase Cycle ID</p>
                  <p className={`font-mono ${styles.title} truncate`}>{purchaseCycleId}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {showActions && (onViewDetails || onAcknowledge) && (
            <div className="flex gap-2 pt-2">
              {onViewDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onViewDetails}
                  className="flex-1"
                >
                  View Full Details
                </Button>
              )}
              {onAcknowledge && (
                <Button
                  size="sm"
                  onClick={onAcknowledge}
                  className={
                    severity === 'critical'
                      ? 'flex-1 bg-red-600 hover:bg-red-700'
                      : 'flex-1'
                  }
                >
                  {severity === 'critical' ? 'Acknowledge Risk' : 'I Understand'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

/**
 * Compact version for inline use
 */
export function DualRepresentationBadge({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <Badge
      variant="outline"
      className="bg-yellow-50 border-yellow-300 text-yellow-800 cursor-pointer hover:bg-yellow-100"
      onClick={onClick}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      Dual Rep
    </Badge>
  );
}

/**
 * Banner version for page-level warnings
 */
export function DualRepresentationBanner({
  agentName,
  propertyAddress,
  onDismiss,
  onLearnMore,
}: {
  agentName: string;
  propertyAddress: string;
  onDismiss?: () => void;
  onLearnMore?: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-900">
            Dual Representation Notice
          </h3>
          <p className="text-sm text-yellow-800 mt-1">
            <strong>{agentName}</strong> represents both parties for <strong>{propertyAddress}</strong>.
            Ensure proper disclosure and consent procedures are followed.
          </p>
          <div className="flex gap-2 mt-3">
            {onLearnMore && (
              <Button size="sm" variant="outline" onClick={onLearnMore}>
                Learn More
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
