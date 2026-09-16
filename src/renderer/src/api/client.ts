import axios from 'axios'
import { API_BASE_URL } from '../config/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout:120000
})

// Request Interceptor: add auth token
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await window.electronAPI.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (error) {
    console.error('Failed to get token for request:', error)
  }
  return config
})

// Response Interceptor: handle 401 & account suspension
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isSuspended =
      error.response?.data?.error === 'ACCOUNT_SUSPENDED' ||
      error.response?.data?.code === 'ACCOUNT_SUSPENDED'

    if (error.response?.status === 401 || isSuspended) {
      try {
        const message =
          error.response?.data?.message ||
          (isSuspended ? 'Account is suspended due to unpaid monthly payment.' : undefined)
        if (message) {
          sessionStorage.setItem('logout_reason', message)
        }
        await window.electronAPI.clearToken()
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: message } }))
      } catch (e) {
        console.error('Failed to clear token on 401 / suspension:', e)
      }
    }
    return Promise.reject(error)
  }
)
