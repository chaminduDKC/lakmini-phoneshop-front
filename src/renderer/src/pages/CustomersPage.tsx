import React, { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@renderer/components/PageHeader'
import { DataTable, Column } from '@renderer/components/DataTable'
import { Modal } from '@renderer/components/Modal'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { useToast } from '@renderer/components/ToastProvider'
import { customerApi, Customer } from '@renderer/api/customer'

export const CustomersPage: React.FC = () => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  // Debounce search input -> actual query param
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 600)
    return () => clearTimeout(t)
  }, [searchInput])

  const {
    data: responseData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['customers', search, page, limit],
    queryFn: () => customerApi.listCustomers({ search: search || undefined, page, limit }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })

  const customers = responseData?.data ?? []
  const pagination = responseData
    ? {
        page: responseData.page,
        limit: responseData.limit,
        total: responseData.total,
        totalPages: responseData.totalPages,
        onPageChange: (p: number) => setPage(p),
        onLimitChange: (l: number) => {
          setLimit(l)
          setPage(1)
        }
      }
    : undefined

  const resetForm = () => {
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setEditingCustomer(null)
    setShowAddModal(false)
  }

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setName(customer.name)
    setPhone(customer.phone)
    setEmail(customer.email || '')
    setAddress(customer.address || '')
    setShowAddModal(true)
  }

  const createMutation = useMutation({
    mutationFn: (data: { name: string; phone: string; email?: string; address?: string }) =>
      customerApi.createCustomer(data),
    onSuccess: (res) => {
      showToast('success', res.message || 'Customer created successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      resetForm()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to create customer')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      customerApi.updateCustomer(data.id, data.payload),
    onSuccess: (res) => {
      showToast('success', res.message || 'Customer updated successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      resetForm()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to update customer')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.deleteCustomer(id),
    onSuccess: () => {
      showToast('success', 'Customer deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to delete customer')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      showToast('error', 'Name and Phone number are required')
      return
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined
    }

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Name',
      accessorKey: 'name',
      cell: ({ value }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center font-bold text-xs">
            {value ? value.charAt(0).toUpperCase() : 'C'}
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
          <span className="text-white font-medium">{value}</span>
        </div>
      )
    },
    {
      header: 'Email Address',
      accessorKey: 'email',
      cell: ({ value }) =>
        value ? (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <Mail size={13} className="text-[var(--color-text-muted)]" />
            <span>{value}</span>
          </div>
        ) : (
          <span className="text-xs text-[var(--color-text-secondary)]">-</span>
        )
    },
    {
      header: 'Address / Location',
      accessorKey: 'address',
      cell: ({ value }) =>
        value ? (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] max-w-xs">
            <MapPin size={13} className="text-[var(--color-text-muted)] shrink-0" />
            <span className="truncate">{value}</span>
          </div>
        ) : (
          <span className="text-xs text-[var(--color-text-secondary)]">-</span>
        )
    },
    {
      header: 'Sales Orders',
      accessorFn: (row) => row._count?.sales || 0,
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
            title="Edit Customer"
          >
            <Edit size={13} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
            title="Delete Customer"
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
        title="Customer Directory"
        subtitle="Manage customer contact records, transaction histories, and repair job accounts"
        action={
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} />
            <span>Add Customer</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      {isError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          Failed to load customers{error instanceof Error ? `: ${error.message}` : '.'} Please try again.
        </div>
      )}

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        pagination={pagination}
        emptyMessage="No customers registered yet. Click 'Add Customer' to create one."
      />

      {/* ADD / EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={resetForm}
        title={editingCustomer ? 'Edit Customer Profile' : 'Register New Customer'}
        size="md"
        marginTop="0"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] border-b border-[var(--color-border)] pb-2">
              <Users size={14} />
              <span>Customer Information</span>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Full Name *
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kamal Perera"
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                  required
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
                  placeholder="e.g. kamal@example.com"
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 120 Galle Road, Colombo"
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
              {editingCustomer
                ? updateMutation.isPending
                  ? 'Saving...'
                  : 'Save Changes'
                : createMutation.isPending
                ? 'Creating...'
                : 'Create Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete Customer"
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