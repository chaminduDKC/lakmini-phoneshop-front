import { apiClient } from "./client"
import { PaginatedResponse, PaginationParams } from "./paginated"

export interface PhoneModelRecord {
  id: string
  brand: string
  model: string
}

export const phoneApi = {
  createPhone: async (data: any): Promise<any> => {
    const response = await apiClient.post("/phones", data)
    return response.data
  },
  updatePhone: async (brand: string, data: any): Promise<any> => {    
    const response = await apiClient.put(`/phones/${brand}`, data)
    return response.data
  },
  listPhone: async (
    params?: PaginationParams & { search?: string; all?: boolean }
  ): Promise<PaginatedResponse<PhoneModelRecord> & { phoneList: PhoneModelRecord[] }> => {
    const response = await apiClient.get<
      PaginatedResponse<PhoneModelRecord> & { phoneList: PhoneModelRecord[] }
    >("/phones", { params })
    return response.data
  },
  deletePhone: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/phones/${id}`)
    return response.data
  }
}
