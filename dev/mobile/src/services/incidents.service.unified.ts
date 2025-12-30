import { apiClient } from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queueService } from './queue.service';

export interface IncidentDraft {
  id: string;
  type: string;
  severity: string;
  location: string;
  date: string;
  description: string;
  photoUris: string[];
}

export interface Incident extends IncidentDraft {
  reportedBy: any;
  status: string;
  createdAt: string;
  photos?: any[];
  attachments?: any[];
}

const DRAFT_KEY = '@incident_draft';

export interface IncidentSearchParams {
  search?: string;
  type?: string;
  severity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface IncidentSearchResponse {
  data: Incident[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const incidentsServiceUnified = {
  async searchIncidents(params: IncidentSearchParams = {}): Promise<IncidentSearchResponse> {
    try {
      const response = await apiClient.get<IncidentSearchResponse>('/safety/incidents', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to search incidents:', error);
      throw error;
    }
  },

  async getIncidentDetail(id: string): Promise<Incident> {
    try {
      const response = await apiClient.get<Incident>(`/safety/incidents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get incident detail:', error);
      throw error;
    }
  },

  async saveDraft(incident: IncidentDraft): Promise<void> {
    try {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(incident));
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  },

  async getDraft(): Promise<IncidentDraft | null> {
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

  /**
   * Add incident to unified queue
   */
  async addToQueue(incident: IncidentDraft): Promise<void> {
    await queueService.addToQueue({
      id: incident.id,
      type: 'incident',
      data: incident,
    });
  },

  /**
   * Submit incident directly (online)
   */
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
        photoUris: incident.photoUris,
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

  /**
   * Process all incident queue items using unified queue service
   */
  async processQueue(): Promise<void> {
    await queueService.processQueue(async (item) => {
      if (item.type === 'incident') {
        await this.submitIncident(item.data as IncidentDraft);
      }
    });
  },

  async uploadAttachment(
    incidentId: string,
    uri: string,
    filename: string,
    mimeType: string,
  ): Promise<any> {
    const uploadId = `incident-${incidentId}-${Date.now()}`;
    const { uploadService } = await import('./upload.service');
    
    const result = await uploadService.uploadFile({
      uploadId,
      endpoint: `/safety/incidents/${incidentId}/attachments`,
      file: { uri, name: filename, mimeType },
    });

    if (result.status !== 'success') {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  },
};
