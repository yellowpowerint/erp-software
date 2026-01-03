import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { theme } from '../../theme.config';
import { Button, TextInput } from '../components';

export default function LogFuelScreen() {
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState('');

  const submit = () => {
    Alert.alert('Success', 'Fuel logged');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Log Fuel</Text>
      <TextInput
        label="Quantity (Liters)"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />
      <TextInput
        label="Cost"
        value={cost}
        onChangeText={setCost}
        keyboardType="numeric"
      />
      <TextInput
        label="Odometer Reading"
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="numeric"
      />
      <Button title="Submit" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
});
