import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { theme } from '../../theme.config';
import { Button, TextInput } from '../components';

export default function FleetInspectionScreen() {
  const [findings, setFindings] = useState('');

  const submit = () => {
    Alert.alert('Success', 'Inspection submitted');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pre-Start Inspection</Text>
      <TextInput
        label="Findings"
        value={findings}
        onChangeText={setFindings}
        multiline
      />
      <Button title="Submit" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
});
