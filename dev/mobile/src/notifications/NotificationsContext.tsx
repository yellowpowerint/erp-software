import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { http } from '../api/http';
import { useAuth } from '../auth/AuthContext';

type NotificationsState = {
  unreadCount: number;
  isLoading: boolean;
};

type NotificationsContextValue = NotificationsState & {
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [state, setState] = useState<NotificationsState>({
    unreadCount: 0,
    isLoading: false,
  });

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      setState((s) => ({ ...s, unreadCount: 0, isLoading: false }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await http.get<number>('/notifications/unread-count');
      const count = typeof res.data === 'number' && Number.isFinite(res.data) ? res.data : 0;
      setState((s) => ({ ...s, unreadCount: count, isLoading: false }));
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [token]);

  const setUnreadCount = useCallback((count: number) => {
    setState((s) => ({ ...s, unreadCount: Math.max(0, count) }));
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      ...state,
      refreshUnreadCount,
      setUnreadCount,
    }),
    [state, refreshUnreadCount, setUnreadCount]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
