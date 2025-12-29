import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api.service';
import NetInfo from '@react-native-community/netinfo';

export interface IncidentDraft {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  date: string;
  description: string;
  photoUris: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QueuedIncident extends IncidentDraft {
  status: 'pending' | 'submitting' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  date: string;
  description: string;
  photos: string[];
  reportedBy: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  createdAt: string;
}

const DRAFT_KEY = '@incident_draft';
const QUEUE_KEY = '@incident_queue';
const MAX_RETRIES = 3;

export const incidentsService = {
  async saveDraft(draft: IncidentDraft): Promise<void> {
    try {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  },

  async loadDraft(): Promise<IncidentDraft | null> {
    try {
      const data = await AsyncStorage.getItem(DRAFT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  },

  async clearDraft(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  },

  async getQueue(): Promise<QueuedIncident[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load queue:', error);
      return [];
    }
  },

  async addToQueue(incident: IncidentDraft): Promise<void> {
    try {
      const queue = await this.getQueue();
      const queued: QueuedIncident = {
        ...incident,
        status: 'pending',
        retryCount: 0,
      };
      queue.push(queued);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to queue:', error);
      throw error;
    }
  },

  async updateQueueItem(id: string, updates: Partial<QueuedIncident>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(item => item.id === id);
      if (index !== -1) {
        queue[index] = { ...queue[index], ...updates };
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Failed to update queue item:', error);
    }
  },

  async removeFromQueue(id: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from queue:', error);
    }
  },

  async submitIncident(incident: IncidentDraft): Promise<Incident> {
    try {
      const formData = new FormData();
      formData.append('type', incident.type);
      formData.append('severity', incident.severity);
      formData.append('location', incident.location);
      formData.append('date', incident.date);
      formData.append('description', incident.description);

      incident.photoUris.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `photo_${index}.jpg`;
        formData.append('photos', {
          uri,
          type: 'image/jpeg',
          name: filename,
        } as any);
      });

      const response = await apiClient.post<any>('/safety/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return {
        id: response.data.id,
        type: incident.type,
        severity: incident.severity,
        location: incident.location,
        date: incident.date,
        description: incident.description,
        photos: response.data.photos || [],
        reportedBy: response.data.reportedBy,
        status: response.data.status || 'open',
        createdAt: response.data.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to submit incident:', error);
      throw error;
    }
  },

  async processQueue(): Promise<void> {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet connection, skipping queue processing');
      return;
    }

    const queue = await this.getQueue();
    const pending = queue.filter(item => item.status === 'pending' || item.status === 'failed');

    for (const item of pending) {
      if (item.retryCount >= MAX_RETRIES) {
        continue;
      }

      try {
        await this.updateQueueItem(item.id, { status: 'submitting' });
        await this.submitIncident(item);
        await this.removeFromQueue(item.id);
      } catch (error: any) {
        const retryCount = item.retryCount + 1;
        await this.updateQueueItem(item.id, {
          status: 'failed',
          retryCount,
          lastError: error?.message || 'Submission failed',
        });
      }
    }
  },

  async retryQueueItem(id: string): Promise<void> {
    await this.updateQueueItem(id, { status: 'pending', retryCount: 0, lastError: undefined });
    await this.processQueue();
  },
};
