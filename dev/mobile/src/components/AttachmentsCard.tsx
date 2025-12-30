import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { theme } from '../../theme.config';
import { Attachment } from '../types/attachment';

type Props = {
  title?: string;
  attachments: Attachment[];
  onAdd?: () => void;
  onPressItem?: (item: Attachment) => void;
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${sizes[i]}`;
};

export function AttachmentsCard({ title = 'Attachments', attachments, onAdd, onPressItem }: Props) {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.title}>{title}</Text>
        <View style={s.right}>
          <View style={s.badge}>
            <Text style={s.badgeText}>{attachments.length}</Text>
          </View>
          {onAdd && (
            <TouchableOpacity style={s.addButton} onPress={onAdd}>
              <Text style={s.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {attachments.length === 0 ? (
        <Text style={s.empty}>No attachments</Text>
      ) : (
        <FlatList
          data={attachments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.item}
              activeOpacity={0.7}
              onPress={() => onPressItem?.(item)}
            >
              <View style={s.iconCircle}>
                <Text style={s.iconText}>📎</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                <Text style={s.meta} numberOfLines={1}>
                  {item.mimeType || 'File'} {item.size ? `• ${formatBytes(item.size)}` : ''}{item.uploadedAt ? ` • ${new Date(item.uploadedAt).toLocaleDateString()}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  badgeText: {
    color: '#fff',
    fontFamily: theme.typography.fontFamily.semibold,
  },
  addButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  empty: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconText: {
    fontSize: 18,
  },
  name: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text,
  },
  meta: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});
