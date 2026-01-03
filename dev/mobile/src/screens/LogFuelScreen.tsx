import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme.config';
import { fleetFuelService } from '../services/fleetFuel.service';
import { fleetActionsService } from '../services/fleetActions.service';
import { Button, TextInput } from '../components';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

export default function LogFuelScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [fuelType, setFuelType] = useState('DIESEL');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [hoursReading, setHoursReading] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await fleetFuelService.getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
      Alert.alert('Error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setReceiptPhoto(result.assets[0]);
  };

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setReceiptPhoto(result.assets[0]);
  };

  const removePhoto = () => {
    setReceiptPhoto(null);
  };

  const submit = async () => {
    if (!selectedAsset) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }
    if (!quantity || !unitPrice) {
      Alert.alert('Error', 'Please provide quantity and unit price');
      return;
    }
    if (!siteLocation) {
      Alert.alert('Error', 'Please provide site location');
      return;
    }

    setSubmitting(true);
    try {
      const totalCost = parseFloat(quantity) * parseFloat(unitPrice);
      const dto = {
        assetId: selectedAsset,
        transactionDate: new Date().toISOString(),
        transactionType: 'FILL_UP',
        fuelType,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalCost,
        odometerReading: odometerReading ? parseFloat(odometerReading) : null,
        hoursReading: hoursReading ? parseFloat(hoursReading) : null,
        fuelStation: fuelStation || null,
        receiptNumber: receiptNumber || null,
        siteLocation,
        notes: notes || null,
        receiptImage: null,
      };

      const photos = receiptPhoto ? [receiptPhoto] : [];
      await fleetActionsService.queueAction('fuel', dto, photos);
      Alert.alert('Success', 'Fuel logged successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      console.error('Failed to log fuel:', error);
      Alert.alert('Error', 'Failed to log fuel');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size=\"large\" color={theme.colors.primary} /></View>;

  const totalCost = quantity && unitPrice ? (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2) : '0.00';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Vehicle</Text>
      <Picker selectedValue={selectedAsset} onValueChange={setSelectedAsset} style={styles.picker}>
        <Picker.Item label=\"Select Vehicle\" value=\"\" />
        {assets.map(a => <Picker.Item key={a.id} label={${a.assetCode} - } value={a.id} />)}
      </Picker>

      <Text style={styles.sectionTitle}>Fuel Details</Text>
      <Picker selectedValue={fuelType} onValueChange={setFuelType} style={styles.picker}>
        <Picker.Item label=\"Diesel\" value=\"DIESEL\" />
        <Picker.Item label=\"Petrol\" value=\"PETROL\" />
        <Picker.Item label=\"LPG\" value=\"LPG\" />
      </Picker>

      <TextInput label=\"Quantity (Liters)\" value={quantity} onChangeText={setQuantity} keyboardType=\"numeric\" placeholder=\"0.00\" />
      <TextInput label=\"Unit Price\" value={unitPrice} onChangeText={setUnitPrice} keyboardType=\"numeric\" placeholder=\"0.00\" />
      
      <View style={styles.totalCostContainer}>
        <Text style={styles.totalCostLabel}>Total Cost:</Text>
        <Text style={styles.totalCostValue}>{totalCost}</Text>
      </View>

      <Text style={styles.sectionTitle}>Readings</Text>
      <TextInput label=\"Odometer Reading (km)\" value={odometerReading} onChangeText={setOdometerReading} keyboardType=\"numeric\" placeholder=\"Optional\" />
      <TextInput label=\"Hours Reading\" value={hoursReading} onChangeText={setHoursReading} keyboardType=\"numeric\" placeholder=\"Optional\" />

      <Text style={styles.sectionTitle}>Location & Receipt</Text>
      <TextInput label=\"Site Location\" value={siteLocation} onChangeText={setSiteLocation} placeholder=\"e.g., Main Site, Workshop\" />
      <TextInput label=\"Fuel Station\" value={fuelStation} onChangeText={setFuelStation} placeholder=\"Optional\" />
      <TextInput label=\"Receipt Number\" value={receiptNumber} onChangeText={setReceiptNumber} placeholder=\"Optional\" />

      <Text style={styles.sectionTitle}>Notes</Text>
      <TextInput label=\"Notes\" value={notes} onChangeText={setNotes} multiline placeholder=\"Optional notes\" />

      <Text style={styles.sectionTitle}>Receipt Photo</Text>
      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}><Text>📷 Take Photo</Text></TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={choosePhoto}><Text>🖼️ Choose Photo</Text></TouchableOpacity>
      </View>
      {receiptPhoto && (
        <View style={styles.photoItem}>
          <Image source={{ uri: receiptPhoto.uri }} style={styles.photoThumb} />
          <TouchableOpacity style={styles.removePhoto} onPress={removePhoto}><Text style={styles.removePhotoText}>✕</Text></TouchableOpacity>
        </View>
      )}

      <Button title={submitting ? 'Submitting...' : 'Log Fuel'} onPress={submit} disabled={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  picker: { backgroundColor: theme.colors.surface, marginBottom: 16 },
  totalCostContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: theme.colors.surface, borderRadius: 8, marginBottom: 16 },
  totalCostLabel: { fontSize: 16, fontWeight: '600' },
  totalCostValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  photoButtons: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  photoButton: { flex: 1, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 8, alignItems: 'center' },
  photoItem: { width: 200, height: 200, position: 'relative', marginBottom: 16 },
  photoThumb: { width: '100%', height: '100%', borderRadius: 8 },
  removePhoto: { position: 'absolute', top: -8, right: -8, backgroundColor: 'red', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
