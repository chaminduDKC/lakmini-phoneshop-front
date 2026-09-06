import { apiClient } from "./client"
import { PaginatedResponse, PaginationParams } from "./paginated"

export interface PurchaseItemDetail {
  id: string
  purchaseId: string
  itemId: string
  quantity: number
  costPrice: number
  sellingPrice: number
  createdAt: string
  item: {
    id: string
    name: string
    sku: string
    attributes: Record<string, any>
    costPrice: number
    sellingPrice: number
    quantity: number
    category: {
      id: string
      name: string
    }
    _count?: {
      sales: number
      partsUsed: number
    }
  }
}

export interface Purchase {
  id: string
  supplierId?: string | null
  supplierName?: string | null
  totalAmount: number
  notes?: string | null
  createdAt: string
  updatedAt: string
  supplier?: {
    id: string
    name: string
    phone?: string | null
  } | null
  items: PurchaseItemDetail[]
}

export interface CreatePurchasePayload {
  supplierId?: string | null
  supplierName?: string | null
  categoryId: string
  itemName: string
  attributes: Record<string, any>
  buyingPrice: number
  sellingPrice: number
  quantity: number
  notes?: string | null
}

export interface UpdatePurchasePayload {
  supplierId?: string | null
  supplierName?: string | null
  itemName?: string
  buyingPrice: number
  sellingPrice: number
  quantity: number
  notes?: string | null
}

export const purchaseApi = {
  listPurchases: async (
    params?: PaginationParams & {
      search?: string
      supplierId?: string
      startDate?: string
      endDate?: string
      all?: boolean
    }
  ): Promise<PaginatedResponse<Purchase>> => {
    const response = await apiClient.get<PaginatedResponse<Purchase>>("/purchases", { params })
    return response.data
  },
  getPurchaseById: async (id: string): Promise<Purchase> => {
    const response = await apiClient.get<Purchase>(`/purchases/${id}`)
    return response.data
  },
  createPurchase: async (
    data: CreatePurchasePayload
  ): Promise<{ success: boolean; message: string; data: { purchase: Purchase; item: any } }> => {
    const response = await apiClient.post("/purchases", data)
    return response.data
  },
  updatePurchase: async (
    id: string,
    data: UpdatePurchasePayload
  ): Promise<{ success: boolean; message: string; data: Purchase }> => {
    const response = await apiClient.put(`/purchases/${id}`, data)
    return response.data
  },
  deletePurchase: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/purchases/${id}`)
    return response.data
  }
}
