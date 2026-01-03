import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { theme } from '../../theme.config';
import { Button, TextInput } from '../components';

export default function ReportBreakdownScreen() {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const submit = () => {
    Alert.alert('Success', 'Breakdown reported');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report Breakdown</Text>
      <TextInput
        label="Location"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
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
