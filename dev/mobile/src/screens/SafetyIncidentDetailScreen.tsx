import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { http } from '../api/http';
import { parseApiError } from '../api/errors';
import { API_BASE_URL } from '../config';
import { ErrorBanner } from '../components/ErrorBanner';
import type { HomeStackParamList } from '../navigation/HomeStack';

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

type SafetyIncidentDetail = {
  id: string;
  incidentNumber: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  incidentDate: string;
  reportedBy: string;
  reportedAt: string;
  description: string;
  injuries: string | null;
  witnesses: string[];
  photoUrls: string[];
  oshaReportable: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function SafetyIncidentDetailScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'SafetyIncidentDetail'>>();
  const id = route.params?.id;

  const trimmedId = useMemo(() => String(id ?? '').trim(), [id]);

  const [detail, setDetail] = useState<SafetyIncidentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccess, setNoAccess] = useState(false);

  const load = useCallback(async () => {
    if (!trimmedId) {
      setError('Missing incident id.');
      setDetail(null);
      setNoAccess(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNoAccess(false);

    try {
      const res = await http.get<SafetyIncidentDetail>(`/safety/incidents/${encodeURIComponent(trimmedId)}`);
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
      setError(`Failed to load incident${statusPart}: ${parsed.message}\nAPI: ${API_BASE_URL}`);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [trimmedId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !detail && !noAccess && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading incident…</Text>
      </View>
    );
  }

  if (noAccess) {
    return (
      <View style={styles.center}>
        <Text style={styles.noAccessTitle}>No access</Text>
        <Text style={styles.muted}>You do not have permission to view this incident.</Text>
        <Pressable onPress={() => void load()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
          <Text style={styles.secondaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {detail ? (
        <>
          <View style={styles.card}>
            <Text style={styles.h1}>{detail.incidentNumber}</Text>
            <Text style={styles.meta}>
              {detail.type} • {detail.severity} • {detail.status}
            </Text>
            <Text style={styles.meta}>Location: {detail.location}</Text>
            <Text style={styles.meta}>Incident: {formatDateTime(detail.incidentDate)}</Text>
            <Text style={styles.meta}>Reported: {formatDateTime(detail.reportedAt)}</Text>
            <Text style={styles.meta}>OSHA reportable: {detail.oshaReportable ? 'YES' : 'NO'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.body}>{detail.description}</Text>

            {detail.injuries ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Injuries</Text>
                <Text style={styles.body}>{detail.injuries}</Text>
              </>
            ) : null}

            {Array.isArray(detail.witnesses) && detail.witnesses.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Witnesses</Text>
                <Text style={styles.body}>{detail.witnesses.join(', ')}</Text>
              </>
            ) : null}

            {detail.notes ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Notes</Text>
                <Text style={styles.body}>{detail.notes}</Text>
              </>
            ) : null}
          </View>

          {Array.isArray(detail.photoUrls) && detail.photoUrls.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <View style={styles.photosGrid}>
                {detail.photoUrls.map((u) => (
                  <Image key={u} source={{ uri: u }} style={styles.photo} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.center}>
          <Text style={styles.muted}>Incident not loaded.</Text>
          <Pressable onPress={() => void load()} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  muted: {
    color: '#6b7280',
    fontWeight: '700',
    textAlign: 'center',
  },
  noAccessTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  h1: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  body: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
  },
});
