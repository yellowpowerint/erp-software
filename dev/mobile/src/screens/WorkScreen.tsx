/**
 * Work Screen - Approvals List (M3.1)
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { approvalsService, Approval, ApprovalStatus, ApprovalType } from '../services/approvals.service';
import { theme } from '../../theme.config';
import { WorkStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';

const APPROVAL_TYPES: ApprovalType[] = ['INVOICE', 'PURCHASE_REQUEST', 'IT_REQUEST', 'PAYMENT_REQUEST'];
const APPROVAL_STATUSES: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function WorkScreen() {
  const navigation = useNavigation<NavigationProp<WorkStackParamList>>();
  const { user } = useAuthStore();

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ApprovalType | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const canAccess = useMemo(() => !!user, [user]);

  const loadApprovals = useCallback(async (targetPage = 1, append = false) => {
    if (!canAccess) return;
    if (targetPage > 1 && isFetchingMore) return;

    try {
      if (targetPage === 1) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsFetchingMore(true);
      }

      const res = await approvalsService.getApprovals({
        page: targetPage,
        search: search.trim() || undefined,
        type: typeFilter,
        status: statusFilter,
      });

      setPage(res.page);
      setTotalPages(res.totalPages);
      setApprovals((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch (err: any) {
      console.error('Failed to load approvals', err);
      setError(err?.response?.status === 403 ? 'Access denied' : 'Failed to load approvals');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  }, [canAccess, isFetchingMore, search, typeFilter, statusFilter]);

  useEffect(() => {
    loadApprovals(1, false);
  }, [typeFilter, statusFilter]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadApprovals(1, false);
  };

  const loadMore = () => {
    if (isLoading || isFetchingMore) return;
    if (page >= totalPages) return;
    loadApprovals(page + 1, true);
  };

  const renderApproval = ({ item }: { item: Approval }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ApprovalDetail', { approvalId: item.id, approvalType: item.type })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title || item.id}</Text>
        <View style={[styles.badge, badgeStyle(item.status)]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>
        {item.type} • {item.requesterName || 'Requester'} • {formatDate(item.createdAt)}
      </Text>
      {item.amount !== undefined && (
        <Text style={styles.cardAmount}>
          {item.currency || 'USD'} {item.amount?.toLocaleString()}
        </Text>
      )}
      {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
    </TouchableOpacity>
  );

  const Filters = () => (
    <View style={styles.filtersContainer}>
      <ScrollChips
        label="Type"
        options={APPROVAL_TYPES}
        value={typeFilter}
        onSelect={(val) => setTypeFilter(val === typeFilter ? undefined : val)}
      />
      <ScrollChips
        label="Status"
        options={APPROVAL_STATUSES}
        value={statusFilter}
        onSelect={(val) => setStatusFilter(val === statusFilter ? undefined : val)}
      />
    </View>
  );

  const ListHeader = () => (
    <View>
      <Text style={styles.title}>Work</Text>
      <Text style={styles.subtitle}>Approvals & Tasks</Text>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('TasksList')}>
          <Text style={styles.quickTitle}>Tasks</Text>
          <Text style={styles.quickSubtitle}>View all tasks</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search approvals (invoice #, supplier, requester)..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => loadApprovals(1, false)}
        />
      </View>

      <Filters />
    </View>
  );

  if (!canAccess) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>You must be signed in to view approvals.</Text>
      </View>
    );
  }

  if (isLoading && !isRefreshing && approvals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading approvals...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={approvals}
      keyExtractor={(item) => item.id}
      renderItem={renderApproval}
      ListHeaderComponent={<ListHeader />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{error || 'No approvals found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadApprovals(1, false)}>
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

function badgeStyle(status: ApprovalStatus) {
  switch (status) {
    case 'APPROVED':
      return { backgroundColor: '#d1f5e1', borderColor: '#2e8b57' };
    case 'REJECTED':
      return { backgroundColor: '#ffe0e0', borderColor: '#cc0000' };
    case 'PENDING':
      return { backgroundColor: '#fff6e0', borderColor: '#d9a300' };
    case 'CANCELLED':
    default:
      return { backgroundColor: '#eaeaea', borderColor: '#999' };
  }
}

function formatDate(date?: string) {
  if (!date) return '—';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
}

function ScrollChips({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value?: string;
  onSelect: (v: any) => void;
}) {
  return (
    <View style={styles.chipsSection}>
      <Text style={styles.chipsLabel}>{label}</Text>
      <View style={styles.chipsRow}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  quickTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
  },
  quickSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  searchBox: {
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    fontFamily: theme.typography.fontFamily.regular,
  },
  filtersContainer: {
    marginBottom: theme.spacing.md,
  },
  chipsSection: {
    marginBottom: theme.spacing.xs,
  },
  chipsLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipInactive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  chipTextActive: {
    color: '#fff',
  },
  chipTextInactive: {
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
  },
  cardMeta: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  cardAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    marginBottom: theme.spacing.sm,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    color: '#fff',
    fontFamily: theme.typography.fontFamily.medium,
  },
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: theme.colors.error || '#cc0000',
    fontFamily: theme.typography.fontFamily.medium,
  },
});
