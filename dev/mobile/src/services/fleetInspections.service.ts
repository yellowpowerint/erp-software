import { apiClient } from './api.service';

export const fleetInspectionsService = {
  async getAssets() {
    const response = await apiClient.get('/fleet/assets', { params: { status: 'ACTIVE' } });
    return response.data.data || response.data || [];
  },

  async createInspection(dto: any) {
    const response = await apiClient.post('/fleet/inspections', dto);
    return response.data;
  },
};
