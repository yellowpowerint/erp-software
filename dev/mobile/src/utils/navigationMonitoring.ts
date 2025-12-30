/**
 * Navigation Performance Monitoring
 * M6.2 - Track screen transitions and navigation performance
 */

import * as Sentry from '@sentry/react-native';
import { addBreadcrumb } from '../config/sentry.config';

interface NavigationState {
  routeName?: string;
  params?: any;
}

let currentScreen: string | undefined;
let screenStartTime: number | undefined;

/**
 * Track screen view for performance monitoring
 */
export const trackScreenView = (routeName: string, params?: any) => {
  // Finish previous screen transaction
  if (currentScreen && screenStartTime) {
    const duration = Date.now() - screenStartTime;
    
    // Add breadcrumb for screen exit
    addBreadcrumb('navigation', `Left screen: ${currentScreen}`, {
      screen: currentScreen,
      duration_ms: duration,
    });
  }

  // Add breadcrumb for screen entry
  addBreadcrumb('navigation', `Entered screen: ${routeName}`, {
    screen: routeName,
    params: params ? Object.keys(params).join(', ') : 'none',
  });

  // Update current screen tracking
  currentScreen = routeName;
  screenStartTime = Date.now();
};

/**
 * Track navigation action
 */
export const trackNavigationAction = (action: string, from: string, to: string) => {
  addBreadcrumb('navigation', `Navigation: ${action}`, {
    action,
    from,
    to,
  });

  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `${action}: ${from} → ${to}`,
    level: 'info',
  });
};

/**
 * Track navigation error
 */
export const trackNavigationError = (error: Error, screen: string) => {
  Sentry.captureException(error, {
    tags: {
      screen,
      error_type: 'navigation',
    },
  });
};
