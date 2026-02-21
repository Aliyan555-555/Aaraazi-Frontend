/**
 * Migration Dashboard - V3.0
 * UI for managing data migration from to V3
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Database,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Shield,
  Zap,
} from 'lucide-react';
import {
  getMigrationStatus,
  getBackupInfo,
  migrateAllData,
  backupExistingData,
  restoreFromBackup,
  resetMigration,
  validateMigration,
  exportAllData,
  importData,
  MigrationStatus,
} from '../lib/migration';
import { toast } from 'sonner';

export function MigrationDashboard() {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = () => {
    const status = getMigrationStatus();
    const backup = getBackupInfo();
    setMigrationStatus(status);
    setBackupInfo(backup);

    // If migration complete, validate
    if (status.isComplete) {
      const validation = validateMigration();
      setValidationResult(validation);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('This will migrate your data to V3.0 structure. A backup will be created first. Continue?')) {
      return;
    }

    setIsProcessing(true);
    toast.loading('Migrating data...');

    // Simulate async to allow UI to update
    setTimeout(() => {
      const result = migrateAllData();
      setMigrationStatus(result);

      if (result.isComplete) {
        toast.dismiss();
        toast.success(`Migration complete! Migrated ${result.propertiesMigrated} properties.`);
        loadStatus();
      } else {
        toast.dismiss();
        toast.error('Migration failed. Check console for details.');
      }

      setIsProcessing(false);
    }, 500);
  };

  const handleBackup = () => {
    toast.loading('Creating backup...');
    const success = backupExistingData();
    toast.dismiss();

    if (success) {
      toast.success('Backup created successfully!');
      loadStatus();
    } else {
      toast.error('Backup failed');
    }
  };

  const handleRestore = () => {
    if (!confirm('This will restore data from the last backup. Current data will be overwritten. Continue?')) {
      return;
    }

    toast.loading('Restoring from backup...');
    const success = restoreFromBackup();
    toast.dismiss();

    if (success) {
      toast.success('Data restored successfully!');
      window.location.reload();
    } else {
      toast.error('Restore failed');
    }
  };

  const handleValidate = () => {
    const result = validateMigration();
    setValidationResult(result);

    if (result.isValid) {
      toast.success('Validation passed! All data is correct.');
    } else {
      toast.error(`Validation found ${result.issues.length} issues`);
    }
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estatemanager-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const success = importData(event.target.result);
          if (success) {
            toast.success('Data imported successfully!');
            window.location.reload();
          } else {
            toast.error('Import failed');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (!confirm('This will reset migration status. Continue?')) {
      return;
    }
    resetMigration();
    toast.success('Migration status reset');
    loadStatus();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl flex items-center gap-2 mb-1">
          <Database className="h-6 w-6" />
          Data Migration Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Migrate your data from to V3.0 structure
        </p>
      </div>

      {/* Migration Status */}
      {migrationStatus?.isComplete ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Migration Complete!</AlertTitle>
          <AlertDescription className="text-green-800">
            Data was successfully migrated on{' '}
            {migrationStatus.timestamp && new Date(migrationStatus.timestamp).toLocaleString()}.
            {migrationStatus.propertiesMigrated && (
              <> Migrated {migrationStatus.propertiesMigrated} properties.</>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Migration Needed</AlertTitle>
          <AlertDescription className="text-blue-800">
            Your data needs to be migrated to the new V3.0 structure. This is a one-time process.
          </AlertDescription>
        </Alert>
      )}

      {/* Backup Status */}
      {backupInfo?.exists && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Backup Available</AlertTitle>
          <AlertDescription>
            Last backup created: {backupInfo.timestamp && new Date(backupInfo.timestamp).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Errors */}
      {migrationStatus?.errors && migrationStatus.errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Migration Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {migrationStatus.errors.map((error, idx) => (
                <li key={idx} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {validationResult && (
        <Card className={validationResult.isValid ? 'border-green-200' : 'border-yellow-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-2xl font-bold">{validationResult.summary.v3Properties}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Sell Cycles</p>
                <p className="text-2xl font-bold">{validationResult.summary.sellCycles}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Purchase Cycles</p>
                <p className="text-2xl font-bold">{validationResult.summary.purchaseCycles}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Rent Cycles</p>
                <p className="text-2xl font-bold">{validationResult.summary.rentCycles}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Buyer Requirements</p>
                <p className="text-2xl font-bold">{validationResult.summary.buyerRequirements}</p>
              </div>
            </div>

            {/* Issues */}
            {!validationResult.isValid && validationResult.issues.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-medium text-yellow-900 mb-2">Issues Found:</p>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.issues.map((issue: string, idx: number) => (
                    <li key={idx} className="text-sm text-yellow-800">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.isValid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-900 font-medium">✓ All validation checks passed!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Migration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Migration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {migrationStatus?.isComplete
                ? 'Migration has already been completed. You can re-run if needed.'
                : 'Click below to start the migration process. A backup will be created automatically.'}
            </p>
            <Button
              onClick={handleMigrate}
              disabled={isProcessing}
              className="w-full"
              variant={migrationStatus?.isComplete ? 'outline' : 'default'}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {migrationStatus?.isComplete ? 'Re-run Migration' : 'Start Migration'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Verify that all data has been migrated correctly and is in the proper V3.0 format.
            </p>
            <Button onClick={handleValidate} variant="outline" className="w-full">
              <CheckCircle className="mr-2 h-4 w-4" />
              Validate Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={handleBackup} variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Create Backup
            </Button>
            <Button
              onClick={handleRestore}
              variant="outline"
              disabled={!backupInfo?.exists}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Restore from Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import/Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import / Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button onClick={handleImport} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Export your data as JSON for external backup, or import previously exported data.
          </p>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between"
          >
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Advanced Options
            </CardTitle>
            <Badge variant="outline">Danger Zone</Badge>
          </button>
        </CardHeader>
        {showAdvanced && (
          <CardContent>
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  These actions can result in data loss. Use with caution.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={handleReset}
                variant="destructive"
                size="sm"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reset Migration Status
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Info Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Database className="h-5 w-5" />
            About V3.0 Migration
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>What's changing:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Properties are now permanent physical assets (not listings)</li>
            <li>Cycles track all buy/sell/rent activities on properties</li>
            <li>Properties can have multiple simultaneous cycles</li>
            <li>Better tracking of ownership history</li>
            <li>Support for agency investments and investor deals</li>
          </ul>
          
          <p className="pt-2"><strong>Migration process:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Automatic backup is created before migration</li>
            <li>Properties are converted to V3.0 structure</li>
            <li>Old "for-sale" listings become Sell Cycles</li>
            <li>Old "for-rent" listings become Rent Cycles</li>
            <li>All data is preserved - nothing is lost</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
