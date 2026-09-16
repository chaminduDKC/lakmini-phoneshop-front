import React, { useState, useMemo, useEffect } from 'react'
import { Plus, ShoppingCart, Search, Eye, Filter, RefreshCw, CheckCircle, AlertCircle, Building2, Smartphone, DollarSign, Package, Edit, Trash2, Layers, X, Sliders, Tag } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@renderer/components/PageHeader'
import { Modal } from '@renderer/components/Modal'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'
import { DataTable, Column } from '@renderer/components/DataTable'
import { useToast } from '@renderer/components/ToastProvider'
import { categoryApi } from '@renderer/api/category'
import { phoneApi } from '@renderer/api/phone'
import { supplierApi, Supplier } from '@renderer/api/supplier'
import { purchaseApi, Purchase, CreatePurchasePayload, UpdatePurchasePayload } from '@renderer/api/purchase'

interface CategoryAttribute {
  id: string
  categoryId: string
  name: string
  inputType: 'DROPDOWN' | 'TEXT' | 'NUMBER' | 'LINKED_LIST'
  options?: string[] | null
  linkedTable?: string | null
  sortOrder: number
}

interface CategoryItem {
  id: string
  name: string
  attributes: CategoryAttribute[]
}

interface PhoneModelItem {
  id: string
  brand: string
  model: string
}

