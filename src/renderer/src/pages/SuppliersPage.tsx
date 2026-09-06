import React, { useState } from 'react'
import { Truck, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Building2, ShoppingCart } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@renderer/components/PageHeader'
import { DataTable, Column } from '@renderer/components/DataTable'
import { Modal } from '@renderer/components/Modal'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { useToast } from '@renderer/components/ToastProvider'
import { supplierApi, Supplier } from '@renderer/api/supplier'

export const SuppliersPage: React.FC = () => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['suppliers', search, page, limit],
    queryFn: () => supplierApi.listSuppliers({ search: search || undefined, page, limit })
  })

  const suppliers = responseData?.data ?? []
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

  const resetForm = () => {
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setEditingSupplier(null)
    setShowAddModal(false)
  }

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setName(supplier.name)
    setPhone(supplier.phone || '')
    setEmail(supplier.email || '')
    setAddress(supplier.address || '')
    setShowAddModal(true)
  }

  const createMutation = useMutation({
    mutationFn: (data: { name: string; phone?: string; email?: string; address?: string }) =>
      supplierApi.createSupplier(data),
    onSuccess: (res) => {
      showToast('success', res.message || 'Supplier created successfully')
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      resetForm()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to create supplier')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      supplierApi.updateSupplier(data.id, data.payload),
    onSuccess: (res) => {
      showToast('success', res.message || 'Supplier updated successfully')
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      resetForm()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to update supplier')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierApi.deleteSupplier(id),
    onSuccess: () => {
      showToast('success', 'Supplier deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to delete supplier')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('error', 'Supplier name is required')
      return
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined
    }

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const columns: Column<Supplier>[] = [
    {
      header: 'Supplier / Company',
      accessorKey: 'name',
      cell: ({ value }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center font-bold text-xs">
            <Building2 size={16} />
          </div>
          <span className="font-semibold text-white text-sm">{value}</span>
        </div>
      )
    },
    {
      header: 'Phone Number',
      accessorKey: 'phone',
      cell: ({ value }) => (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] font-mono">
          <Phone size={13} className="text-[var(--color-accent)]" />
          <span className="text-white">{value || '-'}</span>
        </div>
      )
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ value }) => (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {value || '-'}
        </span>
      )
    },
    {
      header: 'Address / Location',
      accessorKey: 'address',
      cell: ({ value }) => (
        <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-xs block">
          {value || '-'}
        </span>
      )
    },
    {
      header: 'Purchases',
      accessorFn: (row) => row._count?.purchases || 0,
      cell: ({ value }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-bg-primary)] text-[var(--color-accent)] border border-[var(--color-border)]">
          {value} orders
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
            title="Edit Supplier"
          >
            <Edit size={13} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
            title="Delete Supplier"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributors & Suppliers"
        subtitle="Manage phone parts distributors, supplier contracts, and wholesale accounts"
        action={
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
           className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Plus size={18} />
            <span>Add Supplier</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search suppliers by name, phone, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={isLoading}
        pagination={pagination}
        emptyMessage="No suppliers registered yet. Click 'Add Supplier' to create one."
      />

      {/* ADD / EDIT SUPPLIER MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editingSupplier ? 'Edit Supplier Profile' : 'Register New Supplier'}
        size="md"
        marginTop="0"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] border-b border-[var(--color-border)] pb-2">
              <Building2 size={14} />
              <span>Supplier Information</span>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Supplier / Business Name *
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Metro Mobile Distributors / Global Parts LK"
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. orders@metromobile.lk"
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Address / Location
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 45 First Cross Street, Colombo"
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-xs text-white focus:outline-none custom-scrollbar"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
             className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              {editingSupplier
                ? updateMutation.isPending
                  ? 'Saving...'
                  : 'Save Changes'
                : createMutation.isPending
                ? 'Creating...'
                : 'Create Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete Supplier"
        isDestructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
