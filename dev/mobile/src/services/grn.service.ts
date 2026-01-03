import { apiClient } from './api.service';

export type POStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
export type ItemCondition = 'GOOD' | 'DAMAGED' | 'DEFECTIVE' | 'EXPIRED';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: POStatus;
  vendorName: string;
  totalAmount: number;
  currency: string;
  expectedDelivery: string;
  deliveryAddress: string;
  itemsCount: number;
  receivedItemsCount: number;
}

export interface POItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  receivedQty: number;
}

export interface PODetail extends PurchaseOrder {
  items: POItem[];
}

export interface CreateGRNDto {
  purchaseOrderId: string;
  siteLocation: string;
  deliveryNote?: string;
  carrierName?: string;
  vehicleNumber?: string;
  notes?: string;
  items: {
    poItemId: string;
    receivedQty: string;
    condition?: ItemCondition;
    notes?: string;
  }[];
}

export const grnService = {
  async getPOsForReceiving(query: any = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page);
    if (query.status) params.append('status', query.status);
    if (query.search) params.append('search', query.search);
    const response = await apiClient.get(`/procurement/purchase-orders?${params}`);
    return response.data;
  },

  async getPODetail(poId: string): Promise<PODetail> {
    const response = await apiClient.get(`/procurement/purchase-orders/${poId}`);
    return response.data;
  },

  async createGRN(dto: CreateGRNDto) {
    const response = await apiClient.post('/procurement/goods-receipts', dto);
    return response.data;
  },

  async getGRNs(query: any = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page);
    const response = await apiClient.get(`/procurement/goods-receipts?${params}`);
    return response.data;
  },

  async getGRNDetail(grnId: string) {
    const response = await apiClient.get(`/procurement/goods-receipts/${grnId}`);
    return response.data;
  },
};
