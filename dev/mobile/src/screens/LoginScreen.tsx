import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import axios from 'axios';

import { useAuth } from '../auth/AuthContext';

export function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0, [email, password]);

  const onSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      let message = 'Login failed';
      if (axios.isAxiosError(e)) {
        const apiMessage = (e.response?.data as any)?.message;
        if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
          message = apiMessage;
        } else if (typeof e.message === 'string' && e.message.trim().length > 0) {
          message = e.message;
        }
      } else if (typeof e?.message === 'string' && e.message.trim().length > 0) {
        message = e.message;
      }
      Alert.alert('Sign In Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mining ERP</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
      />

      <View style={styles.actions}>
        <Button title={loading ? 'Signing In...' : 'Sign In'} onPress={onSubmit} disabled={!canSubmit || loading} />
        {loading ? <ActivityIndicator style={styles.spinner} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actions: {
    marginTop: 8,
    gap: 8,
  },
  spinner: {
    marginTop: 8,
  },
});