export const PurchasesPage: React.FC = () => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // State for Purchase Modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<Purchase | null>(null)
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null)

  // Quick Custom Category Form State
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatAttributes, setNewCatAttributes] = useState<
    { name: string; inputType: 'DROPDOWN' | 'TEXT' | 'NUMBER' | 'LINKED_LIST'; options?: string[] }[]
  >([])
  const [showAttrBuilder, setShowAttrBuilder] = useState(false)
  const [newAttrName, setNewAttrName] = useState('')
  const [newAttrType, setNewAttrType] = useState<'DROPDOWN' | 'TEXT' | 'NUMBER' | 'LINKED_LIST'>('DROPDOWN')
  const [newPendingOptions, setNewPendingOptions] = useState<string[]>([])
  const [newOptionInput, setNewOptionInput] = useState('')
  const [newCatError, setNewCatError] = useState('')

  // Edit Purchase State
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [editSupplierId, setEditSupplierId] = useState('')
  const [editItemName, setEditItemName] = useState('')
  const [editBuyingPrice, setEditBuyingPrice] = useState('')
  const [editSellingPrice, setEditSellingPrice] = useState('')
  const [editQuantity, setEditQuantity] = useState('1')
  const [editNotes, setEditNotes] = useState('')
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({})

  // Filters
  const [search, setSearch] = useState('')
  const [filterSupplierId, setFilterSupplierId] = useState('')

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  // Linked list brand/model state mapped per attribute name
  const [linkedBrandSelections, setLinkedBrandSelections] = useState<Record<string, string>>({})
  const [linkedModelSelections, setLinkedModelSelections] = useState<Record<string, string>>({})
  
  const [itemName, setItemName] = useState('')
  const [isCustomItemName, setIsCustomItemName] = useState(false)
  const [buyingPrice, setBuyingPrice] = useState<string>('')
  const [sellingPrice, setSellingPrice] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('1')
  const [notes, setNotes] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Quick New Supplier Form State
  const [newSupName, setNewSupName] = useState('')
  const [newSupPhone, setNewSupPhone] = useState('')
  const [newSupEmail, setNewSupEmail] = useState('')
  const [newSupAddress, setNewSupAddress] = useState('')

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)

  // Queries
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryApi.listCategory({ all: true })
  })
  const categories: CategoryItem[] = categoriesData?.data ?? []

  const { data: suppliersData, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.listSuppliers({ all: true })
  })
  const suppliers: Supplier[] = suppliersData?.data ?? []

  const { data: phonesData, isLoading: isLoadingPhones } = useQuery({
    queryKey: ['phones-all'],
    queryFn: () => phoneApi.listPhone({ all: true })
  })

  const { data: responseData, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['purchases', search, filterSupplierId, page, limit],
    queryFn: () =>
      purchaseApi.listPurchases({
        search: search || undefined,
        supplierId: filterSupplierId || undefined,
        page,
        limit
      })
  })

  const purchases = responseData?.data ?? []
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

  // Group phone list by brand
  const phoneBrandMap = useMemo(() => {
    const list: PhoneModelItem[] = phonesData?.phoneList ?? []
    const map = new Map<string, string[]>()
    for (const item of list) {
      if (!map.has(item.brand)) {
        map.set(item.brand, [])
      }
      if (!map.get(item.brand)!.includes(item.model)) {
        map.get(item.brand)!.push(item.model)
      }
    }
    return map
  }, [phonesData])

  const availableBrands = useMemo(() => {
    return Array.from(phoneBrandMap.keys()).sort()
  }, [phoneBrandMap])

  // Current selected category object
  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId)
  }, [categories, selectedCategoryId])

  // Automatically construct generated item name when category or attributes change
  const generatedItemName = useMemo(() => {
    if (!currentCategory) return ''
    const parts: string[] = [currentCategory.name]

    if (currentCategory.attributes) {
      const sortedAttrs = [...currentCategory.attributes].sort((a, b) => a.sortOrder - b.sortOrder)
      for (const attr of sortedAttrs) {
        if (attr.inputType === 'LINKED_LIST') {
          const brand = linkedBrandSelections[attr.name]
          const model = linkedModelSelections[attr.name]
          if (brand && model) {
            parts.push(`${brand} ${model}`)
          } else if (brand) {
            parts.push(brand)
          }
        } else {
          const val = selectedAttributes[attr.name]
          if (val && val.trim()) {
            parts.push(val.trim())
          }
        }
      }
    }

    return parts.join(' - ')
  }, [currentCategory, selectedAttributes, linkedBrandSelections, linkedModelSelections])

  // Keep itemName in sync with auto-generated name unless user manually modified it
  useEffect(() => {
    if (!isCustomItemName) {
      setItemName(generatedItemName)
    }
  }, [generatedItemName, isCustomItemName])

  // Reset category attributes when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId)
    setSelectedAttributes({})
    setLinkedBrandSelections({})
    setLinkedModelSelections({})
    setIsCustomItemName(false)
  }

  // Handle standard attribute change
  const handleAttributeChange = (attrName: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attrName]: value
    }))
  }

  // Handle linked list brand change
  const handleLinkedBrandChange = (attrName: string, brand: string) => {
    setLinkedBrandSelections((prev) => ({
      ...prev,
      [attrName]: brand
    }))
    // Reset selected model for this attribute
    setLinkedModelSelections((prev) => {
      const updated = { ...prev }
      delete updated[attrName]
      return updated
    })
    // Update attribute JSON record
    setSelectedAttributes((prev) => ({
      ...prev,
      [`${attrName}_Brand`]: brand,
      [`${attrName}_Model`]: ''
    }))
  }

  // Handle linked list model change
  const handleLinkedModelChange = (attrName: string, model: string) => {
    setLinkedModelSelections((prev) => ({
      ...prev,
      [attrName]: model
    }))
    const brand = linkedBrandSelections[attrName] || ''
    setSelectedAttributes((prev) => ({
      ...prev,
      [attrName]: `${brand} ${model}`.trim(),
      [`${attrName}_Brand`]: brand,
      [`${attrName}_Model`]: model
    }))
  }

  // Clear purchase form
  const resetForm = () => {
    setSelectedSupplierId('')
    setSelectedCategoryId('')
    setSelectedAttributes({})
    setLinkedBrandSelections({})
    setLinkedModelSelections({})
    setItemName('')
    setIsCustomItemName(false)
    setBuyingPrice('')
    setSellingPrice('')
    setQuantity('1')
    setNotes('')
    setFormErrors({})
  }

  // Mutations
  const createPurchaseMutation = useMutation({
    mutationFn: (payload: CreatePurchasePayload) => purchaseApi.createPurchase(payload),
    onSuccess: (res) => {
      showToast(res.message || 'Purchase recorded successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['ledger'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setShowPurchaseModal(false)
      resetForm()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to record purchase'
      showToast(msg, 'error')
    }
  })

  const createSupplierMutation = useMutation({
    mutationFn: (data: { name: string; phone?: string; email?: string; address?: string }) =>
      supplierApi.createSupplier(data),
    onSuccess: (res) => {
      showToast('Supplier added successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers-all'] })
      setSelectedSupplierId(res.supplier.id)
      setShowSupplierModal(false)
      setNewSupName('')
      setNewSupPhone('')
      setNewSupEmail('')
      setNewSupAddress('')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to add supplier'
      showToast(msg, 'error')
    }
  })

  const createCategoryMutation = useMutation({
    mutationFn: (data: { categoryName: string; attributes: any[] }) =>
      categoryApi.createCategory(data),
    onSuccess: (res) => {
      showToast(res.message || 'Category created successfully', 'success')
      queryClient.setQueryData(['categories-all'], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: [...old.data, res.category]
        }
      })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories-all'] })
      handleCategoryChange(res.category.id)
      setShowCategoryModal(false)
      setNewCatName('')
      setNewCatAttributes([])
      setShowAttrBuilder(false)
      setNewAttrName('')
      setNewAttrType('DROPDOWN')
      setNewPendingOptions([])
      setNewOptionInput('')
      setNewCatError('')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create category'
      showToast(msg, 'error')
    }
  })

  const handleAddNewCatOption = () => {
    const trimmed = newOptionInput.trim()
    if (trimmed && !newPendingOptions.includes(trimmed)) {
      setNewPendingOptions((prev) => [...prev, trimmed])
      setNewOptionInput('')
    }
  }

  const handleRemoveNewCatOption = (idx: number) => {
    setNewPendingOptions((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleAddNewCatAttribute = () => {
    if (!newAttrName.trim()) return
    setNewCatAttributes((prev) => [
      ...prev,
      {
        name: newAttrName.trim(),
        inputType: newAttrType,
        options: newAttrType === 'DROPDOWN' ? newPendingOptions : undefined
      }
    ])
    setNewAttrName('')
    setNewAttrType('DROPDOWN')
    setNewPendingOptions([])
    setNewOptionInput('')
  }

  const handleRemoveNewCatAttribute = (idx: number) => {
    setNewCatAttributes((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSaveCustomCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) {
      setNewCatError('Category name is required')
      return
    }
    setNewCatError('')
    createCategoryMutation.mutate({
      categoryName: newCatName.trim(),
      attributes: newCatAttributes
    })
  }

  const updatePurchaseMutation = useMutation({
    mutationFn: (data: { id: string; payload: UpdatePurchasePayload }) =>
      purchaseApi.updatePurchase(data.id, data.payload),
    onSuccess: (res) => {
      showToast(res.message || 'Purchase updated successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['ledger'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setEditingPurchase(null)
      if (selectedPurchaseDetails?.id === res.data.id) {
        setSelectedPurchaseDetails(res.data)
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update purchase'
      showToast(msg, 'error')
    }
  })

  const deletePurchaseMutation = useMutation({
    mutationFn: (id: string) => purchaseApi.deletePurchase(id),
    onSuccess: (res) => {
      showToast(res.message || 'Purchase deleted successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['ledger'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setPurchaseToDelete(null)
      if (selectedPurchaseDetails?.id === purchaseToDelete?.id) {
        setSelectedPurchaseDetails(null)
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete purchase'
      showToast(msg, 'error')
    }
  })

  const handleOpenEdit = (p: Purchase) => {
    const firstItem = p.items?.[0]
    setEditingPurchase(p)
    setEditSupplierId(p.supplierId || '')
    setEditItemName(firstItem?.item?.name || '')
    setEditBuyingPrice(String(firstItem?.costPrice || ''))
    setEditSellingPrice(String(firstItem?.sellingPrice || ''))
    setEditQuantity(String(firstItem?.quantity || '1'))
    setEditNotes(p.notes || '')
    setEditFormErrors({})
  }

  const handleUpdatePurchase = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPurchase) return
    const errors: Record<string, string> = {}
    const bPrice = parseFloat(editBuyingPrice)
    const sPrice = parseFloat(editSellingPrice)
    const qty = parseInt(editQuantity, 10)

    if (isNaN(bPrice) || bPrice < 0) errors.buyingPrice = 'Valid buying price required'
    if (isNaN(sPrice) || sPrice < 0) errors.sellingPrice = 'Valid selling price required'
    if (isNaN(qty) || qty < 1) errors.quantity = 'Quantity must be at least 1'

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors)
      return
    }

    updatePurchaseMutation.mutate({
      id: editingPurchase.id,
      payload: {
        supplierId: editSupplierId || undefined,
        itemName: editItemName.trim() || undefined,
        buyingPrice: bPrice,
        sellingPrice: sPrice,
        quantity: qty,
        notes: editNotes.trim() || undefined
      }
    })
  }

  // Submit Purchase
  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!selectedCategoryId) errors.categoryId = 'Please select a category'
    if (!itemName.trim()) errors.itemName = 'Item name is required'

    const bPrice = parseFloat(buyingPrice)
    const sPrice = parseFloat(sellingPrice)
    const qty = parseInt(quantity, 10)

    if (isNaN(bPrice) || bPrice < 0) errors.buyingPrice = 'Valid buying price is required'
    if (isNaN(sPrice) || sPrice < 0) errors.sellingPrice = 'Valid selling price is required'
    if (isNaN(qty) || qty < 1) errors.quantity = 'Quantity must be at least 1'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})

    // Build attributes JSON
    const finalAttributes: Record<string, any> = { ...selectedAttributes }
    if (currentCategory?.attributes) {
      for (const attr of currentCategory.attributes) {
        if (attr.inputType === 'LINKED_LIST') {
          finalAttributes[attr.name] = {
            brand: linkedBrandSelections[attr.name] || '',
            model: linkedModelSelections[attr.name] || ''
          }
        }
      }
    }

    const payload: CreatePurchasePayload = {
      supplierId: selectedSupplierId || undefined,
      categoryId: selectedCategoryId,
      itemName: itemName.trim(),
      attributes: finalAttributes,
      buyingPrice: bPrice,
      sellingPrice: sPrice,
      quantity: qty,
      notes: notes.trim() || undefined
    }

    createPurchaseMutation.mutate(payload)
  }

  // Calculation helpers
  const numBuyingPrice = parseFloat(buyingPrice) || 0
  const numSellingPrice = parseFloat(sellingPrice) || 0
  const numQuantity = parseInt(quantity, 10) || 0
  const totalPurchaseCost = numBuyingPrice * numQuantity
  const profitPerUnit = numSellingPrice - numBuyingPrice
  const profitMarginPercent =
    numSellingPrice > 0 ? ((profitPerUnit / numSellingPrice) * 100).toFixed(1) : '0'

  // Table Columns
  const columns: Column<Purchase>[] = [
    {
      header: 'Date',
      accessorFn: (row) => new Date(row.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      cell: ({ value }) => (
        <span className="text-xs text-[var(--color-text-secondary)] font-mono">{value}</span>
      )
    },
    {
      header: 'Supplier',
      accessorFn: (row) => row.supplier?.name || row.supplierName || 'Direct / Walk-in',
      cell: ({ value }) => (
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-[var(--color-text-muted)]" />
          <span className="font-medium text-white">{value}</span>
        </div>
      )
    },
    {
      header: 'Item Purchased',
      accessorFn: (row) => row.items?.[0]?.item?.name || 'Item',
      cell: ({ row }) => {
        const firstItem = row.items?.[0]
        if (!firstItem) return <span className="text-sm text-white">-</span>
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{firstItem.item.name}</span>
            <span className="text-xs text-[var(--color-accent)]">
              {firstItem.item.category?.name} • SKU: {firstItem.item.sku}
            </span>
          </div>
        )
      }
    },
    {
      header: 'Quantity',
      accessorFn: (row) => row.items?.[0]?.quantity || 0,
      cell: ({ value }) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {value} units
        </span>
      )
    },
    {
      header: 'Unit Cost',
      accessorFn: (row) => row.items?.[0]?.costPrice || 0,
      cell: ({ value }) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          Rs. {Number(value).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Total Cost',
      accessorFn: (row) => row.totalAmount,
      cell: ({ value }) => (
        <span className="text-sm font-bold text-white">
          Rs. {Number(value).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const isUsed = row.items?.some(
          (pi) =>
            ((pi.item as any)?._count?.sales ?? 0) > 0 ||
            ((pi.item as any)?._count?.partsUsed ?? 0) > 0
        )

        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedPurchaseDetails(row)}
              title="View Details"
              className="p-1.5 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-accent)] transition-colors flex items-center gap-1 text-xs font-medium px-2"
            >
              <Eye size={13} />
              <span>Details</span>
            </button>
            <button
               disabled={isUsed}
              onClick={() => handleOpenEdit(row)}
             title={
                isUsed
                  ? 'Cannot edit: purchased items have already been sold or used in repairs'
                  : 'Edit Purchase'
              }
              className="p-1.5 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] disabled:opacity-30 disabled:cursor-not-allowed text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-xs font-medium px-2 "
            >
              <Edit size={13} />
              <span>Editx</span>
            </button>
            <button
              onClick={() => setPurchaseToDelete(row)}
              disabled={isUsed}
              className="p-1.5 rounded bg-[var(--color-bg-primary)] hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-bg-primary)] disabled:hover:text-red-400 transition-colors flex items-center gap-1 text-xs font-medium px-2"
              title={
                isUsed
                  ? 'Cannot delete: purchased items have already been sold or used in repairs'
                  : 'Delete Purchase'
              }
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Purchases"
        subtitle="Record inventory purchases, configure attributes, and manage suppliers"
        action={
          <button
            onClick={() => {
              resetForm()
              setShowPurchaseModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} />
            <span>New Purchase</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search purchases by item, SKU, supplier, notes..."
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
              value={filterSupplierId}
              onChange={(e) => {
                setFilterSupplierId(e.target.value)
                setPage(1)
              }}
              className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Purchases Data Table */}
      <DataTable
        columns={columns}
        data={purchases}
        isLoading={isLoadingPurchases}
        pagination={pagination}
        emptyMessage="No purchase records found. Click 'New Purchase' to record your first inventory stock intake."
      />

      {/* NEW PURCHASE MODAL */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="Purchase Inventory Item"
        size="lg"
        marginTop="0"
      >
        <form onSubmit={handleSubmitPurchase} className="space-y-5">
          {/* Supplier Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                Supplier <span className="text-xs text-[var(--color-text-muted)]">(Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowSupplierModal(true)}
                className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 font-medium"
              >
                <Plus size={13} /> Add New Supplier
              </button>
            </div>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white"
            >
              <option value="">Select Supplier or Leave Empty for Walk-in</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.phone ? `(${s.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Category Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                Category <span className="text-amber-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewCatName('')
                  setNewCatAttributes([])
                  setShowAttrBuilder(false)
                  setNewAttrName('')
                  setNewAttrType('DROPDOWN')
                  setNewPendingOptions([])
                  setNewOptionInput('')
                  setNewCatError('')
                  setShowCategoryModal(true)
                }}
                className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 font-medium"
              >
                <Plus size={13} /> Add Custom Category
              </button>
            </div>
            <select
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={`w-full bg-[var(--color-bg-secondary)] border ${
                formErrors.categoryId ? 'border-red-500' : 'border-[var(--color-border)]'
              } focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white`}
            >
              <option value="">-- Choose Category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {formErrors.categoryId && (
              <span className="text-xs text-red-500 mt-1">{formErrors.categoryId}</span>
            )}
          </div>

          {/* Dynamic Attributes Section */}
          {currentCategory && currentCategory.attributes && currentCategory.attributes.length > 0 && (
            <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                <Smartphone size={15} />
                <span>{currentCategory.name} Attributes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCategory.attributes
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((attr) => {
                    if (attr.inputType === 'LINKED_LIST') {
                      const selectedBrand = linkedBrandSelections[attr.name] || ''
                      const selectedModel = linkedModelSelections[attr.name] || ''
                      const modelsForBrand = selectedBrand ? phoneBrandMap.get(selectedBrand) || [] : []

                      return (
                        <div key={attr.id} className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                          <div>
                            <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                              {attr.name} - Phone Brand
                            </label>
                            <select
                              value={selectedBrand}
                              onChange={(e) => handleLinkedBrandChange(attr.name, e.target.value)}
                              className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white"
                            >
                              <option value="">Select Phone Brand</option>
                              {availableBrands.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                              {attr.name} - Model
                            </label>
                            <select
                              value={selectedModel}
                              disabled={!selectedBrand}
                              onChange={(e) => handleLinkedModelChange(attr.name, e.target.value)}
                              className={`w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white ${
                                !selectedBrand ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="">
                                {selectedBrand ? 'Select Phone Model' : 'Select brand first'}
                              </option>
                              {modelsForBrand.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )
                    }

                    if (attr.inputType === 'DROPDOWN') {
                      const options = Array.isArray(attr.options) ? attr.options : []
                      return (
                        <div key={attr.id}>
                          <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                            {attr.name}
                          </label>
                          <select
                            value={selectedAttributes[attr.name] || ''}
                            onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white"
                          >
                            <option value="">Select {attr.name}</option>
                            {options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      )
                    }

                    return (
                      <div key={attr.id}>
                        <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                          {attr.name}
                        </label>
                        <input
                          type={attr.inputType === 'NUMBER' ? 'number' : 'text'}
                          value={selectedAttributes[attr.name] || ''}
                          onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                          placeholder={`Enter ${attr.name}`}
                          className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white"
                        />
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Item Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                Item Name <span className="text-amber-500">*</span>
              </label>
              {isCustomItemName && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomItemName(false)
                    setItemName(generatedItemName)
                  }}
                  className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Reset to Auto-generated
                </button>
              )}
            </div>
            <input
              type="text"
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value)
                setIsCustomItemName(true)
              }}
              placeholder="e.g. Back Cover - iPhone 15 Pro - Black Silicone"
              className={`w-full bg-[var(--color-bg-secondary)] border ${
                formErrors.itemName ? 'border-red-500' : 'border-[var(--color-border)]'
              } focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white`}
            />
            {formErrors.itemName && (
              <span className="text-xs text-red-500 mt-1">{formErrors.itemName}</span>
            )}
            {!isCustomItemName && generatedItemName && (
              <span className="text-xs text-emerald-400 mt-1 block">
                ✓ Auto-generated from selected category & attributes
              </span>
            )}
          </div>

          {/* Pricing & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-[var(--color-text-secondary)]">
                Buying Price (Rs.) <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={buyingPrice}
                onChange={(e) => setBuyingPrice(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-[var(--color-bg-secondary)] border ${
                  formErrors.buyingPrice ? 'border-red-500' : 'border-[var(--color-border)]'
                } focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white`}
              />
              {formErrors.buyingPrice && (
                <span className="text-xs text-red-500 mt-1">{formErrors.buyingPrice}</span>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-[var(--color-text-secondary)]">
                Selling Price (Rs.) <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-[var(--color-bg-secondary)] border ${
                  formErrors.sellingPrice ? 'border-red-500' : 'border-[var(--color-border)]'
                } focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white`}
              />
              {formErrors.sellingPrice && (
                <span className="text-xs text-red-500 mt-1">{formErrors.sellingPrice}</span>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-[var(--color-text-secondary)]">
                Quantity <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className={`w-full bg-[var(--color-bg-secondary)] border ${
                  formErrors.quantity ? 'border-red-500' : 'border-[var(--color-border)]'
                } focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white`}
              />
              {formErrors.quantity && (
                <span className="text-xs text-red-500 mt-1">{formErrors.quantity}</span>
              )}
            </div>
          </div>

          {/* Pricing Summary Card */}
          {numBuyingPrice > 0 && numQuantity > 0 && (
            <div className="p-3.5 rounded-lg bg-[rgba(245,158,11,0.06)] border border-amber-500/20 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[var(--color-text-secondary)]">Total Purchase Cost: </span>
                <span className="text-sm font-bold text-amber-400">
                  Rs. {totalPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {numSellingPrice > 0 && (
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[var(--color-text-secondary)]">Profit Margin: </span>
                    <span className={`font-semibold ${profitPerUnit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      Rs. {profitPerUnit.toLocaleString()} ({profitMarginPercent}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes (Optional) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-[var(--color-text-secondary)]">
              Notes <span className="text-xs text-[var(--color-text-muted)]">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Batch #2026-A, imported original quality, 6-month supplier warranty..."
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white custom-scrollbar"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setShowPurchaseModal(false)}
             className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPurchaseMutation.isPending}
             className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              {createPurchaseMutation.isPending ? 'Recording...' : 'Record Purchase'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK ADD SUPPLIER MODAL */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Add New Supplier"
        size="sm"
        marginTop="0"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!newSupName.trim()) {
              showToast('error', 'Supplier name is required')
              return
            }
            createSupplierMutation.mutate({
              name: newSupName.trim(),
              phone: newSupPhone.trim() || undefined,
              email: newSupEmail.trim() || undefined,
              address: newSupAddress.trim() || undefined
            })
          }}
          className="space-y-4"
        >
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Supplier / Business Name *
              </label>
              <input
                autoFocus
                type="text"
                value={newSupName}
                onChange={(e) => setNewSupName(e.target.value)}
                placeholder="e.g. Apex Mobile Wholesale"
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Phone Number
              </label>
              <input
                type="text"
                value={newSupPhone}
                onChange={(e) => setNewSupPhone(e.target.value)}
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
                value={newSupEmail}
                onChange={(e) => setNewSupEmail(e.target.value)}
                placeholder="e.g. info@apexwholesale.lk"
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Address
              </label>
              <textarea
                rows={2}
                value={newSupAddress}
                onChange={(e) => setNewSupAddress(e.target.value)}
                placeholder="e.g. 123 Main Street, Colombo 03"
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-xs text-white focus:outline-none custom-scrollbar"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setShowSupplierModal(false)}
              className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSupplierMutation.isPending}
              className="px-5 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              {createSupplierMutation.isPending ? 'Adding...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK ADD CUSTOM CATEGORY MODAL */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Add Custom Category"
        size="md"
        marginTop="0"
      >
        <form onSubmit={handleSaveCustomCategory} className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-4">
            <div>
              <label className="block mb-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                Category Name <span className="text-amber-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value)
                  if (newCatError) setNewCatError('')
                }}
                placeholder="e.g. Back Covers, Tempered Glass, Cables..."
                className={`w-full bg-[var(--color-bg-secondary)] border ${
                  newCatError ? 'border-red-500' : 'border-[var(--color-border)]'
                } focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none`}
              />
              {newCatError && (
                <span className="text-xs text-red-500 mt-1 block">{newCatError}</span>
              )}
            </div>

            {/* Optional Attributes Section */}
            <div className="pt-2 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase flex items-center gap-1.5">
                    <Sliders size={14} className="text-[var(--color-accent)]" />
                    Custom Attributes <span className="text-xs font-normal text-[var(--color-text-muted)]">(Optional)</span>
                  </span>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Define custom specs (e.g. Brand, Color, Capacity) for items in this category.
                  </p>
                </div>
                {!showAttrBuilder && (
                  <button
                    type="button"
                    onClick={() => setShowAttrBuilder(true)}
                    className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus size={13} /> Add Attribute
                  </button>
                )}
              </div>

              {/* Added Attributes List */}
              {newCatAttributes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {newCatAttributes.map((attr, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-white"
                    >
                      <Tag size={12} className="text-[var(--color-accent)]" />
                      <span>{attr.name}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        ({attr.inputType === 'LINKED_LIST' ? 'Phone Model' : attr.inputType.toLowerCase()})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewCatAttribute(idx)}
                        className="text-red-400 hover:text-red-300 ml-1"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Attribute Builder Form */}
              {showAttrBuilder && (
                <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--color-accent)]">
                      New Attribute Field
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAttrBuilder(false)}
                      className="text-xs text-[var(--color-text-muted)] hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
                        Attribute Name
                      </label>
                      <input
                        type="text"
                        value={newAttrName}
                        onChange={(e) => setNewAttrName(e.target.value)}
                        placeholder="e.g. Color, Wattage, Type"
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
                        Field Type
                      </label>
                      <select
                        value={newAttrType}
                        onChange={(e) => setNewAttrType(e.target.value as any)}
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="DROPDOWN">Dropdown List</option>
                        <option value="TEXT">Free Text</option>
                        <option value="NUMBER">Number</option>
                        <option value="LINKED_LIST">Linked to Phone Model</option>
                      </select>
                    </div>
                  </div>

                  {newAttrType === 'DROPDOWN' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-medium text-[var(--color-text-secondary)]">
                        Dropdown Options
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOptionInput}
                          onChange={(e) => setNewOptionInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddNewCatOption()
                            }
                          }}
                          placeholder="Type option & press Enter"
                          className="flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewCatOption}
                          className="px-2.5 py-1.5 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-xs text-[var(--color-accent)] font-medium"
                        >
                          + Add
                        </button>
                      </div>
                      {newPendingOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {newPendingOptions.map((opt, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-white"
                            >
                              <span>{opt}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveNewCatOption(i)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {newAttrType === 'LINKED_LIST' && (
                    <p className="text-[11px] text-[var(--color-text-muted)] italic">
                      Will automatically show Phone Brand & Phone Model selection dropdowns during purchase.
                    </p>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={!newAttrName.trim()}
                      onClick={handleAddNewCatAttribute}
                      className="px-3 py-1 rounded bg-[var(--color-accent)] hover:bg-amber-400 text-black font-semibold text-xs transition-colors disabled:opacity-50"
                    >
                      Add This Attribute
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCategoryMutation.isPending}
              className="px-5 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <Layers size={14} />
              <span>{createCategoryMutation.isPending ? 'Saving...' : 'Save Category'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW PURCHASE DETAILS MODAL */}
      <Modal
        isOpen={!!selectedPurchaseDetails}
        onClose={() => setSelectedPurchaseDetails(null)}
        title="Purchase Receipt Details"
        size="md"
        marginTop="0"
      >
        {selectedPurchaseDetails && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]">
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">Date & Time</span>
                <span className="font-semibold text-white">
                  {new Date(selectedPurchaseDetails.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">Supplier</span>
                <span className="font-semibold text-white">
                  {selectedPurchaseDetails.supplier?.name || selectedPurchaseDetails.supplierName || 'Walk-in'}
                </span>
              </div>
            </div>

            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-[var(--color-bg-secondary)] font-semibold text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                Purchased Item
              </div>
              <div className="p-4 space-y-2">
                {selectedPurchaseDetails.items.map((pi) => (
                  <div key={pi.id} className="space-y-1">
                    <div className="font-semibold text-white">{pi.item.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      SKU: <span className="font-mono text-white">{pi.item.sku}</span> | Category: {pi.item.category.name}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                      <div className="p-2 rounded bg-[var(--color-bg-primary)]">
                        <span className="text-[var(--color-text-muted)] block">Quantity</span>
                        <span className="font-semibold text-white">{pi.quantity} units</span>
                      </div>
                      <div className="p-2 rounded bg-[var(--color-bg-primary)]">
                        <span className="text-[var(--color-text-muted)] block">Unit Cost</span>
                        <span className="font-semibold text-white">Rs. {Number(pi.costPrice).toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded bg-[var(--color-bg-primary)]">
                        <span className="text-[var(--color-text-muted)] block">Selling Price</span>
                        <span className="font-semibold text-white">Rs. {Number(pi.sellingPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg flex justify-between items-center">
              <span className="font-medium text-white">Total Amount Paid:</span>
              <span className="text-lg font-bold text-[var(--color-accent)]">
                Rs. {Number(selectedPurchaseDetails.totalAmount).toLocaleString()}
              </span>
            </div>

            {selectedPurchaseDetails.notes && (
              <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)] block mb-1">Notes:</span>
                <p className="text-xs text-[var(--color-text-secondary)]">{selectedPurchaseDetails.notes}</p>
              </div>
            )}

            {/* Actions in Details Modal */}
            <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border)]">
              
                <button
                  type="button"
                  onClick={() => setSelectedPurchaseDetails(null)}
                  className="px-4 py-1.5 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium transition-colors"
                >
                  Close
                </button>
              
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT PURCHASE MODAL */}
      <Modal
        isOpen={!!editingPurchase}
        onClose={() => setEditingPurchase(null)}
        title="Edit Purchase Record"
        size="md"
        marginTop="0"
      >
        {editingPurchase && (
          <form onSubmit={handleUpdatePurchase} className="space-y-4 text-sm">
            {/* Supplier Section */}
            <div>
              <label className="block mb-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                Supplier
              </label>
              <select
                value={editSupplierId}
                onChange={(e) => setEditSupplierId(e.target.value)}
                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Walk-in / Direct Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Name */}
            <div>
              <label className="block mb-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                Item Name
              </label>
              <input
                type="text"
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-lg px-3 py-2 text-sm text-white"
                placeholder="Product name"
              />
            </div>

            {/* Price & Quantity Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                  Buying Price *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editBuyingPrice}
                  onChange={(e) => setEditBuyingPrice(e.target.value)}
                  className={`w-full bg-[var(--color-bg-primary)] border ${
                    editFormErrors.buyingPrice ? 'border-red-500' : 'border-[var(--color-border)]'
                  } focus:border-[var(--color-accent)] rounded-lg px-3 py-2 text-sm text-white`}
                  placeholder="0.00"
                />
                {editFormErrors.buyingPrice && (
                  <span className="text-[11px] text-red-500 mt-0.5 block">{editFormErrors.buyingPrice}</span>
                )}
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                  Selling Price *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editSellingPrice}
                  onChange={(e) => setEditSellingPrice(e.target.value)}
                  className={`w-full bg-[var(--color-bg-primary)] border ${
                    editFormErrors.sellingPrice ? 'border-red-500' : 'border-[var(--color-border)]'
                  } focus:border-[var(--color-accent)] rounded-lg px-3 py-2 text-sm text-white`}
                  placeholder="0.00"
                />
                {editFormErrors.sellingPrice && (
                  <span className="text-[11px] text-red-500 mt-0.5 block">{editFormErrors.sellingPrice}</span>
                )}
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className={`w-full bg-[var(--color-bg-primary)] border ${
                    editFormErrors.quantity ? 'border-red-500' : 'border-[var(--color-border)]'
                  } focus:border-[var(--color-accent)] rounded-lg px-3 py-2 text-sm text-white`}
                  placeholder="1"
                />
                {editFormErrors.quantity && (
                  <span className="text-[11px] text-red-500 mt-0.5 block">{editFormErrors.quantity}</span>
                )}
              </div>
            </div>

            {/* Calculations Summary Box */}
            <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)] space-y-1.5 text-xs">
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Updated Total Cost:</span>
                <span className="font-bold text-white">
                  Rs. {((parseFloat(editBuyingPrice) || 0) * (parseInt(editQuantity, 10) || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Profit per unit:</span>
                <span className={`font-semibold ${(parseFloat(editSellingPrice) || 0) - (parseFloat(editBuyingPrice) || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Rs. {((parseFloat(editSellingPrice) || 0) - (parseFloat(editBuyingPrice) || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[var(--color-text-secondary)] border-t border-[var(--color-border)] pt-1">
                <span>Profit Margin:</span>
                <span className="font-semibold text-amber-400">
                  {parseFloat(editSellingPrice) > 0
                    ? (((parseFloat(editSellingPrice) - parseFloat(editBuyingPrice)) / parseFloat(editSellingPrice)) * 100).toFixed(1)
                    : '0'}%
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block mb-1 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                Notes
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-lg px-3 py-2 text-xs text-white"
                placeholder="Optional notes..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatePurchaseMutation.isPending}
                className="px-5 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-amber-400 text-black font-semibold text-xs transition-colors shadow-md disabled:opacity-50"
              >
                {updatePurchaseMutation.isPending ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!purchaseToDelete}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={() => {
          if (purchaseToDelete) {
            deletePurchaseMutation.mutate(purchaseToDelete.id)
          }
        }}
        title="Delete Purchase"
        message={`Are you sure you want to delete purchase #${purchaseToDelete?.id.slice(-6).toUpperCase()} (${purchaseToDelete?.items?.[0]?.item?.name || 'Item'})? This will reverse the purchase ledger entry and remove or adjust the item in inventory.`}
        isLoading={deletePurchaseMutation.isPending}
      />
    </div>
  )
}
