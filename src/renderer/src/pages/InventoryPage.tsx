import React, { useState } from 'react'
import {
  Package,
  Search,
  Filter,
  Edit,
  AlertTriangle,
  CheckCircle,
  Tag,
  ShoppingCart
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@renderer/components/PageHeader'
import { DataTable, Column } from '@renderer/components/DataTable'
import { Modal } from '@renderer/components/Modal'
import { useToast } from '@renderer/components/ToastProvider'
import { inventoryApi, InventoryItem } from '@renderer/api/inventory'
import { categoryApi } from '@renderer/api/category'

export const InventoryPage: React.FC = () => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editSellingPrice, setEditSellingPrice] = useState('')
  const [editReorderLevel, setEditReorderLevel] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryApi.listCategory({ all: true })
  })
  const categories = categoriesData?.data ?? []

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['inventory', search, filterCategoryId, page, limit],
    queryFn: () =>
      inventoryApi.listInventory({
        search: search || undefined,
        categoryId: filterCategoryId || undefined,
        page,
        limit
      })
  })

  const inventory = responseData?.data ?? []
  const pagination = responseData
    ? {
        page: responseData.page,
        limit: responseData.limit,
        total: responseData.total,
        totalPages: responseData.totalPages,
        onPageChange: (p: number) => setPage(p),
        onLimitChange: (l: number) => setLimit(l)
      }
    : undefined

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      inventoryApi.updateInventoryItem(data.id, data.payload),
    onSuccess: () => {
      showToast('success', 'Inventory item details updated successfully')
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setEditingItem(null)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to update item')
    }
  })

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setEditName(item.name)
    setEditSellingPrice(String(item.sellingPrice))
    setEditReorderLevel(String(item.reorderLevel))
    setEditDescription(item.description || '')
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    updateMutation.mutate({
      id: editingItem.id,
      payload: {
        name: editName.trim(),
        sellingPrice: parseFloat(editSellingPrice) || 0,
        reorderLevel: parseInt(editReorderLevel, 10) || 0,
        description: editDescription.trim() || null
      }
    })
  }

  const columns: Column<InventoryItem>[] = [
    {
      header: 'SKU',
      accessorKey: 'sku',
      cell: ({ value }) => (
        <span className="font-mono text-xs text-[var(--color-accent)] font-bold">{value}</span>
      )
    },
    {
      header: 'Item Name & Category',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white text-sm">{row.name}</span>
          <span className="text-xs text-[var(--color-text-secondary)]">
            Category: {row.category?.name || 'General'}
          </span>
        </div>
      )
    },
    {
      header: 'Stock Status',
      accessorKey: 'quantity',
      cell: ({ row }) => {
        const qty = row.quantity
        const reorder = row.reorderLevel ?? 2
        if (qty === 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle size={12} /> Out of Stock (0)
            </span>
          )
        }
        if (qty <= reorder) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle size={12} /> Low Stock ({qty})
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle size={12} /> In Stock ({qty})
          </span>
        )
      }
    },
    {
      header: 'Cost Price',
      accessorKey: 'costPrice',
      cell: ({ value }) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          Rs. {Number(value).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Selling Price',
      accessorKey: 'sellingPrice',
      cell: ({ value }) => (
        <span className="text-sm font-bold text-white">
          Rs. {Number(value).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="px-2.5 py-1 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-accent)] font-medium text-xs transition-colors flex items-center gap-1"
            title="Edit Item Details"
          >
            <Edit size={13} />
            <span>Edit</span>
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Stock"
        subtitle="View and manage current live stock, prices, SKU records, and threshold reorder levels"
        action={
          <button
            onClick={() => navigate('/purchases')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white font-semibold rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors shadow-md text-sm"
          >
            <ShoppingCart size={18} />
            <span>Purchase Stock</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search items by name, SKU, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[var(--color-text-muted)]" />
            <select
              value={filterCategoryId}
              onChange={(e) => {
                setFilterCategoryId(e.target.value)
                setPage(1)
              }}
              className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={inventory}
        isLoading={isLoading}
        pagination={pagination}
        emptyMessage="No items in inventory. Record a purchase to add items into stock."
      />

      {/* EDIT ITEM MODAL */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Inventory Item"
        size="md"
        marginTop="0"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] border-b border-[var(--color-border)] pb-2">
              <Package size={14} />
              <span>Item Information</span>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Item Name *
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                required
              />
            </div>

            {/* Locked Stock & Cost Information */}
            <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[var(--color-text-secondary)] block mb-0.5 font-medium">Quantity in Stock</span>
                <span className="font-bold text-white text-sm">{editingItem?.quantity} units</span>
                <span className="text-[11px] text-amber-400/90 block mt-0.5">
                  Locked (managed via Purchases / Sales / Repairs)
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)] block mb-0.5 font-medium">Unit Cost Price</span>
                <span className="font-bold text-white text-sm">Rs. {Number(editingItem?.costPrice).toLocaleString()}</span>
                <span className="text-[11px] text-amber-400/90 block mt-0.5">
                  Locked (recorded from Purchases)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Selling Price (Rs.) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editSellingPrice}
                  onChange={(e) => setEditSellingPrice(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Reorder Alert Level *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editReorderLevel}
                  onChange={(e) => setEditReorderLevel(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Description / Notes
              </label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-xs text-white focus:outline-none custom-scrollbar"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
