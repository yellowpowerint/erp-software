import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
  flush: () => Promise<void>;
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

  const flush = useCallback(async () => {
    if (!token) return;
    if (flushInProgress.current) return;

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
          remaining.push({
            ...item,
            updatedAt: now,
            attempts: (item.attempts ?? 0) + 1,
            status: 'FAILED',
            lastError: String(e?.message || e),
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
      flush,
      pendingCount,
    }),
    [state, enqueue, removeItem, flush, pendingCount]
  );

  return <ExpenseReceiptQueueContext.Provider value={value}>{children}</ExpenseReceiptQueueContext.Provider>;
}

export function useExpenseReceiptQueue() {
  const ctx = useContext(ExpenseReceiptQueueContext);
  if (!ctx) throw new Error('useExpenseReceiptQueue must be used within ExpenseReceiptQueueProvider');
  return ctx;
}
