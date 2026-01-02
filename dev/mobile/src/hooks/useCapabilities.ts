/**
 * useCapabilities Hook
 * Phase 1 - Easy access to user capabilities for gating features
 */

import { useAuthStore } from '../store/authStore';

export function useCapabilities() {
  const capabilities = useAuthStore((state) => state.capabilities);
  const capabilitiesStatus = useAuthStore((state) => state.capabilitiesStatus);
  const capabilitiesError = useAuthStore((state) => state.capabilitiesError);
  const refreshCapabilities = useAuthStore((state) => state.refreshCapabilities);
  
  return {
    status: capabilitiesStatus,
    error: capabilitiesError,
    refresh: refreshCapabilities,
    loaded: capabilitiesStatus === 'loaded',
    capabilities: capabilities?.capabilities || null,
    modules: capabilities?.modules || [],
    role: capabilities?.role || null,
    
    // Helper methods
    hasModule: (moduleId: string) => {
      return capabilities?.modules.includes(moduleId) ?? false;
    },
    
    can: (capability: string) => {
      if (!capabilities?.capabilities) return false;
      return (capabilities.capabilities as any)[capability] === true;
    },
    
    // Common capability checks
    canApprove: capabilities?.capabilities.canApprove ?? false,
    canReject: capabilities?.capabilities.canReject ?? false,
    canReceiveStock: capabilities?.capabilities.canReceiveStock ?? false,
    canCreateIncident: capabilities?.capabilities.canCreateIncident ?? false,
    canCreateRequisition: capabilities?.capabilities.canCreateRequisition ?? false,
    canUploadDocuments: capabilities?.capabilities.canUploadDocuments ?? false,
  };
}
