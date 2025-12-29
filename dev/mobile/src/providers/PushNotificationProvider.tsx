/**
 * Push Notification Provider
 * Session M2.3 - Handle push notifications in all app states (foreground, background, killed)
 */

import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { useNotificationsStore } from '../store/notificationsStore';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface PushNotificationProviderProps {
  children: React.ReactNode;
}

export default function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const navigation = useNavigation();
  const { fetchUnreadCount } = useNotificationsStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Handle notification received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received (foreground):', notification);
      fetchUnreadCount();
    });

    // Handle notification tap (works in all app states)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      handleNotificationTap(response.notification);
    });

    // Handle deep links from killed state
    const handleInitialURL = async () => {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        handleDeepLink(initialURL);
      }
    };
    handleInitialURL();

    // Handle deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      subscription.remove();
    };
  }, []);

  const handleNotificationTap = (notification: Notifications.Notification) => {
    const data = notification.request.content.data;
    
    // Refresh unread count
    fetchUnreadCount();

    // Parse deep link from notification data
    if (data?.deepLink) {
      handleDeepLink(data.deepLink as string);
    } else if (data?.entityType && data?.entityId) {
      // Fallback: construct route from entity type/id
      navigateToEntity(data.entityType as string, data.entityId as string);
    } else {
      // Default: navigate to notifications screen
      (navigation as any).navigate('Home', { screen: 'Notifications' });
    }
  };

  const handleDeepLink = (url: string) => {
    console.log('Handling deep link:', url);
    
    // Parse miningerp:// URLs
    const match = url.match(/miningerp:\/\/(\w+)(?:\/(.+))?/);
    if (match) {
      const [, screen, params] = match;
      
      if (screen === 'notifications') {
        (navigation as any).navigate('Home', { screen: 'Notifications' });
      } else if (screen === 'approval' && params) {
        (navigation as any).navigate('Work', { 
          screen: 'ApprovalDetail', 
          params: { approvalId: params } 
        });
      } else if (screen === 'task' && params) {
        (navigation as any).navigate('Work', { 
          screen: 'TaskDetail', 
          params: { taskId: params } 
        });
      } else {
        // Fallback to notifications
        (navigation as any).navigate('Home', { screen: 'Notifications' });
      }
    }
  };

  const navigateToEntity = (entityType: string, entityId: string) => {
    switch (entityType) {
      case 'approval':
        (navigation as any).navigate('Work', { 
          screen: 'ApprovalDetail', 
          params: { approvalId: entityId } 
        });
        break;
      case 'task':
        (navigation as any).navigate('Work', { 
          screen: 'TaskDetail', 
          params: { taskId: entityId } 
        });
        break;
      default:
        (navigation as any).navigate('Home', { screen: 'Notifications' });
    }
  };

  return <>{children}</>;
}