import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import type { WorkStackParamList } from '../navigation/WorkStack';

type ApprovalType = 'INVOICE' | 'PURCHASE_REQUEST' | 'IT_REQUEST' | 'PAYMENT_REQUEST';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

type ApprovalListItem = {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  referenceNumber: string;
  title: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  amount: number | null;
  currency: string | null;
  createdAt: string;
};

type ApprovalsListResponse = {
  items: ApprovalListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

type StatusFilter = 'ALL' | ApprovalStatus;

type TypeFilter = 'ALL' | ApprovalType;

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || !Number.isFinite(amount)) return '—';
  const c = (currency ?? 'GHS').toUpperCase();
  return `${c} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function typeLabel(t: ApprovalType) {
  switch (t) {
    case 'INVOICE':
      return 'Invoice';
    case 'PURCHASE_REQUEST':
      return 'Purchase Request';
    case 'IT_REQUEST':
      return 'IT Request';
    case 'PAYMENT_REQUEST':
      return 'Payment Request';
    default:
      return t;
  }
}

export function ApprovalsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<WorkStackParamList, 'ApprovalsList'>>();

  const [items, setItems] = useState<ApprovalListItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildQueryString = useCallback(
    (p: number) => {
      const parts: string[] = [];
      parts.push(`page=${encodeURIComponent(String(p))}`);
      parts.push(`pageSize=${encodeURIComponent(String(pageSize))}`);
      if (typeFilter !== 'ALL') parts.push(`type=${encodeURIComponent(typeFilter)}`);
      if (statusFilter !== 'ALL') parts.push(`status=${encodeURIComponent(statusFilter)}`);
      const s = search.trim();
      if (s.length > 0) parts.push(`search=${encodeURIComponent(s)}`);
      return `?${parts.join('&')}`;
    },
    [pageSize, typeFilter, statusFilter, search]
  );

  const fetchPage = useCallback(
    async (p: number, mode: 'replace' | 'append') => {
      if (mode === 'append') {
        if (loadingMore || loading) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const qs = buildQueryString(p);
        const res = await http.get<ApprovalsListResponse>(`/approvals${qs}`);
        const data = res.data;

        setTotal(data.total);
        setHasNextPage(!!data.hasNextPage);

        setItems((prev) => {
          if (mode === 'append') return [...(prev ?? []), ...(data.items ?? [])];
          return data.items ?? [];
        });
      } catch (e: any) {
        const parsed = parseApiError(e, API_BASE_URL);
        const statusPart = parsed.status ? ` (${parsed.status})` : '';
        setError(`Failed to load approvals${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
        if (mode !== 'append') setItems(null);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQueryString, loadingMore, loading]
  );

  useEffect(() => {
    setPage(1);
    void fetchPage(1, 'replace');
  }, [typeFilter, statusFilter, search, fetchPage]);

  useEffect(() => {
    void fetchPage(1, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    setPage(1);
    setRefreshing(true);
    try {
      await fetchPage(1, 'replace');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const onEndReached = useCallback(() => {
    if (!hasNextPage || loadingMore || loading) return;
    setPage((p) => p + 1);
  }, [hasNextPage, loadingMore, loading]);

  useEffect(() => {
    if (page === 1) return;
    void fetchPage(page, 'append');
  }, [page, fetchPage]);

  const headerMeta = useMemo(() => {
    const count = items?.length ?? 0;
    const t = total ?? 0;
    const typePart = typeFilter === 'ALL' ? 'All types' : typeLabel(typeFilter);
    const statusPart = statusFilter === 'ALL' ? 'All statuses' : statusFilter;
    return `${count} shown • ${t} total • ${typePart} • ${statusPart}`;
  }, [items, total, typeFilter, statusFilter]);

  const statusButtons: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  const typeButtons: { key: TypeFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'INVOICE', label: 'Invoices' },
    { key: 'PURCHASE_REQUEST', label: 'PRs' },
    { key: 'IT_REQUEST', label: 'IT' },
    { key: 'PAYMENT_REQUEST', label: 'Payments' },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Approvals</Text>
        <Text style={styles.meta}>{items ? headerMeta : '—'}</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by number, title, supplier, payee…"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />

      <View style={styles.filters}>
        {statusButtons.map((b) => (
          <Pressable
            key={b.key}
            onPress={() => setStatusFilter(b.key)}
            style={({ pressed }) => [
              styles.filterButton,
              statusFilter === b.key ? styles.filterButtonActive : null,
              pressed ? styles.filterButtonPressed : null,
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.filterText, statusFilter === b.key ? styles.filterTextActive : null]}>{b.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.filters}>
        {typeButtons.map((b) => (
          <Pressable
            key={b.key}
            onPress={() => setTypeFilter(b.key)}
            style={({ pressed }) => [
              styles.filterButton,
              typeFilter === b.key ? styles.filterButtonActive : null,
              pressed ? styles.filterButtonPressed : null,
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.filterText, typeFilter === b.key ? styles.filterTextActive : null]}>{b.label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {loading && !items ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading approvals…</Text>
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.25}
          onEndReached={onEndReached}
          renderItem={({ item }) => {
            const requesterName = `${item.requester.firstName} ${item.requester.lastName}`.trim() || item.requester.email;
            return (
              <Pressable
                onPress={() => navigation.navigate('ApprovalDetail', { type: item.type, id: item.id })}
                style={({ pressed }) => [styles.row, pressed ? { opacity: 0.9 } : null]}
                accessibilityRole="button"
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {typeLabel(item.type)} • {item.referenceNumber}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {item.status} • {requesterName}
                  </Text>
                </View>
                <View style={styles.amountWrap}>
                  <Text style={styles.amount}>{formatMoney(item.amount, item.currency)}</Text>
                  <Text style={styles.amountMeta}>{String(item.createdAt).slice(0, 19).replace('T', ' ')}</Text>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Loading more…</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No approvals found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  search: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterButtonPressed: {
    opacity: 0.9,
  },
  filterText: {
    fontWeight: '900',
    color: '#111827',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  row: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  rowSub: {
    marginTop: 3,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  rowMeta: {
    marginTop: 6,
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '700',
  },
  amountWrap: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  amount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
  },
  amountMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '700',
  },
  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  empty: {
    color: '#6b7280',
    fontWeight: '700',
  },
});
