import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { leaveRequestsService, LeaveRequestSubmit } from '../services/leaveRequests.service';
import { theme } from '../../theme.config';

export default function LeaveRequestScreen() {
  const navigation = useNavigation();
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveTypes = async () => {
    const types = await leaveRequestsService.getLeaveTypes();
    setLeaveTypes(types);
    if (types.length > 0) {
      setLeaveType(types[0]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!leaveType) {
      newErrors.leaveType = 'Leave type is required';
    }

    if (startDate > endDate) {
      newErrors.dateRange = 'Start date must be before end date';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDays = (): number => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: LeaveRequestSubmit = {
        leaveType,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason: reason.trim(),
      };

      await leaveRequestsService.submitLeaveRequest(data);

      Alert.alert(
        'Success',
        'Your leave request has been submitted successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Request Leave</Text>
      <Text style={s.subtitle}>Submit a new leave request</Text>

      <View style={s.section}>
        <Text style={s.label}>Leave Type *</Text>
        <View style={s.pickerContainer}>
          <Picker
            selectedValue={leaveType}
            onValueChange={(value) => setLeaveType(value)}
            style={s.picker}
          >
            {leaveTypes.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>
        {errors.leaveType && <Text style={s.errorText}>{errors.leaveType}</Text>}
      </View>

      <View style={s.section}>
        <Text style={s.label}>Start Date *</Text>
        <TouchableOpacity style={s.dateButton} onPress={() => setShowStartPicker(true)}>
          <Text style={s.dateText}>{startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
            minimumDate={new Date()}
          />
        )}
        {errors.startDate && <Text style={s.errorText}>{errors.startDate}</Text>}
      </View>

      <View style={s.section}>
        <Text style={s.label}>End Date *</Text>
        <TouchableOpacity style={s.dateButton} onPress={() => setShowEndPicker(true)}>
          <Text style={s.dateText}>{endDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
            minimumDate={startDate}
          />
        )}
        {errors.dateRange && <Text style={s.errorText}>{errors.dateRange}</Text>}
      </View>

      <View style={s.section}>
        <Text style={s.label}>Duration</Text>
        <View style={s.durationCard}>
          <Text style={s.durationText}>{calculateDays()} days</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Reason *</Text>
        <TextInput
          style={s.textArea}
          placeholder="Enter reason for leave request (minimum 10 characters)"
          placeholderTextColor={theme.colors.textSecondary}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {errors.reason && <Text style={s.errorText}>{errors.reason}</Text>}
      </View>

      <TouchableOpacity
        style={[s.submitButton, isSubmitting && s.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.submitButtonText}>Submit Request</Text>
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
  dateButton: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  dateText: { fontSize: 16, color: theme.colors.text },
  durationCard: { backgroundColor: theme.colors.primary + '20', borderRadius: 8, padding: theme.spacing.md, alignItems: 'center' },
  durationText: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary },
  textArea: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, fontSize: 16, color: theme.colors.text, minHeight: 100 },
  errorText: { fontSize: 12, color: theme.colors.error, marginTop: 4 },
  submitButton: { backgroundColor: theme.colors.primary, borderRadius: 8, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: '#fff' },
});
