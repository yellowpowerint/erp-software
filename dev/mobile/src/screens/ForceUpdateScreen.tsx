import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  installedVersion: string;
  requiredVersion: string;
  iosUrl: string;
  androidUrl: string;
};

export function ForceUpdateScreen({ installedVersion, requiredVersion, iosUrl, androidUrl }: Props) {
  const storeUrl = Platform.OS === 'ios' ? iosUrl : androidUrl;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Required</Text>
      <Text style={styles.message}>
        Your app version ({installedVersion}) is below the minimum supported version ({requiredVersion}).
      </Text>

      <Pressable
        onPress={async () => {
          await Linking.openURL(storeUrl);
        }}
        style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Update Now</Text>
      </Pressable>

      <Text style={styles.small}>Store URL: {storeUrl}</Text>
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
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f5c400',
    alignItems: 'center',
    justifyContent: 'center',
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
