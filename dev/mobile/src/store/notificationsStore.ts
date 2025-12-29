/**
 * Notifications Store
 * Session M2.2 - Zustand store for notifications state
 */

import { create } from 'zustand';
import { notificationsService } from '../services/notifications.service';

interface NotificationsState {
  unreadCount: number;
  isLoading: boolean;
  
  fetchUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
  clearUnreadCount: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  isLoading: false,

  fetchUnreadCount: async () => {
    set({ isLoading: true });
    try {
      const count = await notificationsService.getUnreadCount();
      set({ unreadCount: count, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      set({ isLoading: false });
    }
  },

  decrementUnreadCount: () => {
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  clearUnreadCount: () => {
    set({ unreadCount: 0 });
  },
}));
