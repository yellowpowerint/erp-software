/**
 * Notifications Service
 * Session M2.2 - In-app notification inbox
 */

import { apiClient } from './api.service';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'approval' | 'task' | 'alert' | 'incident' | 'general';
  isRead: boolean;
  createdAt: string;
  entityType?: string;
  entityId?: string;
  deepLink?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationsService = {
  /**
   * Fetch notifications list with pagination
   */
  async getNotifications(page = 1, pageSize = 20): Promise<NotificationsResponse> {
    try {
      const response = await apiClient.get<any>('/notifications', {
        params: { page, pageSize },
      });

      const notifications = (response.data.notifications || response.data || []).map((item: any) => ({
        id: item.id || String(Math.random()),
        title: item.title || 'Notification',
        body: item.body || item.message || '',
        type: item.type || 'general',
        isRead: item.isRead || item.read || false,
        createdAt: item.createdAt || item.timestamp || new Date().toISOString(),
        entityType: item.entityType,
        entityId: item.entityId,
        deepLink: item.deepLink,
      }));

      return {
        notifications,
        total: response.data.total || notifications.length,
        page: response.data.page || page,
        pageSize: response.data.pageSize || pageSize,
        hasMore: response.data.hasMore || false,
      };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  },

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<Notification> {
    try {
      const response = await apiClient.get<any>(`/notifications/${id}`);
      return {
        id: response.data.id || id,
        title: response.data.title || 'Notification',
        body: response.data.body || response.data.message || '',
        type: response.data.type || 'general',
        isRead: response.data.isRead || response.data.read || false,
        createdAt: response.data.createdAt || response.data.timestamp || new Date().toISOString(),
        entityType: response.data.entityType,
        entityId: response.data.entityId,
        deepLink: response.data.deepLink,
      };
    } catch (error) {
      console.error(`Failed to fetch notification ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.put('/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
      return response.data.count || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  },

  /**
   * Parse deep link from notification
   */
  parseDeepLink(notification: Notification): { screen: string; params?: any } | null {
    if (notification.deepLink) {
      // Parse miningerp:// URLs
      const match = notification.deepLink.match(/miningerp:\/\/(\w+)(?:\/(.+))?/);
      if (match) {
        const [, screen, params] = match;
        return { screen, params: params ? { id: params } : undefined };
      }
    }

    // Fallback: construct from entityType/entityId
    if (notification.entityType && notification.entityId) {
      switch (notification.entityType) {
        case 'approval':
          return { screen: 'Work', params: { screen: 'ApprovalDetail', params: { approvalId: notification.entityId } } };
        case 'task':
          return { screen: 'Work', params: { screen: 'TaskDetail', params: { taskId: notification.entityId } } };
        default:
          return null;
      }
    }

    return null;
  },
};
