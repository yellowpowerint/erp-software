import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import axios from 'axios';

import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config';

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
        if (!e.response) {
          message = `Network error. API: ${API_BASE_URL}`;
        } else {
          const apiMessage = (e.response?.data as any)?.message;
          if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
            message = apiMessage;
          } else if (typeof e.message === 'string' && e.message.trim().length > 0) {
            message = e.message;
          }
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>Yellow Power</Text>
        <Text style={styles.brandSub}>ERP</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          style={styles.input}
        />

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit || loading}
          style={({ pressed }) => [
            styles.button,
            (!canSubmit || loading) ? styles.buttonDisabled : null,
            pressed && canSubmit && !loading ? styles.buttonPressed : null,
          ]}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f5c400',
    letterSpacing: 0.2,
  },
  brandSub: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
