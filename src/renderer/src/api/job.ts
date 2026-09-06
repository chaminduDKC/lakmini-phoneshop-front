import { apiClient } from "./client"
import { BusinessInfo } from "./sale"
import { PaginatedResponse, PaginationParams } from "./paginated"

export type RepairStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELIVERED" | "CANCELLED"
export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID"
export type PartSource = "INVENTORY" | "EXTERNAL"

export interface JobPartUsed {
  id: string
  repairId: string
  source: PartSource
  itemId?: string | null
  partName?: string | null
  partCost?: number | null
  sellingCost: number
  qtyUsed: number
  createdAt: string
  item?: {
    id: string
    name: string
    sku: string
    category?: {
      id: string
      name: string
    }
  } | null
}

export interface RepairJob {
  id: string
  jobNumber: string
  customerId?: string | null
  customerName: string
  customerPhone: string
  phoneModel: string
  receivedCondition: string
  issue: string
  passcode?: string | null
  status: RepairStatus
  paymentStatus: PaymentStatus
  technician?: string | null
  serviceCharge: number
  advancePaid: number
  discount: number
  totalAmount: number
  repairNotes?: string | null
  warrantyPeriod?: string | null
  warrantyDescription?: string | null
  deliveredAt?: string | null
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    name: string
    phone: string
    address?: string | null
  } | null
  partsUsed: JobPartUsed[]
}

export interface CreateJobPayload {
  customerId?: string | null
  customerName: string
  customerPhone: string
  customerAddress?: string | null
  phoneModel: string
  receivedCondition: string
  issue: string
  passcode?: string | null
  advancePaid?: number
  serviceCharge?: number
  technician?: string | null
}

export interface UpdateJobPayload {
  phoneModel?: string
  receivedCondition?: string
  issue?: string
  passcode?: string | null
  status?: RepairStatus
  paymentStatus?: PaymentStatus
  technician?: string | null
  serviceCharge?: number
  advancePaid?: number
  discount?: number
  repairNotes?: string | null
  warrantyPeriod?: string | null
  warrantyDescription?: string | null
}

export interface AddJobPartPayload {
  source: PartSource
  itemId?: string | null
  partName?: string | null
  partCost?: number | null
  sellingCost: number
  qtyUsed: number
}

export const jobApi = {
  listJobs: async (
    params?: PaginationParams & {
      search?: string
      status?: string
      paymentStatus?: string
      customerId?: string
      all?: boolean
    }
  ): Promise<PaginatedResponse<RepairJob>> => {
    const response = await apiClient.get<PaginatedResponse<RepairJob>>("/jobs", { params })
    return response.data
  },
  getJobById: async (
    id: string
  ): Promise<{ job: RepairJob; businessInfo?: BusinessInfo }> => {
    const response = await apiClient.get<{ job: RepairJob; businessInfo?: BusinessInfo }>(
      `/jobs/${id}`
    )
    return response.data
  },
  createJob: async (
    data: CreateJobPayload
  ): Promise<{ success: boolean; message: string; data: RepairJob }> => {
    const response = await apiClient.post("/jobs", data)
    return response.data
  },
  updateJob: async (
    id: string,
    data: UpdateJobPayload
  ): Promise<{ job: RepairJob; message: string }> => {
    const response = await apiClient.put(`/jobs/${id}`, data)
    return response.data
  },
  addJobPart: async (
    id: string,
    data: AddJobPartPayload
  ): Promise<{ job: RepairJob; message: string }> => {
    const response = await apiClient.post(`/jobs/${id}/parts`, data)
    return response.data
  },
  removeJobPart: async (
    id: string,
    partId: string
  ): Promise<{ job: RepairJob; message: string }> => {
    const response = await apiClient.delete(`/jobs/${id}/parts/${partId}`)
    return response.data
  },
  deliverJob: async (
    id: string,
    data?: Partial<UpdateJobPayload>
  ): Promise<{
    success: boolean
    message: string
    data: { job: RepairJob; businessInfo?: BusinessInfo }
  }> => {
    const response = await apiClient.post(`/jobs/${id}/deliver`, data)
    return response.data
  },
  deleteJob: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/jobs/${id}`)
    return response.data
  }
}
