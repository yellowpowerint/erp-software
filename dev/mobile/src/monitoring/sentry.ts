import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

import type { MeResponse } from '../auth/types';

function parseSampleRate(value: unknown, fallback: number) {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}

const dsnRaw = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const SENTRY_ENABLED = typeof dsnRaw === 'string' && dsnRaw.trim().length > 0;

export const navigationIntegration = SENTRY_ENABLED
  ? Sentry.reactNavigationIntegration({ enableTimeToInitialDisplay: true })
  : null;

let initialized = false;

export function initSentry() {
  if (!SENTRY_ENABLED) return;
  if (initialized) return;
  initialized = true;

  const dsn = String(dsnRaw).trim();
  const tracesSampleRate = parseSampleRate(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE, 0.1);

  const release = (() => {
    const slug = (Constants.expoConfig as any)?.slug;
    const version = (Constants.expoConfig as any)?.version;
    const v = `${String(slug || 'mobile')}@${String(version || '0.0.0')}`;
    return v;
  })();

  Sentry.init({
    dsn,
    release,
    tracesSampleRate,
    integrations: navigationIntegration ? [navigationIntegration] : [],
  });
}

export function wrapRootComponent<T>(Component: T): T {
  if (!SENTRY_ENABLED) return Component;
  return Sentry.wrap(Component as any) as any;
}

export function registerNavigationContainer(containerRef: any) {
  if (!SENTRY_ENABLED) return;
  if (!navigationIntegration) return;
  navigationIntegration.registerNavigationContainer(containerRef);
}

export function setSentryUser(me: MeResponse | null) {
  if (!SENTRY_ENABLED) return;

  if (!me) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: me.id,
  });

  Sentry.setTag('role', me.role);
}
