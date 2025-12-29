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
      setError('Failed to load item');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  if (error || !item) return <View style={s.centered}><Text style={s.errorText}>{error}</Text></View>;

  const statusColor = item.quantity === 0 ? theme.colors.error : item.quantity <= item.reorderLevel ? theme.colors.warning : theme.colors.success;

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
      <Text style={s.sectionTitle}>Recent Movements</Text>
      {movements.map(m => (
        <View key={m.id} style={s.movementCard}>
          <Text style={s.movementType}>{m.type}: {m.quantity} {m.unit}</Text>
          <Text style={s.movementDate}>{new Date(m.date).toLocaleDateString()}</Text>
        </View>
      ))}
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
  movementCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.sm, borderRadius: 8, marginBottom: theme.spacing.sm },
  movementType: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold },
  movementDate: { fontSize: 12, color: theme.colors.textSecondary },
  errorText: { color: theme.colors.error },
});
