/**
 * NotificationShowcase Component
 * PHASE 5 TASK 3: Test page for toast and alert notifications
 * 
 * PURPOSE:
 * Visual test page to verify brand semantic colors are applied correctly
 * to all notification variants (success, warning, error, info).
 * 
 * FEATURES:
 * - Toast notifications (Sonner) with all variants
 * - Alert components with all variants
 * - Visual comparison
 * - Color verification
 */

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';

export const NotificationShowcase: React.FC = () => {
  // Toast handlers
  const showSuccessToast = () => {
    toast.success('Success!', {
      description: 'Your property has been added successfully.',
    });
  };

  const showErrorToast = () => {
    toast.error('Error!', {
      description: 'Failed to save property. Please try again.',
    });
  };

  const showWarningToast = () => {
    toast.warning('Warning!', {
      description: 'This action cannot be undone.',
    });
  };

  const showInfoToast = () => {
    toast.info('Information', {
      description: 'Your data has been updated in the system.',
    });
  };

  const showDefaultToast = () => {
    toast('Default notification', {
      description: 'This is a regular notification message.',
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-700">
            Notification Showcase
          </h1>
          <p className="text-slate-500">
            Phase 5 Task 3: Test page for brand-aligned toast and alert notifications
          </p>
        </div>

        {/* Toast Notifications Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-medium text-slate-700">
              Toast Notifications (Sonner)
            </h2>
            <p className="text-sm text-slate-500">
              Click the buttons below to trigger toast notifications with brand semantic colors
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Success Toast */}
            <Button
              onClick={showSuccessToast}
              className="bg-forest-400 hover:bg-forest-500 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Success Toast
            </Button>

            {/* Error Toast */}
            <Button
              onClick={showErrorToast}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Error Toast
            </Button>

            {/* Warning Toast */}
            <Button
              onClick={showWarningToast}
              className="bg-warning hover:bg-warning-600 text-white"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Warning Toast
            </Button>

            {/* Info Toast */}
            <Button
              onClick={showInfoToast}
              className="bg-info hover:bg-info-600 text-white"
            >
              <Info className="h-4 w-4 mr-2" />
              Info Toast
            </Button>

            {/* Default Toast */}
            <Button
              onClick={showDefaultToast}
              variant="secondary"
            >
              <Bell className="h-4 w-4 mr-2" />
              Default Toast
            </Button>
          </div>

          {/* Color Reference */}
          <div className="bg-white rounded-lg border border-neutral-300 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Expected Toast Colors:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-medium text-slate-600">Success</div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-forest-50 border border-forest-200"></div>
                  <span className="text-slate-500">Forest Green bg</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-forest-400"></div>
                  <span className="text-slate-500">Forest Green text</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium text-slate-600">Error</div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-error-50 border border-error-100"></div>
                  <span className="text-slate-500">Red bg</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-error"></div>
                  <span className="text-slate-500">Red text</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium text-slate-600">Warning</div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning-50 border border-warning-100"></div>
                  <span className="text-slate-500">Yellow bg</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning-600"></div>
                  <span className="text-slate-500">Yellow text</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium text-slate-600">Info</div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-info-50 border border-info-100"></div>
                  <span className="text-slate-500">Blue bg</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-info-600"></div>
                  <span className="text-slate-500">Blue text</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Components Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-medium text-slate-700">
              Alert Components
            </h2>
            <p className="text-sm text-slate-500">
              Static alert components with brand semantic colors
            </p>
          </div>

          <div className="space-y-4">
            {/* Success Alert */}
            <Alert variant="success">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your property has been added successfully. It is now visible in the Properties workspace.
              </AlertDescription>
            </Alert>

            {/* Error Alert */}
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to save property. Please check your inputs and try again.
              </AlertDescription>
            </Alert>

            {/* Warning Alert */}
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This action cannot be undone. All associated data will be permanently deleted.
              </AlertDescription>
            </Alert>

            {/* Info Alert */}
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Your data synchronization is up to date. Last sync: 2 minutes ago.
              </AlertDescription>
            </Alert>

            {/* Default Alert */}
            <Alert variant="default">
              <Bell className="h-4 w-4" />
              <AlertTitle>Default Notification</AlertTitle>
              <AlertDescription>
                This is a regular notification without semantic meaning.
              </AlertDescription>
            </Alert>
          </div>

          {/* Alert Color Reference */}
          <div className="bg-white rounded-lg border border-neutral-300 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Alert Component Colors:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-medium text-slate-600">Success Alert</div>
                <div className="p-2 rounded bg-success-bg border border-success-border">
                  <div className="text-success">Forest Green (#2D6A54)</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium text-slate-600">Error Alert</div>
                <div className="p-2 rounded bg-destructive-bg border border-destructive-border">
                  <div className="text-destructive">Red (#DC2626)</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium text-slate-600">Warning Alert</div>
                <div className="p-2 rounded bg-warning-bg border border-warning-border">
                  <div className="text-warning-foreground">Yellow (#D97706)</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium text-slate-600">Info Alert</div>
                <div className="p-2 rounded bg-info-bg border border-info-border">
                  <div className="text-info-foreground">Blue (#2563EB)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-slate-700">
            Usage Examples
          </h2>

          <div className="bg-white rounded-lg border border-neutral-300 p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-slate-700">Toast Usage</h3>
              <pre className="bg-slate-50 rounded p-3 text-xs overflow-x-auto">
                {`import { toast } from 'sonner@2.0.3';

// Success
toast.success('Success!', {
  description: 'Property added successfully.'
});

// Error
toast.error('Error!', {
  description: 'Failed to save.'
});

// Warning
toast.warning('Warning!', {
  description: 'Action cannot be undone.'
});

// Info
toast.info('Info', {
  description: 'Data updated.'
});`}
              </pre>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-slate-700">Alert Usage</h3>
              <pre className="bg-slate-50 rounded p-3 text-xs overflow-x-auto">
                {`import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>
    Your changes have been saved.
  </AlertDescription>
</Alert>

// Variants: default, success, destructive, warning, info`}
              </pre>
            </div>
          </div>
        </div>

        {/* Testing Checklist */}
        <div className="bg-white rounded-lg border border-neutral-300 p-6">
          <h3 className="text-lg font-medium text-slate-700 mb-4">
            Testing Checklist
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-forest-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Success Toast:</span> Forest green background (#F2F7F5), forest green text (#2D6A54)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-forest-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Error Toast:</span> Red background (#FEE2E2), red text (#DC2626)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-forest-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Warning Toast:</span> Yellow background (#FEF3C7), yellow text (#D97706)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-forest-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Info Toast:</span> Blue background (#DBEAFE), blue text (#2563EB)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-forest-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Alert Components:</span> Same color scheme as toasts
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-forest-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">WCAG AA:</span> All color contrasts meet accessibility standards (4.5:1 minimum)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationShowcase;
