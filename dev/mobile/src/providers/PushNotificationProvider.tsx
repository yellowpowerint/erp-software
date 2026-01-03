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
    
    // Ignore Expo development URLs (exp://)
    if (url.startsWith('exp://')) {
      console.log('Ignoring Expo development URL');
      return;
    }
    
    // Parse miningerp:// URLs - support both legacy and canonical routes
    // Canonical: miningerp://work/approvals/:id, miningerp://work/tasks/:id
    // Legacy: miningerp://approval/:id, miningerp://task/:id
    
    // Try canonical routes first (work/approvals/:id or work/tasks/:id)
    const canonicalMatch = url.match(/miningerp:\/\/work\/(approvals|tasks)\/([^/?]+)(?:\?(.+))?/);
    if (canonicalMatch) {
      const [, resource, id, queryString] = canonicalMatch;
      
      if (resource === 'approvals') {
        // Parse approvalType from query string if present
        const params: any = { approvalId: id };
        if (queryString) {
          const urlParams = new URLSearchParams(queryString);
          const approvalType = urlParams.get('type');
          if (approvalType) {
            params.approvalType = approvalType;
          }
        }
        (navigation as any).navigate('Work', { 
          screen: 'ApprovalDetail', 
          params 
        });
        return;
      } else if (resource === 'tasks') {
        (navigation as any).navigate('Work', { 
          screen: 'TaskDetail', 
          params: { taskId: id } 
        });
        return;
      }
    }
    
    // Try legacy routes (approval/:id or task/:id)
    const legacyMatch = url.match(/miningerp:\/\/(approval|task|notifications)(?:\/([^/?]+))?/);
    if (legacyMatch) {
      const [, screen, id] = legacyMatch;
      
      if (screen === 'notifications') {
        (navigation as any).navigate('Home', { screen: 'Notifications' });
      } else if (screen === 'approval' && id) {
        (navigation as any).navigate('Work', { 
          screen: 'ApprovalDetail', 
          params: { approvalId: id } 
        });
      } else if (screen === 'task' && id) {
        (navigation as any).navigate('Work', { 
          screen: 'TaskDetail', 
          params: { taskId: id } 
        });
      } else {
        // Fallback to notifications
        (navigation as any).navigate('Home', { screen: 'Notifications' });
      }
    } else {
      // No match - fallback to notifications
      (navigation as any).navigate('Home', { screen: 'Notifications' });
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