/**
 * Migration Checker - V3.0
 * Automatic check on app load to prompt migration if needed
 */

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Database, Shield, Zap } from 'lucide-react';
import { getMigrationStatus, migrateAllData, MigrationStatus } from '../lib/migration';
import { toast } from 'sonner';

interface MigrationCheckerProps {
  onMigrationComplete?: () => void;
}

export function MigrationChecker({ onMigrationComplete }: MigrationCheckerProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationStatus | null>(null);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = () => {
    const status = getMigrationStatus();
    
    // If migration not complete, check if there's data
    if (!status.isComplete) {
      const v2Data = localStorage.getItem('properties');
      if (v2Data) {
        // data exists, prompt migration
        setShowPrompt(true);
      }
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    toast.loading('Migrating data to V3.0...');

    // Simulate async to allow UI to update
    setTimeout(() => {
      const result = migrateAllData();
      setMigrationResult(result);
      setIsMigrating(false);
      toast.dismiss();

      if (result.isComplete) {
        toast.success(`Migration complete! Migrated ${result.propertiesMigrated} properties.`);
        setTimeout(() => {
          setShowPrompt(false);
          if (onMigrationComplete) {
            onMigrationComplete();
          }
        }, 2000);
      } else {
        toast.error('Migration encountered errors. Please check the migration dashboard.');
      }
    }, 1000);
  };

  const handleSkip = () => {
    setShowPrompt(false);
    toast.info('You can migrate later from Settings > Data Migration');
  };

  if (!showPrompt) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Data Migration Required
          </DialogTitle>
          <DialogDescription>
            Welcome to aaraazi V3.0! Your data needs to be migrated to the new structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info */}
          <Alert className="bg-blue-50 border-blue-200">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>What's new in V3.0:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Properties are now permanent assets (not temporary listings)</li>
                <li>Track multiple buy/sell/rent cycles on each property</li>
                <li>Better ownership history tracking</li>
                <li>Support for agency investments and investor deals</li>
                <li>Internal match detection for sell + purchase cycles</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Safety */}
          <Alert className="bg-green-50 border-green-200">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Your data is safe:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Automatic backup is created before migration</li>
                <li>All existing data is preserved</li>
                <li>You can restore from backup if needed</li>
                <li>Process typically takes less than 1 second</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Migration Result */}
          {migrationResult && (
            <>
              {migrationResult.isComplete ? (
                <Alert className="bg-green-50 border-green-200">
                  <Zap className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Migration Successful!</strong>
                    <p className="mt-1 text-sm">
                      Migrated {migrationResult.propertiesMigrated} properties successfully.
                      Redirecting...
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Migration encountered errors:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      {migrationResult.errors?.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Warning */}
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900 text-sm">
              <strong>Important:</strong> If you skip migration now, you can migrate later from
              Settings → Data Migration. However, new features will work best with migrated data.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
              disabled={isMigrating}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleMigrate}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isMigrating}
            >
              {isMigrating ? (
                <>
                  <Database className="mr-2 h-4 w-4 animate-pulse" />
                  Migrating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Migrate Now
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            Need help? Visit the Migration Dashboard in Settings for detailed options.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
