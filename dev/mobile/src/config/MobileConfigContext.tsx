import Constants from 'expo-constants';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';

export type MobileFeatureFlags = {
  home: boolean;
  work: boolean;
  modules: boolean;
  notifications: boolean;
  more: boolean;
};

export type MobileConfig = {
  minimumVersions: {
    ios: string;
    android: string;
  };
  storeUrls: {
    ios: string;
    android: string;
  };
  featureFlags: MobileFeatureFlags;
  serverTime: string;
};

type MobileConfigState = {
  isBooting: boolean;
  config: MobileConfig | null;
  error: string | null;
  isUpdateRequired: boolean;
  installedVersion: string;
  requiredVersion: string | null;
};

type MobileConfigContextValue = MobileConfigState & {
  refresh: () => Promise<void>;
};

const MobileConfigContext = createContext<MobileConfigContextValue | undefined>(undefined);

function getInstalledVersion(): string {
  const fromExpoConfig = (Constants.expoConfig as any)?.version;
  const fromManifest2 = (Constants as any).manifest2?.extra?.expoClient?.version;
  const fromManifest = (Constants as any).manifest?.version;

  const version = fromExpoConfig || fromManifest2 || fromManifest;
  return typeof version === 'string' && version.trim().length > 0 ? version.trim() : '0.0.0';
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10));
  const pb = b.split('.').map((x) => parseInt(x, 10));

  for (let i = 0; i < 3; i += 1) {
    const va = Number.isFinite(pa[i]) ? pa[i] : 0;
    const vb = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

function getRequiredVersion(config: MobileConfig): string {
  return Platform.OS === 'ios' ? config.minimumVersions.ios : config.minimumVersions.android;
}

export function MobileConfigProvider({ children }: { children: React.ReactNode }) {
  const installedVersion = useMemo(() => getInstalledVersion(), []);

  const [state, setState] = useState<MobileConfigState>({
    isBooting: true,
    config: null,
    error: null,
    isUpdateRequired: false,
    installedVersion,
    requiredVersion: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isBooting: true, error: null }));
    try {
      const res = await http.get<MobileConfig>('/mobile/config');
      const config = res.data;
      const required = getRequiredVersion(config);
      const isUpdateRequired = compareSemver(installedVersion, required) < 0;
      setState({
        isBooting: false,
        config,
        error: null,
        isUpdateRequired,
        installedVersion,
        requiredVersion: required,
      });
    } catch (e) {
      const parsed = parseApiError(e, API_BASE_URL);
      setState((s) => ({
        ...s,
        isBooting: false,
        config: null,
        error: `Failed to load mobile config: ${parsed.message}\nAPI: ${API_BASE_URL}`,
        isUpdateRequired: false,
        requiredVersion: null,
      }));
    }
  }, [installedVersion]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<MobileConfigContextValue>(
    () => ({
      ...state,
      refresh,
    }),
    [state, refresh]
  );

  return <MobileConfigContext.Provider value={value}>{children}</MobileConfigContext.Provider>;
}

export function useMobileConfig() {
  const ctx = useContext(MobileConfigContext);
  if (!ctx) throw new Error('useMobileConfig must be used within MobileConfigProvider');
  return ctx;
}
