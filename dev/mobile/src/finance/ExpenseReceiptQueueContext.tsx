import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import { http } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { uploadDocument } from '../uploads/uploadDocument';

export type ReceiptPhoto = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

export type ExpenseReceiptQueueItem = {
  id: string;
  expenseId: string;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  status: 'PENDING' | 'FAILED';
  lastError?: string;
  lastStatus?: number;
  nextAttemptAt?: string;
  photo: ReceiptPhoto;
};

type QueueState = {
  isBooting: boolean;
  items: ExpenseReceiptQueueItem[];
  isFlushing: boolean;
  activeItemId: string | null;
  activeProgress: number;
};

type ExpenseReceiptQueueContextValue = QueueState & {
  enqueue: (expenseId: string, photo: ReceiptPhoto) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  retryItem: (id: string) => Promise<void>;
  flush: (opts?: { force?: boolean }) => Promise<void>;
  pendingCount: number;
};

const STORAGE_KEYS = {
  queue: 'finance.expenseReceiptQueue.v1',
};

const ExpenseReceiptQueueContext = createContext<ExpenseReceiptQueueContextValue | undefined>(undefined);

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

function shouldAttemptNow(item: ExpenseReceiptQueueItem) {
  if (!item.nextAttemptAt) return true;
  const t = new Date(item.nextAttemptAt).getTime();
  if (Number.isNaN(t)) return true;
  return t <= Date.now();
}

export function ExpenseReceiptQueueProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [state, setState] = useState<QueueState>({
    isBooting: true,
    items: [],
    isFlushing: false,
    activeItemId: null,
    activeProgress: 0,
  });

  const flushInProgress = useRef(false);
  const itemsRef = useRef<ExpenseReceiptQueueItem[]>([]);

  useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);

  const persistQueue = useCallback(async (items: ExpenseReceiptQueueItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(items));
  }, []);

  const bootstrap = useCallback(async () => {
    const queueRaw = await AsyncStorage.getItem(STORAGE_KEYS.queue);
    const items = safeJsonParse<ExpenseReceiptQueueItem[]>(queueRaw) ?? [];
    setState({ isBooting: false, items, isFlushing: false, activeItemId: null, activeProgress: 0 });
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const enqueue = useCallback(
    async (expenseId: string, photo: ReceiptPhoto) => {
      const now = new Date().toISOString();
      const item: ExpenseReceiptQueueItem = {
        id: newId(),
        expenseId,
        createdAt: now,
        updatedAt: now,
        attempts: 0,
        status: 'PENDING',
        nextAttemptAt: now,
        photo,
      };

      const nextItems = [item, ...itemsRef.current];
      setState((s) => ({ ...s, items: nextItems }));
      await persistQueue(nextItems);
    },
    [persistQueue]
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
      const next = itemsRef.current.map((x): ExpenseReceiptQueueItem => {
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

      const remaining: ExpenseReceiptQueueItem[] = [];

      for (const item of itemsSnapshot) {
        if (!force && !shouldAttemptNow(item)) {
          remaining.push(item);
          continue;
        }

        setState((s) => ({ ...s, activeItemId: item.id, activeProgress: 0 }));
        try {
          const doc = await uploadDocument<any>(
            {
              file: item.photo,
              category: 'RECEIPT',
              module: 'finance_expenses',
              referenceId: item.expenseId,
              description: 'Expense receipt (mobile)',
              clientUploadId: item.id,
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

          const receiptUrl = (doc as any)?.fileUrl;
          if (!receiptUrl) {
            throw new Error('Receipt upload succeeded but returned no fileUrl');
          }

          await http.put(`/finance/expenses/${encodeURIComponent(item.expenseId)}/receipt`, {
            receiptUrl: String(receiptUrl),
          });
        } catch (e: any) {
          const now = new Date().toISOString();
          const status = axios.isAxiosError(e) ? e.response?.status : undefined;
          remaining.push({
            ...item,
            updatedAt: now,
            attempts: (item.attempts ?? 0) + 1,
            status: 'FAILED',
            lastError: String(e?.message || e),
            lastStatus: status,
            nextAttemptAt: computeNextAttemptAtIso((item.attempts ?? 0) + 1),
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

  const value = useMemo<ExpenseReceiptQueueContextValue>(
    () => ({
      ...state,
      enqueue,
      removeItem,
      retryItem,
      flush,
      pendingCount,
    }),
    [state, enqueue, removeItem, retryItem, flush, pendingCount]
  );

  return <ExpenseReceiptQueueContext.Provider value={value}>{children}</ExpenseReceiptQueueContext.Provider>;
}

export function useExpenseReceiptQueue() {
  const ctx = useContext(ExpenseReceiptQueueContext);
  if (!ctx) throw new Error('useExpenseReceiptQueue must be used within ExpenseReceiptQueueProvider');
  return ctx;
}
