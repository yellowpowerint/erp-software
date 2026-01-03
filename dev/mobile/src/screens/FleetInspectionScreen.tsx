import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme.config';
import { fleetInspectionsService } from '../services/fleetInspections.service';
import { fleetActionsService } from '../services/fleetActions.service';
import { Button, TextInput } from '../components';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

const CHECKLIST = [
  { category: 'Exterior', items: ['Body condition', 'Lights working', 'Tires condition', 'Mirrors intact'] },
  { category: 'Engine', items: ['Oil level OK', 'Coolant level OK', 'Battery OK', 'No leaks'] },
  { category: 'Safety', items: ['Seat belts OK', 'Fire extinguisher', 'First aid kit', 'PPE available'] },
];

export default function FleetInspectionScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssets();
    initChecklist();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await fleetInspectionsService.getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
      Alert.alert('Error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const initChecklist = () => {
    const items = CHECKLIST.flatMap(cat =>
      cat.items.map(item => ({ category: cat.category, item, status: 'PASS', notes: '' }))
    );
    setChecklistItems(items);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], [field]: value };
    setChecklistItems(updated);
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setPhotos([...photos, result.assets[0]]);
  };

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setPhotos([...photos, result.assets[0]]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!selectedAsset) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }

    setSubmitting(true);
    try {
      const failedItems = checklistItems.filter(i => i.status === 'FAIL');
      const overallResult = failedItems.length === 0 ? 'PASS' : failedItems.length <= 2 ? 'CONDITIONAL' : 'FAIL';
      const score = Math.round(((checklistItems.length - failedItems.length) / checklistItems.length) * 100);

      const dto = {
        assetId: selectedAsset,
        type: 'PRE_START',
        inspectionDate: new Date().toISOString(),
        checklistItems,
        overallResult,
        score,
        findings,
        recommendations,
        defectsFound: failedItems.map(i => i.item),
        followUpRequired: failedItems.length > 0,
        photos: [],
      };

      await fleetActionsService.queueAction('inspection', dto, photos);
      Alert.alert('Success', 'Inspection submitted successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      console.error('Failed to submit inspection:', error);
      Alert.alert('Error', 'Failed to submit inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size=\"large\" color={theme.colors.primary} /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Vehicle</Text>
      <Picker selectedValue={selectedAsset} onValueChange={setSelectedAsset} style={styles.picker}>
        <Picker.Item label=\"Select Vehicle\" value=\"\" />
        {assets.map(a => <Picker.Item key={a.id} label={${a.assetCode} - } value={a.id} />)}
      </Picker>

      <Text style={styles.sectionTitle}>Checklist</Text>
      {CHECKLIST.map((cat, catIdx) => (
        <View key={catIdx} style={styles.category}>
          <Text style={styles.categoryTitle}>{cat.category}</Text>
          {cat.items.map((item, itemIdx) => {
            const idx = checklistItems.findIndex(ci => ci.category === cat.category && ci.item === item);
            return (
              <View key={itemIdx} style={styles.checklistItem}>
                <Text style={styles.itemText}>{item}</Text>
                <View style={styles.statusButtons}>
                  {['PASS', 'FAIL', 'NA'].map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusButton, checklistItems[idx]?.status === status && styles.statusButtonActive]}
                      onPress={() => updateItem(idx, 'status', status)}
                    >
                      <Text style={[styles.statusButtonText, checklistItems[idx]?.status === status && styles.statusButtonTextActive]}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Findings</Text>
      <TextInput label=\"Findings\" value={findings} onChangeText={setFindings} multiline />

      <Text style={styles.sectionTitle}>Recommendations</Text>
      <TextInput label=\"Recommendations\" value={recommendations} onChangeText={setRecommendations} multiline />

      <Text style={styles.sectionTitle}>Photos</Text>
      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}><Text>📷 Take Photo</Text></TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={choosePhoto}><Text>🖼️ Choose Photo</Text></TouchableOpacity>
      </View>
      <View style={styles.photoGrid}>
        {photos.map((photo, idx) => (
          <View key={idx} style={styles.photoItem}>
            <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
            <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(idx)}><Text style={styles.removePhotoText}>✕</Text></TouchableOpacity>
          </View>
        ))}
      </View>

      <Button title={submitting ? 'Submitting...' : 'Submit Inspection'} onPress={submit} disabled={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  picker: { backgroundColor: theme.colors.surface, marginBottom: 16 },
  category: { marginBottom: 16 },
  categoryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: theme.colors.primary },
  checklistItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { flex: 1, fontSize: 14 },
  statusButtons: { flexDirection: 'row', gap: 4 },
  statusButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#f0f0f0' },
  statusButtonActive: { backgroundColor: theme.colors.primary },
  statusButtonText: { fontSize: 12, color: '#666' },
  statusButtonTextActive: { color: '#fff', fontWeight: '600' },
  photoButtons: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  photoButton: { flex: 1, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 8, alignItems: 'center' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  photoItem: { width: 100, height: 100, position: 'relative' },
  photoThumb: { width: '100%', height: '100%', borderRadius: 8 },
  removePhoto: { position: 'absolute', top: -8, right: -8, backgroundColor: 'red', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
