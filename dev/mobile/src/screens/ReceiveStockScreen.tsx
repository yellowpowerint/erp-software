import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { inventoryService } from '../services/inventory.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

type ReceiveStockRouteProp = RouteProp<ModulesStackParamList, 'ReceiveStock'>;

export default function ReceiveStockScreen() {
  const route = useRoute<ReceiveStockRouteProp>();
  const navigation = useNavigation();
  const { itemId, itemName, currentStock, unit } = route.params;
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submitMovement = async () => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than 0');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await inventoryService.createMovement({
        itemId,
        type: 'IN',
        quantity: qty,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        photoUri: photoUri || undefined,
      });
      Alert.alert('Success', 'Stock received successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to record stock receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Receive Stock</Text>
        <Text style={s.itemName}>{itemName}</Text>
        <Text style={s.currentStock}>Current Stock: {currentStock} {unit}</Text>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Quantity to Receive *</Text>
        <TextInput
          style={s.input}
          placeholder={`Enter quantity in ${unit}`}
          placeholderTextColor={theme.colors.textSecondary}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Reference (PO, Delivery Note)</Text>
        <TextInput
          style={s.input}
          placeholder="e.g., PO-12345"
          placeholderTextColor={theme.colors.textSecondary}
          value={reference}
          onChangeText={setReference}
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Notes</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="Additional notes..."
          placeholderTextColor={theme.colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Delivery Note Photo</Text>
        <View style={s.photoButtons}>
          <TouchableOpacity style={s.photoButton} onPress={handleTakePhoto}>
            <Text style={s.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.photoButton} onPress={handlePickPhoto}>
            <Text style={s.photoButtonText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
        {photoUri && (
          <View style={s.photoPreview}>
            <Image source={{ uri: photoUri }} style={s.photo} />
            <TouchableOpacity style={s.removePhoto} onPress={() => setPhotoUri(null)}>
              <Text style={s.removePhotoText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[s.submitButton, isSubmitting && s.submitButtonDisabled]} 
        onPress={submitMovement}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.submitButtonText}>Receive Stock</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  itemName: { fontSize: 18, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginTop: 8 },
  currentStock: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  section: { marginBottom: theme.spacing.lg },
  label: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginBottom: 8 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoButton: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  photoButtonText: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.primary },
  photoPreview: { marginTop: 12, alignItems: 'center' },
  photo: { width: '100%', height: 200, borderRadius: 8 },
  removePhoto: { marginTop: 8, padding: 8 },
  removePhotoText: { color: theme.colors.error, fontSize: 14, fontFamily: theme.typography.fontFamily.semibold },
  submitButton: { backgroundColor: theme.colors.primary, borderRadius: 8, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#fff' },
});
