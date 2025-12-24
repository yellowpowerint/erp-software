import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { http } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { APP_SCHEME } from '../config';
import { getOrCreateDeviceId } from './deviceId';

type Props = {
  children: React.ReactNode;
};

function getInstalledVersion(): string {
  const fromExpoConfig = (Constants.expoConfig as any)?.version;
  const fromManifest2 = (Constants as any).manifest2?.extra?.expoClient?.version;
  const fromManifest = (Constants as any).manifest?.version;

  const version = fromExpoConfig || fromManifest2 || fromManifest;
  return typeof version === 'string' && version.trim().length > 0 ? version.trim() : '0.0.0';
}

function getProjectId(): string | undefined {
  const fromEas = (Constants as any)?.easConfig?.projectId;
  const fromExtra = (Constants.expoConfig as any)?.extra?.eas?.projectId;
  const v = fromEas || fromExtra;
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

function normalizeDeepLink(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const url = raw.trim();
  if (!url) return null;

  if (url.startsWith(`${APP_SCHEME}://`)) return url;
  if (url.startsWith('https://') || url.startsWith('http://')) return url;

  return null;
}

export function PushNotificationsProvider({ children }: Props) {
  const { token } = useAuth();

  const appVersion = useMemo(() => getInstalledVersion(), []);

  const registerOnBackend = useCallback(
    async (pushToken: string) => {
      if (!token) return;

      const deviceId = await getOrCreateDeviceId();
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';

      await http.post('/mobile/devices/register', {
        deviceId,
        platform,
        pushToken,
        appVersion,
        deviceModel: (Constants as any)?.deviceName,
        osVersion: Platform.Version ? String(Platform.Version) : undefined,
      });
    },
    [token, appVersion]
  );

  const ensurePushRegistration = useCallback(async () => {
    if (!token) return;

    const perms = await Notifications.getPermissionsAsync();
    const status = perms.status === 'granted' ? 'granted' : (await Notifications.requestPermissionsAsync()).status;

    if (status !== 'granted') {
      return;
    }

    const projectId = getProjectId();

    let expoToken: string | null = null;
    try {
      const t = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      expoToken = t.data;
    } catch {
      try {
        const t = await Notifications.getExpoPushTokenAsync();
        expoToken = t.data;
      } catch {
        expoToken = null;
      }
    }

    if (!expoToken) return;

    try {
      await registerOnBackend(expoToken);
    } catch {
      return;
    }
  }, [token, registerOnBackend]);

  const handleDeepLink = useCallback(async (raw: unknown) => {
    const url = normalizeDeepLink(raw);
    if (!url) {
      Alert.alert('Notice', 'This notification did not include a valid destination link.');
      const fallback = `${APP_SCHEME}://notifications`;
      try {
        await Linking.openURL(fallback);
      } catch {
        return;
      }
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Notice', 'Unable to open the notification link.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Notice', 'Unable to open the notification link.');
    }
  }, []);

  useEffect(() => {
    void ensurePushRegistration();
  }, [ensurePushRegistration]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as any;
      const deepLink = data?.deepLink ?? data?.url;
      await handleDeepLink(deepLink);
    });

    void Notifications.getLastNotificationResponseAsync().then((last) => {
      if (!last) return;
      const data = (last.notification.request.content.data as any) ?? null;
      const deepLink = data?.deepLink ?? data?.url;
      void handleDeepLink(deepLink);
    });

    return () => {
      sub.remove();
    };
  }, [handleDeepLink]);

  return <>{children}</>;
}
