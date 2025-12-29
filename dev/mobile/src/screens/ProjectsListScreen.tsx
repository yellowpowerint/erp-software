import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { projectsService, Project, ProjectSearchResponse } from '../services/projects.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

export default function ProjectsListScreen() {
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadProjects();
    }, [statusFilter, searchQuery])
  );

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const res: ProjectSearchResponse = await projectsService.getProjects({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setProjects(res.projects);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        navigation.navigate('NoAccess', { resource: 'projects' });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'completed': return theme.colors.info;
      case 'on-hold': return theme.colors.warning;
      case 'cancelled': return theme.colors.error;
      case 'planning': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return theme.colors.error;
      case 'high': return theme.colors.warning;
      case 'medium': return theme.colors.info;
      case 'low': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const sanitized = hex.replace('#', '');
    if (sanitized.length !== 6) return hex;
    const r = parseInt(sanitized.slice(0, 2), 16);
    const g = parseInt(sanitized.slice(2, 4), 16);
    const b = parseInt(sanitized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const renderItem = ({ item }: { item: Project }) => (
    <TouchableOpacity 
      style={s.card} 
      onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
    >
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardCode}>{item.code}</Text>
          <Text style={s.cardName}>{item.name}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: hexToRgba(getStatusColor(item.status), 0.12) }]}>
          <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.cardMeta}>
        <Text style={s.cardMetaText}>Manager: {item.managerName}</Text>
        {item.location && <Text style={s.cardMetaText}>📍 {item.location}</Text>}
      </View>

      <View style={s.progressContainer}>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${item.progress}%` }]} />
        </View>
        <Text style={s.progressText}>{item.progress}%</Text>
      </View>

      <View style={s.cardFooter}>
        <View style={[s.priorityBadge, { backgroundColor: hexToRgba(getPriorityColor(item.priority), 0.12) }]}>
          <Text style={[s.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
        <Text style={s.cardDate}>
          {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
        </Text>
      </View>

      <View style={s.budgetContainer}>
        <Text style={s.budgetLabel}>Budget:</Text>
        <Text style={s.budgetAmount}>
          {item.currency} {item.budget.toLocaleString()} 
          <Text style={s.budgetSpent}> (Spent: {item.currency} {item.spent.toLocaleString()})</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <FlatList
      data={projects}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <View>
          <View style={s.header}>
            <Text style={s.title}>Projects</Text>
          </View>

          <TextInput
            style={s.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={s.filterChips}>
            {['all', 'active', 'planning', 'on-hold', 'completed'].map(status => (
              <TouchableOpacity 
                key={status} 
                style={[s.chip, statusFilter === status && s.chipActive]} 
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[s.chipText, statusFilter === status && s.chipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      contentContainerStyle={s.list}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyText}>No projects found</Text>
        </View>
      }
      refreshControl={
        <RefreshControl 
          refreshing={isRefreshing} 
          onRefresh={() => { setIsRefreshing(true); loadProjects(); }} 
        />
      }
    />
  );
}

const s = StyleSheet.create({
  list: { padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: theme.spacing.md },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  filterChips: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.md, flexWrap: 'wrap' },
  chip: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 16, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  chipTextActive: { color: theme.colors.background },
  card: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 8, 
    padding: theme.spacing.md, 
    marginBottom: theme.spacing.md, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  cardHeader: { flexDirection: 'row', marginBottom: theme.spacing.sm },
  cardCode: { fontSize: 12, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.textSecondary },
  cardName: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold },
  cardMeta: { marginBottom: theme.spacing.sm },
  cardMetaText: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  progressBar: { 
    flex: 1, 
    height: 8, 
    backgroundColor: theme.colors.border, 
    borderRadius: 4, 
    overflow: 'hidden',
    marginRight: theme.spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary },
  progressText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, width: 40 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  priorityText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold },
  cardDate: { fontSize: 11, color: theme.colors.textSecondary },
  budgetContainer: { flexDirection: 'row', alignItems: 'center' },
  budgetLabel: { fontSize: 12, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginRight: 4 },
  budgetAmount: { fontSize: 12, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },
  budgetSpent: { fontSize: 11, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  empty: { padding: theme.spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary },
});
