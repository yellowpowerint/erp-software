import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { http } from '../api/http';
import { useAuth } from '../auth/AuthContext';

export type IncidentType =
  | 'INJURY'
  | 'NEAR_MISS'
  | 'EQUIPMENT_DAMAGE'
  | 'ENVIRONMENTAL'
  | 'SECURITY'
  | 'FIRE'
  | 'CHEMICAL_SPILL'
  | 'OTHER';

export type IncidentSeverity = 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL' | 'FATAL';

export type IncidentDraft = {
  type: IncidentType;
  severity: IncidentSeverity;
  location: string;
  incidentDate: string;
  description: string;
  injuries?: string;
  witnessesText?: string;
  oshaReportable: boolean;
  notes?: string;
  photos: { uri: string; fileName?: string; mimeType?: string }[];
};

export type IncidentQueueItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  status: 'PENDING' | 'FAILED';
  lastError?: string;
  draft: IncidentDraft;
};

type QueueState = {
  isBooting: boolean;
  draft: IncidentDraft | null;
  items: IncidentQueueItem[];
  isFlushing: boolean;
};

type IncidentQueueContextValue = QueueState & {
  saveDraft: (draft: IncidentDraft | null) => Promise<void>;
  enqueueFromDraft: (draft: IncidentDraft, opts?: { clearDraft?: boolean }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  flush: () => Promise<void>;
  pendingCount: number;
};

const STORAGE_KEYS = {
  draft: 'safety.incidentDraft.v1',
  queue: 'safety.incidentQueue.v1',
};

const IncidentQueueContext = createContext<IncidentQueueContextValue | undefined>(undefined);

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function IncidentQueueProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [state, setState] = useState<QueueState>({
    isBooting: true,
    draft: null,
    items: [],
    isFlushing: false,
  });

  const flushInProgress = useRef(false);
  const itemsRef = useRef<IncidentQueueItem[]>([]);

  useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);

  const persistDraft = useCallback(async (draft: IncidentDraft | null) => {
    if (!draft) {
      await AsyncStorage.removeItem(STORAGE_KEYS.draft);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(draft));
  }, []);

  const persistQueue = useCallback(async (items: IncidentQueueItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(items));
  }, []);

  const bootstrap = useCallback(async () => {
    const [draftRaw, queueRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.draft),
      AsyncStorage.getItem(STORAGE_KEYS.queue),
    ]);

    const draft = safeJsonParse<IncidentDraft>(draftRaw);
    const items = safeJsonParse<IncidentQueueItem[]>(queueRaw) ?? [];

    setState({ isBooting: false, draft, items, isFlushing: false });
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const saveDraft = useCallback(
    async (draft: IncidentDraft | null) => {
      setState((s) => ({ ...s, draft }));
      await persistDraft(draft);
    },
    [persistDraft]
  );

  const enqueueFromDraft = useCallback(
    async (draft: IncidentDraft, opts?: { clearDraft?: boolean }) => {
      const clearDraft = opts?.clearDraft !== false;
      const now = new Date().toISOString();
      const item: IncidentQueueItem = {
        id: newId(),
        createdAt: now,
        updatedAt: now,
        attempts: 0,
        status: 'PENDING',
        draft,
      };

      const nextItems = [item, ...itemsRef.current];
      setState((s) => ({ ...s, draft: clearDraft ? null : s.draft, items: nextItems }));
      await persistQueue(nextItems);
      if (clearDraft) await persistDraft(null);
    },
    [persistDraft, persistQueue]
  );

  const removeItem = useCallback(
    async (id: string) => {
      const next = itemsRef.current.filter((x) => x.id !== id);
      setState((s) => ({ ...s, items: next }));
      await persistQueue(next);
    },
    [persistQueue]
  );

  const flush = useCallback(async () => {
    if (!token) return;
    if (flushInProgress.current) return;

    flushInProgress.current = true;
    setState((s) => ({ ...s, isFlushing: true }));

    try {
      const net = await NetInfo.fetch();
      const offline = net.isConnected === false || net.isInternetReachable === false;
      if (offline) return;

      const itemsSnapshot = [...itemsRef.current];
      if (itemsSnapshot.length === 0) return;

      const remaining: IncidentQueueItem[] = [];

      for (const item of itemsSnapshot) {
        try {
          const witnesses = (item.draft.witnessesText ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          const createRes = await http.post<{ id: string }>('/safety/incidents', {
            type: item.draft.type,
            severity: item.draft.severity,
            location: item.draft.location,
            incidentDate: item.draft.incidentDate,
            description: item.draft.description,
            injuries: item.draft.injuries?.trim() || undefined,
            witnesses: witnesses.length > 0 ? witnesses : undefined,
            oshaReportable: item.draft.oshaReportable,
            notes: item.draft.notes?.trim() || undefined,
          });

          const incidentId = (createRes.data as any)?.id;
          if (!incidentId) {
            throw new Error('Incident creation failed: missing id');
          }
          const photoUrls: string[] = [];

          for (const photo of item.draft.photos ?? []) {
            const form = new FormData();
            const name = photo.fileName || `incident-${Date.now()}.jpg`;
            const type = photo.mimeType || 'image/jpeg';

            form.append('file', { uri: photo.uri, name, type } as any);
            form.append('category', 'INCIDENT_REPORT');
            form.append('module', 'safety_incidents');
            form.append('referenceId', incidentId);
            form.append('description', 'Safety incident photo (mobile)');

            const docRes = await http.post<any>('/documents/upload', form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            const url = docRes.data?.fileUrl;
            if (url) photoUrls.push(String(url));
          }

          if (photoUrls.length > 0) {
            await http.put(`/safety/incidents/${encodeURIComponent(incidentId)}/photos`, { photoUrls });
          }
        } catch (e: any) {
          const now = new Date().toISOString();
          remaining.push({
            ...item,
            updatedAt: now,
            attempts: (item.attempts ?? 0) + 1,
            status: 'FAILED',
            lastError: String(e?.message || e),
          });
        }
      }

      setState((s) => ({ ...s, items: remaining }));
      await persistQueue(remaining);
    } finally {
      flushInProgress.current = false;
      setState((s) => ({ ...s, isFlushing: false }));
    }
  }, [persistQueue, token]);

  useEffect(() => {
    if (!token) return;

    const unsub = NetInfo.addEventListener((net) => {
      const offline = net.isConnected === false || net.isInternetReachable === false;
      if (!offline) {
        void flush();
      }
    });

    return () => unsub();
  }, [token, flush]);

  const pendingCount = useMemo(() => state.items.length, [state.items.length]);

  const value = useMemo<IncidentQueueContextValue>(
    () => ({
      ...state,
      saveDraft,
      enqueueFromDraft,
      removeItem,
      flush,
      pendingCount,
    }),
    [state, saveDraft, enqueueFromDraft, removeItem, flush, pendingCount]
  );

  return <IncidentQueueContext.Provider value={value}>{children}</IncidentQueueContext.Provider>;
}

export function useIncidentQueue() {
  const ctx = useContext(IncidentQueueContext);
  if (!ctx) throw new Error('useIncidentQueue must be used within IncidentQueueProvider');
  return ctx;
}
