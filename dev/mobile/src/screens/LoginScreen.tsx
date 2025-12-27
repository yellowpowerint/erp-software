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

import { parseApiError } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';

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
      const parsed = parseApiError(e, API_BASE_URL);
      Alert.alert('Sign In Failed', parsed.message);
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
    backgroundColor: colors.primary,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  brand: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(245, 196, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandSub: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryForeground,
    letterSpacing: 3,
  },
  subtitle: {
    marginTop: 16,
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: colors.accent,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.secondary,
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: colors.accentForeground,
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
