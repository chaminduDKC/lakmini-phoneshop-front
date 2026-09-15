import React, { useMemo, useState } from 'react'
import {
  Smartphone,
  Plus,
  Search,
  Edit,
  Trash2,
  Layers,
  X,
  Tag
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@renderer/components/PageHeader'
import { DataTable, Column } from '@renderer/components/DataTable'
import { Modal } from '@renderer/components/Modal'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { useToast } from '@renderer/components/ToastProvider'
import { phoneApi } from '@renderer/api/phone'

interface PhoneModel {
  id?: string
  model: string
}

export const PhoneModels: React.FC = () => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [showFormModal, setShowFormModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')
  const [modelName, setModelName] = useState('')
  const [search, setSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [models, setModels] = useState<PhoneModel[]>([])
  const [removedModelIds, setRemovedModelIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; model: string } | null>(null)
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<{
    brand: string
    modelIds: string[]
  } | null>(null)

  const { data: list, isLoading } = useQuery({
    queryKey: ['phones', search],
    queryFn: () => phoneApi.listPhone({ search: search || undefined, all: true })
  })

  const groupedList = useMemo(() => {
    const rows = list?.phoneList ?? list?.data ?? []
    const map = new Map<string, { brand: string; models: { id: string; model: string }[] }>()

    for (const row of rows) {
      if (!map.has(row.brand)) {
        map.set(row.brand, { brand: row.brand, models: [] })
      }
      map.get(row.brand)!.models.push({ id: row.id, model: row.model })
    }

    return Array.from(map.values())
  }, [list])

  const clearForm = () => {
    setShowFormModal(false)
    setEditingBrand(null)
    setBrandName('')
    setModelName('')
    setModels([])
    setRemovedModelIds([])
    setIsSubmitting(false)
  }

  const addModel = () => {
    const trimmed = modelName.trim()
    if (!trimmed) return
    if (!models.some(m => m.model.toLowerCase() === trimmed.toLowerCase())) {
      setModels(prev => [...prev, { model: trimmed }])
      setModelName('')
    } else {
      showToast('warning', 'Model already exists in this brand')
    }
  }

  const removeModel = (index: number) => {
    const target = models[index]
    if (target.id) {
      setRemovedModelIds(prev => [...prev, target.id!])
    }
    setModels(prev => prev.filter((_, i) => i !== index))
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => phoneApi.updatePhone(editingBrand!, data),
    onSuccess: () => {
      showToast('success', 'Phone brand & models updated')
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      clearForm()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to update phone brand')
      setIsSubmitting(false)
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => phoneApi.createPhone(data),
    onSuccess: () => {
      showToast('success', 'Phone brand & models registered')
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      clearForm()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to create phone brand')
      setIsSubmitting(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => phoneApi.deleteModel(id),
    onSuccess: () => {
      showToast('success', 'Phone model deleted')
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to delete model')
    }
  })

  const deleteBrandMutation = useMutation({
    mutationFn: (brand: string) => phoneApi.deleteBrand(brand),
    onSuccess: () => {
      showToast('success', 'Phone brand deleted')
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      setDeleteBrandTarget(null)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to delete brand')
    }
  })

  const handleEdit = (item: { brand: string; models: { id: string; model: string }[] }) => {
    setEditingBrand(item.brand)
    setBrandName(item.brand)
    setModels(item.models.map(m => ({ id: m.id, model: m.model })))
    setRemovedModelIds([])
    setShowFormModal(true)
  }

  const handleSave = async () => {
    console.log(brandName);
    
    if (!brandName.trim() || models.length === 0) return
    setIsSubmitting(true)
    if (editingBrand) {
      updateMutation.mutate({ brandName, models, removedModelIds })
    } else {
      createMutation.mutate({ brandName, models: models.map(m => m.model) })
    }
  }

  const columns: Column<any>[] = [
    {
      header: 'Brand',
      accessorKey: 'brand',
      cell: ({ value }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center font-bold text-xs">
            <Smartphone size={16} />
          </div>
          <span className="font-bold text-white text-sm">{value}</span>
        </div>
      )
    },
    {
      header: 'Registered Phone Models',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1.5 py-1">
          {row.models.map((model: any) => (
            <span
              key={model.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-white"
            >
              <span>{model.model}</span>
              <button
                type="button"
                onClick={() => setDeleteTarget(model)}
                className="text-[var(--color-text-muted)] hover:text-red-400 ml-0.5"
                title={`Delete ${model.model}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleEdit(row)}
            className="px-2.5 py-1 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-accent)] font-medium text-xs transition-colors flex items-center gap-1"
            title="Edit Brand & Models"
          >
            <Edit size={13} />
            <span>Edit</span>
          </button>
          <button
            onClick={() =>
              setDeleteBrandTarget({
                brand: row.brand,
                modelIds: row.models.map((m: any) => m.id)
              })
            }
            className="p-1.5 rounded hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
            title={`Delete ${row.brand} and all models`}
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
        title="Phone Brands & Models"
        subtitle="Catalog phone manufacturers and their compatible device models for repairs and parts inventory"
        action={
          <button
            onClick={() => {
              clearForm()
              setShowFormModal(true)
            }}
           className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} />
            <span>New Phone Brand</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search brands or device models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <DataTable
        data={groupedList}
        emptyMessage="No phone brands registered yet. Click 'New Phone Brand' to add."
        isLoading={isLoading}
        columns={columns}
      />

      {/* CREATE / EDIT PHONE MODAL */}
      <Modal
        isOpen={showFormModal}
        marginTop="0"
        title={editingBrand ? `Edit Phone Brand — ${editingBrand}` : 'Register New Phone Brand'}
        onClose={clearForm}
        size="md"
      >
        <div className="space-y-4">
          {/* Brand Name Card */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] border-b border-[var(--color-border)] pb-2">
              <Smartphone size={14} />
              <span>Manufacturer / Brand</span>
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Brand Name *
              </label>
              <input
                autoFocus
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Apple, Samsung, Xiaomi, Google..."
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Models Builder Card */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                <Tag size={14} />
                <span>Models in this Brand ({models.length})</span>
              </div>
            </div>

            {models.length === 0 ? (
              <div className="text-xs text-[var(--color-text-muted)] text-center py-5 border border-dashed border-[var(--color-border)] rounded-lg">
                No models added yet. Add at least one model below.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] max-h-48 overflow-y-auto custom-scrollbar">
                {models.map((model, i) => (
                  <span
                    key={model.id ?? i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-white"
                  >
                    <span>{model.model}</span>
                    <button
                      type="button"
                      onClick={() => removeModel(i)}
                      className="text-[var(--color-text-muted)] hover:text-red-400 ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Model Input */}
            <div className="p-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] space-y-2">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                Add Model Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addModel()
                    }
                  }}
                  placeholder="e.g. Galaxy S24 Ultra / iPhone 15 Pro..."
                  className="flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addModel}
                  disabled={!modelName.trim()}
                  className="px-3 py-1.5 bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-white text-xs font-medium rounded-md border border-[var(--color-border)] transition-colors disabled:opacity-50"
                >
                  + Add Model
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={clearForm}
             className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!brandName.trim() || models.length === 0 || isSubmitting}
             className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              {isSubmitting
                ? 'Saving...'
                : editingBrand
                ? 'Update Brand'
                : `Save Brand (${models.length} models)`}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        title="Delete Phone Model"
        message={`Are you sure you want to delete "${deleteTarget?.model}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
        isDestructive
      />

      <ConfirmDialog
        isOpen={!!deleteBrandTarget}
        onClose={() => setDeleteBrandTarget(null)}
        onConfirm={() => { 
          if (deleteBrandTarget) deleteBrandMutation.mutate(deleteBrandTarget.brand)
        }}
        title="Delete Phone Brand"
        message={`Are you sure you want to delete "${deleteBrandTarget?.brand}" and all ${deleteBrandTarget?.modelIds.length} associated models? This cannot be undone.`}
        isLoading={deleteBrandMutation.isPending}
        isDestructive
      />
    </div>
  )
}