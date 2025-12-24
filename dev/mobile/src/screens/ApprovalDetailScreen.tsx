
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { ErrorBanner } from '../components/ErrorBanner';
import type { WorkStackParamList } from '../navigation/WorkStack';

type ApprovalType = 'INVOICE' | 'PURCHASE_REQUEST' | 'IT_REQUEST' | 'PAYMENT_REQUEST';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

type ApprovalDetail = {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  referenceNumber: string;
  title: string;
  description?: string | null;
  requester: { firstName: string; lastName: string; email: string; role: string };
  amount: number | null;
  currency: string | null;
  createdAt: string;
  attachmentUrl?: string | null;
  approvalHistory: Array<{
    id: string;
    action: string;
    comments?: string | null;
    createdAt: string;
    approver?: { firstName?: string; lastName?: string; email?: string; role?: string };
  }>;
};

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || !Number.isFinite(amount)) return '—';
  const c = (currency ?? 'GHS').toUpperCase();
  return `${c} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function ApprovalDetailScreen() {
  const route = useRoute<RouteProp<WorkStackParamList, 'ApprovalDetail'>>();
  const { type, id } = route.params;

  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canAct = useMemo(() => detail?.status === 'PENDING', [detail?.status]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<ApprovalDetail>(`/approvals/item/${type}/${id}`);
      setDetail(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load approval${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const requesterName = useMemo(() => {
    if (!detail) return '';
    const n = `${detail.requester.firstName} ${detail.requester.lastName}`.trim();
    return n || detail.requester.email;
  }, [detail]);

  const openAttachment = useCallback(async () => {
    const url = (detail?.attachmentUrl ?? '').trim();
    if (!url) return;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('Unable to open', 'This attachment link cannot be opened on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open', 'Failed to open attachment link.');
    }
  }, [detail?.attachmentUrl]);

  const doAction = useCallback(
    async (action: 'approve' | 'reject') => {
      if (!detail) return;
      const text = comments.trim();
      if (action === 'reject' && text.length < 2) {
        Alert.alert('Reason required', 'Please enter a rejection reason.');
        return;
      }
      setActing(true);
      try {
        await http.post(`/approvals/item/${type}/${id}/${action}`, { comments: text.length ? text : undefined });
        setComments('');
        await load();
      } catch (e: any) {
        const parsed = parseApiError(e, API_BASE_URL);
        if (parsed.status === 409) {
          Alert.alert('Already actioned', parsed.message);
          await load();
        } else {
          Alert.alert('Action failed', parsed.message);
        }
      } finally {
        setActing(false);
      }
    },
    [comments, detail, id, load, type]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}
      {loading && !detail ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : null}

      {detail ? (
        <>
          <View style={styles.card}>
            <Text style={styles.h1}>{detail.referenceNumber}</Text>
            <Text style={styles.muted}>Status: {detail.status}</Text>
            <Text style={styles.muted}>Requester: {requesterName}</Text>
            <Text style={styles.muted}>Amount: {formatMoney(detail.amount, detail.currency)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Details</Text>
            <Text style={styles.body}>{detail.title}</Text>
            {detail.description ? <Text style={styles.muted}>{detail.description}</Text> : null}
            {detail.attachmentUrl ? (
              <Pressable onPress={openAttachment} style={styles.link} accessibilityRole="button">
                <Text style={styles.linkText}>Open attachment</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>History</Text>
            {detail.approvalHistory?.length ? (
              detail.approvalHistory.map((h) => {
                const n = `${h.approver?.firstName ?? ''} ${h.approver?.lastName ?? ''}`.trim();
                return (
                  <View key={h.id} style={styles.historyRow}>
                    <Text style={styles.body}>
                      {h.action}
                      {n ? ` • ${n}` : ''}
                    </Text>
                    {h.comments ? <Text style={styles.muted}>{h.comments}</Text> : null}
                    <Text style={styles.muted}>{String(h.createdAt).slice(0, 19).replace('T', ' ')}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.muted}>No approval actions yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.h2}>Actions</Text>
            {!canAct ? <Text style={styles.muted}>This item is already {detail.status.toLowerCase()}.</Text> : null}
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder={canAct ? 'Optional comment (required for reject)' : 'Comment'}
              editable={!acting && canAct}
              style={[styles.input, !canAct ? styles.disabled : null]}
              multiline
            />
            <View style={styles.row}>
              <Pressable disabled={!canAct || acting} onPress={() => doAction('approve')} style={styles.btnPrimary}>
                {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Approve</Text>}
              </Pressable>
              <Pressable disabled={!canAct || acting} onPress={() => doAction('reject')} style={styles.btnDanger}>
                {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reject</Text>}
              </Pressable>
            </View>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', gap: 12, flexGrow: 1 },
  center: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, backgroundColor: '#f9fafb', gap: 8 },
  h1: { fontSize: 16, fontWeight: '900', color: '#111827' },
  h2: { fontSize: 12, fontWeight: '900', color: '#111827', opacity: 0.75, textTransform: 'uppercase' },
  body: { fontSize: 13, fontWeight: '800', color: '#111827' },
  muted: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  link: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#fff' },
  linkText: { fontSize: 12, fontWeight: '900', color: '#2563eb' },
  historyRow: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#fff', gap: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#fff', minHeight: 44 },
  row: { flexDirection: 'row', gap: 12 },
  btnPrimary: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  btnDanger: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#7f1d1d', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
