/**
 * Inventory Service
 * Session M4.1 - Inventory search and detail
 */

import { apiClient } from './api.service';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  location?: string;
  description?: string;
  lastUpdated?: string;
  isLowStock?: boolean;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unit: string;
  date: string;
  reference?: string;
  notes?: string;
  performedBy?: string;
}

export interface InventorySearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}

export interface InventorySearchResponse {
  items: InventoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InventoryItemDetail extends InventoryItem {
  supplier?: string;
  cost?: number;
  currency?: string;
  barcode?: string;
  recentMovements?: InventoryMovement[];
}

const DEFAULT_PAGE_SIZE = 20;

export interface CreateMovementParams {
  itemId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reference?: string;
  notes?: string;
  photoUri?: string;
}

export const inventoryService = {
  /**
   * Create stock movement
   */
  async createMovement(params: CreateMovementParams): Promise<InventoryMovement> {
    try {
      const formData = new FormData();
      formData.append('itemId', params.itemId);
      formData.append('type', params.type);
      formData.append('quantity', params.quantity.toString());
      if (params.reference) formData.append('reference', params.reference);
      if (params.notes) formData.append('notes', params.notes);
      
      if (params.photoUri) {
        const filename = params.photoUri.split('/').pop() || 'photo.jpg';
        formData.append('photo', {
          uri: params.photoUri,
          type: 'image/jpeg',
          name: filename,
        } as any);
      }

      const response = await apiClient.post<any>('/inventory/movements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return {
        id: response.data.id || String(Math.random()),
        itemId: params.itemId,
        type: params.type,
        quantity: params.quantity,
        unit: response.data.unit || 'units',
        date: response.data.date || new Date().toISOString(),
        reference: params.reference,
        notes: params.notes,
        performedBy: response.data.performedBy,
      };
    } catch (error) {
      console.error('Failed to create movement:', error);
      throw error;
    }
  },

  /**
   * Search inventory items with filters
   */
  async searchItems(params: InventorySearchParams = {}): Promise<InventorySearchResponse> {
    try {
      const query = {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        ...(params.search ? { search: params.search } : {}),
        ...(params.category ? { category: params.category } : {}),
        ...(params.lowStockOnly ? { lowStockOnly: true } : {}),
      };

      const response = await apiClient.get<any>('/inventory/items', { params: query });

      // Normalize response structure
      const items = (response.data.items || response.data || []).map((item: any) => ({
        id: item.id || item._id || String(Math.random()),
        name: item.name || 'Unknown Item',
        sku: item.sku || item.code || 'N/A',
        category: item.category || 'Uncategorized',
        quantity: item.quantity ?? item.stock ?? 0,
        unit: item.unit || 'units',
        reorderLevel: item.reorderLevel ?? item.minStock ?? 0,
        location: item.location || item.warehouse,
        description: item.description,
        lastUpdated: item.lastUpdated || item.updatedAt,
        isLowStock: item.isLowStock ?? (item.quantity <= item.reorderLevel),
      }));

      return {
        items,
        page: response.data.page || params.page || 1,
        pageSize: response.data.pageSize || params.pageSize || DEFAULT_PAGE_SIZE,
        total: response.data.total || items.length,
        totalPages: response.data.totalPages || Math.ceil((response.data.total || items.length) / (params.pageSize || DEFAULT_PAGE_SIZE)),
      };
    } catch (error) {
      console.error('Failed to search inventory items:', error);
      throw error;
    }
  },

  /**
   * Get inventory item detail
   */
  async getItemDetail(id: string): Promise<InventoryItemDetail> {
    try {
      const response = await apiClient.get<any>(`/inventory/items/${id}`);
      const item = response.data;

      return {
        id: item.id || item._id || id,
        name: item.name || 'Unknown Item',
        sku: item.sku || item.code || 'N/A',
        category: item.category || 'Uncategorized',
        quantity: item.quantity ?? item.stock ?? 0,
        unit: item.unit || 'units',
        reorderLevel: item.reorderLevel ?? item.minStock ?? 0,
        location: item.location || item.warehouse,
        description: item.description,
        lastUpdated: item.lastUpdated || item.updatedAt,
        isLowStock: item.isLowStock ?? (item.quantity <= item.reorderLevel),
        supplier: item.supplier || item.supplierName,
        cost: item.cost || item.unitCost,
        currency: item.currency || 'USD',
        barcode: item.barcode,
        recentMovements: item.recentMovements || [],
      };
    } catch (error) {
      console.error(`Failed to get inventory item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get recent movements for an item
   */
  async getItemMovements(itemId: string, limit = 10): Promise<InventoryMovement[]> {
    try {
      const response = await apiClient.get<any>('/inventory/movements', {
        params: { itemId, limit },
      });

      const movements = (response.data.movements || response.data || []).map((movement: any) => ({
        id: movement.id || String(Math.random()),
        itemId: movement.itemId || itemId,
        type: movement.type || 'ADJUSTMENT',
        quantity: movement.quantity ?? 0,
        unit: movement.unit || 'units',
        date: movement.date || movement.createdAt || new Date().toISOString(),
        reference: movement.reference || movement.referenceNumber,
        notes: movement.notes || movement.description,
        performedBy: movement.performedBy || movement.userName,
      }));

      return movements;
    } catch (error) {
      console.error(`Failed to get movements for item ${itemId}:`, error);
      return [];
    }
  },

  /**
   * Get available categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/inventory/categories');
      return response.data.categories || response.data || [];
    } catch (error) {
      console.error('Failed to get inventory categories:', error);
      // Return common categories as fallback
      return ['Equipment', 'Supplies', 'Tools', 'Safety', 'Parts', 'Materials'];
    }
  },
};
