/**
 * Push Notification Service
 * Session M2.3 - Push registration, token retrieval, and notification handling
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from './api.service';

export interface DeviceRegistration {
  deviceId: string;
  pushToken: string;
  platform: 'ios' | 'android';
}

export const pushService = {
  /**
   * Request push notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission denied');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to request push permissions:', error);
      return false;
    }
  },

  /**
   * Get Expo push token
   */
  async getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Cannot get push token on simulator/emulator');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'mining-erp-mobile',
      });
      return token.data;
    } catch (error) {
      console.error('Failed to get Expo push token:', error);
      return null;
    }
  },

  /**
   * Get device ID (unique identifier)
   */
  async getDeviceId(): Promise<string> {
    const deviceName = Device.deviceName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';
    const modelName = Device.modelName || 'unknown';
    
    const deviceString = `${deviceName}-${modelName}-${osVersion}-${Platform.OS}`;
    return deviceString.replace(/[^a-zA-Z0-9-]/g, '_');
  },

  /**
   * Register device with backend
   */
  async registerDevice(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Cannot register device without push permissions');
        return false;
      }

      const pushToken = await this.getExpoPushToken();
      if (!pushToken) {
        console.warn('Cannot register device without push token');
        return false;
      }

      const deviceId = await this.getDeviceId();
      const platform = Platform.OS as 'ios' | 'android';

      const payload: DeviceRegistration = {
        deviceId,
        pushToken,
        platform,
      };

      await apiClient.post('/mobile/devices/register', payload);
      console.log('Device registered successfully:', deviceId);
      return true;
    } catch (error) {
      console.error('Failed to register device:', error);
      return false;
    }
  },

  /**
   * Unregister device from backend
   */
  async unregisterDevice(): Promise<boolean> {
    try {
      const deviceId = await this.getDeviceId();
      await apiClient.post('/mobile/devices/unregister', { deviceId });
      console.log('Device unregistered successfully:', deviceId);
      return true;
    } catch (error) {
      console.error('Failed to unregister device:', error);
      return false;
    }
  },
};