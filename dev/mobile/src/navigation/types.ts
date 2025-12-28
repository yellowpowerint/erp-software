/**
 * Navigation Types
 * Session M0.1 - Navigation structure and deep link routing
 */

import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
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
};

// Modules Stack Navigator
export type ModulesStackParamList = {
  ModulesMain: undefined;
};

// More Stack Navigator
export type MoreStackParamList = {
  MoreMain: undefined;
};

// Work Stack Navigator
export type WorkStackParamList = {
  WorkList: undefined;
  ApprovalDetail: { approvalId: string };
  TaskDetail: { taskId: string };
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
