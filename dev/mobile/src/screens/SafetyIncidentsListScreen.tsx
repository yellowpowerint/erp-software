import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import type { HomeStackParamList } from '../navigation/HomeStack';
import { useAuth } from '../auth/AuthContext';

type IncidentStatus = 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
type IncidentSeverity = 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL' | 'FATAL';
type IncidentType =
  | 'INJURY'
  | 'NEAR_MISS'
  | 'EQUIPMENT_DAMAGE'
  | 'ENVIRONMENTAL'
  | 'SECURITY'
  | 'FIRE'
  | 'CHEMICAL_SPILL'
  | 'OTHER';

type SafetyIncidentListItem = {
  id: string;
  incidentNumber: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  incidentDate: string;
  reportedAt: string;
  oshaReportable: boolean;
  photoUrls: string[];
  reportedBy: string;
};

type IncidentsListResponse = {
  items: SafetyIncidentListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

type StatusFilter = 'ALL' | IncidentStatus;

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

function canSeeAllIncidents(role: string | null | undefined) {
  return ['SUPER_ADMIN', 'SAFETY_OFFICER', 'OPERATIONS_MANAGER', 'DEPARTMENT_HEAD'].includes(String(role));
}

export function SafetyIncidentsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'SafetyIncidents'>>();
  const { me } = useAuth();

  const canSeeAll = useMemo(() => canSeeAllIncidents(me?.role), [me?.role]);

  const [items, setItems] = useState<SafetyIncidentListItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [mineOnly, setMineOnly] = useState(!canSeeAll);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canSeeAll) {
      setMineOnly(true);
    }
  }, [canSeeAll]);

  const buildQueryString = useCallback(
    (p: number) => {
      const parts: string[] = [];
      parts.push(`page=${encodeURIComponent(String(p))}`);
      parts.push(`pageSize=${encodeURIComponent(String(pageSize))}`);
      if (statusFilter !== 'ALL') parts.push(`status=${encodeURIComponent(statusFilter)}`);
      const s = search.trim();
      if (s.length > 0) parts.push(`search=${encodeURIComponent(s)}`);
      if (mineOnly) parts.push('mine=true');
      return `?${parts.join('&')}`;
    },
    [pageSize, statusFilter, search, mineOnly]
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
        const res = await http.get<IncidentsListResponse>(`/safety/incidents${qs}`);
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
        setError(`Failed to load incidents${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
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
  }, [statusFilter, mineOnly, search, fetchPage]);

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
    const statusPart = statusFilter === 'ALL' ? 'All statuses' : statusFilter;
    const minePart = mineOnly ? 'Mine' : 'All';
    return `${count} shown • ${t} total • ${minePart} • ${statusPart}`;
  }, [items, total, statusFilter, mineOnly]);

  const statusButtons: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'REPORTED', label: 'Reported' },
    { key: 'INVESTIGATING', label: 'Investigating' },
    { key: 'RESOLVED', label: 'Resolved' },
    { key: 'CLOSED', label: 'Closed' },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Incident Reports</Text>
        <Text style={styles.meta}>{items ? headerMeta : '—'}</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by incident #, location, description…"
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

      {canSeeAll ? (
        <View style={styles.filters}>
          <Pressable
            onPress={() => setMineOnly(true)}
            style={({ pressed }) => [
              styles.filterButton,
              mineOnly ? styles.filterButtonActive : null,
              pressed ? styles.filterButtonPressed : null,
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.filterText, mineOnly ? styles.filterTextActive : null]}>Mine</Text>
          </Pressable>
          <Pressable
            onPress={() => setMineOnly(false)}
            style={({ pressed }) => [
              styles.filterButton,
              !mineOnly ? styles.filterButtonActive : null,
              pressed ? styles.filterButtonPressed : null,
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.filterText, !mineOnly ? styles.filterTextActive : null]}>All</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {loading && !items ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading incidents…</Text>
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
            const thumb = Array.isArray(item.photoUrls) && item.photoUrls.length > 0 ? item.photoUrls[0] : null;
            return (
              <Pressable
                onPress={() => navigation.navigate('SafetyIncidentDetail', { id: item.id })}
                style={({ pressed }) => [styles.row, pressed ? { opacity: 0.9 } : null]}
                accessibilityRole="button"
              >
                {thumb ? <Image source={{ uri: thumb }} style={styles.thumb} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.incidentNumber}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={2}>
                    {item.type} • {item.severity} • {item.status}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {item.location} • {formatDate(item.incidentDate)}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
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
              <Text style={styles.empty}>No incidents found.</Text>
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
    fontWeight: '700',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  filterButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterButtonPressed: {
    opacity: 0.9,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111827',
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
    gap: 10,
    backgroundColor: '#f9fafb',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  rowSub: {
    marginTop: 3,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#374151',
    fontWeight: '700',
  },
  empty: {
    color: '#6b7280',
    fontWeight: '700',
  },
  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  chevron: {
    color: '#9ca3af',
    fontSize: 22,
    paddingLeft: 4,
    fontWeight: '900',
  },
});
