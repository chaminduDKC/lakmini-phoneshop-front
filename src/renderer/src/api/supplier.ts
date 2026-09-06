import { apiClient } from "./client"
import { PaginatedResponse, PaginationParams } from "./paginated"

export interface Supplier {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  _count?: {
    items: number
    purchases: number
  }
  createdAt: string
  updatedAt: string
}

export const supplierApi = {
  listSuppliers: async (
    params?: PaginationParams & { search?: string; all?: boolean }
  ): Promise<PaginatedResponse<Supplier>> => {
    const response = await apiClient.get<PaginatedResponse<Supplier>>("/suppliers", { params })
    return response.data
  },
  createSupplier: async (data: {
    name: string
    phone?: string
    email?: string
    address?: string
  }): Promise<{ supplier: Supplier; message: string }> => {
    const response = await apiClient.post("/suppliers", data)
    return response.data
  },
  updateSupplier: async (
    id: string,
    data: {
      name?: string
      phone?: string
      email?: string
      address?: string
    }
  ): Promise<{ supplier: Supplier; message: string }> => {
    const response = await apiClient.put(`/suppliers/${id}`, data)
    return response.data
  },
  deleteSupplier: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/suppliers/${id}`)
    return response.data
  }
}
