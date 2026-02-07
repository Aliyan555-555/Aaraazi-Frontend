/**
 * Environment Configuration
 * Centralized environment variables with type safety and validation
 */

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const getOptionalEnvVar = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

export const env = {
  // API Configuration
  api: {
    url: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000'),
    timeout: parseInt(getOptionalEnvVar('NEXT_PUBLIC_API_TIMEOUT', '30000')),
  },

  // NextAuth Configuration
  nextAuth: {
    url: getEnvVar('NEXTAUTH_URL', 'http://localhost:3001'),
    secret: getEnvVar('NEXTAUTH_SECRET'),
  },

  // Session Configuration
  session: {
    maxAge: parseInt(getOptionalEnvVar('SESSION_MAX_AGE', '604800')), // 7 days
    updateAge: parseInt(getOptionalEnvVar('SESSION_UPDATE_AGE', '86400')), // 1 day
  },

  // Runtime
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

export default env;
