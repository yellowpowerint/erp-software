import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type QuickAction = {
  key: string;
  title: string;
  subtitle?: string;
  onPress: () => void | Promise<void>;
};

type Props = {
  visible: boolean;
  title?: string;
  actions: QuickAction[];
  onClose: () => void;
};

export function QuickActionsSheet({ visible, title = 'Quick actions', actions, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.close, pressed ? styles.closePressed : null]}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.list}>
            {actions.map((a) => (
              <Pressable
                key={a.key}
                onPress={async () => {
                  await a.onPress();
                  onClose();
                }}
                style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{a.title}</Text>
                  {a.subtitle ? <Text style={styles.rowSubtitle}>{a.subtitle}</Text> : null}
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 16,
    paddingTop: 12,
    paddingHorizontal: 14,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  close: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  closePressed: {
    opacity: 0.85,
  },
  closeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  row: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  chevron: {
    color: '#9ca3af',
    fontSize: 22,
    paddingLeft: 10,
    fontWeight: '800',
  },
});
