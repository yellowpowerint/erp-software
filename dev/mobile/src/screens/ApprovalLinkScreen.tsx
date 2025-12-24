import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import type { WorkStackParamList } from '../navigation/WorkStack';

type ApprovalType = 'INVOICE' | 'PURCHASE_REQUEST' | 'IT_REQUEST' | 'PAYMENT_REQUEST';

type ApprovalDetail = {
  id: string;
  type: ApprovalType;
};

export function ApprovalLinkScreen() {
  const route = useRoute<RouteProp<WorkStackParamList, 'ApprovalLink'>>();
  const navigation = useNavigation<NativeStackNavigationProp<WorkStackParamList>>();
  const { id } = route.params;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);

  const trimmedId = useMemo(() => String(id ?? '').trim(), [id]);

  const resolve = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoAccess(false);

    const types: ApprovalType[] = ['INVOICE', 'PURCHASE_REQUEST', 'IT_REQUEST', 'PAYMENT_REQUEST'];

    try {
      for (const t of types) {
        try {
          await http.get<ApprovalDetail>(`/approvals/item/${t}/${encodeURIComponent(trimmedId)}`);
          navigation.replace('ApprovalDetail', { type: t, id: trimmedId });
          return;
        } catch (e: any) {
          const parsed = parseApiError(e, API_BASE_URL);

          if (parsed.status === 403) {
            setNoAccess(true);
            return;
          }

          if (parsed.status === 404) {
            continue;
          }

          const statusPart = parsed.status ? ` (${parsed.status})` : '';
          setError(`Unable to open approval${statusPart}: ${parsed.message}`);
          return;
        }
      }

      setError('This approval could not be found.');
    } finally {
      setLoading(false);
    }
  }, [navigation, trimmedId]);

  useEffect(() => {
    if (!trimmedId) {
      setError('Missing approval id.');
      return;
    }
    void resolve();
  }, [resolve, trimmedId]);

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Opening approval…</Text>
        </View>
      ) : null}

      {noAccess ? (
        <View style={styles.card}>
          <Text style={styles.title}>No access</Text>
          <Text style={styles.muted}>You don’t have access to view this approval.</Text>
          <View style={styles.row}>
            <Pressable onPress={() => navigation.navigate('ApprovalsList')} style={styles.btnPrimary} accessibilityRole="button">
              <Text style={styles.btnText}>Go to Approvals</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!loading && !noAccess && error ? (
        <View style={styles.card}>
          <Text style={styles.title}>Unable to open</Text>
          <Text style={styles.muted}>{error}</Text>
          <View style={styles.row}>
            <Pressable onPress={resolve} style={styles.btnPrimary} accessibilityRole="button">
              <Text style={styles.btnText}>Retry</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('ApprovalsList')} style={styles.btnSecondary} accessibilityRole="button">
              <Text style={styles.btnSecondaryText}>Approvals</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  muted: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  btnPrimary: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  btnSecondaryText: {
    color: '#111827',
    fontWeight: '900',
  },
});
