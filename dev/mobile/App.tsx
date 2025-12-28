/**
 * Mining ERP Mobile App
 * Session M0.1 - App entry point with navigation and deep linking
 * Yellow Power International
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
