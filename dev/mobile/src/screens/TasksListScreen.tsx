/**
 * Tasks List Screen
 * Session M3.3 - Tasks list with search, filters, pagination
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { tasksService, Task, TaskStatus } from '../services/tasks.service';
import { theme } from '../../theme.config';
import { WorkStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { cacheService } from '../services/cache.service';

const TASK_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'];

export default function TasksListScreen() {
  const navigation = useNavigation<NavigationProp<WorkStackParamList>>();
  const { user } = useAuthStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);
  const [mineOnly, setMineOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const canAccess = useMemo(() => !!user, [user]);

  useEffect(() => {
    loadTasks(1, false);
  }, [statusFilter, search, mineOnly]);

  const loadTasks = async (targetPage = 1, append = false, forceRefresh = false) => {
    if (!canAccess) return;
    if (targetPage > 1 && isFetchingMore) return;

    try {
      if (targetPage === 1) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsFetchingMore(true);
      }

      const userId = user?.id;

      const apiParams = {
        page: targetPage,
        search: search.trim() || undefined,
        status: statusFilter,
        mine: mineOnly,
      };

      const cacheParams = { ...apiParams, userId };

      // Try to load from cache first (only for page 1)
      if (targetPage === 1 && !forceRefresh) {
        const cached = await cacheService.get<any>('/tasks', cacheParams);
        if (cached) {
          console.log('[TASKS] Loaded tasks from cache');
          setPage(cached.page);
          setTotalPages(cached.totalPages);
          setTasks(cached.items);
          setIsFromCache(true);
          setIsLoading(false);

          // Fetch fresh data in background
          tasksService.getTasks(apiParams)
            .then(res => {
              console.log('[TASKS] Refreshed tasks from server');
              setPage(res.page);
              setTotalPages(res.totalPages);
              setTasks(res.items);
              setIsFromCache(false);
              cacheService.set('/tasks', res, cacheParams);
            })
            .catch(err => {
              console.error('[TASKS] Background refresh failed:', err);
            });
          return;
        }
      }

      // Fetch from server
      const res = await tasksService.getTasks(apiParams);

      setPage(res.page);
      setTotalPages(res.totalPages);
      setTasks((prev) => (append ? [...prev, ...res.items] : res.items));
      setIsFromCache(false);

      // Cache the response (only page 1)
      if (targetPage === 1) {
        await cacheService.set('/tasks', res, cacheParams);
      }
    } catch (err: any) {
      console.error('Failed to load tasks', err);
      setError(err?.response?.status === 403 ? 'Access denied' : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadTasks(1, false, true); // Force refresh from server
  };

  const loadMore = () => {
    if (isLoading || isFetchingMore) return;
    if (page >= totalPages) return;
    loadTasks(page + 1, true);
  };

  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return theme.colors.textSecondary;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return theme.colors.error;
    if (diffDays <= 3) return theme.colors.warning;
    return theme.colors.textSecondary;
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return 'No due date';
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return due.toLocaleDateString();
  };

  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return { backgroundColor: theme.colors.success + '20', color: theme.colors.success };
      case 'IN_PROGRESS':
        return { backgroundColor: theme.colors.info + '20', color: theme.colors.info };
      case 'CANCELLED':
        return { backgroundColor: theme.colors.error + '20', color: theme.colors.error };
      default:
        return { backgroundColor: theme.colors.warning + '20', color: theme.colors.warning };
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const statusStyle = getStatusBadgeStyle(item.status);
    const dueDateColor = getDueDateColor(item.dueDate);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title || item.id}</Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.badgeText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>
            {item.assignedToName || 'Unassigned'}
          </Text>
          {item.dueDate && (
            <Text style={[styles.cardDueDate, { color: dueDateColor }]}>
              {formatDueDate(item.dueDate)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const Filters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.filterChips}>
          {TASK_STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(status === statusFilter ? undefined : status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.mineToggle}
        onPress={() => setMineOnly(!mineOnly)}
      >
        <View style={[styles.checkbox, mineOnly && styles.checkboxActive]}>
          {mineOnly && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.mineToggleText}>My tasks only</Text>
      </TouchableOpacity>
    </View>
  );

  const ListHeader = () => (
    <View>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Your assigned tasks</Text>

      {isFromCache && (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheBannerText}>📱 Offline - Showing cached data</Text>
        </View>
      )}

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => loadTasks(1, false)}
        />
      </View>

      <Filters />
    </View>
  );

  if (!canAccess) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>You must be signed in to view tasks.</Text>
      </View>
    );
  }

  if (isLoading && !isRefreshing && tasks.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={renderTask}
      ListHeaderComponent={<ListHeader />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{error || 'No tasks found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadTasks(1, false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      }
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading more...</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  cacheBanner: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  cacheBannerText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#856404',
    textAlign: 'center',
  },
  searchBox: {
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filtersContainer: {
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    marginBottom: theme.spacing.sm,
  },
  filterLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  mineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
  },
  mineToggleText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.semibold,
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMetaText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  cardDueDate: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.error,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#FFFFFF',
  },
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});
