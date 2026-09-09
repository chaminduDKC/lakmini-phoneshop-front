import { apiClient } from "./client"
import { PaginatedResponse, PaginationParams } from "./paginated"

export type LedgerEntryType =
  | "OPENING_BALANCE"
  | "PURCHASE"
  | "PURCHASE_REVERSAL"
  | "SALE"
  | "SALE_REVERSAL"
  | "REPAIR"
  | "REPAIR_REVERSAL"
  | "EXTERNAL_PART"
  | "EXTERNAL_PART_REVERSAL"
  | "CAPITAL"
  | "WITHDRAWAL"

export interface LedgerEntry {
  id: string
  type: LedgerEntryType
  amount: string | number
  description: string
  referenceId: string | null
  direction: "CREDIT" | "DEBIT"
  runningBalance: number
  createdAt: string
}

export interface LedgerSummary {
  currentBalance: number
  totalCredits: number
  totalDebits: number
}

export interface CreateManualEntryPayload {
  type: "OPENING_BALANCE" | "CAPITAL" | "WITHDRAWAL"
  amount: number
  description?: string
  createdAt?: string
}

export const ledgerApi = {
  listLedger: async (
    params?: PaginationParams & {
      search?: string
      type?: string
      startDate?: string
      endDate?: string
      all?: boolean
    }
  ): Promise<PaginatedResponse<LedgerEntry>> => {
    const response = await apiClient.get<PaginatedResponse<LedgerEntry>>("/ledger", { params })
    return response.data
  },

  getLedgerSummary: async (): Promise<LedgerSummary> => {
    const response = await apiClient.get<LedgerSummary>("/ledger/summary")
    return response.data
  },

  createManualEntry: async (
    payload: CreateManualEntryPayload
  ): Promise<{ success: boolean; data: LedgerEntry }> => {
    const response = await apiClient.post("/ledger/manual", payload)
    return response.data
  },

  updateEntry: async (
    id: string,
    payload: { amount?: number; description?: string }
  ): Promise<{ success: boolean; data: LedgerEntry }> => {
    const response = await apiClient.put(`/ledger/${id}`, payload)
    return response.data
  },

  deleteEntry: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/ledger/${id}`)
    return response.data
  }
}
