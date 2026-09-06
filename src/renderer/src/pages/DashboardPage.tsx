import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Package,
  Calendar,
  RefreshCw,
  Eye,
  Percent,
  Plus
} from "lucide-react"
import { PageHeader } from "@renderer/components/PageHeader"
import { dashboardApi, DashboardStats } from "@renderer/api/dashboard"

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
]

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)

  const {
    data: stats,
    isLoading,
    isRefetching,
    refetch
  } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", selectedYear, selectedMonth],
    queryFn: () => dashboardApi.getStats({ year: selectedYear, month: selectedMonth }),
    refetchInterval: 60000
  })

  // Format currency
  const formatCurrency = (val?: number) => {
    return `Rs. ${(val || 0).toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const currentMonthName = MONTH_NAMES[selectedMonth - 1]

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <PageHeader
        title="Dashboard & Analytics"
        subtitle={`Business performance overview for ${currentMonthName} ${selectedYear}`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Selector */}
            <div className="flex items-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 shadow-sm">
              <Calendar size={15} className="text-[var(--color-text-muted)] mr-2" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1} className="bg-[var(--color-bg-primary)] text-white">
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 shadow-sm">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((yr) => (
                  <option key={yr} value={yr} className="bg-[var(--color-bg-primary)] text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="p-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={15} className={isRefetching ? "animate-spin text-[var(--color-accent)]" : ""} />
            </button>
          </div>
        }
      />

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Monthly Revenue */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Monthly Revenue</p>
              <h3 className="text-2xl font-black text-white mt-1.5">
                {isLoading ? "..." : formatCurrency(stats?.revenue.totalRevenue)}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              Sales: <strong className="text-white">{formatCurrency(stats?.revenue.partsSaleRevenue)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
              Repairs: <strong className="text-white">{formatCurrency(stats?.revenue.repairsRevenue)}</strong>
            </span>
          </div>
        </div>

        {/* 2. Monthly Cost */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Monthly Cost</p>
              <h3 className="text-2xl font-black text-white mt-1.5">
                {isLoading ? "..." : formatCurrency(stats?.cost.totalCost)}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
              Stock: <strong className="text-white">{formatCurrency(stats?.cost.partsPurchaseCost)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
              Ext. Parts: <strong className="text-white">{formatCurrency(stats?.cost.externalPartsCost)}</strong>
            </span>
          </div>
        </div>

        {/* 3. Monthly Profit */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Monthly Net Profit</p>
              <h3
                className={`text-2xl font-black mt-1.5 ${
                  (stats?.profit.totalProfit || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isLoading ? "..." : formatCurrency(stats?.profit.totalProfit)}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              Margin: <strong className="text-white">{stats?.profit.profitMarginPercent ?? 0}%</strong>
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              Parts: <strong className="text-white">{formatCurrency(stats?.profit.partsSalesProfit)}</strong>
            </span>
          </div>
        </div>

        {/* 4. Pending Payments */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Pending Payments</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1.5">
                {isLoading ? "..." : formatCurrency(stats?.pendingPayments.totalAmount)}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
            <span>
              Uncollected Jobs: <strong className="text-white">{stats?.pendingPayments.count ?? 0}</strong>
            </span>
            <button
              onClick={() => navigate("/jobs")}
              className="text-[var(--color-accent)] hover:underline font-semibold flex items-center gap-0.5"
            >
              Collect <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* FINANCIAL STREAM BREAKDOWN (REVENUE, COST, PROFIT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* REVENUE BREAKDOWN */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                  <TrendingUp size={16} />
                </div>
                <h4 className="font-bold text-sm text-white">Revenue Breakdown</h4>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {formatCurrency(stats?.revenue.totalRevenue)}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {/* Parts Sales */}
              <div className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
                    <ShoppingCart size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Parts Sales (POS)</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {stats?.revenue.salesCount || 0} completed invoices
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-white">
                  {formatCurrency(stats?.revenue.partsSaleRevenue)}
                </span>
              </div>

              {/* Repairs */}
              <div className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400">
                    <Wrench size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Repair Services</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {stats?.revenue.repairsCount || 0} repair jobs billed
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-white">
                  {formatCurrency(stats?.revenue.repairsRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="pt-2">
            <div className="h-2 w-full bg-[var(--color-bg-primary)] rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    (stats?.revenue.totalRevenue || 0) > 0
                      ? ((stats?.revenue.partsSaleRevenue || 0) / (stats?.revenue.totalRevenue || 1)) * 100
                      : 50
                  }%`
                }}
                className="bg-emerald-500 h-full transition-all"
                title="Parts Sales"
              />
              <div
                style={{
                  width: `${
                    (stats?.revenue.totalRevenue || 0) > 0
                      ? ((stats?.revenue.repairsRevenue || 0) / (stats?.revenue.totalRevenue || 1)) * 100
                      : 50
                  }%`
                }}
                className="bg-cyan-500 h-full transition-all"
                title="Repairs"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1.5 font-medium">
              <span>Sales ({((stats?.revenue.totalRevenue || 0) > 0 ? ((stats?.revenue.partsSaleRevenue || 0) / stats!.revenue.totalRevenue) * 100 : 0).toFixed(0)}%)</span>
              <span>Repairs ({((stats?.revenue.totalRevenue || 0) > 0 ? ((stats?.revenue.repairsRevenue || 0) / stats!.revenue.totalRevenue) * 100 : 0).toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        {/* COST BREAKDOWN */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-red-500/10 text-red-400">
                  <TrendingDown size={16} />
                </div>
                <h4 className="font-bold text-sm text-white">Cost Breakdown</h4>
              </div>
              <span className="text-xs font-bold text-red-400">
                {formatCurrency(stats?.cost.totalCost)}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {/* Parts Purchase Cost */}
              <div className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-red-500/10 text-red-400">
                    <Package size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Stock Purchases</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {stats?.cost.purchasesCount || 0} purchase orders
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-white">
                  {formatCurrency(stats?.cost.partsPurchaseCost)}
                </span>
              </div>

              {/* External Parts Cost */}
              <div className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-orange-500/10 text-orange-400">
                    <Wrench size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">External Repair Parts</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Direct outsourced parts</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-white">
                  {formatCurrency(stats?.cost.externalPartsCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="pt-2">
            <div className="h-2 w-full bg-[var(--color-bg-primary)] rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    (stats?.cost.totalCost || 0) > 0
                      ? ((stats?.cost.partsPurchaseCost || 0) / (stats?.cost.totalCost || 1)) * 100
                      : 50
                  }%`
                }}
                className="bg-red-500 h-full transition-all"
                title="Stock Purchases"
              />
              <div
                style={{
                  width: `${
                    (stats?.cost.totalCost || 0) > 0
                      ? ((stats?.cost.externalPartsCost || 0) / (stats?.cost.totalCost || 1)) * 100
                      : 50
                  }%`
                }}
                className="bg-orange-500 h-full transition-all"
                title="External Parts"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1.5 font-medium">
              <span>Stock ({((stats?.cost.totalCost || 0) > 0 ? ((stats?.cost.partsPurchaseCost || 0) / stats!.cost.totalCost) * 100 : 0).toFixed(0)}%)</span>
              <span>External ({((stats?.cost.totalCost || 0) > 0 ? ((stats?.cost.externalPartsCost || 0) / stats!.cost.totalCost) * 100 : 0).toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        {/* PROFIT BREAKDOWN */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  <DollarSign size={16} />
                </div>
                <h4 className="font-bold text-sm text-white">Profit Analysis</h4>
              </div>
              <span
                className={`text-xs font-bold ${
                  (stats?.profit.totalProfit || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatCurrency(stats?.profit.totalProfit)}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {/* Profit from Parts Sales */}
              <div className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Profit from Parts Sales</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Sales minus COGS ({formatCurrency(stats?.profit.partsSalesCOGS)})
                  </p>
                </div>
                <span
                  className={`text-xs font-bold ${
                    (stats?.profit.partsSalesProfit || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(stats?.profit.partsSalesProfit)}
                </span>
              </div>

              {/* Profit from Repairs */}
              <div className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Profit from Repairs</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Repairs minus Parts Used ({formatCurrency(stats?.profit.repairsPartsCost)})
                  </p>
                </div>
                <span
                  className={`text-xs font-bold ${
                    (stats?.profit.repairsProfit || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(stats?.profit.repairsProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs bg-[var(--color-bg-primary)] p-2.5 rounded-lg border border-[var(--color-border)]">
            <span className="text-[var(--color-text-muted)] font-medium flex items-center gap-1">
              <Percent size={13} className="text-[var(--color-accent)]" /> Net Margin
            </span>
            <span className="font-bold text-white">{stats?.profit.profitMarginPercent ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* OPERATIONAL SECTION: LOW STOCK & PENDING REPAIRS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LOW STOCK ITEMS ALERT */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
                  <AlertTriangle size={16} />
                </div>
                <h4 className="font-bold text-sm text-white">Low Stock Items</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {stats?.lowStock.count || 0} alert{(stats?.lowStock.count || 0) === 1 ? "" : "s"}
                </span>
              </div>
              <button
                onClick={() => navigate("/purchases")}
                className="text-xs text-[var(--color-accent)] hover:underline font-semibold flex items-center gap-1"
              >
                <Plus size={13} /> Reorder Stock
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
              {stats?.lowStock.items && stats.lowStock.items.length > 0 ? (
                stats.lowStock.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-between gap-3 hover:border-[var(--color-accent)] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        <span className="font-mono text-[10px] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 rounded">
                          {item.sku}
                        </span>
                        <span>•</span>
                        <span>{item.categoryName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold ${
                            item.quantity === 0
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {item.quantity === 0 ? "Out of Stock" : `${item.quantity} in stock`}
                        </span>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          Min: {item.reorderLevel}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                  <p className="font-semibold text-white">All stock levels healthy</p>
                  <p className="text-[11px] mt-0.5">No items are currently below their reorder threshold.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[var(--color-border)] flex justify-between items-center text-xs">
            <span className="text-[var(--color-text-muted)]">Check full catalog</span>
            <button
              onClick={() => navigate("/inventory")}
              className="text-[var(--color-accent)] hover:underline font-semibold flex items-center gap-0.5"
            >
              Inventory Management <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* PENDING REPAIR JOBS TRACKER */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400">
                  <Wrench size={16} />
                </div>
                <h4 className="font-bold text-sm text-white">Active Repair Jobs</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  {stats?.pendingJobs.total || 0} active
                </span>
              </div>
              <button
                onClick={() => navigate("/jobs")}
                className="text-xs text-[var(--color-accent)] hover:underline font-semibold flex items-center gap-1"
              >
                <Plus size={13} /> New Job
              </button>
            </div>

            {/* Status pills breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="p-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-amber-500/20 text-center">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Intake</p>
                <p className="text-lg font-black text-white mt-0.5">
                  {stats?.pendingJobs.pendingIntake || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-sky-500/20 text-center">
                <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">In Progress</p>
                <p className="text-lg font-black text-white mt-0.5">
                  {stats?.pendingJobs.inProgress || 0}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-emerald-500/20 text-center">
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Ready / Done</p>
                <p className="text-lg font-black text-white mt-0.5">
                  {stats?.pendingJobs.completedReady || 0}
                </p>
              </div>
            </div>

            {/* Active jobs mini list */}
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {stats?.pendingJobs.list && stats.pendingJobs.list.length > 0 ? (
                stats.pendingJobs.list.map((job) => (
                  <div
                    key={job.id}
                    className="p-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-between gap-3 hover:border-[var(--color-accent)] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{job.jobNumber}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            job.status === "PENDING"
                              ? "bg-amber-500/20 text-amber-400"
                              : job.status === "IN_PROGRESS"
                              ? "bg-sky-500/20 text-sky-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                        {job.phoneModel} • {job.customerName}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate("/jobs")}
                      className="p-1.5 rounded hover:bg-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white transition-colors"
                      title="Manage Job"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]">
                  <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-400 opacity-60" />
                  <p className="font-semibold text-white">No pending repair jobs</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[var(--color-border)] flex justify-between items-center text-xs">
            <span className="text-[var(--color-text-muted)]">View all repairs</span>
            <button
              onClick={() => navigate("/jobs")}
              className="text-[var(--color-accent)] hover:underline font-semibold flex items-center gap-0.5"
            >
              Repair Jobs Workspace <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* PENDING CUSTOMER PAYMENTS TABLE */}
      {stats?.pendingPayments.list && stats.pendingPayments.list.length > 0 && (
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
                <Clock size={16} />
              </div>
              <h4 className="font-bold text-sm text-white">Pending Customer Payments (Repair Dues)</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Total Outstanding:</span>
              <span className="text-sm font-black text-amber-400">
                {formatCurrency(stats.pendingPayments.totalAmount)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Job Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Device Model</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Total Billed</th>
                  <th className="py-2.5 px-3 text-right">Advance Paid</th>
                  <th className="py-2.5 px-3 text-right text-amber-400">Amount Due</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]/50">
                {stats.pendingPayments.list.map((job) => (
                  <tr key={job.id} className="hover:bg-[var(--color-bg-primary)]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{job.jobNumber}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-white">{job.customerName}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{job.customerPhone}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">{job.phoneModel}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-white">
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-white">
                      {formatCurrency(job.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-medium">
                      {formatCurrency(job.advancePaid)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-amber-400">
                      {formatCurrency(job.dueAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => navigate("/jobs")}
                        className="px-2 py-1 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-[10px] font-bold transition-colors shadow-sm"
                      >
                        Collect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}