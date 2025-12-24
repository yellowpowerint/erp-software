import React, { useCallback, useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';

import { http } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config';

export function HomeScreen() {
  const { me, signOut } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await http.get('/reports/dashboard');
      setDashboard(res.data);
    } catch (e: any) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        await signOut();
        return;
      }

      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const apiMessage = (e.response?.data as any)?.message;
        const messagePart = typeof apiMessage === 'string' && apiMessage.trim().length > 0 ? apiMessage : e.message;
        setError(`Failed to load dashboard (${status ?? 'NO_RESPONSE'}): ${messagePart}\nAPI: ${API_BASE_URL}`);
      } else {
        setError(`Failed to load dashboard: ${String(e)}\nAPI: ${API_BASE_URL}`);
      }
    }
  }, [signOut]);

  useEffect(() => {
    (async () => {
      await loadDashboard();
    })();
  }, [loadDashboard]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Hello{me?.firstName ? `, ${me.firstName}` : ''}</Text>
      <Text style={styles.meta}>Role: {me?.role ?? 'Unknown'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dashboard (raw)</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text selectable style={styles.mono}>
          {dashboard ? JSON.stringify(dashboard, null, 2) : error ? '—' : 'Loading...'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Retry"
          onPress={async () => {
            setDashboard(null);
            await loadDashboard();
          }}
        />
        <Button title="Logout" onPress={signOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  h1: {
    fontSize: 22,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
    opacity: 0.7,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#b00020',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  actions: {
    marginTop: 8,
  },
});
