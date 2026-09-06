import { apiClient } from './client'
import type { LoginRequest, LoginResponse, User } from '@shared/types'

interface AvailabilityResult {
  success: boolean
  error?: {
    code: 'SERVICE_SUSPENDED' | 'UNAVAILABLE'
    message: string
  }
}
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },
  checkAvailability: async (): Promise<AvailabilityResult> => {
    try {
      await apiClient.get('/health')
      return { success: true }
    } catch (err: any) {
      if (err.response?.status === 402) {
        return {
          success: false,
          error: {
            code: 'SERVICE_SUSPENDED',
            message: 'Service interrupted due to unpaid balance'
          }
        }
      }
      // network error, timeout, 500, etc — NOT the same as unpaid balance
      return {
        success: false,
        error: {
          code: 'UNAVAILABLE',
          message: 'Unable to reach the server'
        }
      }
    }
  }
}
