import React from 'react';
import { Text } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { canAccessOptional, type MobileResource } from '../access/rbac';

export function AccessGate({ resource, children }: { resource: MobileResource; children: React.ReactNode }) {
  const { me } = useAuth();
  return canAccessOptional(me?.role, resource) ? <>{children}</> : <Text>Access denied</Text>;
}
