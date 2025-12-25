import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import { http } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { uploadDocument } from '../uploads/uploadDocument';

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
  lastStatus?: number;
  nextAttemptAt?: string;
  remoteIncidentId?: string;
  draft: IncidentDraft;
};

type QueueState = {
  isBooting: boolean;
  draft: IncidentDraft | null;
  items: IncidentQueueItem[];
  isFlushing: boolean;
  activeItemId: string | null;
  activeProgress: number;
};

type IncidentQueueContextValue = QueueState & {
  saveDraft: (draft: IncidentDraft | null) => Promise<void>;
  enqueueFromDraft: (draft: IncidentDraft, opts?: { clearDraft?: boolean }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  retryItem: (id: string) => Promise<void>;
  flush: (opts?: { force?: boolean }) => Promise<void>;
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

function computeNextAttemptAtIso(attempts: number) {
  const a = Math.max(0, Number(attempts) || 0);
  const baseMs = 5000;
  const maxMs = 10 * 60 * 1000;
  const delay = Math.min(baseMs * Math.pow(2, a), maxMs);
  const jitter = Math.floor(Math.random() * 2000);
  return new Date(Date.now() + delay + jitter).toISOString();
}

function shouldAttemptNow(item: IncidentQueueItem) {
  if (!item.nextAttemptAt) return true;
  const t = new Date(item.nextAttemptAt).getTime();
  if (Number.isNaN(t)) return true;
  return t <= Date.now();
}

export function IncidentQueueProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [state, setState] = useState<QueueState>({
    isBooting: true,
    draft: null,
    items: [],
    isFlushing: false,
    activeItemId: null,
    activeProgress: 0,
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

    setState({ isBooting: false, draft, items, isFlushing: false, activeItemId: null, activeProgress: 0 });
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
        nextAttemptAt: now,
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

  const retryItem = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      const next = itemsRef.current.map((x): IncidentQueueItem => {
        if (x.id !== id) return x;
        return { ...x, status: 'PENDING', updatedAt: now, nextAttemptAt: now };
      });
      setState((s) => ({ ...s, items: next }));
      await persistQueue(next);
      await flush({ force: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persistQueue, token]
  );

  const flush = useCallback(async (opts?: { force?: boolean }) => {
    if (!token) return;
    if (flushInProgress.current) return;
    const force = opts?.force === true;

    flushInProgress.current = true;
    setState((s) => ({ ...s, isFlushing: true, activeItemId: null, activeProgress: 0 }));

    try {
      const net = await NetInfo.fetch();
      const offline = net.isConnected === false || net.isInternetReachable === false;
      if (offline) return;

      const itemsSnapshot = [...itemsRef.current];
      if (itemsSnapshot.length === 0) return;

      const remaining: IncidentQueueItem[] = [];

      for (const item of itemsSnapshot) {
        if (!force && !shouldAttemptNow(item)) {
          remaining.push(item);
          continue;
        }

        setState((s) => ({ ...s, activeItemId: item.id, activeProgress: 0 }));
        let workingItem: IncidentQueueItem = item;
        try {
          const itemWithRemote: IncidentQueueItem = { ...workingItem };

          const witnesses = (item.draft.witnessesText ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          let incidentId = String(itemWithRemote.remoteIncidentId ?? '').trim();
          if (!incidentId) {
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

            incidentId = String((createRes.data as any)?.id ?? '').trim();
            if (!incidentId) {
              throw new Error('Incident creation failed: missing id');
            }
            itemWithRemote.remoteIncidentId = incidentId;
            workingItem = itemWithRemote;
          }
          const photoUrls: string[] = [];

          const photos = item.draft.photos ?? [];
          for (let index = 0; index < photos.length; index++) {
            const photo = photos[index];
            const doc = await uploadDocument<any>(
              {
                file: photo,
                category: 'INCIDENT_REPORT',
                module: 'safety_incidents',
                referenceId: incidentId,
                description: 'Safety incident photo (mobile)',
                clientUploadId: `${item.id}:${index}`,
              },
              {
                onProgress: (p) => {
                  setState((s) => ({
                    ...s,
                    activeItemId: item.id,
                    activeProgress: p,
                  }));
                },
              }
            );

            const url = (doc as any)?.fileUrl;
            if (url) photoUrls.push(String(url));
          }

          if (photoUrls.length > 0) {
            await http.put(`/safety/incidents/${encodeURIComponent(incidentId)}/photos`, { photoUrls });
          }
        } catch (e: any) {
          const now = new Date().toISOString();
          const status = axios.isAxiosError(e) ? e.response?.status : undefined;
          remaining.push({
            ...workingItem,
            updatedAt: now,
            attempts: (workingItem.attempts ?? 0) + 1,
            status: 'FAILED',
            lastError: String(e?.message || e),
            lastStatus: status,
            nextAttemptAt: computeNextAttemptAtIso((workingItem.attempts ?? 0) + 1),
          });
        }
      }

      setState((s) => ({ ...s, items: remaining, activeItemId: null, activeProgress: 0 }));
      await persistQueue(remaining);
    } finally {
      flushInProgress.current = false;
      setState((s) => ({ ...s, isFlushing: false, activeItemId: null, activeProgress: 0 }));
    }
  }, [persistQueue, token]);

  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      const due = itemsRef.current.some((x) => shouldAttemptNow(x));
      if (due) {
        void flush();
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [token, flush]);

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
      retryItem,
      flush,
      pendingCount,
    }),
    [state, saveDraft, enqueueFromDraft, removeItem, retryItem, flush, pendingCount]
  );

  return <IncidentQueueContext.Provider value={value}>{children}</IncidentQueueContext.Provider>;
}

export function useIncidentQueue() {
  const ctx = useContext(IncidentQueueContext);
  if (!ctx) throw new Error('useIncidentQueue must be used within IncidentQueueProvider');
  return ctx;
}
