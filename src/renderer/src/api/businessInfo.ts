import { apiClient } from './client'
import { BusinessInfo } from './sale'

export type { BusinessInfo }

export interface UpdateBusinessInfoPayload {
  businessName: string
  subTitle: string
  tagline: string
  phone1: string
  phone2: string
  address: string
}

export const businessInfoApi = {
  get: async (): Promise<{ data: BusinessInfo | null }> => {
    const res = await apiClient.get<{ data: BusinessInfo | null }>('/business-info')
    return res.data
  },
  update: async (
    payload: UpdateBusinessInfoPayload
  ): Promise<{ success: boolean; message: string; data: BusinessInfo }> => {
    const res = await apiClient.put<{ success: boolean; message: string; data: BusinessInfo }>(
      '/business-info',
      payload
    )
    return res.data
  },
}
