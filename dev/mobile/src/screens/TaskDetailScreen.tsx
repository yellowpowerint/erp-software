import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { ErrorBanner } from '../components/ErrorBanner';
import type { WorkStackParamList } from '../navigation/WorkStack';

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

type TaskDetail = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  assignedTo: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string; projectCode: string | null };
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function TaskDetailScreen() {
  const route = useRoute<RouteProp<WorkStackParamList, 'TaskDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<WorkStackParamList>>();
  const { id } = route.params;

  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);

  const trimmedId = useMemo(() => String(id ?? '').trim(), [id]);

  const load = useCallback(async () => {
    if (!trimmedId) {
      setError('Missing task id.');
      setDetail(null);
      setNoAccess(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNoAccess(false);
    try {
      const res = await http.get<TaskDetail>(`/tasks/${encodeURIComponent(trimmedId)}`);
      setDetail(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      if (parsed.status === 403) {
        setNoAccess(true);
        setDetail(null);
        setError(null);
        return;
      }
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load task${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [trimmedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const projectLine = useMemo(() => {
    if (!detail?.project) return '—';
    const code = detail.project.projectCode ? `${detail.project.projectCode} • ` : '';
    return code + detail.project.name;
  }, [detail?.project]);

  return (
    <View style={styles.screen}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {noAccess ? (
        <View style={styles.card}>
          <Text style={styles.title}>No access</Text>
          <Text style={styles.value}>You don’t have access to view this task.</Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => navigation.navigate('TasksList')}
              style={styles.btnPrimary}
              accessibilityRole="button"
            >
              <Text style={styles.btnText}>Go to Tasks</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {loading && !detail ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading task…</Text>
        </View>
      ) : detail ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{detail.title}</Text>
            <Text style={styles.meta}>{projectLine}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status</Text>
            <Text style={styles.value}>{detail.status}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned to</Text>
            <Text style={styles.value}>{detail.assignedTo ?? '—'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Due</Text>
            <Text style={styles.value}>{formatDateTime(detail.dueDate)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Completed</Text>
            <Text style={styles.value}>{detail.isCompleted ? 'Yes' : 'No'}</Text>
            {detail.isCompleted ? <Text style={styles.subValue}>Completed at: {formatDateTime(detail.completedAt)}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.value}>{(detail.description ?? '').trim() || '—'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timestamps</Text>
            <Text style={styles.subValue}>Created: {formatDateTime(detail.createdAt)}</Text>
            <Text style={styles.subValue}>Updated: {formatDateTime(detail.updatedAt)}</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={styles.loadingText}>No task data.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
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
  btnText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  content: {
    paddingBottom: 16,
    gap: 12,
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
  header: {
    gap: 4,
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
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  subValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});
