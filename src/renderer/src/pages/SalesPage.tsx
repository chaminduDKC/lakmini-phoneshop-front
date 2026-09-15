import React, { useState, useMemo } from 'react'
import {
  DollarSign,
  Plus,
  Search,
  ShoppingCart,
  Printer,
  Eye,
  Trash2,
  User,
  Phone,
  ShieldCheck,
  Package,
  Calendar,
  CreditCard,
  Building2,
  AlertCircle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@renderer/components/PageHeader'
import { DataTable, Column } from '@renderer/components/DataTable'
import { Modal } from '@renderer/components/Modal'
import { FormField } from '@renderer/components/FormField'
import { useToast } from '@renderer/components/ToastProvider'
import { inventoryApi, InventoryItem } from '@renderer/api/inventory'
import { customerApi, Customer } from '@renderer/api/customer'
import {
  saleApi,
  Sale,
  CreateSalePayload,
  CreateSaleItemPayload,
  BusinessInfo
} from '@renderer/api/sale'
import { WarrantyBillModal } from '@renderer/components/WarrantyBillModal'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'

interface CartItem {
  itemId: string
  itemName: string
  sku: string
  availableStock: number
  quantity: number
  unitPrice: number
  warrantyPeriod: string
  serialNumber: string
}

const WARRANTY_PRESETS = [
  'No Warranty',
  '7 Days Checking',
  '1 Month',
  '3 Months',
  '6 Months',
  '1 Year',
  '2 Years'
]

export const SalesPage: React.FC = () => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Modals
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [activeBillSale, setActiveBillSale] = useState<Sale | null>(null)
  const [activeBusinessInfo, setActiveBusinessInfo] = useState<BusinessInfo | null>(null)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterCustomerId, setFilterCustomerId] = useState('')

  // New Sale Form State - Customer
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustAddress, setNewCustAddress] = useState('')

  // New Sale Form State - Cart Line Item Builder
  const [selectedItemId, setSelectedItemId] = useState('')
  const [lineQuantity, setLineQuantity] = useState<string>('1')
  const [lineUnitPrice, setLineUnitPrice] = useState<string>('')
  const [lineWarranty, setLineWarranty] = useState<string>('No Warranty')
  const [customWarranty, setCustomWarranty] = useState<string>('')
  const [lineSerial, setLineSerial] = useState<string>('')

  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<string>('0')
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [notes, setNotes] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)

  // Queries
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory-all'],
    queryFn: () => inventoryApi.listInventory({ all: true })
  })
  const inventory: InventoryItem[] = inventoryData?.data ?? []

  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customerApi.listCustomers({ all: true })
  })
  const customers: Customer[] = customersData?.data ?? []

  const { data: responseData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales', search, filterCustomerId, page, limit],
    queryFn: () =>
      saleApi.listSales({
        search: search || undefined,
        customerId: filterCustomerId || undefined,
        page,
        limit
      })
  })

  const sales = responseData?.data ?? []
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

  // Selected item object from inventory
  const selectedInventoryItem = useMemo(() => {
    return inventory.find((i) => i.id === selectedItemId)
  }, [inventory, selectedItemId])

  // When item is selected, pre-fill standard selling price
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId)
    const item = inventory.find((i) => i.id === itemId)
    if (item) {
      setLineUnitPrice(String(item.sellingPrice))
      setLineQuantity('1')
    } else {
      setLineUnitPrice('')
    }
  }

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedInventoryItem) {
      showToast('error', 'Please select an item from inventory')
      return
    }

    const qty = parseInt(lineQuantity, 10)
    const price = parseFloat(lineUnitPrice)

    if (isNaN(qty) || qty < 1) {
      showToast('error', 'Quantity must be at least 1')
      return
    }

    if (isNaN(price) || price < 0) {
      showToast('error', 'Please enter a valid selling price')
      return
    }

    // Check existing qty in cart for this item
    const existingInCart = cart.find((c) => c.itemId === selectedInventoryItem.id)
    const totalRequestedQty = (existingInCart ? existingInCart.quantity : 0) + qty

    if (totalRequestedQty > selectedInventoryItem.quantity) {
      showToast(
        'error',
        `Cannot add ${qty}. Only ${selectedInventoryItem.quantity} units available in stock.`
      )
      return
    }

    const finalWarranty =
      lineWarranty === 'Custom' ? customWarranty.trim() || 'Custom Warranty' : lineWarranty

    if (existingInCart) {
      setCart((prev) =>
        prev.map((c) =>
          c.itemId === selectedInventoryItem.id
            ? {
                ...c,
                quantity: c.quantity + qty,
                unitPrice: price,
                warrantyPeriod: finalWarranty,
                serialNumber: lineSerial.trim() || c.serialNumber
              }
            : c
        )
      )
    } else {
      setCart((prev) => [
        ...prev,
        {
          itemId: selectedInventoryItem.id,
          itemName: selectedInventoryItem.name,
          sku: selectedInventoryItem.sku,
          availableStock: selectedInventoryItem.quantity,
          quantity: qty,
          unitPrice: price,
          warrantyPeriod: finalWarranty,
          serialNumber: lineSerial.trim()
        }
      ])
    }

    // Reset Line Builder
    setSelectedItemId('')
    setLineQuantity('1')
    setLineUnitPrice('')
    setLineWarranty('No Warranty')
    setCustomWarranty('')
    setLineSerial('')
  }

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  // Cart Calculations
  const cartSubTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }, [cart])

  const numDiscount = parseFloat(discount) || 0
  const cartGrandTotal = Math.max(0, cartSubTotal - numDiscount)

  // Reset complete sale form
  const resetSaleForm = () => {
    setCustomerMode('existing')
    setSelectedCustomerId('')
    setNewCustName('')
    setNewCustPhone('')
    setNewCustAddress('')
    setSelectedItemId('')
    setLineQuantity('1')
    setLineUnitPrice('')
    setLineWarranty('No Warranty')
    setCustomWarranty('')
    setLineSerial('')
    setCart([])
    setDiscount('0')
    setPaymentMethod('CASH')
    setNotes('')
    setFormErrors({})
  }

  // Mutations
  const createSaleMutation = useMutation({
    mutationFn: (payload: CreateSalePayload) => saleApi.createSale(payload),
    onSuccess: (res) => {
      showToast('success', res.message || 'Sale completed successfully')
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      if(customerMode === "new"){
        queryClient.invalidateQueries({ queryKey: ['customers-all'] })
      }
      setShowSaleModal(false)
      resetSaleForm()
      // Open Warranty Bill Modal immediately
      setActiveBillSale(res.data.sale)
      setActiveBusinessInfo(res.data.businessInfo || null)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to record sale')
    }
  })

  const deleteSaleMutation = useMutation({
    mutationFn: (id: string) => saleApi.deleteSale(id),
    onSuccess: (res) => {
      showToast('success', res.message || 'Sale deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['ledger'] })
      setSaleToDelete(null)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to delete sale')
      setSaleToDelete(null)
    }
  })

  // Submit Sale Checkout
  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    let custName = ''
    let custPhone = ''
    let custAddress: string | undefined = undefined

    if (customerMode === 'existing') {
      if (!selectedCustomerId) {
        errors.customer = 'Please select a customer or choose "New Customer"'
      } else {
        const found = customers.find((c) => c.id === selectedCustomerId)
        if (found) {
          custName = found.name
          custPhone = found.phone
          custAddress = found.address || undefined
        }
      }
    } else {
      if (!newCustName.trim()) errors.newCustName = 'Customer name is required'
      if (!newCustPhone.trim()) errors.newCustPhone = 'Phone number is required'
      custName = newCustName.trim()
      custPhone = newCustPhone.trim()
      custAddress = newCustAddress.trim() || undefined
    }

    if (cart.length === 0) {
      errors.cart = 'Please add at least one item to the cart'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})

    const itemsPayload: CreateSaleItemPayload[] = cart.map((c) => ({
      itemId: c.itemId,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      warrantyPeriod: c.warrantyPeriod || null,
      serialNumber: c.serialNumber || null
    }))

    const payload: CreateSalePayload = {
      customerId: customerMode === 'existing' ? selectedCustomerId : undefined,
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddress,
      items: itemsPayload,
      discount: numDiscount,
      paymentMethod,
      notes: notes.trim() || undefined
    }

    createSaleMutation.mutate(payload)
  }

  // Fetch full bill details for existing sale
  const handleViewBill = async (saleId: string) => {
    try {
      const res = await saleApi.getSaleById(saleId)
      setActiveBillSale(res.sale)
      setActiveBusinessInfo(res.businessInfo || null)
    } catch (err: any) {
      showToast('error', 'Failed to fetch invoice details')
    }
  }

  // Columns for Sales History DataTable
  const columns: Column<Sale>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      cell: ({ value }) => (
        <span className="font-mono text-xs font-bold text-[var(--color-accent)]">{value}</span>
      )
    },
    {
      header: 'Date & Time',
      accessorFn: (row) =>
        new Date(row.createdAt).toLocaleDateString('en-GB', {
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
      header: 'Customer',
      accessorFn: (row) => `${row.customerName} (${row.customerPhone})`,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-white text-sm">{row.customerName}</span>
          <span className="text-xs text-[var(--color-text-secondary)]">{row.customerPhone}</span>
        </div>
      )
    },
    {
      header: 'Items',
      accessorFn: (row) => row.items?.length || 0,
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-white">
            {row.items?.reduce((s, i) => s + i.quantity, 0)} units ({row.items?.length} items)
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] truncate max-w-xs">
            {row.items?.map((i) => i.item.name).join(', ')}
          </span>
        </div>
      )
    },
    {
      header: 'Payment',
      accessorKey: 'paymentMethod',
      cell: ({ value }) => (
        <span className="text-xs uppercase font-medium px-2 py-0.5 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
          {value}
        </span>
      )
    },
    {
      header: 'Total Amount',
      accessorKey: 'totalAmount',
      cell: ({ value }) => (
        <span className="font-bold text-sm text-emerald-400">
          Rs. {Number(value).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleViewBill(row.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-accent)] font-medium text-xs transition-colors"
            title="Print / View Warranty Bill"
          >
            <Printer size={14} />
            <span>Warranty Bill</span>
          </button>
          <button
            onClick={() => setSaleToDelete(row)}
            className="p-1.5 rounded bg-[var(--color-bg-primary)] hover:bg-red-500/20 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
            title="Delete Sale"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Invoicing"
        subtitle="Sell parts from inventory, configure custom selling prices & warranties, and print bills"
        action={
          <button
            onClick={() => {
              resetSaleForm()
              setShowSaleModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} />
            <span>New Sale (POS)</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search sales by invoice #, customer name, phone, or item..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterCustomerId}
            onChange={(e) => {
              setFilterCustomerId(e.target.value)
              setPage(1)
            }}
            className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sales History Table */}
      <DataTable
        columns={columns}
        data={sales}
        isLoading={isLoadingSales}
        pagination={pagination}
        emptyMessage="No sales recorded yet. Click 'New Sale (POS)' to make your first sale."
      />

      {/* NEW SALE (POS) MODAL */}
      <Modal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        title="Create New Sale & Warranty Bill"
        size="xl"
        marginTop="0"
      >
        <form onSubmit={handleConfirmSale} className="space-y-5">
          {/* SECTION 1: CUSTOMER SELECTION */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                <User size={15} />
                <span>Customer Information</span>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    customerMode === 'existing'
                      ? 'bg-[var(--color-accent)] text-white font-semibold shadow-sm'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    customerMode === 'new'
                      ? 'bg-[var(--color-accent)] text-white font-semibold shadow-sm'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  + New Customer
                </button>
              </div>
            </div>

            {customerMode === 'existing' ? (
              <div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className={`w-full bg-[var(--color-bg-secondary)] border ${
                    formErrors.customer ? 'border-red-500' : 'border-[var(--color-border)]'
                  } focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white`}
                >
                  <option value="">-- Choose from Registered Customers --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.phone} {c.address ? `(${c.address})` : ''}
                    </option>
                  ))}
                </select>
                {formErrors.customer && (
                  <span className="text-xs text-red-500 mt-1 block">{formErrors.customer}</span>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className={`w-full bg-[var(--color-bg-secondary)] border ${
                      formErrors.newCustName ? 'border-red-500' : 'border-[var(--color-border)]'
                    } focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white`}
                  />
                  {formErrors.newCustName && (
                    <span className="text-xs text-red-500 mt-1 block">{formErrors.newCustName}</span>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Phone Number *"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className={`w-full bg-[var(--color-bg-secondary)] border ${
                      formErrors.newCustPhone ? 'border-red-500' : 'border-[var(--color-border)]'
                    } focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white`}
                  />
                  {formErrors.newCustPhone && (
                    <span className="text-xs text-red-500 mt-1 block">{formErrors.newCustPhone}</span>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Address (Optional)"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: ADD INVENTORY ITEM TO CART */}
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              <Package size={15} />
              <span>Select Part From Inventory</span>
            </div>

            <div className="space-y-3">
              {/* Item Selector */}
              <div>
                <select
                  value={selectedItemId}
                  onChange={(e) => handleItemSelect(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white"
                >
                  <option value="">-- Choose Inventory Part / Item --</option>
                  {inventory.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.quantity <= 0}
                    >
                      {item.name} | Stock: {item.quantity} units | Price: Rs. {Number(item.sellingPrice).toLocaleString()} (SKU: {item.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price, Qty, Warranty Line Config */}
              {selectedInventoryItem && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                      Selling Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={lineUnitPrice}
                      onChange={(e) => setLineUnitPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-2.5 py-1.5 text-sm text-white font-semibold"
                    />
                    <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5 block">
                      Standard: Rs. {Number(selectedInventoryItem.sellingPrice).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                      Quantity * (Max: {selectedInventoryItem.quantity})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedInventoryItem.quantity}
                      value={lineQuantity}
                      onChange={(e) => setLineQuantity(e.target.value)}
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-2.5 py-1.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                      Warranty Period
                    </label>
                    <select
                      value={lineWarranty}
                      onChange={(e) => setLineWarranty(e.target.value)}
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-2.5 py-1.5 text-sm text-white"
                    >
                      {WARRANTY_PRESETS.map((wp) => (
                        <option key={wp} value={wp}>
                          {wp}
                        </option>
                      ))}
                      <option value="Custom">Custom Warranty</option>
                    </select>
                    {lineWarranty === 'Custom' && (
                      <input
                        type="text"
                        placeholder="e.g. 45 Days Screen Only"
                        value={customWarranty}
                        onChange={(e) => setCustomWarranty(e.target.value)}
                        className="mt-1 w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1 text-xs text-white"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                      Serial / IMEI (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 354892019..."
                      value={lineSerial}
                      onChange={(e) => setLineSerial(e.target.value)}
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-2.5 py-1.5 text-sm text-white"
                    />
                  </div>

                  <div className="sm:col-span-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="px-4 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-md text-xs flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <Plus size={14} /> Add Item to Sale
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: CART ITEMS LIST */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Items to Sell ({cart.length})
            </label>
            {cart.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
                No items added yet. Select an inventory part above and click "Add Item to Sale".
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg-secondary)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Warranty</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {cart.map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white">{c.itemName}</div>
                          <div className="text-[11px] text-[var(--color-text-muted)]">
                            SKU: {c.sku} {c.serialNumber ? `| S/N: ${c.serialNumber}` : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                            {c.warrantyPeriod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-white">
                          {c.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[var(--color-text-secondary)]">
                          Rs. {Number(c.unitPrice).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">
                          Rs. {(c.unitPrice * c.quantity).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(idx)}
                            className="p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {formErrors.cart && (
              <span className="text-xs text-red-500 mt-1 block">{formErrors.cart}</span>
            )}
          </div>

          {/* SECTION 4: BILLING & CHECKOUT SUMMARY */}
          {cart.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                      Discount (Rs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Credit/Debit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer / Online</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                    Notes / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Paid in full, customer requested fast warranty"
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs space-y-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-white">Rs. {cartSubTotal.toLocaleString()}</span>
                  </div>
                  {numDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount:</span>
                      <span className="font-semibold">- Rs. {numDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-[var(--color-accent)] pt-2 border-t border-[var(--color-border)]">
                    <span>Grand Total:</span>
                    <span>Rs. {cartGrandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 pt-1">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Warranty bill will be generated automatically upon confirmation.</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setShowSaleModal(false)}
             className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSaleMutation.isPending || cart.length === 0}
             className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              {createSaleMutation.isPending ? 'Processing...' : 'Confirm Sale & Generate Bill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* WARRANTY BILL / INVOICE MODAL */}
      <WarrantyBillModal
        isOpen={!!activeBillSale}
        onClose={() => setActiveBillSale(null)}
        sale={activeBillSale}
        businessInfo={activeBusinessInfo}
      />

      {/* DELETE SALE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!saleToDelete}
        title="Delete Sale"
        message={
          saleToDelete
            ? `Are you sure you want to delete invoice #${saleToDelete.invoiceNumber}? This will restore inventory stock and create a reversal ledger entry.`
            : ''
        }
        confirmLabel="Delete"
        onClose={()=> setSaleToDelete(null)}
        onConfirm={() => saleToDelete && deleteSaleMutation.mutate(saleToDelete.id)}
        onCancel={() => setSaleToDelete(null)}
        isLoading={deleteSaleMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
