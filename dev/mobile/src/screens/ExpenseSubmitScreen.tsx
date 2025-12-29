import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { expensesService } from '../services/expenses.service';
import { theme } from '../../theme.config';

export default function ExpenseSubmitScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    expensesService.getCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0) setCategory(cats[0]);
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is required to select a receipt photo');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setReceiptUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take a photo');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setReceiptUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!category || !amount || parseFloat(amount) <= 0 || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      Alert.alert('Error', 'Expense date cannot be in the future');
      return;
    }

    setIsSubmitting(true);
    setRetryCount(0);

    const submitWithRetry = async (attempt = 0): Promise<void> => {
      let submitError: any = null;
      try {
        await expensesService.submitExpense({
          category,
          amount: parseFloat(amount),
          date: date.toISOString().split('T')[0],
          description,
          receiptUri: receiptUri || undefined,
        });
        Alert.alert('Success', 'Expense submitted successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } catch (error: any) {
        submitError = error;
        if (attempt < 2) {
          setRetryCount(attempt + 1);
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          return submitWithRetry(attempt + 1);
        }
        Alert.alert('Error', error.message || 'Failed to submit expense after 3 attempts');
      } finally {
        if (attempt >= 2 || !submitError) {
          setIsSubmitting(false);
          setRetryCount(0);
        }
      }
    };

    await submitWithRetry();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Submit Expense</Text>
      <Text style={s.subtitle}>Submit a new expense claim</Text>

      <View style={s.section}>
        <Text style={s.label}>Category *</Text>
        <View style={s.pickerContainer}>
          <Picker selectedValue={category} onValueChange={setCategory} style={s.picker}>
            {categories.map(c => <Picker.Item key={c} label={c} value={c} />)}
          </Picker>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Amount *</Text>
        <TextInput 
          style={s.input} 
          placeholder="0.00" 
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="decimal-pad" 
          value={amount} 
          onChangeText={setAmount} 
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Date *</Text>
        <TouchableOpacity style={s.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={s.dateText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>

      <View style={s.section}>
        <Text style={s.label}>Description *</Text>
        <TextInput 
          style={s.textArea} 
          placeholder="Enter description (minimum 5 characters)" 
          placeholderTextColor={theme.colors.textSecondary}
          value={description} 
          onChangeText={setDescription} 
          multiline 
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
      <View style={s.section}>
        <Text style={s.label}>Receipt (Optional)</Text>
        {receiptUri ? (
          <View>
            <Image source={{ uri: receiptUri }} style={s.receiptImage} />
            <TouchableOpacity onPress={() => setReceiptUri(null)}>
              <Text style={s.removeText}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.photoButtons}>
            <TouchableOpacity style={s.photoButton} onPress={takePhoto}>
              <Text style={s.photoButtonText}>📷 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.photoButton} onPress={pickImage}>
              <Text style={s.photoButtonText}>🖼️ Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[s.submitButton, isSubmitting && s.submitButtonDisabled]} 
        onPress={handleSubmit} 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <View style={s.submitButtonContent}>
            <ActivityIndicator color="#fff" />
            {retryCount > 0 && <Text style={s.retryText}>Retrying ({retryCount}/3)...</Text>}
          </View>
        ) : (
          <Text style={s.submitButtonText}>Submit Expense</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  section: { marginBottom: theme.spacing.lg },
  label: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  pickerContainer: { backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  picker: { height: 50, color: theme.colors.text },
  input: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, fontSize: 16, color: theme.colors.text },
  dateButton: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  dateText: { fontSize: 16, color: theme.colors.text },
  textArea: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, fontSize: 16, color: theme.colors.text, minHeight: 100 },
  photoButtons: { flexDirection: 'row', gap: 8 },
  photoButton: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  photoButtonText: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  receiptImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  removeText: { color: theme.colors.error, textAlign: 'center', fontFamily: theme.typography.fontFamily.semibold },
  submitButton: { backgroundColor: theme.colors.primary, borderRadius: 8, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitButtonText: { color: '#fff', fontFamily: theme.typography.fontFamily.bold, fontSize: 16 },
  retryText: { color: '#fff', fontSize: 12, marginLeft: 8 },
});
