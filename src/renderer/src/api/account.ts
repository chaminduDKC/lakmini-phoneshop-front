import { apiClient } from './client'

export type AccountStatus = 'ACTIVE' | 'SUSPENDED'

export interface AccountData {
  id: string
  name: string
  status: AccountStatus
  dueDate: string | null
  suspendedAt: string | null
  suspendReason: string | null
  remainingDays: number | null
  isOverdue: boolean
}

export interface UpdateAccountPayload {
  name?: string
  status?: AccountStatus
  dueDate?: string | null
  suspendReason?: string | null
}

export const accountApi = {
  get: async (): Promise<{ data: AccountData }> => {
    const res = await apiClient.get<{ data: AccountData }>('/account')
    return res.data
  },
  update: async (
    payload: UpdateAccountPayload
  ): Promise<{ success: boolean; message: string; data: AccountData }> => {
    const res = await apiClient.put<{ success: boolean; message: string; data: AccountData }>(
      '/account',
      payload
    )
    return res.data
  },
  checkSuspension: async (): Promise<{
    success: boolean
    message: string
    suspendedCount: number
    data: AccountData
  }> => {
    const res = await apiClient.post<{
      success: boolean
      message: string
      suspendedCount: number
      data: AccountData
    }>('/account/check-suspension')
    return res.data
  },
  setStatus: async (
    status: AccountStatus,
    suspendReason?: string | null
  ): Promise<{ success: boolean; message: string; data: AccountData }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: AccountData }>(
      '/account/set-status',
      { status, suspendReason }
    )
    return res.data
  },
  setDueDate: async (
    dueDate: string | null
  ): Promise<{ success: boolean; message: string; data: AccountData }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: AccountData }>(
      '/account/set-due-date',
      { dueDate }
    )
    return res.data
  },
}
