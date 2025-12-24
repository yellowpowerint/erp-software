import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config';

export type NotificationPreferences = {
  email: Record<string, boolean> & { enabled: boolean };
  sms: Record<string, boolean> & { enabled: boolean };
  push: Record<string, boolean> & { enabled: boolean };
};

type NotificationPreferencesState = {
  hasLoaded: boolean;
  isLoading: boolean;
  isSaving: boolean;
  prefs: NotificationPreferences | null;
  error: string | null;
};

type NotificationPreferencesContextValue = NotificationPreferencesState & {
  refresh: () => Promise<void>;
  save: (prefs: NotificationPreferences) => Promise<NotificationPreferences>;
};

const NotificationPreferencesContext = createContext<NotificationPreferencesContextValue | undefined>(undefined);

export function NotificationPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [state, setState] = useState<NotificationPreferencesState>({
    hasLoaded: false,
    isLoading: false,
    isSaving: false,
    prefs: null,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!token) {
      setState({ hasLoaded: false, isLoading: false, isSaving: false, prefs: null, error: null });
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null, hasLoaded: false }));
    try {
      const res = await http.get<NotificationPreferences>('/settings/notifications/preferences');
      setState({ hasLoaded: true, isLoading: false, isSaving: false, prefs: res.data, error: null });
    } catch (e) {
      const parsed = parseApiError(e, API_BASE_URL);
      setState((s) => ({
        ...s,
        hasLoaded: true,
        isLoading: false,
        error: `Failed to load notification preferences: ${parsed.message}`,
      }));
    }
  }, [token]);

  const save = useCallback(
    async (prefs: NotificationPreferences) => {
      if (!token) throw new Error('Not authenticated');

      setState((s) => ({ ...s, isSaving: true, error: null }));
      try {
        const res = await http.put<NotificationPreferences>('/settings/notifications/preferences', prefs);
        setState((s) => ({ ...s, isSaving: false, prefs: res.data, error: null }));
        return res.data;
      } catch (e) {
        const parsed = parseApiError(e, API_BASE_URL);
        setState((s) => ({ ...s, isSaving: false, error: `Failed to save preferences: ${parsed.message}` }));
        throw e;
      }
    },
    [token]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<NotificationPreferencesContextValue>(
    () => ({
      ...state,
      refresh,
      save,
    }),
    [state, refresh, save]
  );

  return (
    <NotificationPreferencesContext.Provider value={value}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences() {
  const ctx = useContext(NotificationPreferencesContext);
  if (!ctx) throw new Error('useNotificationPreferences must be used within NotificationPreferencesProvider');
  return ctx;
}
