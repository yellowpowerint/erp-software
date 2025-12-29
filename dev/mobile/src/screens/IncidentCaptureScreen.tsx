import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { incidentsService, IncidentDraft } from '../services/incidents.service';
import { theme } from '../../theme.config';
import NetInfo from '@react-native-community/netinfo';

const INCIDENT_TYPES = ['Near Miss', 'Injury', 'Equipment Damage', 'Environmental', 'Security', 'Other'];
const SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function IncidentCaptureScreen() {
  const navigation = useNavigation();
  const [type, setType] = useState(INCIDENT_TYPES[0]);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    loadDraft();
    
    // Auto-retry queue when connection restored
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        incidentsService.processQueue();
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Auto-save draft on field changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (type || location || description) {
        const draft: IncidentDraft = {
          id: Date.now().toString(),
          type,
          severity,
          location,
          date,
          description,
          photoUris,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        incidentsService.saveDraft(draft).catch(() => {});
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [type, severity, location, date, description, photoUris]);

  const loadDraft = async () => {
    const draft = await incidentsService.loadDraft();
    if (draft) {
      Alert.alert(
        'Draft Found',
        'Would you like to continue with your saved draft?',
        [
          { text: 'Discard', onPress: () => incidentsService.clearDraft(), style: 'destructive' },
          {
            text: 'Continue',
            onPress: () => {
              setType(draft.type);
              setSeverity(draft.severity);
              setLocation(draft.location);
              setDate(draft.date);
              setDescription(draft.description);
              setPhotoUris(draft.photoUris);
            },
          },
        ]
      );
    }
  };

  const saveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const draft: IncidentDraft = {
        id: Date.now().toString(),
        type,
        severity,
        location,
        date,
        description,
        photoUris,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await incidentsService.saveDraft(draft);
      Alert.alert('Success', 'Draft saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const addPhoto = async (fromCamera: boolean) => {
    if (photoUris.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 photos allowed');
      return;
    }

    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', `${fromCamera ? 'Camera' : 'Photo library'} permission is required`);
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setPhotoUris([...photoUris, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris(photoUris.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    if (!type) {
      Alert.alert('Validation Error', 'Please select an incident type');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter a location');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return false;
    }
    return true;
  };

  const submitIncident = async () => {
    if (!validate()) return;

    const netState = await NetInfo.fetch();
    const draft: IncidentDraft = {
      id: Date.now().toString(),
      type,
      severity,
      location: location.trim(),
      date,
      description: description.trim(),
      photoUris,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!netState.isConnected) {
      Alert.alert(
        'Offline Mode',
        'No internet connection. Incident will be queued for submission when online.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await incidentsService.addToQueue(draft);
              await incidentsService.clearDraft();
              Alert.alert('Success', 'Incident queued for submission', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            },
          },
        ]
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await incidentsService.submitIncident(draft);
      await incidentsService.clearDraft();
      Alert.alert('Success', 'Incident reported successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      if (error?.response?.status === 0 || error?.message?.includes('Network')) {
        await incidentsService.addToQueue(draft);
        Alert.alert('Queued', 'Network error. Incident queued for submission.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to submit incident');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Report Safety Incident</Text>

      <View style={s.section}>
        <Text style={s.label}>Incident Type *</Text>
        <View style={s.pickerContainer}>
          <Picker selectedValue={type} onValueChange={setType} style={s.picker}>
            {INCIDENT_TYPES.map(t => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Severity *</Text>
        <View style={s.severityRow}>
          {SEVERITIES.map(sev => (
            <TouchableOpacity
              key={sev.value}
              style={[s.severityChip, severity === sev.value && s.severityChipActive]}
              onPress={() => setSeverity(sev.value as any)}
            >
              <Text style={[s.severityText, severity === sev.value && s.severityTextActive]}>
                {sev.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Location *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g., Main Site - Building A"
          placeholderTextColor={theme.colors.textSecondary}
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Date *</Text>
        <TextInput
          style={s.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.textSecondary}
          value={date}
          onChangeText={setDate}
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Description *</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="Describe what happened..."
          placeholderTextColor={theme.colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Photos ({photoUris.length}/5)</Text>
        <View style={s.photoButtons}>
          <TouchableOpacity style={s.photoButton} onPress={() => addPhoto(true)}>
            <Text style={s.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.photoButton} onPress={() => addPhoto(false)}>
            <Text style={s.photoButtonText}>Choose Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={s.photoGrid}>
          {photoUris.map((uri, index) => (
            <View key={index} style={s.photoItem}>
              <Image source={{ uri }} style={s.photo} />
              <TouchableOpacity style={s.removePhoto} onPress={() => removePhoto(index)}>
                <Text style={s.removePhotoText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.button, s.draftButton]}
          onPress={saveDraft}
          disabled={isSavingDraft}
        >
          {isSavingDraft ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={s.draftButtonText}>Save Draft</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.button, s.submitButton, isSubmitting && s.submitButtonDisabled]}
          onPress={submitIncident}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.lg },
  section: { marginBottom: theme.spacing.lg },
  label: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginBottom: 8 },
  pickerContainer: { backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  picker: { height: 50 },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityChip: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  severityChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  severityText: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  severityTextActive: { color: '#fff' },
  input: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  textArea: { height: 100, textAlignVertical: 'top' },
  photoButtons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  photoButton: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  photoButtonText: { fontSize: 14, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.primary },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoItem: { width: 100, height: 100, position: 'relative' },
  photo: { width: '100%', height: '100%', borderRadius: 8 },
  removePhoto: { position: 'absolute', top: -8, right: -8, backgroundColor: theme.colors.error, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 12, marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl },
  button: { flex: 1, borderRadius: 8, padding: theme.spacing.md, alignItems: 'center' },
  draftButton: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  draftButtonText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },
  submitButton: { backgroundColor: theme.colors.primary },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#fff' },
});
