import AsyncStorage from '@react-native-async-storage/async-storage';
import { fleetInspectionsService } from './fleetInspections.service';
import { fleetBreakdownsService } from './fleetBreakdowns.service';
import { fleetFuelService } from './fleetFuel.service';
import { uploadService } from './upload.service';

const QUEUE_KEY = '@fleet_queue';

export const fleetActionsService = {
  async queueAction(type: string, data: any, photos: any[] = []) {
    const queue = await this.getQueue();
    queue.push({ id: `${type}_${Date.now()}`, type, data, photos, status: 'pending' });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async getQueue() {
    const json = await AsyncStorage.getItem(QUEUE_KEY);
    return json ? JSON.parse(json) : [];
  },

  async processQueue() {
    const queue = await this.getQueue();
    for (const item of queue.filter(i => i.status === 'pending')) {
      try {
        if (item.type === 'inspection') {
          await fleetInspectionsService.createInspection(item.data);
        } else if (item.type === 'breakdown') {
          await fleetBreakdownsService.reportBreakdown(item.data);
        } else if (item.type === 'fuel') {
          await fleetFuelService.logFuel(item.data);
        }
        item.status = 'completed';
      } catch (error) {
        item.status = 'failed';
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },
};
