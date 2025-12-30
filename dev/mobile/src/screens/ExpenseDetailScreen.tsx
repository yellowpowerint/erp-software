import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';
import { AttachmentsCard } from '../components';
import { mediaPickerService } from '../services/mediaPicker.service';
import { expensesService, ExpenseDetail } from '../services/expenses.service';
import { Attachment } from '../types/attachment';

type ExpenseDetailRouteProp = RouteProp<ModulesStackParamList, 'ExpenseDetail'>;

export default function ExpenseDetailScreen() {
  const route = useRoute<ExpenseDetailRouteProp>();
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();
  const { expenseId } = route.params;

  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const load = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const data = await expensesService.getExpenseDetail(expenseId);
      setExpense(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        navigation.navigate('NoAccess', { resource: 'expenses' });
        return;
      }
      if (status === 404) {
        navigation.navigate('NotFound', { resource: 'expenses' });
        return;
      }
      Alert.alert('Error', 'Failed to load expense.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId]);

  const handleAddAttachment = async () => {
    if (!expense) return;

    try {
      const picked = await mediaPickerService.pickDocument();
      if (!picked) return;

      setIsUploading(true);
      await expensesService.uploadAttachment(expense.id, picked.uri, picked.name, picked.mimeType);
      await load(true);
      Alert.alert('Success', 'Attachment uploaded successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={s.centered}>
        <Text style={s.emptyText}>Expense not found</Text>
      </View>
    );
  }

  const attachments: Attachment[] = (expense.attachments || []).map((a) => ({
    id: a.id,
    name: a.fileName,
    url: a.fileUrl,
    mimeType: a.fileType,
    uploadedAt: a.uploadedAt,
  }));

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} />}
    >
      <View style={s.header}>
        <Text style={s.title}>{expense.expenseNumber}</Text>
        <Text style={s.subtitle}>{expense.category}</Text>
      </View>

      <View style={s.card}>
        <Row label="Amount" value={`${expense.currency} ${expense.amount.toFixed(2)}`} />
        <Row label="Date" value={new Date(expense.expenseDate).toLocaleDateString()} />
        <Row label="Status" value={expense.status.toUpperCase()} />
        {expense.project?.name ? <Row label="Project" value={expense.project.name} /> : null}
        {expense.submittedBy?.firstName ? (
          <Row
            label="Submitted By"
            value={`${expense.submittedBy.firstName} ${expense.submittedBy.lastName}`}
          />
        ) : null}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Description</Text>
        <View style={s.card}>
          <Text style={s.text}>{expense.description}</Text>
        </View>
      </View>

      <View style={s.section}>
        <AttachmentsCard
          attachments={attachments}
          onAdd={!isUploading && expense.status === 'pending' ? handleAddAttachment : undefined}
          onPressItem={(att) => {
            if (!att.url) {
              Alert.alert('No URL', 'This attachment has no download URL.');
              return;
            }

            navigation.navigate('DocumentViewer', {
              documentId: att.id,
              url: att.url,
              name: att.name,
              mimeType: att.mimeType,
              size: att.size,
            });
          }}
        />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  emptyText: { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium },

  header: { marginBottom: theme.spacing.md },
  title: { fontSize: theme.typography.fontSize.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  subtitle: { marginTop: 2, fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },

  section: { marginTop: theme.spacing.md },
  sectionTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },

  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium, marginRight: theme.spacing.md, flex: 1 },
  value: { color: theme.colors.text, fontFamily: theme.typography.fontFamily.semibold, flex: 1, textAlign: 'right' },

  text: { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular, lineHeight: 20 },
});
