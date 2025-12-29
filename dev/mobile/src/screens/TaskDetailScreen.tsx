import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { tasksService, TaskDetail } from '../services/tasks.service';
import { theme } from '../../theme.config';

export default function TaskDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { taskId } = route.params || {};
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    if (!taskId) {
      setError('Task ID not provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await tasksService.getTaskDetail(taskId);
      setTask(data);
    } catch (err: any) {
      console.error('Failed to load task:', err);
      const status = err?.response?.status;
      if (status === 403) {
        (navigation as any).navigate('NoAccess', { resource: 'task', message: 'You do not have permission to view this task.' });
        return;
      }
      if (status === 404) {
        (navigation as any).navigate('NotFound', { resource: 'task', message: 'This task could not be found.' });
        return;
      }
      setError('Failed to load task');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Task not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTask}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const isDueSoon = task.dueDate && !isOverdue && new Date(task.dueDate).getTime() - Date.now() < 86400000 * 3;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{task.title}</Text>
          {task.assignedToName && <Text style={styles.subtitle}>Assigned to {task.assignedToName}</Text>}
        </View>
        <View style={[styles.badge, getStatusBadgeStyle(task.status)]}>
          <Text style={styles.badgeText}>{task.status}</Text>
        </View>
      </View>

      {task.dueDate && (
        <View style={[styles.dueDateCard, isOverdue ? styles.overdue : isDueSoon ? styles.dueSoon : {}]}>
          <Text style={styles.dueDateLabel}>{isOverdue ? '⚠️ OVERDUE' : isDueSoon ? '⏰ DUE SOON' : 'Due Date'}</Text>
          <Text style={styles.dueDateValue}>{new Date(task.dueDate).toLocaleDateString()}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.card}>
          {task.priority && <InfoRow label="Priority" value={task.priority} />}
          {task.assignedByName && <InfoRow label="Assigned By" value={task.assignedByName} />}
          <InfoRow label="Created" value={new Date(task.createdAt).toLocaleString()} />
          {task.completedAt && <InfoRow label="Completed" value={new Date(task.completedAt).toLocaleString()} />}
          {task.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{task.description}</Text>
            </View>
          )}
        </View>
      </View>

      {task.comments && task.comments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments</Text>
          <View style={styles.card}>
            {task.comments.map((c, idx) => (
              <View key={c.id} style={[styles.comment, idx > 0 && styles.commentBorder]}>
                <Text style={styles.commentAuthor}>{c.authorName}</Text>
                <Text style={styles.commentContent}>{c.content}</Text>
                <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {task.attachments && task.attachments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          <View style={styles.card}>
            {task.attachments.map((att) => (
              <TouchableOpacity key={att.id} style={styles.attachment}>
                <Text style={styles.attachmentName}>📎 {att.filename}</Text>
                {att.size && <Text style={styles.attachmentSize}>{formatBytes(att.size)}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'COMPLETED':
      return { backgroundColor: '#4CAF50' };
    case 'IN_PROGRESS':
      return { backgroundColor: '#2196F3' };
    case 'PENDING':
      return { backgroundColor: '#FF9800' };
    default:
      return { backgroundColor: '#999' };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.background },
  loadingText: { marginTop: theme.spacing.sm, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.regular },
  errorText: { color: theme.colors.error, fontFamily: theme.typography.fontFamily.medium, marginBottom: theme.spacing.sm },
  retryButton: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md },
  retryText: { color: '#fff', fontFamily: theme.typography.fontFamily.medium },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: theme.spacing.md, backgroundColor: theme.colors.surface },
  title: { fontSize: theme.typography.fontSize.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  subtitle: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  badge: { paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  badgeText: { color: '#fff', fontSize: theme.typography.fontSize.xs, fontFamily: theme.typography.fontFamily.semibold },
  dueDateCard: { padding: theme.spacing.md, margin: theme.spacing.md, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surface },
  overdue: { backgroundColor: '#ffe0e0', borderWidth: 2, borderColor: theme.colors.error },
  dueSoon: { backgroundColor: '#fff6e0', borderWidth: 2, borderColor: theme.colors.warning },
  dueDateLabel: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  dueDateValue: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginTop: theme.spacing.xs },
  section: { padding: theme.spacing.md },
  sectionTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md },
  infoRow: { marginBottom: theme.spacing.sm },
  infoLabel: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text },
  comment: { paddingVertical: theme.spacing.sm },
  commentBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  commentAuthor: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  commentContent: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text, marginTop: 2 },
  commentDate: { fontSize: theme.typography.fontSize.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 2 },
  attachment: { paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  attachmentName: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text },
  attachmentSize: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 2 },
});
