// Comprehensive error reporting and monitoring system

export interface ErrorReport {
  id: string;
  timestamp: string;
  type:
    | "validation"
    | "storage"
    | "network"
    | "component"
    | "data"
    | "user"
    | "system";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details?: any;
  userAgent?: string;
  url?: string;
  userId?: string;
  componentStack?: string;
  context?: Record<string, any>;
}

export class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: ErrorReport[] = [];
  private maxErrors = 100; // Keep last 100 errors
  private reportingEnabled = true;

  private constructor() {
    this.loadStoredErrors();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  // Report an error
  report(
    type: ErrorReport["type"],
    severity: ErrorReport["severity"],
    message: string,
    details?: any,
    context?: Record<string, any>,
  ): void {
    if (!this.reportingEnabled) return;

    const error: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type,
      severity,
      message,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      context,
    };

    this.addError(error);
    this.logError(error);

    // For critical errors, show user notification
    if (severity === "critical") {
      this.showCriticalErrorNotification(error);
    }
  }

  // Report validation errors
  reportValidationError(field: string, message: string, value?: any): void {
    this.report("validation", "low", `Validation failed for ${field}`, {
      field,
      value,
      validationMessage: message,
    });
  }

  // Report storage errors
  reportStorageError(operation: string, key: string, error: any): void {
    this.report("storage", "medium", `Storage ${operation} failed for ${key}`, {
      operation,
      key,
      error: error instanceof Error ? error.message : error,
    });
  }

  // Report component errors
  reportComponentError(
    componentName: string,
    error: Error,
    errorInfo?: any,
  ): void {
    this.report("component", "high", `Component error in ${componentName}`, {
      componentName,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
    });
  }

  // Report data inconsistency errors
  reportDataError(dataType: string, issue: string, data?: any): void {
    this.report(
      "data",
      "medium",
      `Data inconsistency in ${dataType}: ${issue}`,
      {
        dataType,
        issue,
        data,
      },
    );
  }

  // Report user action errors
  reportUserError(action: string, error: string, context?: any): void {
    this.report("user", "low", `User action failed: ${action}`, {
      action,
      error,
      context,
    });
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: number; // Last 24 hours
  } {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      recent: 0,
    };

    this.errors.forEach((error) => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

      // Count by severity
      stats.bySeverity[error.severity] =
        (stats.bySeverity[error.severity] || 0) + 1;

      // Count recent errors
      if (new Date(error.timestamp) > yesterday) {
        stats.recent++;
      }
    });

    return stats;
  }

  // Get recent errors
  getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errors
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  }

  // Get errors by type
  getErrorsByType(type: ErrorReport["type"]): ErrorReport[] {
    return this.errors.filter((error) => error.type === type);
  }

  // Get critical errors
  getCriticalErrors(): ErrorReport[] {
    return this.errors.filter((error) => error.severity === "critical");
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = [];
    this.saveErrors();
  }

  // Export errors for debugging
  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }

  // Enable/disable error reporting
  setReportingEnabled(enabled: boolean): void {
    this.reportingEnabled = enabled;
  }

  private addError(error: ErrorReport): void {
    this.errors.push(error);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    this.saveErrors();
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(error: ErrorReport): void {
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.type.toUpperCase()}] ${error.message}`, error.details);
  }

  private getLogMethod(
    severity: ErrorReport["severity"],
  ): (...args: any[]) => void {
    switch (severity) {
      case "critical":
      case "high":
        return console.error;
      case "medium":
        return console.warn;
      case "low":
      default:
        return console.log;
    }
  }

  private showCriticalErrorNotification(error: ErrorReport): void {
    // This would integrate with your notification system
    logger.error("CRITICAL ERROR:", error.message);

    // You could show a toast notification here
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("criticalError", { detail: error }));
    }
  }

  private loadStoredErrors(): void {
    try {
      const stored = localStorage.getItem("error_reports");
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (error) {
      logger.warn("Failed to load stored errors:", error);
    }
  }

  private saveErrors(): void {
    try {
      localStorage.setItem("error_reports", JSON.stringify(this.errors));
    } catch (error) {
      logger.warn("Failed to save errors:", error);
      // If storage is full, clear old errors and try again
      this.errors = this.errors.slice(-50);
      try {
        localStorage.setItem("error_reports", JSON.stringify(this.errors));
      } catch (retryError) {
        logger.error("Failed to save errors even after cleanup:", retryError);
      }
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.report("system", "high", "Unhandled promise rejection", {
        reason: event.reason,
        promise: event.promise,
      });
    });

    // Handle global JavaScript errors
    window.addEventListener("error", (event) => {
      this.report("system", "high", "Global JavaScript error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance();

// Convenience functions
export const reportError = (
  type: ErrorReport["type"],
  severity: ErrorReport["severity"],
  message: string,
  details?: any,
  context?: Record<string, any>,
) => {
  errorReporter.report(type, severity, message, details, context);
};

export const reportValidationError = (
  field: string,
  message: string,
  value?: any,
) => {
  errorReporter.reportValidationError(field, message, value);
};

export const reportStorageError = (
  operation: string,
  key: string,
  error: any,
) => {
  errorReporter.reportStorageError(operation, key, error);
};

export const reportComponentError = (
  componentName: string,
  error: Error,
  errorInfo?: any,
) => {
  errorReporter.reportComponentError(componentName, error, errorInfo);
};

export const reportDataError = (
  dataType: string,
  issue: string,
  data?: any,
) => {
  errorReporter.reportDataError(dataType, issue, data);
};

export const reportUserError = (
  action: string,
  error: string,
  context?: any,
) => {
  errorReporter.reportUserError(action, error, context);
};
