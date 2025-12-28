/**
 * Deep Link Configuration
 * Session M0.1 - miningerp:// deep link routing with notification fallback
 */

import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList, NotificationPayload } from './types';

/**
 * React Navigation Linking Configuration
 * Base scheme: miningerp://
 * 
 * Canonical patterns (M0.1):
 * - miningerp://work/approvals/{approvalId}
 * - miningerp://work/tasks/{taskId}
 * - miningerp://notifications
 * - miningerp://modules
 * - miningerp://more
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['miningerp://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: {
            screens: {
              HomeMain: '',
              Notifications: 'notifications',
            },
          },
          Work: {
            screens: {
              WorkList: 'work',
              ApprovalDetail: 'work/approvals/:approvalId',
              TaskDetail: 'work/tasks/:taskId',
            },
          },
          Modules: 'modules',
          More: 'more',
        },
      },
    },
  },
};

/**
 * Map notification payload to deep link route
 * Session M0.1 - All Notifications Rule:
 * 1. If payload has deepLink URL, use it
 * 2. If payload has entityType + entityId, map to canonical pattern
 * 3. Otherwise, fallback to miningerp://notifications (Home tab)
 */
export function mapNotificationToDeepLink(payload: NotificationPayload): string {
  // Rule 1: Use explicit deep link if provided
  if (payload.deepLink) {
    return payload.deepLink;
  }

  // Rule 2: Map entity type + id to canonical patterns
  if (payload.entityType && payload.entityId) {
    switch (payload.entityType) {
      case 'approval':
        return `miningerp://work/approvals/${payload.entityId}`;
      
      case 'task':
        return `miningerp://work/tasks/${payload.entityId}`;
      
      case 'notification':
        return 'miningerp://notifications';
      
      case 'inventory':
      case 'safety':
        // MVP: view-only, route to Modules tab
        return 'miningerp://modules';
      
      default:
        return 'miningerp://notifications';
    }
  }

  // Rule 3: Fallback to Notifications
  return 'miningerp://notifications';
}

/**
 * Deep Link Routes by Notification Type (M0.1 specification)
 */
export const notificationTypeRoutes: Record<string, string> = {
  'approval.assigned': 'miningerp://work/approvals/{id}',
  'approval.updated': 'miningerp://work/approvals/{id}',
  'approval.approved': 'miningerp://work/approvals/{id}',
  'approval.rejected': 'miningerp://work/approvals/{id}',
  'task.assigned': 'miningerp://work/tasks/{id}',
  'task.due': 'miningerp://work/tasks/{id}',
  'task.updated': 'miningerp://work/tasks/{id}',
  'inventory.low_stock': 'miningerp://modules',
  'inventory.alert': 'miningerp://modules',
  'safety.incident_update': 'miningerp://modules',
  'general': 'miningerp://notifications',
};
