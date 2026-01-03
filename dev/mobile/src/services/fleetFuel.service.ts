import { apiClient } from './api.service';

export const fleetFuelService = {
  async getAssets() {
    const response = await apiClient.get('/fleet/assets', { params: { status: 'ACTIVE' } });
    return response.data.data || response.data || [];
  },

  async logFuel(dto: any) {
    const response = await apiClient.post('/fleet/fuel', dto);
    return response.data;
  },
};
