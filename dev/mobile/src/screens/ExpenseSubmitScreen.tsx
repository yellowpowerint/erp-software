import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { expensesService } from '../services/expenses.service';
import { theme } from '../../theme.config';

export default function ExpenseSubmitScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    expensesService.getCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0) setCategory(cats[0]);
    });
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setReceiptUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setReceiptUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!category || !amount || parseFloat(amount) <= 0 || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await expensesService.submitExpense({
        category,
        amount: parseFloat(amount),
        date: new Date().toISOString().split('T')[0],
        description,
        receiptUri: receiptUri || undefined,
      });
      Alert.alert('Success', 'Expense submitted', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Submit Expense</Text>
      <View style={s.section}>
        <Text style={s.label}>Category *</Text>
        <Picker selectedValue={category} onValueChange={setCategory}>
          {categories.map(c => <Picker.Item key={c} label={c} value={c} />)}
        </Picker>
      </View>
      <View style={s.section}>
        <Text style={s.label}>Amount *</Text>
        <TextInput style={s.input} placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      </View>
      <View style={s.section}>
        <Text style={s.label}>Description *</Text>
        <TextInput style={s.textArea} placeholder="Enter description" value={description} onChangeText={setDescription} multiline />
      </View>
      <View style={s.section}>
        <Text style={s.label}>Receipt</Text>
        {receiptUri ? (
          <View>
            <Image source={{ uri: receiptUri }} style={s.receiptImage} />
            <TouchableOpacity onPress={() => setReceiptUri(null)}><Text style={s.removeText}>Remove</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={s.photoButtons}>
            <TouchableOpacity style={s.photoButton} onPress={takePhoto}><Text>📷 Camera</Text></TouchableOpacity>
            <TouchableOpacity style={s.photoButton} onPress={pickImage}><Text>🖼️ Gallery</Text></TouchableOpacity>
          </View>
        )}
      </View>
      <TouchableOpacity style={s.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitButtonText}>Submit</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  section: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#ddd' },
  textArea: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#ddd', minHeight: 80 },
  photoButtons: { flexDirection: 'row', gap: 8 },
  photoButton: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, alignItems: 'center' },
  receiptImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  removeText: { color: theme.colors.error, textAlign: 'center' },
  submitButton: { backgroundColor: theme.colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
