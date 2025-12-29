import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { incidentsService, Incident } from '../services/incidents.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

type IncidentDetailRouteProp = RouteProp<ModulesStackParamList, 'IncidentDetail'>;

export default function IncidentDetailScreen() {
  const route = useRoute<IncidentDetailRouteProp>();
  const navigation = useNavigation();
  const { incidentId } = route.params;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  const loadIncident = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await incidentsService.getIncidentDetail(incidentId);
      setIncident(data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        (navigation as any).navigate('NoAccess', { 
          resource: 'incident', 
          message: 'You do not have permission to view this incident' 
        });
        return;
      }
      if (err?.response?.status === 404) {
        (navigation as any).navigate('NotFound', { 
          resource: 'incident', 
          message: 'This incident was not found or may have been deleted' 
        });
        return;
      }
      setError('Failed to load incident');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.colors.error;
      case 'high': return '#FF6B6B';
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.info;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return theme.colors.error;
      case 'investigating': return theme.colors.warning;
      case 'resolved': return theme.colors.success;
      case 'closed': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>{error || 'Incident not found'}</Text>
        <TouchableOpacity style={s.retryButton} onPress={() => loadIncident()}>
          <Text style={s.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={s.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadIncident(true)}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={s.header}>
        <Text style={s.title}>{incident.type}</Text>
        <View style={s.badges}>
          <View style={[s.badge, { backgroundColor: getSeverityColor(incident.severity) + '20' }]}>
            <Text style={[s.badgeText, { color: getSeverityColor(incident.severity) }]}>
              {incident.severity.toUpperCase()}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: getStatusColor(incident.status) + '20' }]}>
            <Text style={[s.badgeText, { color: getStatusColor(incident.status) }]}>
              {incident.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Details</Text>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Location:</Text>
          <Text style={s.detailValue}>{incident.location}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Date:</Text>
          <Text style={s.detailValue}>{new Date(incident.date).toLocaleDateString()}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Reported By:</Text>
          <Text style={s.detailValue}>{incident.reportedBy}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Created:</Text>
          <Text style={s.detailValue}>{new Date(incident.createdAt).toLocaleString()}</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Description</Text>
        <Text style={s.description}>{incident.description}</Text>
      </View>

      {incident.photos && incident.photos.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Photos ({incident.photos.length})</Text>
          <View style={s.photoGrid}>
            {incident.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={s.photo}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  badges: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  badgeText: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold },
  section: { padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sectionTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textSecondary, width: 100 },
  detailValue: { fontSize: 14, color: theme.colors.text, flex: 1 },
  description: { fontSize: 14, color: theme.colors.text, lineHeight: 20 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 100, height: 100, borderRadius: 8 },
  errorText: { fontSize: 16, color: theme.colors.error, marginBottom: theme.spacing.md },
  retryButton: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  retryButtonText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#fff' },
});
