import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';

type Project = {
  id: string;
  projectCode?: string;
  name: string;
  status?: string;
  priority?: string;
  _count?: {
    milestones?: number;
    tasks?: number;
  };
};

export function ProjectsListScreen() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(() => {
    if (!projects) return 0;
    return projects.filter((p) => ['PLANNING', 'ACTIVE'].includes(String(p.status).toUpperCase())).length;
  }, [projects]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<Project[]>('/projects');
      setProjects(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load projects${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setProjects(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <Text style={styles.meta}>{projects ? `${projects.length} total • ${activeCount} active` : '—'}</Text>
      </View>

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !projects ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading projects…</Text>
        </View>
      ) : (
        <FlatList
          data={projects ?? []}
          keyExtractor={(p) => p.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSub}>
                  {(item.projectCode ? `${item.projectCode} • ` : '') + (item.status ?? '—')}
                  {item.priority ? ` • ${item.priority}` : ''}
                </Text>
              </View>
              <View style={styles.counts}>
                <Text style={styles.countText}>{item._count?.tasks ?? 0} tasks</Text>
                <Text style={styles.countText}>{item._count?.milestones ?? 0} milestones</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No projects found.</Text>
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
    fontWeight: '600',
  },
  counts: {
    alignItems: 'flex-end',
    paddingLeft: 12,
    gap: 2,
  },
  countText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '800',
  },
  empty: {
    color: '#6b7280',
    fontWeight: '700',
  },
});
