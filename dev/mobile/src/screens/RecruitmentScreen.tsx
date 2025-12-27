import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { parseApiError } from '../api/errors';
import { http } from '../api/http';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';

type JobPosting = {
  id: string;
  title?: string | null;
  department?: string | null;
  status?: string | null;
  createdAt?: string | null;
  description?: string | null;
};

type Candidate = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

type TabKey = 'jobs' | 'candidates';

function formatDate(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
}

export function RecruitmentScreen() {
  const [tab, setTab] = useState<TabKey>('jobs');

  const [jobs, setJobs] = useState<JobPosting[] | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(() => (tab === 'jobs' ? jobs : candidates), [tab, jobs, candidates]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, candRes] = await Promise.all([
        http.get<JobPosting[]>('/hr/recruitment/jobs'),
        http.get<Candidate[]>('/hr/recruitment/candidates'),
      ]);
      setJobs(jobsRes.data);
      setCandidates(candRes.data);
    } catch (e: any) {
      const parsed = parseApiError(e, API_BASE_URL);
      const statusPart = parsed.status ? ` (${parsed.status})` : '';
      setError(`Failed to load recruitment data${statusPart}: ${parsed.message}`);
      setJobs(null);
      setCandidates(null);
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
    void load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        <TabButton active={tab === 'jobs'} label={`Job Postings${jobs ? ` (${jobs.length})` : ''}`} onPress={() => setTab('jobs')} />
        <TabButton active={tab === 'candidates'} label={`Candidates${candidates ? ` (${candidates.length})` : ''}`} onPress={() => setTab('candidates')} />
      </View>

      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {loading && !active ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Loading recruitment…</Text>
        </View>
      ) : (
        <FlatList
          data={active ?? []}
          keyExtractor={(i: any, idx) => i.id ?? String(idx)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) =>
            tab === 'jobs' ? <JobRow item={item as JobPosting} /> : <CandidateRow item={item as Candidate} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>{tab === 'jobs' ? 'No job postings found.' : 'No candidates found.'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active ? styles.tabBtnActive : null]} accessibilityRole="button">
      <Text style={[styles.tabText, active ? styles.tabTextActive : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function JobRow({ item }: { item: JobPosting }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {item.title ?? 'Job Posting'}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {item.department ? `Dept: ${item.department}` : 'Dept: —'}
        {item.status ? `  •  ${item.status}` : ''}
        {item.createdAt ? `  •  ${formatDate(item.createdAt)}` : ''}
      </Text>
      {item.description ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
    </View>
  );
}

function CandidateRow({ item }: { item: Candidate }) {
  const name = item.firstName || item.lastName ? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() : 'Candidate';
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {item.status ? `Status: ${item.status}` : 'Status: —'}
        {item.createdAt ? `  •  ${formatDate(item.createdAt)}` : ''}
      </Text>
      {item.email ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.email}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tabBtnActive: { borderColor: colors.accent },
  tabText: { color: colors.mutedForeground, fontWeight: '800', fontSize: 12, textAlign: 'center' },
  tabTextActive: { color: colors.foreground },
  list: { padding: 12 },
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  title: { color: colors.foreground, fontSize: 15, fontWeight: '900' },
  subtitle: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
  center: { padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.mutedForeground },
});
