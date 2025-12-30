import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export const initSentry = () => {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enabled: !__DEV__, // Disable in development
    
    // Performance Monitoring
    tracesSampleRate: __DEV__ ? 0 : 0.2, // 20% of transactions in production
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds
    
    // Privacy & Security
    beforeSend: (event) => {
      // Scrub sensitive data from events
      if (event.request) {
        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['authorization'];
          delete event.request.headers['Cookie'];
          delete event.request.headers['cookie'];
        }
        
        // Remove query parameters that might contain tokens
        if (event.request.url) {
          const url = new URL(event.request.url);
          url.searchParams.delete('token');
          url.searchParams.delete('apiKey');
          url.searchParams.delete('api_key');
          event.request.url = url.toString();
        }
      }
      
      // Remove PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            const sanitized = { ...breadcrumb.data };
            delete sanitized.email;
            delete sanitized.phone;
            delete sanitized.password;
            delete sanitized.token;
            delete sanitized.apiKey;
            return { ...breadcrumb, data: sanitized };
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
    
    beforeBreadcrumb: (breadcrumb) => {
      // Filter out sensitive breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.message) {
        const sensitivePatterns = [
          /password/i,
          /token/i,
          /api[_-]?key/i,
          /secret/i,
          /authorization/i,
        ];
        
        if (sensitivePatterns.some(pattern => pattern.test(breadcrumb.message || ''))) {
          return null; // Drop this breadcrumb
        }
      }
      
      return breadcrumb;
    },
    
    // Integration settings
    integrations: [],
    
    // Release tracking
    release: Constants.expoConfig?.version || '1.0.0',
    dist: Constants.expoConfig?.android?.versionCode?.toString() || '1',
  });
};

/**
 * Set user context without PII
 * Only includes non-sensitive identifiers
 */
export const setSentryUser = (userId: string, role: string) => {
  Sentry.setUser({
    id: userId, // Hashed or anonymized ID only
    role: role,
    // DO NOT include: email, name, phone, or any PII
  });
};

/**
 * Clear user context on logout
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Add custom breadcrumb for debugging
 */
export const addBreadcrumb = (category: string, message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data: data || {},
  });
};

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
};

/**
 * Start performance transaction (span)
 */
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, (span) => span);
};

/**
 * Add tag for filtering
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

export default Sentry;
