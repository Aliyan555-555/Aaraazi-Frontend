/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 * Design System Compliant
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-red-100">
                  <AlertTriangle className="size-6 text-red-600" />
                </div>
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    We encountered an unexpected error. Please try again.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-900 mb-2">
                    Error Details (Development Mode)
                  </p>
                  <p className="text-sm text-red-800 font-mono mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-red-700">
                      <summary className="cursor-pointer font-medium mb-1">
                        Component Stack
                      </summary>
                      <pre className="overflow-auto max-h-48 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* User-Friendly Message */}
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  This error has been logged and we'll look into it. You can try the following:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Refresh the page</li>
                  <li>Go back to the homepage</li>
                  <li>Clear your browser cache</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="size-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="size-4 mr-2" />
                  Go to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}