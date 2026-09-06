import { apiClient } from './client'

export interface DashboardStats {
  period: {
    year: number
    month: number
    startDate: string
    endDate: string
  }
  revenue: {
    partsSaleRevenue: number
    repairsRevenue: number
    totalRevenue: number
    salesCount: number
    repairsCount: number
  }
  cost: {
    partsPurchaseCost: number
    externalPartsCost: number
    totalCost: number
    purchasesCount: number
  }
  profit: {
    partsSalesProfit: number
    partsSalesCOGS: number
    repairsProfit: number
    repairsPartsCost: number
    totalProfit: number
    profitMarginPercent: number
  }
  lowStock: {
    count: number
    items: Array<{
      id: string
      name: string
      sku: string
      quantity: number
      reorderLevel: number
      costPrice: number
      sellingPrice: number
      categoryName: string
      supplierName?: string | null
    }>
  }
  pendingJobs: {
    total: number
    pendingIntake: number
    inProgress: number
    completedReady: number
    list: Array<{
      id: string
      jobNumber: string
      customerName: string
      customerPhone: string
      phoneModel: string
      receivedCondition: string
      issue: string
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED'
      paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID'
      totalAmount: number
      advancePaid: number
      technician?: string | null
      createdAt: string
    }>
  }
  pendingPayments: {
    totalAmount: number
    count: number
    list: Array<{
      id: string
      jobNumber: string
      customerName: string
      customerPhone: string
      phoneModel: string
      status: string
      paymentStatus: string
      totalAmount: number
      advancePaid: number
      dueAmount: number
      createdAt: string
    }>
  }
  recent: {
    sales: Array<{
      id: string
      invoiceNumber: string
      customerName: string
      customerPhone: string
      totalAmount: number
      paymentMethod: string
      createdAt: string
      items: Array<{
        quantity: number
        item: { name: string }
      }>
    }>
    repairs: Array<{
      id: string
      jobNumber: string
      customerName: string
      customerPhone: string
      phoneModel: string
      issue: string
      status: string
      totalAmount: number
      createdAt: string
    }>
  }
}

export const dashboardApi = {
  getStats: async (params?: {
    month?: number
    year?: number
    startDate?: string
    endDate?: string
  }): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats', { params })
    return response.data
  }
}
