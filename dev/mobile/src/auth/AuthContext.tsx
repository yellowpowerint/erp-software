import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { http, setAuthToken, setUnauthorizedHandler } from '../api/http';
import { clearAccessToken, getAccessToken, setAccessToken } from './authStorage';
import type { LoginResponse, MeResponse } from './types';
import { getExistingDeviceId } from '../push/deviceId';
import { setSentryUser } from '../monitoring/sentry';

type AuthState = {
  isBooting: boolean;
  token: string | null;
  me: MeResponse | null;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMe(): Promise<MeResponse> {
  const res = await http.get<MeResponse>('/auth/me');
  return res.data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isBooting: true,
    token: null,
    me: null,
  });

  useEffect(() => {
    setSentryUser(state.me);
  }, [state.me]);

  const bootstrap = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setAuthToken(null);
        setState({ isBooting: false, token: null, me: null });
        return;
      }

      setAuthToken(token);
      const me = await fetchMe();
      setState({ isBooting: false, token, me });
    } catch {
      await clearAccessToken();
      setAuthToken(null);
      setState({ isBooting: false, token: null, me: null });
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await http.post<LoginResponse>('/auth/login', { email, password });
      const token = res.data.access_token;
      if (!token) {
        throw new Error('Login failed: missing access token');
      }

      await setAccessToken(token);
      setAuthToken(token);

      const me = res.data.user ?? (await fetchMe());
      setState({ isBooting: false, token, me });
    } catch (err) {
      await clearAccessToken();
      setAuthToken(null);
      setState({ isBooting: false, token: null, me: null });
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const deviceId = await getExistingDeviceId();
      if (deviceId) {
        await http.post('/mobile/devices/unregister', { deviceId });
      }
    } catch {
      // best-effort
    }

    await clearAccessToken();
    setAuthToken(null);
    setState({ isBooting: false, token: null, me: null });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => signOut());
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const refreshMe = useCallback(async () => {
    if (!state.token) return;
    const me = await fetchMe();
    setState((s) => ({ ...s, me }));
  }, [state.token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      refreshMe,
    }),
    [state, signIn, signOut, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
