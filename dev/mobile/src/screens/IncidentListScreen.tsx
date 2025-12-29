import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { incidentsService, Incident } from '../services/incidents.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

const STATUS_FILTERS = ['all', 'open', 'investigating', 'resolved', 'closed'];
const SEVERITY_FILTERS = ['all', 'low', 'medium', 'high', 'critical'];

export default function IncidentListScreen() {
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIncidents(1, false);
  }, [search, statusFilter, severityFilter]);

  const loadIncidents = async (targetPage = 1, append = false) => {
    if (targetPage > 1 && isFetchingMore) return;

    try {
      if (targetPage === 1) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsFetchingMore(true);
      }

      const res = await incidentsService.searchIncidents({
        page: targetPage,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
      });

      setPage(res.page);
      setTotalPages(res.totalPages);
      setIncidents(prev => append ? [...prev, ...res.incidents] : res.incidents);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        navigation.navigate('NoAccess', { resource: 'incidents', message: 'You do not have permission to view incidents' });
        return;
      }
      setError('Failed to load incidents');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadIncidents(1, false);
  };

  const loadMore = () => {
    if (isLoading || isFetchingMore || page >= totalPages) return;
    loadIncidents(page + 1, true);
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

  const renderItem = ({ item }: { item: Incident }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('IncidentDetail', { incidentId: item.id })}
    >
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.type}</Text>
          <Text style={s.cardLocation}>{item.location}</Text>
        </View>
        <View style={[s.severityBadge, { backgroundColor: getSeverityColor(item.severity) + '20' }]}>
          <Text style={[s.severityText, { color: getSeverityColor(item.severity) }]}>
            {item.severity.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={s.cardDescription} numberOfLines={2}>{item.description}</Text>

      <View style={s.cardFooter}>
        <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
        <Text style={s.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      <Text style={s.title}>Safety Incidents</Text>
      <Text style={s.subtitle}>View and manage incidents</Text>

      <View style={s.searchBox}>
        <TextInput
          style={s.searchInput}
          placeholder="Search incidents..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={s.filters}>
        <Text style={s.filterLabel}>Status:</Text>
        <View style={s.filterChips}>
          {STATUS_FILTERS.map(status => (
            <TouchableOpacity
              key={status}
              style={[s.filterChip, statusFilter === status && s.filterChipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[s.filterChipText, statusFilter === status && s.filterChipTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.filters}>
        <Text style={s.filterLabel}>Severity:</Text>
        <View style={s.filterChips}>
          {SEVERITY_FILTERS.map(severity => (
            <TouchableOpacity
              key={severity}
              style={[s.filterChip, severityFilter === severity && s.filterChipActive]}
              onPress={() => setSeverityFilter(severity)}
            >
              <Text style={[s.filterChipText, severityFilter === severity && s.filterChipTextActive]}>
                {severity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryButton} onPress={() => loadIncidents(1, false)}>
          <Text style={s.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={incidents}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyText}>No incidents found</Text>
        </View>
      }
      contentContainerStyle={s.list}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingMore ? <ActivityIndicator style={{ padding: 16 }} color={theme.colors.primary} /> : null
      }
    />
  );
}

const s = StyleSheet.create({
  list: { padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  searchBox: { marginBottom: theme.spacing.md },
  searchInput: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  filters: { marginBottom: theme.spacing.md },
  filterLabel: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginBottom: 8 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.colors.border },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  filterChipTextActive: { color: '#fff' },
  card: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm },
  cardTitle: { fontSize: 16, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  cardLocation: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  severityText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold },
  cardDescription: { fontSize: 14, color: theme.colors.text, marginBottom: theme.spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold, textTransform: 'uppercase' },
  cardDate: { fontSize: 12, color: theme.colors.textSecondary },
  empty: { padding: theme.spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary },
  errorText: { fontSize: 16, color: theme.colors.error, marginBottom: theme.spacing.md },
  retryButton: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  retryButtonText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#fff' },
});
