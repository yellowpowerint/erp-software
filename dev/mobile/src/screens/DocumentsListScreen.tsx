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
import { API_BASE_URL } from '../config';
import type { MoreStackParamList } from '../navigation/MoreStack';
import { listDocuments } from '../documents/api';
import type { DocumentItem } from '../documents/types';

function formatSize(bytes: number) {
  const b = Number(bytes) || 0;
  if (b <= 0) return '0 B';
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function DocumentsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList, 'Documents'>>();

  const [items, setItems] = useState<DocumentItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const trimmedSearch = useMemo(() => search.trim(), [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDocuments({ search: trimmedSearch.length > 0 ? trimmedSearch : undefined });
      setItems(data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load documents${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setItems(null);
    } finally {
      setLoading(false);
    }
  }, [trimmedSearch]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.meta}>{items ? `${items.length} documents` : '—'}</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name, description, module…"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !items ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading documents…</Text>
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('DocumentViewer', { id: item.id })}
              style={({ pressed }) => [styles.row, pressed ? { opacity: 0.9 } : null]}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.originalName || item.fileName}
                </Text>
                <Text style={styles.rowSub} numberOfLines={2}>
                  {(item.category ?? '—') + (item.module ? ` • ${item.module}` : '')}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {formatSize(item.fileSize)} • {formatDate(item.createdAt)}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No documents found.</Text>
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
  empty: {
    color: '#6b7280',
    fontWeight: '700',
  },
});
