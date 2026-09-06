import { apiClient } from "./client"
import { PaginatedResponse, PaginationParams } from "./paginated"

export interface SaleItemDetail {
  id: string
  saleId: string
  itemId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  warrantyPeriod?: string | null
  serialNumber?: string | null
  createdAt: string
  item: {
    id: string
    name: string
    sku: string
    category: {
      id: string
      name: string
    }
  }
}

export interface BusinessInfo {
  id: string
  businessName: string
  subTitle?: string
  tagline?: string
  phone1: string
  phone2?: string
  address: string
}

export interface Sale {
  id: string
  invoiceNumber: string
  customerId?: string | null
  customerName: string
  customerPhone: string
  subTotal: number
  discount: number
  totalAmount: number
  paymentMethod: string
  notes?: string | null
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    name: string
    phone: string
    address?: string | null
  } | null
  items: SaleItemDetail[]
}

export interface CreateSaleItemPayload {
  itemId: string
  quantity: number
  unitPrice: number
  warrantyPeriod?: string | null
  serialNumber?: string | null
}

export interface CreateSalePayload {
  customerId?: string | null
  customerName: string
  customerPhone: string
  customerAddress?: string | null
  items: CreateSaleItemPayload[]
  discount?: number
  paymentMethod?: string
  notes?: string | null
}

export const saleApi = {
  listSales: async (
    params?: PaginationParams & {
      search?: string
      customerId?: string
      startDate?: string
      endDate?: string
      all?: boolean
    }
  ): Promise<PaginatedResponse<Sale>> => {
    const response = await apiClient.get<PaginatedResponse<Sale>>("/sales", { params })
    return response.data
  },
  getSaleById: async (id: string): Promise<{ sale: Sale; businessInfo?: BusinessInfo }> => {
    const response = await apiClient.get<{ sale: Sale; businessInfo?: BusinessInfo }>(`/sales/${id}`)
    return response.data
  },
  createSale: async (
    data: CreateSalePayload
  ): Promise<{
    success: boolean
    message: string
    data: { sale: Sale; businessInfo?: BusinessInfo }
  }> => {
    const response = await apiClient.post("/sales", data)
    return response.data
  }
}
