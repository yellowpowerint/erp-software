import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme.config';
import { fleetBreakdownsService } from '../services/fleetBreakdowns.service';
import { fleetActionsService } from '../services/fleetActions.service';
import { Button, TextInput } from '../components';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function ReportBreakdownScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MECHANICAL');
  const [severity, setSeverity] = useState('MEDIUM');
  const [location, setLocation] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [gpsLocation, setGpsLocation] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssets();
    requestLocationPermission();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await fleetBreakdownsService.getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
      Alert.alert('Error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setGpsLocation(loc.coords);
      setLocation(${loc.coords.latitude.toFixed(6)}, );
    }
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
    if (!title || !description) {
      Alert.alert('Error', 'Please provide title and description');
      return;
    }
    if (!siteLocation) {
      Alert.alert('Error', 'Please provide site location');
      return;
    }

    setSubmitting(true);
    try {
      const dto = {
        assetId: selectedAsset,
        breakdownDate: new Date().toISOString(),
        location,
        siteLocation,
        title,
        description,
        category,
        severity,
        operationalImpact: '',
        photos: [],
      };

      await fleetActionsService.queueAction('breakdown', dto, photos);
      Alert.alert('Success', 'Breakdown reported successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      console.error('Failed to report breakdown:', error);
      Alert.alert('Error', 'Failed to report breakdown');
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

      <Text style={styles.sectionTitle}>Breakdown Details</Text>
      <TextInput label=\"Title\" value={title} onChangeText={setTitle} placeholder=\"Brief description\" />
      <TextInput label=\"Description\" value={description} onChangeText={setDescription} multiline placeholder=\"Detailed breakdown description\" />

      <Text style={styles.sectionTitle}>Category</Text>
      <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
        <Picker.Item label=\"Mechanical\" value=\"MECHANICAL\" />
        <Picker.Item label=\"Electrical\" value=\"ELECTRICAL\" />
        <Picker.Item label=\"Hydraulic\" value=\"HYDRAULIC\" />
        <Picker.Item label=\"Structural\" value=\"STRUCTURAL\" />
        <Picker.Item label=\"Tire\" value=\"TIRE\" />
        <Picker.Item label=\"Other\" value=\"OTHER\" />
      </Picker>

      <Text style={styles.sectionTitle}>Severity</Text>
      <Picker selectedValue={severity} onValueChange={setSeverity} style={styles.picker}>
        <Picker.Item label=\"Low\" value=\"LOW\" />
        <Picker.Item label=\"Medium\" value=\"MEDIUM\" />
        <Picker.Item label=\"High\" value=\"HIGH\" />
        <Picker.Item label=\"Critical\" value=\"CRITICAL\" />
      </Picker>

      <Text style={styles.sectionTitle}>Location</Text>
      <TextInput label=\"Site Location\" value={siteLocation} onChangeText={setSiteLocation} placeholder=\"e.g., Main Pit, Workshop\" />
      <TextInput label=\"GPS Coordinates\" value={location} onChangeText={setLocation} placeholder=\"Auto-detected or manual entry\" />

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

      <Button title={submitting ? 'Submitting...' : 'Report Breakdown'} onPress={submit} disabled={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  picker: { backgroundColor: theme.colors.surface, marginBottom: 16 },
  photoButtons: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  photoButton: { flex: 1, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 8, alignItems: 'center' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  photoItem: { width: 100, height: 100, position: 'relative' },
  photoThumb: { width: '100%', height: '100%', borderRadius: 8 },
  removePhoto: { position: 'absolute', top: -8, right: -8, backgroundColor: 'red', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
