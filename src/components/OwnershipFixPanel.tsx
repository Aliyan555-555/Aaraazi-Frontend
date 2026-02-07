/**
 * Ownership Fix Panel - Developer Tool
 * 
 * This component allows admins to check for and fix ownership type issues
 * for properties that were purchased but don't show in the correct portfolio.
 * 
 * TEMPORARY: This can be added to the Portfolio Management page or accessed
 * via a developer tools menu. After running the fix once, it can be removed.
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Wrench, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  fixAgencyOwnedProperties, 
  checkForOwnershipIssues,
  type FixResult 
} from '../lib/fixAgencyOwnership';
import { formatPropertyAddress } from '../lib/utils';

// Helper function to safely format address (handles both string and object)
const safeFormatAddress = (address: any): string => {
  if (!address) return 'Unknown Address';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    try {
      return formatPropertyAddress(address);
    } catch {
      return 'Invalid Address Format';
    }
  }
  return String(address);
};

export function OwnershipFixPanel() {
  const [checking, setChecking] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [checkResult, setCheckResult] = useState<ReturnType<typeof checkForOwnershipIssues> | null>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);

  const handleCheck = () => {
    setChecking(true);
    setCheckResult(null);
    setFixResult(null);
    
    setTimeout(() => {
      const result = checkForOwnershipIssues();
      setCheckResult(result);
      setChecking(false);
    }, 100);
  };

  const handleFix = () => {
    setFixing(true);
    setFixResult(null);
    
    setTimeout(() => {
      const result = fixAgencyOwnedProperties();
      setFixResult(result);
      setFixing(false);
      
      // Re-check after fixing
      setTimeout(() => {
        const checkResult = checkForOwnershipIssues();
        setCheckResult(checkResult);
      }, 100);
    }, 100);
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-yellow-600" />
          Property Ownership Fix Tool
        </CardTitle>
        <CardDescription>
          Check and fix properties that aren't showing in the correct portfolio due to missing owner type information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCheck}
            disabled={checking}
            variant="outline"
          >
            {checking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Check for Issues
              </>
            )}
          </Button>
          
          {checkResult && checkResult.hasIssues && (
            <Button
              onClick={handleFix}
              disabled={fixing}
              variant="default"
            >
              {fixing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Fix All Issues ({checkResult.issueCount})
                </>
              )}
            </Button>
          )}
        </div>

        {/* Check Results */}
        {checkResult && (
          <Alert variant={checkResult.hasIssues ? 'destructive' : 'default'}>
            {checkResult.hasIssues ? (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Issues Found</AlertTitle>
                <AlertDescription>
                  Found {checkResult.issueCount} {checkResult.issueCount === 1 ? 'property' : 'properties'} with incorrect owner type information.
                </AlertDescription>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>All Clear</AlertTitle>
                <AlertDescription>
                  No ownership issues found. All properties have correct owner type information.
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {/* Issues List */}
        {checkResult && checkResult.hasIssues && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Issues Details:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {checkResult.issues.map((issue, index) => (
                <div 
                  key={index}
                  className="text-sm p-3 bg-white rounded-md border border-gray-200"
                >
                  <div className="font-medium">{safeFormatAddress(issue.address)}</div>
                  <div className="text-xs text-gray-600 mt-1 space-y-1">
                    <div>
                      <span className="font-medium">Current Owner Type:</span>{' '}
                      <Badge variant="outline" className="ml-1">
                        {issue.currentOwnerType || 'undefined'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Expected Owner Type:</span>{' '}
                      <Badge variant="default" className="ml-1">
                        {issue.expectedOwnerType}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Purchaser Type:</span>{' '}
                      <span className="text-gray-700">{issue.purchaserType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fix Results */}
        {fixResult && (
          <Alert variant={fixResult.totalFixed > 0 ? 'default' : 'destructive'}>
            {fixResult.totalFixed > 0 ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Fix Complete</AlertTitle>
                <AlertDescription>
                  Successfully fixed {fixResult.totalFixed} out of {fixResult.totalScanned} scanned{' '}
                  {fixResult.totalScanned === 1 ? 'property' : 'properties'}.
                  {fixResult.errors.length > 0 && (
                    <span className="block mt-1 text-red-600">
                      {fixResult.errors.length} {fixResult.errors.length === 1 ? 'error' : 'errors'} occurred.
                    </span>
                  )}
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Changes Made</AlertTitle>
                <AlertDescription>
                  Scanned {fixResult.totalScanned} {fixResult.totalScanned === 1 ? 'property' : 'properties'}, no fixes needed.
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {/* Fixed Properties List */}
        {fixResult && fixResult.fixedProperties.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-700">Fixed Properties:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {fixResult.fixedProperties.map((fixed, index) => (
                <div 
                  key={index}
                  className="text-sm p-3 bg-green-50 rounded-md border border-green-200"
                >
                  <div className="font-medium text-green-900">{safeFormatAddress(fixed.address)}</div>
                  <div className="text-xs text-green-700 mt-1">
                    Updated from{' '}
                    <Badge variant="outline" className="mx-1">
                      {fixed.oldOwnerType || 'undefined'}
                    </Badge>
                    to
                    <Badge variant="default" className="mx-1 bg-green-600">
                      {fixed.newOwnerType}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors List */}
        {fixResult && fixResult.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-700">Errors:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {fixResult.errors.map((error, index) => (
                <div 
                  key={index}
                  className="text-sm p-2 bg-red-50 rounded-md border border-red-200"
                >
                  <div className="font-medium text-red-900">Property: {error.propertyId}</div>
                  <div className="text-xs text-red-700">{error.error}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="font-medium mb-1">How to use:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Check for Issues" to scan all properties for ownership problems</li>
            <li>If issues are found, click "Fix All Issues" to correct them</li>
            <li>Properties will be updated to have the correct owner type based on their purchase cycle</li>
            <li>After fixing, properties should appear in the correct portfolio (Agency/Investor/Client)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}