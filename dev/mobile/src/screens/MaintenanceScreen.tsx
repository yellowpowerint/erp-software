import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  message: string;
  onRetry: () => Promise<void> | void;
};

export function MaintenanceScreen({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maintenance</Text>
      <Text style={styles.message}>{message}</Text>

      <Pressable
        onPress={() => {
          void onRetry();
        }}
        style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Retry</Text>
      </Pressable>

      <Text style={styles.small}>If this persists, contact your administrator.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#0b1220',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f5c400',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#0b1220',
    fontWeight: '900',
    fontSize: 16,
  },
  small: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
