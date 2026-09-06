import { apiClient } from "./client"
import { PaginatedResponse, PaginationParams } from "./paginated"

export const categoryApi = {
  createCategory: async (data: any): Promise<any> => {
    console.log(data);
    
    const response = await apiClient.post("/categories", data)
    return response.data
  },
  updateCategory: async (id: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/categories/${id}`, data)
    return response.data
  },
  deleteCategory: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/categories/${id}`)
    return response.data
  },
  listCategory: async (
    params?: PaginationParams & { search?: string; all?: boolean }
  ): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get<PaginatedResponse<any>>("/categories", { params })
    return response.data
  }
}
