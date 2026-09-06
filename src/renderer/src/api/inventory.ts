import { apiClient } from "./client"
import { PaginatedResponse, PaginationParams } from "./paginated"

export interface InventoryItem {
  id: string
  categoryId: string
  sku: string
  name: string
  attributes: Record<string, any>
  description?: string | null
  costPrice: number
  sellingPrice: number
  quantity: number
  reorderLevel: number
  supplierId?: string | null
  category: {
    id: string
    name: string
  }
  supplier?: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

export const inventoryApi = {
  listInventory: async (
    params?: PaginationParams & { search?: string; categoryId?: string; all?: boolean }
  ): Promise<PaginatedResponse<InventoryItem>> => {
    const response = await apiClient.get<PaginatedResponse<InventoryItem>>("/inventory", { params })
    return response.data
  },
  getInventoryItem: async (id: string): Promise<InventoryItem> => {
    const response = await apiClient.get<InventoryItem>(`/inventory/${id}`)
    return response.data
  },
  updateInventoryItem: async (
    id: string,
    data: {
      name?: string
      sellingPrice?: number
      reorderLevel?: number
      description?: string | null
    }
  ): Promise<{ item: InventoryItem; message: string }> => {
    const response = await apiClient.put(`/inventory/${id}`, data)
    return response.data
  },
  deleteInventoryItem: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/inventory/${id}`)
    return response.data
  }
}
