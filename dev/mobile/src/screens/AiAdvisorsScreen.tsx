import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';

type SectionItem = { key: string; value: string };

function toSections(data: any): SectionItem[] {
  if (!data || typeof data !== 'object') {
    return [{ key: 'value', value: String(data ?? '') }];
  }

  const entries = Object.entries(data as Record<string, any>);
  return entries.map(([k, v]) => {
    if (v == null) return { key: k, value: '—' };
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      return { key: k, value: String(v) };
    }
    try {
      const s = JSON.stringify(v, null, 2);
      return { key: k, value: s.length > 1200 ? `${s.slice(0, 1200)}…` : s };
    } catch {
      return { key: k, value: String(v) };
    }
  });
}

export function AiAdvisorsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const sections = useMemo(() => toSections(data), [data]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get('/ai/procurement-advisor');
      setData(res.data);
      setLastUpdated(new Date());
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load advisor${statusPart}: ${parsed.message}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading advisor…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <ErrorBanner message={error} onRetry={load} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>AI Advisors</Text>
          <Text style={styles.h2}>{lastUpdated ? `Updated: ${lastUpdated.toLocaleString()}` : '—'}</Text>
        </View>
        <Pressable
          onPress={() => void load()}
          style={({ pressed }) => [styles.refreshBtn, pressed ? styles.pressed : null]}
          accessibilityRole="button"
        >
          <Text style={styles.refreshText}>{loading ? 'Refreshing…' : 'Refresh'}</Text>
        </Pressable>
      </View>

      {sections.length ? (
        <View style={styles.card}>
          {sections.map((s) => (
            <View key={s.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{s.key}</Text>
              <Text style={styles.sectionBody}>{s.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.muted}>No advisor output available.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  content: { padding: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  h1: { color: colors.foreground, fontSize: 18, fontWeight: '900' },
  h2: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
  refreshBtn: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  refreshText: { color: colors.foreground, fontWeight: '800', fontSize: 12 },
  pressed: { opacity: 0.7 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  section: { gap: 6 },
  sectionTitle: { color: colors.mutedForeground, fontSize: 12, fontWeight: '900' },
  sectionBody: { color: colors.foreground, fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  muted: { color: colors.mutedForeground },
});
