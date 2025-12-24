import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { useNotificationPreferences, type NotificationPreferences } from '../settings/NotificationPreferencesContext';

type ChannelKey = 'email' | 'sms' | 'push';

function setChannelEnabled(p: NotificationPreferences, channel: ChannelKey, enabled: boolean): NotificationPreferences {
  return {
    ...p,
    [channel]: {
      ...(p[channel] || { enabled: true }),
      enabled,
    },
  } as NotificationPreferences;
}

export function NotificationPreferencesScreen() {
  const { prefs, isLoading, isSaving, error, refresh, save, hasLoaded } = useNotificationPreferences();

  const [draft, setDraft] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (prefs) setDraft(prefs);
  }, [prefs]);

  const dirty = useMemo(() => {
    if (!prefs || !draft) return false;
    return (
      prefs.email.enabled !== draft.email.enabled ||
      prefs.sms.enabled !== draft.sms.enabled ||
      prefs.push.enabled !== draft.push.enabled
    );
  }, [prefs, draft]);

  const onSave = async () => {
    if (!draft) return;

    try {
      await save(draft);
      Alert.alert('Saved', 'Your notification preferences have been updated.');
    } catch {
      // error state already set by context
    }
  };

  if (isLoading && !prefs && !hasLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.centerText}>Loading preferences…</Text>
      </View>
    );
  }

  if (!draft) {
    return (
      <View style={styles.container}>
        {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}
        <View style={styles.center}>
          <Text style={styles.centerText}>No preferences available.</Text>
          <Pressable onPress={refresh} style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}>
            <Text style={styles.buttonText}>Reload</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Delivery channels</Text>
        <Text style={styles.infoText}>Turn channels on/off. Changes are saved to your account and persist across login/reinstall.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Email</Text>
            <Text style={styles.rowSubtitle}>Receive notifications via email</Text>
          </View>
          <Switch
            value={!!draft.email.enabled}
            onValueChange={(v) => setDraft((d) => (d ? setChannelEnabled(d, 'email', v) : d))}
            disabled={isSaving}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Push</Text>
            <Text style={styles.rowSubtitle}>Receive notifications on this device</Text>
          </View>
          <Switch
            value={!!draft.push.enabled}
            onValueChange={(v) => setDraft((d) => (d ? setChannelEnabled(d, 'push', v) : d))}
            disabled={isSaving}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>SMS</Text>
            <Text style={styles.rowSubtitle}>Receive critical alerts via SMS</Text>
          </View>
          <Switch
            value={!!draft.sms.enabled}
            onValueChange={(v) => setDraft((d) => (d ? setChannelEnabled(d, 'sms', v) : d))}
            disabled={isSaving}
          />
        </View>
      </View>

      <View style={styles.footerRow}>
        <Pressable
          onPress={refresh}
          disabled={isSaving}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null, isSaving ? styles.buttonDisabled : null]}
        >
          <Text style={styles.secondaryButtonText}>Refresh</Text>
        </Pressable>

        <Pressable
          onPress={onSave}
          disabled={!dirty || isSaving}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.buttonPressed : null,
            (!dirty || isSaving) ? styles.buttonDisabled : null,
          ]}
        >
          {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Save</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 12,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  centerText: {
    fontWeight: '700',
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  infoText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  footerRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 14,
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  button: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
