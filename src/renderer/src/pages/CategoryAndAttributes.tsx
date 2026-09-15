import React, { useState } from 'react'
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  ChevronRight,
  X,
  AlertTriangle,
  Sliders
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@renderer/components/PageHeader'
import { DataTable, Column } from '@renderer/components/DataTable'
import { Modal } from '@renderer/components/Modal'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { MessageDialog } from '@renderer/components/MessageDialog'
import { useToast } from '@renderer/components/ToastProvider'
import { categoryApi } from '@renderer/api/category'

type InputType = 'DROPDOWN' | 'TEXT' | 'NUMBER' | 'LINKED_LIST'

interface AttributeDef {
  name: string
  inputType: InputType
  options: string[]
  dependsOnName?: string
  dependsOnValue?: string
}

export const CategoryAndAttributes: React.FC = () => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [showFormModal, setShowFormModal] = useState(false)
  const [editingId, setEditingId] = useState<string>('')
  const [categoryName, setCategoryName] = useState('')
  const [attributes, setAttributes] = useState<AttributeDef[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)

  // Current attribute being composed
  const [attrName, setAttrName] = useState('')
  const [attrType, setAttrType] = useState<InputType>('DROPDOWN')
  const [pendingOptions, setPendingOptions] = useState<string[]>([])
  const [optionInput, setOptionInput] = useState('')

  const [deletingId, setDeletingId] = useState<string>('')
  const [messageDialog, setMessageDialog] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
  } | null>(null)

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['categories', search, page, limit],
    queryFn: () => categoryApi.listCategory({ search: search || undefined, page, limit })
  })

  const categories = responseData?.data ?? []
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

  const createCategoryMutation = useMutation({
    mutationFn: () => categoryApi.createCategory({categoryName, attributes}),
    onSuccess: () => {
      showToast('success', 'Category created successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      clearFields()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to create category')
    }
  })

  const updateCategoryMutation = useMutation({
    mutationFn: () => categoryApi.updateCategory(editingId, {categoryName, attributes}),
    onSuccess: () => {
      showToast('success', 'Category updated successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      clearFields()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to update category')
    }
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: () => categoryApi.deleteCategory(deletingId),
    onSuccess: () => {
      showToast('success', 'Category deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeletingId('')
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to delete category')
    }
  })

  const addOption = () => {
    const trimmed = optionInput.trim()
    if (trimmed && !pendingOptions.includes(trimmed)) {
      setPendingOptions(prev => [...prev, trimmed])
      setOptionInput('')
    }
  }

  const removeOption = (idx: number) => {
    setPendingOptions(prev => prev.filter((_, i) => i !== idx))
  }

  const addAttribute = () => {
    if (!attrName.trim()) return
    const newAttr: AttributeDef = {
      name: attrName.trim(),
      inputType: attrType,
      options: attrType === 'DROPDOWN' ? pendingOptions : []
    }
    setAttributes(prev => [...prev, newAttr])
    setAttrName('')
    setAttrType('DROPDOWN')
    setPendingOptions([])
    setOptionInput('')
  }

  const removeAttribute = (idx: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== idx))
  }

  const clearFields = () => {
    setShowFormModal(false)
    setEditingId('')
    setCategoryName('')
    setAttributes([])
    setAttrName('')
    setPendingOptions([])
    setOptionInput('')
  }

  const handleEdit = (cat: any) => {
    setEditingId(cat.id)
    setCategoryName(cat.name)
    setAttributes(
      cat.attributes.map((a: any) => ({
        name: a.name,
        inputType: a.inputType,
        options: a.options || []
      }))
    )
    setShowFormModal(true)
  }

  const handleSave = () => {
    if (!categoryName.trim()) return
    if (editingId) {
      updateCategoryMutation.mutate()
    } else {
      createCategoryMutation.mutate()
    }
  }

  const isSubmitting = createCategoryMutation.isPending || updateCategoryMutation.isPending

  const columns: Column<any>[] = [
    {
      header: 'Category Name',
      accessorKey: 'name',
      cell: ({ value }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center font-bold text-xs">
            <Layers size={16} />
          </div>
          <span className="font-semibold text-white text-sm">{value}</span>
        </div>
      )
    },
    {
      header: 'Custom Attributes & Form Fields',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1.5 py-1">
          {row.attributes && row.attributes.length > 0 ? (
            row.attributes.map((attr: any) => (
              <span
                key={attr.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
              >
                <span className="font-semibold text-white">{attr.name}</span>
                {attr.inputType === 'DROPDOWN' && attr.options?.length > 0 ? (
                  <span className="text-[var(--color-text-muted)]">({attr.options.length} options)</span>
                ) : (
                  <span className="text-[var(--color-text-muted)] text-[11px] italic">({attr.inputType.toLowerCase()})</span>
                )}
              </span>
            ))
          ) : (
            <span className="text-xs text-[var(--color-text-muted)] italic">No attributes (Simple Category)</span>
          )}
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
            title="Edit Category"
          >
            <Edit size={13} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setDeletingId(row.id)}
            className="p-1.5 rounded hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
            title="Delete Category"
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
        title="Item Categories & Form Attributes"
        subtitle="Define custom category specifications and attributes for dynamic inventory purchasing"
        action={
          <button
            onClick={() => {
              clearFields()
              setShowFormModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} />
            <span>New Category</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search categories by name..."
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
        data={categories}
        isLoading={isLoading}
        pagination={pagination}
        emptyMessage="No categories created yet. Click 'New Category' to add one."
      />

      {/* CREATE / EDIT CATEGORY MODAL */}
      <Modal
        isOpen={showFormModal}
        onClose={clearFields}
        title={editingId ? 'Edit Category & Attributes' : 'Create New Category'}
        size="lg"
        marginTop="0"
      >
        <div className="space-y-4">
          {/* Category Details Card */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] border-b border-[var(--color-border)] pb-2">
              <Layers size={14} />
              <span>Category Information</span>
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Category Name *
              </label>
              <input
                autoFocus
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Phone Displays, Battery, Screen Protectors..."
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Attributes List & Builder Card */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                <Tag size={14} />
                <span>Defined Attributes ({attributes.length})</span>
              </div>
            </div>

            {attributes.length === 0 ? (
              <div className="text-xs text-[var(--color-text-muted)] text-center py-5 border border-dashed border-[var(--color-border)] rounded-lg">
                No attributes added yet. Configure at least one attribute below so products can be categorized.
              </div>
            ) : (
              <div className="space-y-2">
                {attributes.map((attr, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{attr.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {attr.inputType === 'DROPDOWN'
                          ? `Dropdown (${attr.options.join(', ')})`
                          : attr.inputType === 'TEXT'
                          ? 'Free text input'
                          : attr.inputType === 'NUMBER'
                          ? 'Numeric input'
                          : 'Linked list (Brands & Models)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttribute(i)}
                      className="text-xs font-medium text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Attribute Builder */}
            <div className="p-3.5 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] space-y-3">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sliders size={13} className="text-[var(--color-accent)]" />
                <span>Add Attribute Field</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                    Attribute Name *
                  </label>
                  <input
                    type="text"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    placeholder="e.g. Quality Grade, Model Compatibility..."
                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                    Field Input Type *
                  </label>
                  <select
                    value={attrType}
                    onChange={(e) => setAttrType(e.target.value as InputType)}
                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="DROPDOWN">Dropdown (Choose from presets)</option>
                    <option value="LINKED_LIST">Linked List (Phone Brands & Models)</option>
                    <option value="TEXT">Free Text Field</option>
                    <option value="NUMBER">Number Field</option>
                  </select>
                </div>
              </div>

              {attrType === 'DROPDOWN' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                    Dropdown Options
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addOption()
                        }
                      }}
                      placeholder="Type option (e.g. Original / OLED / Incell) and press Add..."
                      className="flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      className="px-3 py-1.5 bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-white text-xs font-medium rounded-md border border-[var(--color-border)] transition-colors"
                    >
                      + Add Option
                    </button>
                  </div>

                  {pendingOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pendingOptions.map((opt, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-white"
                        >
                          {opt}
                          <button
                            type="button"
                            onClick={() => removeOption(i)}
                            className="hover:text-red-400 ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={addAttribute}
                  disabled={!attrName.trim() || (attrType === 'DROPDOWN' && pendingOptions.length === 0)}
                  className="px-3 py-1.5 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-accent)] font-semibold text-xs border border-[var(--color-border)] transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Attach Attribute to Category</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={clearFields}
             className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!categoryName.trim() || isSubmitting}
             className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              {isSubmitting
                ? 'Saving...'
                : editingId
                ? 'Update Category'
                : attributes.length > 0
                ? `Save Category (${attributes.length} fields)`
                : 'Save Category'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        message="Are you sure you want to delete this category? Items under this category may be affected."
        onConfirm={() => deleteCategoryMutation.mutate()}
        title="Delete Category"
        isLoading={deleteCategoryMutation.isPending}
        onClose={() => setDeletingId('')}
      />
    </div>
  )
}