import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { useAuth } from '../auth/AuthContext';

type Milestone = {
  id: string;
  name: string;
  description?: string | null;
  dueDate?: string | null;
  order?: number | null;
  isCompleted?: boolean | null;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  order?: number | null;
};

type ProjectDetail = {
  id: string;
  projectCode?: string | null;
  name: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  estimatedBudget?: number | null;
  actualCost?: number | null;
  progress?: number | null;
  notes?: string | null;
  milestones?: Milestone[];
  tasks?: Task[];
};

function canViewProjects(role: string | undefined) {
  if (!role) return true;
  return role !== 'VENDOR';
}

export function ProjectDetailScreen({ route }: any) {
  const { me } = useAuth();
  const projectId = String(route?.params?.id ?? '');

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = useMemo(() => canViewProjects(me?.role), [me?.role]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<ProjectDetail>(`/projects/${encodeURIComponent(projectId)}`);
      setProject(res.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load project${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!allowed) return;
    void load();
  }, [load, allowed]);

  if (!allowed) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Projects</Text>
        <Text style={styles.muted}>You do not have access to view projects.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !project ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading project…</Text>
        </View>
      ) : project ? (
        <>
          <View style={styles.card}>
            <Text style={styles.title}>{project.name}</Text>
            <Text style={styles.meta}>
              {[project.projectCode ? String(project.projectCode) : '', project.status ?? '', project.priority ?? '']
                .map((p) => String(p || '').trim())
                .filter(Boolean)
                .join(' • ') || '—'}
            </Text>
            {project.location ? <Text style={styles.muted}>Location: {project.location}</Text> : null}
            {project.description ? <Text style={styles.body}>{project.description}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Start</Text>
              <Text style={styles.v}>{project.startDate ? String(project.startDate).slice(0, 10) : '—'}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>End</Text>
              <Text style={styles.v}>{project.endDate ? String(project.endDate).slice(0, 10) : '—'}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Progress</Text>
              <Text style={styles.v}>{project.progress != null ? `${project.progress}%` : '—'}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Budget</Text>
              <Text style={styles.v}>{project.estimatedBudget != null ? String(project.estimatedBudget) : '—'}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.k}>Actual cost</Text>
              <Text style={styles.v}>{project.actualCost != null ? String(project.actualCost) : '—'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Milestones</Text>
            {(project.milestones ?? []).length === 0 ? (
              <Text style={styles.muted}>No milestones.</Text>
            ) : (
              (project.milestones ?? []).map((m) => (
                <View key={m.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{m.name}</Text>
                    <Text style={styles.muted}>
                      {[
                        m.dueDate ? `Due ${String(m.dueDate).slice(0, 10)}` : '',
                        m.isCompleted ? 'Completed' : '',
                      ]
                        .filter(Boolean)
                        .join(' • ') || '—'}
                    </Text>
                    {m.description ? <Text style={styles.bodySmall}>{m.description}</Text> : null}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            {(project.tasks ?? []).length === 0 ? (
              <Text style={styles.muted}>No tasks.</Text>
            ) : (
              (project.tasks ?? []).map((t) => (
                <View key={t.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{t.title}</Text>
                    <Text style={styles.muted}>
                      {[
                        t.status ? String(t.status) : '',
                        t.dueDate ? `Due ${String(t.dueDate).slice(0, 10)}` : '',
                        t.assignedTo ? `Assignee ${String(t.assignedTo)}` : '',
                      ]
                        .filter(Boolean)
                        .join(' • ') || '—'}
                    </Text>
                    {t.description ? <Text style={styles.bodySmall}>{t.description}</Text> : null}
                  </View>
                </View>
              ))
            )}
          </View>

          {project.notes ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.bodySmall}>{project.notes}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.center}>
          <Text style={styles.muted}>Project not found.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, backgroundColor: '#ffffff', flexGrow: 1 },
  card: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#f9fafb', gap: 8 },
  title: { fontSize: 18, fontWeight: '900', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', fontWeight: '700' },
  muted: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  body: { fontSize: 13, color: '#111827', fontWeight: '600', lineHeight: 18 },
  bodySmall: { fontSize: 12, color: '#111827', fontWeight: '600', lineHeight: 17 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#111827' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 10 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  k: { fontSize: 12, fontWeight: '800', color: '#111827' },
  v: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  itemRow: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10, marginTop: 2 },
  itemTitle: { fontSize: 13, fontWeight: '900', color: '#111827' },
});
