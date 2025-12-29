import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { inventoryService, InventoryItemDetail, InventoryMovement } from '../services/inventory.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

type InventoryDetailRouteProp = RouteProp<ModulesStackParamList, 'InventoryDetail'>;

export default function InventoryDetailScreen() {
  const route = useRoute<InventoryDetailRouteProp>();
  const navigation = useNavigation();
  const { itemId } = route.params;
  const [item, setItem] = useState<InventoryItemDetail | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadItemDetail(); }, [itemId]);

  const loadItemDetail = async () => {
    try {
      setIsLoading(true);
      const [itemData, movementsData] = await Promise.all([
        inventoryService.getItemDetail(itemId),
        inventoryService.getItemMovements(itemId, 10),
      ]);
      setItem(itemData);
      setMovements(movementsData);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        (navigation as any).navigate('NoAccess', { resource: 'inventory item', message: 'You do not have permission to view this item' });
        return;
      }
      if (err?.response?.status === 404) {
        (navigation as any).navigate('NotFound', { resource: 'inventory item', message: 'This item was not found or may have been deleted' });
        return;
      }
      setError('Failed to load item');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  if (error || !item) return <View style={s.centered}><Text style={s.errorText}>{error}</Text></View>;

  const statusColor = item.quantity === 0 ? theme.colors.error : item.quantity <= item.reorderLevel ? theme.colors.warning : theme.colors.success;

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'IN': return theme.colors.success;
      case 'OUT': return theme.colors.error;
      case 'ADJUSTMENT': return theme.colors.info;
      default: return theme.colors.textSecondary;
    }
  };

  const formatMovementQuantity = (movement: InventoryMovement) => {
    const sign = movement.type === 'OUT' ? '-' : movement.type === 'IN' ? '+' : '';
    return `${sign}${movement.quantity} ${movement.unit}`;
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{item.name}</Text>
        <Text style={s.sku}>SKU: {item.sku}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.label}>Stock: <Text style={{color: statusColor, fontWeight: 'bold'}}>{item.quantity} {item.unit}</Text></Text>
        <Text style={s.label}>Category: {item.category}</Text>
        <Text style={s.label}>Reorder: {item.reorderLevel} {item.unit}</Text>
        {item.location && <Text style={s.label}>Location: {item.location}</Text>}
      </View>
      
      <TouchableOpacity 
        style={s.receiveButton} 
        onPress={() => (navigation as any).navigate('ReceiveStock', {
          itemId: item.id,
          itemName: item.name,
          currentStock: item.quantity,
          unit: item.unit,
        })}
      >
        <Text style={s.receiveButtonText}>Receive Stock</Text>
      </TouchableOpacity>
      <Text style={s.sectionTitle}>Recent Movements</Text>
      {movements.length === 0 ? (
        <Text style={s.emptyText}>No recent movements</Text>
      ) : (
        movements.map(m => (
          <View key={m.id} style={s.movementCard}>
            <View style={s.movementHeader}>
              <View style={[s.movementBadge, { backgroundColor: getMovementTypeColor(m.type) + '20' }]}>
                <Text style={[s.movementType, { color: getMovementTypeColor(m.type) }]}>{m.type}</Text>
              </View>
              <Text style={s.movementDate}>{new Date(m.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[s.movementQty, { color: getMovementTypeColor(m.type) }]}>{formatMovementQuantity(m)}</Text>
            {m.reference && <Text style={s.movementRef}>Ref: {m.reference}</Text>}
            {m.notes && <Text style={s.movementNotes}>{m.notes}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: theme.spacing.md },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  sku: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: 8, marginBottom: theme.spacing.md },
  label: { fontSize: 14, color: theme.colors.text, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, marginBottom: theme.spacing.sm },
  movementCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: 8, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  movementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  movementBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  movementType: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold, textTransform: 'uppercase' },
  movementDate: { fontSize: 12, color: theme.colors.textSecondary },
  movementQty: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, marginBottom: 4 },
  movementRef: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  movementNotes: { fontSize: 12, color: theme.colors.text, marginTop: 4, fontStyle: 'italic' },
  emptyText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', padding: theme.spacing.lg },
  receiveButton: { backgroundColor: theme.colors.primary, borderRadius: 8, padding: theme.spacing.md, alignItems: 'center', marginBottom: theme.spacing.lg },
  receiveButtonText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#fff' },
  errorText: { color: theme.colors.error },
});
