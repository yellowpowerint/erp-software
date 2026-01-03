import { apiClient } from './api.service';

export const fleetBreakdownsService = {
  async getAssets() {
    const response = await apiClient.get('/fleet/assets', { params: { status: 'ACTIVE' } });
    return response.data.data || response.data || [];
  },

  async reportBreakdown(dto: any) {
    const response = await apiClient.post('/fleet/breakdowns', dto);
    return response.data;
  },
};
