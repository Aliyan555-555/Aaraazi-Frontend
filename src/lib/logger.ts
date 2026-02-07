/**
 * Logging Utility
 * Centralized logging with development/production mode support
 */

const isDevelopment =
  typeof import.meta !== "undefined" && import.meta.env?.DEV !== false;

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warning messages (always logged)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Log error messages (always logged)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log("[DEBUG]", ...args);
    }
  },

  /**
   * Log info messages with icon (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info("ℹ️", ...args);
    }
  },

  /**
   * Log success messages with icon (only in development)
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log("✅", ...args);
    }
  },
};

/**
 * Error handler utility
 */
export const handleError = (
  error: unknown,
  context: string,
  options?: {
    showToast?: boolean;
    rethrow?: boolean;
  },
) => {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  logger.error(`[${context}]`, errorMessage, error);

  if (options?.rethrow) {
    throw error;
  }

  return {
    success: false,
    error: errorMessage,
  };
};

/**
 * Async error wrapper
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context: string,
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`[${context}]`, errorMessage, error);
    return { success: false, error: errorMessage };
  }
};
