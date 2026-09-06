import React from "react"
import { Inbox, ChevronLeft, ChevronRight } from "lucide-react"

export interface Column<T> {
  header: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => any
  cell?: (props: { row: T; value: any }) => React.ReactNode
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  pagination?: PaginationState
}

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50]

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = "No data found",
  pagination
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <td key={colIndex}>
                      <div className="h-4 bg-[var(--color-border)] rounded animate-pulse w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full rounded-lg border border-[var(--color-border)] p-12 flex flex-col items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg-card)]">
        <Inbox size={48} className="mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  const renderPagination = () => {
    if (!pagination) return null
    const { page, limit, total, totalPages, onPageChange, onLimitChange } = pagination
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)

    // Compute page buttons with ellipsis
    const getPageNumbers = () => {
      const pages: (number | "...")[] = []
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        if (page > 3) pages.push("...")
        const start = Math.max(2, page - 1)
        const end = Math.min(totalPages - 1, page + 1)
        for (let i = start; i <= end; i++) pages.push(i)
        if (page < totalPages - 2) pages.push("...")
        pages.push(totalPages)
      }
      return pages
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] rounded-b-lg">
        {/* Info + rows per page */}
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span>
            Showing <span className="text-white font-medium">{from}–{to}</span> of{" "}
            <span className="text-white font-medium">{total}</span> records
          </span>
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={limit}
              onChange={(e) => {
                onLimitChange(Number(e.target.value))
                onPageChange(1)
              }}
              className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-white rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-[var(--color-accent)]"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} />
          </button>

          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={i} className="px-2 text-xs text-[var(--color-text-muted)]">
                …
              </span>
            ) : (
              <button
                key={i}
                onClick={() => onPageChange(p as number)}
                className={`min-w-[28px] h-7 px-2 rounded text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-white"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => {
                let value: any = null
                if (col.accessorKey) {
                  value = row[col.accessorKey]
                } else if (col.accessorFn) {
                  value = col.accessorFn(row)
                }
                return (
                  <td key={colIndex}>
                    {col.cell ? col.cell({ row, value }) : String(value ?? "-")}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </div>
  )
}
