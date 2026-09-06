import { apiClient } from "./client"
import { PaginatedResponse, PaginationParams } from "./paginated"

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  _count?: {
    sales: number
  }
  createdAt: string
  updatedAt: string
}

export const customerApi = {
  listCustomers: async (
    params?: PaginationParams & { search?: string; all?: boolean }
  ): Promise<PaginatedResponse<Customer>> => {
    const response = await apiClient.get<PaginatedResponse<Customer>>("/customers", { params })
    return response.data
  },
  createCustomer: async (data: {
    name: string
    phone: string
    email?: string
    address?: string
  }): Promise<{ customer: Customer; message: string }> => {
    const response = await apiClient.post("/customers", data)
    return response.data
  },
  updateCustomer: async (
    id: string,
    data: {
      name?: string
      phone?: string
      email?: string
      address?: string
    }
  ): Promise<{ customer: Customer; message: string }> => {
    const response = await apiClient.put(`/customers/${id}`, data)
    return response.data
  },
  deleteCustomer: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/customers/${id}`)
    return response.data
  }
}
