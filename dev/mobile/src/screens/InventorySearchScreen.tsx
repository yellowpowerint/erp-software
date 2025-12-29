/**
 * Inventory Search Screen
 * Session M4.1 - Inventory search with filters and pagination
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { inventoryService, InventoryItem } from '../services/inventory.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';

export default function InventorySearchScreen() {
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();
  const { user } = useAuthStore();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadItems(1, false);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [categoryFilter, lowStockOnly, search]);

  const loadCategories = async () => {
    try {
      const cats = await inventoryService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadItems = async (targetPage = 1, append = false) => {
    if (!user) return;
    if (targetPage > 1 && isFetchingMore) return;

    try {
      if (targetPage === 1) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsFetchingMore(true);
      }

      const res = await inventoryService.searchItems({
        page: targetPage,
        search: search.trim() || undefined,
        category: categoryFilter,
        lowStockOnly,
      });

      setPage(res.page);
      setTotalPages(res.totalPages);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch (err: any) {
      console.error('Failed to load inventory items', err);
      setError(err?.response?.status === 403 ? 'Access denied' : 'Failed to load inventory');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadItems(1, false);
  };

  const loadMore = () => {
    if (isLoading || isFetchingMore) return;
    if (page >= totalPages) return;
    loadItems(page + 1, true);
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.quantity === 0) return theme.colors.error;
    if (item.isLowStock || item.quantity <= item.reorderLevel) return theme.colors.warning;
    return theme.colors.success;
  };

  const getStockStatusText = (item: InventoryItem) => {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.isLowStock || item.quantity <= item.reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const statusColor = getStockStatusColor(item);
    const statusText = getStockStatusText(item);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('InventoryDetail', { itemId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSku}>SKU: {item.sku}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{item.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantity:</Text>
            <Text style={[styles.infoValue, { color: statusColor, fontFamily: theme.typography.fontFamily.semibold }]}>
              {item.quantity} {item.unit}
            </Text>
          </View>
          {item.location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{item.location}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const Filters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Category:</Text>
        <View style={styles.filterChips}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                categoryFilter === category && styles.filterChipActive,
              ]}
              onPress={() => setCategoryFilter(category === categoryFilter ? undefined : category)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === category && styles.filterChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.lowStockToggle}
        onPress={() => setLowStockOnly(!lowStockOnly)}
      >
        <View style={[styles.checkbox, lowStockOnly && styles.checkboxActive]}>
          {lowStockOnly && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.lowStockToggleText}>Show low stock only</Text>
      </TouchableOpacity>
    </View>
  );

  const ListHeader = () => (
    <View>
      <Text style={styles.title}>Inventory</Text>
      <Text style={styles.subtitle}>Search and view stock items</Text>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, SKU, or description..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => loadItems(1, false)}
        />
      </View>

      <Filters />
    </View>
  );

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>You must be signed in to view inventory.</Text>
      </View>
    );
  }

  if (isLoading && !isRefreshing && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={<ListHeader />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{error || 'No items found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadItems(1, false)}>
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
  lowStockToggle: {
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
  lowStockToggleText: {
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
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardSku: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.semibold,
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
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
