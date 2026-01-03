import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { queueProcessorService } from '../services/queueProcessor.service';

const PROCESS_INTERVAL = 30000; // 30 seconds

/**
 * Hook to automatically process the queue in the background
 * Processes when:
 * - App comes to foreground
 * - Network connection is restored
 * - Every 30 seconds while app is active
 */
export function useQueueProcessor() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const processQueue = async () => {
    if (isProcessingRef.current) {
      console.log('[QUEUE_PROCESSOR] Already processing, skipping');
      return;
    }

    isProcessingRef.current = true;
    try {
      const result = await queueProcessorService.processAllQueues();
      if (result.total.processed > 0 || result.total.failed > 0) {
        console.log('[QUEUE_PROCESSOR] Processed:', result.total);
      }
    } catch (error) {
      console.error('[QUEUE_PROCESSOR] Error:', error);
    } finally {
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    // Process immediately on mount
    processQueue();

    // Set up periodic processing
    intervalRef.current = setInterval(processQueue, PROCESS_INTERVAL);

    // Process when app comes to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[QUEUE_PROCESSOR] App became active, processing queue');
        processQueue();
      }
    });

    // Process when network is restored
    const netInfoUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('[QUEUE_PROCESSOR] Network restored, processing queue');
        processQueue();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      appStateSubscription.remove();
      netInfoUnsubscribe();
    };
  }, []);

  return { processQueue };
}
