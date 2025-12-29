/**
 * Navigation Types
 * Session M0.1 - Navigation structure and deep link routing
 */

import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigator (4 tabs per M0.1)
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Work: NavigatorScreenParams<WorkStackParamList>;
  Modules: NavigatorScreenParams<ModulesStackParamList>;
  More: NavigatorScreenParams<MoreStackParamList>;
};

// Home Stack Navigator
export type HomeStackParamList = {
  HomeMain: undefined;
  Notifications: undefined;
  NotificationDetail: { notificationId: string };
};

// Modules Stack Navigator
export type ModulesStackParamList = {
  ModulesMain: undefined;
  InventorySearch: undefined;
  InventoryDetail: { itemId: string };
};

// More Stack Navigator
export type MoreStackParamList = {
  MoreMain: undefined;
  NotificationPreferences: undefined;
};

// Work Stack Navigator
export type WorkStackParamList = {
  WorkList: undefined;
  TasksList: undefined;
  ApprovalDetail: { approvalId: string; approvalType?: string };
  TaskDetail: { taskId: string };
  NoAccess: { resource?: string; message?: string };
  NotFound: { resource?: string; message?: string };
};

// Deep Link Routes (M0.1 specification)
export type DeepLinkRoute =
  | { screen: 'Home' }
  | { screen: 'Work'; params: { screen: 'ApprovalDetail'; params: { approvalId: string } } }
  | { screen: 'Work'; params: { screen: 'TaskDetail'; params: { taskId: string } } }
  | { screen: 'Modules' }
  | { screen: 'More' };

// Notification Payload Types
export interface NotificationPayload {
  deepLink?: string;
  entityType?: 'approval' | 'task' | 'notification' | 'inventory' | 'safety';
  entityId?: string;
  title?: string;
  body?: string;
}
