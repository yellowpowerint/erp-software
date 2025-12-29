import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { notificationPreferencesService, NotificationPreferences } from '../services/notificationPreferences.service';
import { theme } from '../../theme.config';

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadPreferences(); }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    const prefs = await notificationPreferencesService.getPreferences();
    setPreferences(prefs);
    setIsLoading(false);
  };

  const savePreferences = async () => {
    if (!preferences) return;
    setIsSaving(true);
    await notificationPreferencesService.updatePreferences(preferences);
    setIsSaving(false);
    Alert.alert('Success', 'Saved');
  };

  const toggleChannel = (ch: keyof NotificationPreferences['channels']) => {
    if (!preferences) return;
    setPreferences({ ...preferences, channels: { ...preferences.channels, [ch]: !preferences.channels[ch] } });
  };

  const toggleCategory = (cat: keyof NotificationPreferences['categories']) => {
    if (!preferences) return;
    setPreferences({ ...preferences, categories: { ...preferences.categories, [cat]: !preferences.categories[cat] } });
  };

  if (isLoading) return <View style={styles.container}><ActivityIndicator size='large' color={theme.colors.primary} /></View>;
  if (!preferences) return <View style={styles.container}><Text>Error</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Channels</Text>
        <View style={styles.row}><Text>Email</Text><Switch value={preferences.channels.email} onValueChange={() => toggleChannel('email')} /></View>
        <View style={styles.row}><Text>Push</Text><Switch value={preferences.channels.push} onValueChange={() => toggleChannel('push')} /></View>
        <View style={styles.row}><Text>SMS</Text><Switch value={preferences.channels.sms} onValueChange={() => toggleChannel('sms')} /></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.row}><Text>Approvals</Text><Switch value={preferences.categories.approvals} onValueChange={() => toggleCategory('approvals')} /></View>
        <View style={styles.row}><Text>Tasks</Text><Switch value={preferences.categories.tasks} onValueChange={() => toggleCategory('tasks')} /></View>
        <View style={styles.row}><Text>Inventory</Text><Switch value={preferences.categories.inventory} onValueChange={() => toggleCategory('inventory')} /></View>
        <View style={styles.row}><Text>Safety</Text><Switch value={preferences.categories.safety} onValueChange={() => toggleCategory('safety')} /></View>
        <View style={styles.row}><Text>HR</Text><Switch value={preferences.categories.hr} onValueChange={() => toggleCategory('hr')} /></View>
        <View style={styles.row}><Text>System</Text><Switch value={preferences.categories.system} onValueChange={() => toggleCategory('system')} /></View>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={savePreferences} disabled={isSaving}>
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Preferences'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: theme.colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  saveButton: { margin: 16, padding: 16, backgroundColor: theme.colors.primary, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
