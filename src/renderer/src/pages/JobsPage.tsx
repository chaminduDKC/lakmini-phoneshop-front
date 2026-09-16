import React, { useState, useMemo } from 'react'
import {
  Wrench,
  Plus,
  Search,
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  CheckCircle,
  Truck,
  Smartphone,
  Tag,
  KeyRound,
  FileText
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@renderer/components/PageHeader'
import { DataTable, Column } from '@renderer/components/DataTable'
import { Modal } from '@renderer/components/Modal'
import { useToast } from '@renderer/components/ToastProvider'
import { customerApi, Customer } from '@renderer/api/customer'
import { inventoryApi, InventoryItem } from '@renderer/api/inventory'
import {
  jobApi,
  RepairJob,
  CreateJobPayload,
  UpdateJobPayload,
  AddJobPartPayload,
  RepairStatus,
  PaymentStatus,
  PartSource
} from '@renderer/api/job'
import { BusinessInfo } from '@renderer/api/sale'
import { JobWarrantyBillModal } from '@renderer/components/JobWarrantyBillModal'
import { ConfirmDialog } from '@renderer/components/ConfirmDialog'

const RECEIVED_CONDITIONS = [
  'Working',
  'No Power / Dead',
  'Display Not Working / Blank',
  'Touch Not Working',
  'Glass Cracked / Broken',
  'Charging Issue / Not Charging',
  'Battery Draining Fast',
  'Water / Liquid Damaged',
  'Restarting / Boot Loop',
  'Network / No Service',
  'Speaker / Mic Fault',
  'Camera Fault',
  'Custom'
]

const WARRANTY_PRESETS = [
  'No Warranty',
  '7 Days Checking',
  '1 Month',
  '3 Months',
  '6 Months',
  '1 Year'
]

export const JobsPage: React.FC = () => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<RepairJob | null>(null)
  const [activeBillJob, setActiveBillJob] = useState<RepairJob | null>(null)
  const [activeBusinessInfo, setActiveBusinessInfo] = useState<BusinessInfo | null>(null)
  const [jobToDelete, setJobToDelete] = useState<RepairJob | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL')

  // Create Job Form State
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustAddress, setNewCustAddress] = useState('')

  const [phoneModel, setPhoneModel] = useState('')
  const [receivedCondition, setReceivedCondition] = useState('Working')
  const [customCondition, setCustomCondition] = useState('')
  const [issue, setIssue] = useState('')
  const [passcode, setPasscode] = useState('')
  const [serviceCharge, setServiceCharge] = useState<string>('0')
  const [advancePaid, setAdvancePaid] = useState<string>('0')
  const [technician, setTechnician] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Workspace Job Edit Form State
  const [editStatus, setEditStatus] = useState<RepairStatus>('PENDING')
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('UNPAID')
  const [editTechnician, setEditTechnician] = useState('')
  const [editServiceCharge, setEditServiceCharge] = useState<string>('0')
  const [editAdvancePaid, setEditAdvancePaid] = useState<string>('0')
  const [editDiscount, setEditDiscount] = useState<string>('0')
  const [editRepairNotes, setEditRepairNotes] = useState('')
  const [editWarrantyPeriod, setEditWarrantyPeriod] = useState('No Warranty')
  const [editWarrantyDesc, setEditWarrantyDesc] = useState('')

  // Workspace Part Addition State
  const [showAddPartForm, setShowAddPartForm] = useState(false)
  const [partSource, setPartSource] = useState<PartSource>('INVENTORY')
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('')
  const [partQty, setPartQty] = useState<string>('1')
  const [partSellingCost, setPartSellingCost] = useState<string>('')
  const [externalPartName, setExternalPartName] = useState('')
  const [externalPartCost, setExternalPartCost] = useState<string>('')

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)

  // Queries
  const { data: responseData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobs', search, selectedStatusTab, page, limit],
    queryFn: () =>
      jobApi.listJobs({
        search: search || undefined,
        status: selectedStatusTab !== 'ALL' ? selectedStatusTab : undefined,
        page,
        limit
      }),
      refetchOnWindowFocus: false,   // don't refetch when tab regains focus
      refetchOnReconnect: false,     // don't refetch when network reconnects
      refetchOnMount: false,  // don't refetch when component remounts (uses cache if fresh)
  })

  const jobs = responseData?.data ?? []
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

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customerApi.listCustomers({ all: true }),
    refetchOnWindowFocus: false,   // don't refetch when tab regains focus
      refetchOnReconnect: false,     // don't refetch when network reconnects
      refetchOnMount: false,  // don't refetch when component remounts (uses cache if fresh)
  })
  const customers: Customer[] = customersData?.data ?? []

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-all'],
    queryFn: () => inventoryApi.listInventory({ all: true }),
    refetchOnWindowFocus: false,   // don't refetch when tab regains focus
      refetchOnReconnect: false,     // don't refetch when network reconnects
      refetchOnMount: false,  // don't refetch when component remounts (uses cache if fresh)
  })
  const inventory: InventoryItem[] = inventoryData?.data ?? []

  // Selected Inventory Item for Parts addition
  const selectedInventoryItem = useMemo(() => {
    return inventory.find((i) => i.id === selectedInventoryItemId)
  }, [inventory, selectedInventoryItemId])

  // Count summaries
  const statusCounts = useMemo(() => {
    return {
      all: jobs.length,
      pending: jobs.filter((j) => j.status === 'PENDING').length,
      in_progress: jobs.filter((j) => j.status === 'IN_PROGRESS').length,
      completed: jobs.filter((j) => j.status === 'COMPLETED').length,
      delivered: jobs.filter((j) => j.status === 'DELIVERED').length
    }
  }, [jobs])

  // Open Workspace for a Job
  const handleOpenWorkspace = (job: RepairJob) => {
    setSelectedJob(job)
    setEditStatus(job.status)
    setEditPaymentStatus(job.paymentStatus)
    setEditTechnician(job.technician || '')
    setEditServiceCharge(String(job.serviceCharge || 0))
    setEditAdvancePaid(String(job.advancePaid || 0))
    setEditDiscount(String(job.discount || 0))
    setEditRepairNotes(job.repairNotes || '')
    setEditWarrantyPeriod(job.warrantyPeriod || 'No Warranty')
    setEditWarrantyDesc(job.warrantyDescription || '')
    setShowAddPartForm(false)
    resetPartForm()
  }

  const resetPartForm = () => {
    setPartSource('INVENTORY')
    setSelectedInventoryItemId('')
    setPartQty('1')
    setPartSellingCost('')
    setExternalPartName('')
    setExternalPartCost('')
  }

  const resetCreateForm = () => {
    setCustomerMode('existing')
    setSelectedCustomerId('')
    setNewCustName('')
    setNewCustPhone('')
    setNewCustAddress('')
    setPhoneModel('')
    setReceivedCondition('Working')
    setCustomCondition('')
    setIssue('')
    setPasscode('')
    setServiceCharge('0')
    setAdvancePaid('0')
    setTechnician('')
    setFormErrors({})
  }

  // Mutations
  const createJobMutation = useMutation({
    mutationFn: (payload: CreateJobPayload) => jobApi.createJob(payload),
    onSuccess: (res) => {
      showToast('success', res.message || 'Repair job registered successfully')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      setShowCreateModal(false)
      resetCreateForm()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to create repair job')
    }
  })

  const updateJobMutation = useMutation({
    mutationFn: (data: { id: string; payload: UpdateJobPayload }) =>
      jobApi.updateJob(data.id, data.payload),
    onSuccess: (res) => {
      showToast('success', 'Repair job updated')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
       queryClient.invalidateQueries({ queryKey: ['ledger'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      setSelectedJob(res.job)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to update job')
    }
  })

  const addPartMutation = useMutation({
    mutationFn: (data: { id: string; payload: AddJobPartPayload }) =>
      jobApi.addJobPart(data.id, data.payload),
    onSuccess: (res) => {
      showToast('success', 'Part added to repair job')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['ledger'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      setSelectedJob(res.job)
      setShowAddPartForm(false)
      resetPartForm()
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to add part')
    }
  })

  const removePartMutation = useMutation({
    mutationFn: (data: { id: string; partId: string }) =>
      jobApi.removeJobPart(data.id, data.partId),
    onSuccess: (res) => {
      showToast('success', 'Part removed from job')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['ledger'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      setSelectedJob(res.job)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to remove part')
    }
  })

  const deliverJobMutation = useMutation({
    mutationFn: (data: { id: string; payload?: UpdateJobPayload }) =>
      jobApi.deliverJob(data.id, data.payload),
    onSuccess: (res) => {
      showToast('success', 'Job marked as DELIVERED & bill generated')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
       queryClient.invalidateQueries({ queryKey: ['ledger'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      setSelectedJob(null)
      setActiveBillJob(res.data.job)
      setActiveBusinessInfo(res.data.businessInfo || null)
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to deliver job')
    }
  })

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => jobApi.deleteJob(id),
    onSuccess: (res) => {
      showToast('success', res.message || 'Repair job deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['ledger'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setJobToDelete(null)
      if (selectedJob && selectedJob.id === jobToDelete?.id) {
        setSelectedJob(null)
      }
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to delete repair job')
    }
  })

  // Submit Job Creation
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    let custName = ''
    let custPhone = ''
    let custAddress: string | undefined = undefined

    if (customerMode === 'existing') {
      if (!selectedCustomerId) {
        errors.customer = 'Please select a customer or toggle "+ New Customer"'
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

    if (!phoneModel.trim()) errors.phoneModel = 'Phone model is required'
    if (!issue.trim()) errors.issue = 'Issue description is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})

    const finalCondition =
      receivedCondition === 'Custom'
        ? customCondition.trim() || 'Custom Condition'
        : receivedCondition

    const payload: CreateJobPayload = {
      customerId: customerMode === 'existing' ? selectedCustomerId : undefined,
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddress,
      phoneModel: phoneModel.trim(),
      receivedCondition: finalCondition,
      issue: issue.trim(),
      passcode: passcode.trim() || undefined,
      advancePaid: parseFloat(advancePaid) || 0,
      serviceCharge: parseFloat(serviceCharge) || 0,
      technician: technician.trim() || undefined
    }

    createJobMutation.mutate(payload)
  }

  // Save Workspace Details
  const handleSaveWorkspaceDetails = () => {
    if (!selectedJob) return
    const payload: UpdateJobPayload = {
      status: editStatus,
      paymentStatus: editPaymentStatus,
      technician: editTechnician.trim() || null,
      serviceCharge: parseFloat(editServiceCharge) || 0,
      advancePaid: parseFloat(editAdvancePaid) || 0,
      discount: parseFloat(editDiscount) || 0,
      repairNotes: editRepairNotes.trim() || null,
      warrantyPeriod: editWarrantyPeriod.trim() || null,
      warrantyDescription: editWarrantyDesc.trim() || null
    }

    updateJobMutation.mutate({ id: selectedJob.id, payload })
  }

  // Deliver Job to Customer (passes current workspace labor & charges)
  const handleDeliverJob = () => {
    if (!selectedJob) return
    const payload: UpdateJobPayload = {
      serviceCharge: parseFloat(editServiceCharge) || 0,
      advancePaid: parseFloat(editAdvancePaid) || 0,
      discount: parseFloat(editDiscount) || 0,
      technician: editTechnician.trim() || null,
      repairNotes: editRepairNotes.trim() || null,
      warrantyPeriod: editWarrantyPeriod.trim() || null,
      warrantyDescription: editWarrantyDesc.trim() || null
    }
    deliverJobMutation.mutate({ id: selectedJob.id, payload })
  }

  // Handle Add Part to Job
  const handleAddPartSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob) return

    const qty = parseInt(partQty, 10)
    const sellingPrice = parseFloat(partSellingCost)

    if (isNaN(qty) || qty < 1) {
      showToast('error', 'Quantity must be at least 1')
      return
    }

    if (isNaN(sellingPrice) || sellingPrice < 0) {
      showToast('error', 'Valid selling price is required')
      return
    }

    if (partSource === 'INVENTORY') {
      if (!selectedInventoryItem) {
        showToast('error', 'Please select an inventory item')
        return
      }
      if (qty > selectedInventoryItem.quantity) {
        showToast(
          'error',
          `Cannot add ${qty}. Only ${selectedInventoryItem.quantity} units in stock.`
        )
        return
      }

      addPartMutation.mutate({
        id: selectedJob.id,
        payload: {
          source: 'INVENTORY',
          itemId: selectedInventoryItem.id,
          sellingCost: sellingPrice,
          qtyUsed: qty
        }
      })
    } else {
      if (!externalPartName.trim()) {
        showToast('error', 'Part name is required for external parts')
        return
      }
      const cost = parseFloat(externalPartCost) || 0

      addPartMutation.mutate({
        id: selectedJob.id,
        payload: {
          source: 'EXTERNAL',
          partName: externalPartName.trim(),
          partCost: cost,
          sellingCost: sellingPrice,
          qtyUsed: qty
        }
      })
    }
  }

  // View Bill for Existing Job
  const handleViewBill = async (jobId: string) => {
    try {
      const res = await jobApi.getJobById(jobId)
      setActiveBillJob(res.job)
      setActiveBusinessInfo(res.businessInfo || null)
    } catch (err: any) {
      showToast('error', 'Failed to load repair bill')
    }
  }

  // Status Badge Helper
  const renderStatusBadge = (status: RepairStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={12} /> Pending
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Wrench size={12} /> In Progress
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Completed
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Truck size={12} /> Delivered
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle size={12} /> Cancelled
          </span>
        )
    }
  }

  // Payment Badge Helper
  const renderPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            PAID
          </span>
        )
      case 'PARTIALLY_PAID':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            PARTIAL
          </span>
        )
      case 'UNPAID':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            UNPAID
          </span>
        )
    }
  }

  // DataTable Columns
  const columns: Column<RepairJob>[] = [
    {
      header: 'Job #',
      accessorKey: 'jobNumber',
      cell: ({ value }) => (
        <span className="font-mono text-xs font-bold text-[var(--color-accent)]">{value}</span>
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
      header: 'Device & Condition',
      accessorKey: 'phoneModel',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm">{row.phoneModel}</span>
          <span className="text-xs text-amber-400/90 font-medium">
            {row.receivedCondition}
          </span>
        </div>
      )
    },
    {
      header: 'Reported Issue',
      accessorKey: 'issue',
      cell: ({ value }) => (
        <span className="text-xs text-[var(--color-text-secondary)] max-w-xs truncate block">
          {value}
        </span>
      )
    },
    {
      header: 'Repair Status',
      accessorKey: 'status',
      cell: ({ value }) => renderStatusBadge(value)
    },
    {
      header: 'Payment',
      accessorKey: 'paymentStatus',
      cell: ({ value }) => renderPaymentBadge(value)
    },
    {
      header: 'Total / Balance',
      accessorFn: (row) => row.totalAmount,
      cell: ({ row }) => {
        const total = Number(row.totalAmount || 0)
        const adv = Number(row.advancePaid || 0)
        const balance = Math.max(0, total - adv)
        return (
          <div className="flex flex-col text-xs">
            <span className="font-bold text-white">Rs. {total.toLocaleString()}</span>
            {balance > 0 && (
              <span className="text-[11px] text-amber-400">Due: Rs. {balance.toLocaleString()}</span>
            )}
          </div>
        )
      }
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const isDeleteDisabled =
          row.status === 'DELIVERED' ||
          row.paymentStatus === 'PAID' ||
          row.paymentStatus === 'PARTIALLY_PAID'

        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenWorkspace(row)}
              className="px-2.5 py-1 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-accent)] font-medium text-xs transition-colors flex items-center gap-1"
              title="Manage Repair Job"
            >
              <Wrench size={13} />
              <span>Manage</span>
            </button>
            <button
              onClick={() => handleViewBill(row.id)}
              className="p-1 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white transition-colors"
              title="Print Repair Bill"
            >
              <Printer size={14} />
            </button>
            <button
              onClick={() => setJobToDelete(row)}
              disabled={isDeleteDisabled}
              className="p-1 rounded bg-[var(--color-bg-primary)] hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-bg-primary)] disabled:hover:text-red-400 transition-colors"
              title={
                isDeleteDisabled
                  ? 'Cannot delete a job that is delivered, paid, or partially paid'
                  : 'Delete Repair Job'
              }
            >
              <Trash2 size={14} />
            </button>
          </div>
        )
      }
    }
  ]

  // Workspace Calculations
  const workspacePartsTotal = useMemo(() => {
    if (!selectedJob) return 0
    return selectedJob.partsUsed.reduce(
      (sum, p) => sum + Number(p.sellingCost || 0) * (p.qtyUsed || 1),
      0
    )
  }, [selectedJob])

  const numServiceCharge = parseFloat(editServiceCharge) || 0
  const numDiscount = parseFloat(editDiscount) || 0
  const numAdvancePaid = parseFloat(editAdvancePaid) || 0
  const workspaceGrossTotal = workspacePartsTotal + numServiceCharge
  const workspaceNetTotal = Math.max(0, workspaceGrossTotal - numDiscount)
  const workspaceBalanceDue = Math.max(0, workspaceNetTotal - numAdvancePaid)

  const isJobLocked = selectedJob
    ? selectedJob.paymentStatus === 'PAID' &&
      (selectedJob.status === 'COMPLETED' || selectedJob.status === 'DELIVERED')
    : false
  const isFormStillLocked =
    editPaymentStatus === 'PAID' &&
    (editStatus === 'COMPLETED' || editStatus === 'DELIVERED')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair Jobs"
        subtitle="Manage phone intake, track repair diagnostics, allocate inventory parts, and deliver warranty bills"
        action={
          <button
            onClick={() => {
              resetCreateForm()
              setShowCreateModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} />
            <span>New Repair Job</span>
          </button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => {
            setSelectedStatusTab('ALL')
            setPage(1)
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatusTab === 'ALL'
              ? 'bg-[var(--color-bg-secondary)] border-[var(--color-accent)] shadow-md shadow-amber-500/10'
              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
          }`}
        >
          <span className="text-xs text-[var(--color-text-muted)] block">All Jobs</span>
          <span className="text-xl font-bold text-white">{statusCounts.all}</span>
        </button>

        <button
          onClick={() => {
            setSelectedStatusTab('PENDING')
            setPage(1)
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatusTab === 'PENDING'
              ? 'bg-[rgba(245,158,11,0.1)] border-amber-500'
              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
          }`}
        >
          <span className="text-xs text-amber-400 block font-medium">Pending</span>
          <span className="text-xl font-bold text-amber-400">{statusCounts.pending}</span>
        </button>

        <button
          onClick={() => {
            setSelectedStatusTab('IN_PROGRESS')
            setPage(1)
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatusTab === 'IN_PROGRESS'
              ? 'bg-[rgba(56,189,248,0.1)] border-sky-400'
              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
          }`}
        >
          <span className="text-xs text-sky-400 block font-medium">In Progress</span>
          <span className="text-xl font-bold text-sky-400">{statusCounts.in_progress}</span>
        </button>

        <button
          onClick={() => {
            setSelectedStatusTab('COMPLETED')
            setPage(1)
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatusTab === 'COMPLETED'
              ? 'bg-[rgba(34,197,94,0.1)] border-emerald-500'
              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
          }`}
        >
          <span className="text-xs text-emerald-400 block font-medium">Completed</span>
          <span className="text-xl font-bold text-emerald-400">{statusCounts.completed}</span>
        </button>

        <button
          onClick={() => {
            setSelectedStatusTab('DELIVERED')
            setPage(1)
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatusTab === 'DELIVERED'
              ? 'bg-[rgba(168,85,247,0.1)] border-purple-500'
              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
          }`}
        >
          <span className="text-xs text-purple-400 block font-medium">Delivered</span>
          <span className="text-xl font-bold text-purple-400">{statusCounts.delivered}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search jobs by Job #, customer, phone model, issue..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Jobs Data Table */}
      <DataTable
        columns={columns}
        data={jobs}
        isLoading={isLoadingJobs}
        pagination={pagination}
        emptyMessage="No repair jobs found. Click 'New Repair Job' to register a phone repair."
      />

      {/* MODAL 1: NEW REPAIR JOB (INTAKE) */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register New Phone Repair Job"
        size="lg"
        marginTop="0"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          {/* Customer Selection Section */}
          <div className="p-3.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-2.5">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                <User size={14} />
                <span>Customer Details</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-4 py-2 cursor-pointer rounded transition-colors ${
                    customerMode === 'existing'
                      ? 'bg-[var(--color-accent)] text-black font-semibold'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-4 py-2 cursor-pointer rounded transition-colors ${
                    customerMode === 'new'
                      ? 'bg-[var(--color-accent)] text-black font-semibold'
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
                  <option value="">-- Select Registered Customer --</option>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className={`w-full bg-[var(--color-bg-secondary)] border ${
                      formErrors.newCustName ? 'border-red-500' : 'border-[var(--color-border)]'
                    } focus:border-[var(--color-accent)] rounded px-3 py-2.1 text-xs text-white`}
                  />
                  {formErrors.newCustName && (
                    <span className="text-xs text-red-500 mt-0.5 block">{formErrors.newCustName}</span>
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
                    } focus:border-[var(--color-accent)] rounded px-3 py-2.1 text-xs text-white`}
                  />
                  {formErrors.newCustPhone && (
                    <span className="text-xs text-red-500 mt-0.5 block">{formErrors.newCustPhone}</span>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Address (Optional)"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-2.1 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Phone Details Section */}
          <div className="p-3.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] border-b border-[var(--color-border)] pb-2">
              <Smartphone size={14} />
              <span>Phone & Intake Diagnostics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Phone Model / Device Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 13 Pro Max"
                  value={phoneModel}
                  onChange={(e) => setPhoneModel(e.target.value)}
                  className={`w-full bg-[var(--color-bg-secondary)] border ${
                    formErrors.phoneModel ? 'border-red-500' : 'border-[var(--color-border)]'
                  } focus:border-[var(--color-accent)] rounded px-3 py-2 text-sm text-white`}
                />
                {formErrors.phoneModel && (
                  <span className="text-xs text-red-500 mt-0.5 block">{formErrors.phoneModel}</span>
                )}
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Received Status / Condition *
                </label>
                <select
                  value={receivedCondition}
                  onChange={(e) => setReceivedCondition(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded px-3 py-2 text-sm text-white"
                >
                  {RECEIVED_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
                {receivedCondition === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Describe custom received status..."
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    className="mt-1.5 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-2.5 py-1 text-xs text-white"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Reported Fault / Issue Description *
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Display blank after falling, touch unresponsive, replace display unit..."
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className={`w-full bg-[var(--color-bg-secondary)] border ${
                  formErrors.issue ? 'border-red-500' : 'border-[var(--color-border)]'
                } focus:border-[var(--color-accent)] rounded px-3 py-1.5 text-xs text-white custom-scrollbar`}
              />
              {formErrors.issue && (
                <span className="text-xs text-red-500 mt-0.5 block">{formErrors.issue}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Passcode / Pattern (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234 / L pattern"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Advance Paid (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Estimated Labor / Charge (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createJobMutation.isPending}
              className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {createJobMutation.isPending ? 'Saving...' : 'Register Repair Job'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: JOB WORKSPACE & DETAILS (PARTS, WARRANTY, REPAIR DETAILS) */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={`Repair Workspace — ${selectedJob?.jobNumber || ''}`}
        size="xl"
        marginTop="0"
      >
        {selectedJob && (
          <div className="space-y-4">
            {/* Locked Warning Banner */}
            {isJobLocked && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white">Repair Job is Completed & Paid (Locked)</span>
                  <span className="text-[var(--color-text-secondary)]">
                    Adding parts and delivering are disabled. To adjust this job, change the <strong>Repair Status</strong> (e.g. to <span className="text-amber-400">IN_PROGRESS</span>) or <strong>Payment Status</strong> (e.g. to <span className="text-amber-400">UNPAID / PARTIALLY_PAID</span>) below and click <strong>Save Job Updates</strong>. A reverse ledger entry will be recorded automatically.
                  </span>
                </div>
              </div>
            )}

            {/* Top Device & Customer Header Banner */}
            <div className="p-3.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[var(--color-text-muted)] block">Customer</span>
                <span className="font-bold text-white text-sm">{selectedJob.customerName}</span>
                <span className="text-[var(--color-text-secondary)] block">{selectedJob.customerPhone}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Device / Phone</span>
                <span className="font-bold text-amber-400 text-sm">{selectedJob.phoneModel}</span>
                <span className="text-emerald-400 block">{selectedJob.receivedCondition}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Reported Fault</span>
                <span className="text-[var(--color-text-secondary)] font-medium line-clamp-2">
                  {selectedJob.issue}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Passcode / PIN</span>
                <span className="font-mono text-white font-semibold">
                  {selectedJob.passcode || 'None'}
                </span>
              </div>
            </div>

            {/* Status & Payment Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs">
              <div>
                <label className="block mb-1 font-semibold text-[var(--color-text-secondary)]">
                  Repair Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as RepairStatus)}
                  className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white focus:border-[var(--color-accent)] font-semibold"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[var(--color-text-secondary)]">
                  Payment Status
                </label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white focus:border-[var(--color-accent)] font-semibold"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[var(--color-text-secondary)]">
                  Technician Assigned
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kasun / Chief Tech"
                  value={editTechnician}
                  onChange={(e) => setEditTechnician(e.target.value)}
                  className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {/* PARTS USED SECTION */}
            <div className="p-3.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                  <Package size={14} />
                  <span>Parts Replaced / Allocated ({selectedJob.partsUsed.length})</span>
                </div>
                <button
                  type="button"
                  disabled={isJobLocked}
                  onClick={() => setShowAddPartForm(!showAddPartForm)}
                  className="px-2.5 py-1 text-[var(--color-accent)] rounded text-xs font-semibold flex items-center gap-1 hover:cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={isJobLocked ? 'Cannot add parts to a completed & paid job. Revert status first.' : undefined}
                >
                  <Plus size={13} />
                  <span>{showAddPartForm ? 'Close Part Form' : 'Add Part (Stock / External)'}</span>
                </button>
              </div>

              {/* Inline Add Part Form */}
              {showAddPartForm && (
                <form
                  onSubmit={handleAddPartSubmit}
                  className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-amber-500/30 space-y-3"
                >
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="partSource"
                        checked={partSource === 'INVENTORY'}
                        onChange={() => setPartSource('INVENTORY')}
                      />
                      <span className="text-white">Inventory</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="partSource"
                        checked={partSource === 'EXTERNAL'}
                        onChange={() => setPartSource('EXTERNAL')}
                      />
                      <span className="text-white">External</span>
                    </label>
                  </div>

                  {partSource === 'INVENTORY' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-1">
                        <label className="block mb-1 text-[var(--color-text-secondary)]">
                          Select Inventory Item *
                        </label>
                        <select
                          value={selectedInventoryItemId}
                          onChange={(e) => {
                            setSelectedInventoryItemId(e.target.value)
                            const itm = inventory.find((i) => i.id === e.target.value)
                            if (itm) setPartSellingCost(String(itm.sellingPrice))
                          }}
                          className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="">-- Choose Item --</option>
                          {inventory.map((itm) => (
                            <option
                              key={itm.id}
                              value={itm.id}
                              disabled={itm.quantity <= 0}
                            >
                              {itm.name} | Avail: {itm.quantity} | Rs. {Number(itm.sellingPrice).toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 text-[var(--color-text-secondary)]">
                          Qty Used *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedInventoryItem?.quantity || 1}
                          value={partQty}
                          onChange={(e) => setPartQty(e.target.value)}
                          className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-[var(--color-text-secondary)]">
                          Selling Price to Customer (Rs.) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={partSellingCost}
                          onChange={(e) => setPartSellingCost(e.target.value)}
                          className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block mb-1 text-[var(--color-text-secondary)]">
                          External Part Description *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. OLED Display IC replacement (Market)"
                          value={externalPartName}
                          onChange={(e) => setExternalPartName(e.target.value)}
                          className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[var(--color-text-secondary)]">
                          Our Cost (Rs.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0.00"
                          value={externalPartCost}
                          onChange={(e) => setExternalPartCost(e.target.value)}
                          className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-[var(--color-text-secondary)]">
                          Customer Price (Rs.) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0.00"
                          value={partSellingCost}
                          onChange={(e) => setPartSellingCost(e.target.value)}
                          className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                    <button
                      type="button"
                      onClick={() => setShowAddPartForm(false)}
                      className="px-3 py-1 rounded bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addPartMutation.isPending}
                      className="px-4 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs"
                    >
                      {addPartMutation.isPending ? 'Adding...' : 'Attach Part to Job'}
                    </button>
                  </div>
                </form>
              )}

              {/* Parts List Table */}
              {selectedJob.partsUsed.length === 0 ? (
                <div className="text-center py-4 text-xs text-[var(--color-text-muted)]">
                  No parts added to this repair yet. Click "+ Add Part" if parts/components are replaced.
                </div>
              ) : (
                <div className="rounded border border-[var(--color-border)] overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                      <tr>
                        <th className="py-2 px-3">Part Description</th>
                        <th className="py-2 px-3 text-center">Source</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Price Charged</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-3 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {selectedJob.partsUsed.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-medium text-white">
                            {p.item?.name || p.partName}
                            {p.item && (
                              <span className="text-[10px] text-[var(--color-text-muted)] block">
                                SKU: {p.item.sku}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                              {p.source}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-semibold text-white">{p.qtyUsed}</td>
                          <td className="py-2 px-3 text-right text-[var(--color-text-secondary)]">
                            Rs. {Number(p.sellingCost).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-white">
                            Rs. {(Number(p.sellingCost) * p.qtyUsed).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              disabled={isJobLocked}
                              onClick={() =>
                                removePartMutation.mutate({
                                  id: selectedJob.id,
                                  partId: p.id
                                })
                              }
                              className="text-[var(--color-text-muted)] hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isJobLocked ? 'Cannot remove parts from a completed & paid job' : 'Remove Part'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* REPAIR WORK DONE & WARRANTY DETAILS */}
            <div className="p-3.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] border-b border-[var(--color-border)] pb-2">
                <ShieldCheck size={14} />
                <span>Repair Diagnostics & Warranty</span>
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                  Repair Work Done / Diagnostics Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cleaned motherboard corrosion, replaced battery connector, tested charging current at 1.8A..."
                  value={editRepairNotes}
                  onChange={(e) => setEditRepairNotes(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-1.5 text-xs text-white custom-scrollbar"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                    Repair Warranty Period
                  </label>
                  <select
                    value={editWarrantyPeriod}
                    onChange={(e) => setEditWarrantyPeriod(e.target.value)}
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-1.5 text-xs text-white"
                  >
                    {WARRANTY_PRESETS.map((wp) => (
                      <option key={wp} value={wp}>
                        {wp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                    Warranty Description / Clauses (Printed on Bill)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Months warranty strictly for touch & display IC. No water/drop damage."
                    value={editWarrantyDesc}
                    onChange={(e) => setEditWarrantyDesc(e.target.value)}
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* BILLING SUMMARY & ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-[rgba(245,158,11,0.05)] border border-amber-500/20">
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block mb-1 text-[var(--color-text-secondary)] font-medium">
                    Labor (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editServiceCharge}
                    onChange={(e) => setEditServiceCharge(e.target.value)}
                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[var(--color-text-secondary)] font-medium">
                    Discount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[var(--color-text-secondary)] font-medium">
                    Advance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editAdvancePaid}
                    onChange={(e) => setEditAdvancePaid(e.target.value)}
                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between p-3 rounded bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-xs space-y-1.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Parts Total:</span>
                    <span className="font-semibold text-white">Rs. {workspacePartsTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Service / Labor:</span>
                    <span className="font-semibold text-white">Rs. {numServiceCharge.toLocaleString()}</span>
                  </div>
                  {numDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount:</span>
                      <span className="font-semibold">- Rs. {numDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-white pt-1 border-t border-[var(--color-border)]">
                    <span>Total Bill:</span>
                    <span>Rs. {workspaceNetTotal.toLocaleString()}</span>
                  </div>
                  {numAdvancePaid > 0 && (
                    <div className="flex justify-between text-[var(--color-text-secondary)]">
                      <span>Advance Received:</span>
                      <span className="font-semibold">- Rs. {numAdvancePaid.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-amber-400 pt-1 border-t border-[var(--color-border)]">
                    <span>Balance Due:</span>
                    <span>Rs. {workspaceBalanceDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setJobToDelete(selectedJob)}
                  disabled={
                    selectedJob.status === 'DELIVERED' ||
                    selectedJob.paymentStatus === 'PAID' ||
                    selectedJob.paymentStatus === 'PARTIALLY_PAID'
                  }
                  className="px-3 py-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500/10 disabled:hover:text-red-400"
                  title={
                    selectedJob.status === 'DELIVERED' ||
                    selectedJob.paymentStatus === 'PAID' ||
                    selectedJob.paymentStatus === 'PARTIALLY_PAID'
                      ? 'Cannot delete a job that is delivered, paid, or partially paid'
                      : 'Delete this Repair Job'
                  }
                >
                  <Trash2 size={14} />
                  <span>Delete Job</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveWorkspaceDetails}
                  disabled={updateJobMutation.isPending }
                  className="px-4 py-2 rounded bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-white font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isJobLocked && isFormStillLocked ? 'Change status away from Paid/Completed to unlock and save' : undefined}
                >
                  {updateJobMutation.isPending ? 'Saving...' : 'Save Job Updates'}
                </button>

                <button
                  type="button"
                  onClick={handleDeliverJob}
                  disabled={deliverJobMutation.isPending}
                  className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isJobLocked ? 'This job is already completed and paid.' : undefined}
                >
                  <Truck size={15} />
                  <span>
                    {deliverJobMutation.isPending ? 'Delivering...' : 'Deliver to Customer & Print Bill'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={() => {
          if (jobToDelete) {
            deleteJobMutation.mutate(jobToDelete.id)
          }
        }}
        title="Delete Repair Job"
        message={`Are you sure you want to delete repair job #${jobToDelete?.jobNumber} for ${jobToDelete?.customerName}? This will permanently remove the job, reverse attached external part costs in the ledger, and restore any inventory parts.`}
        isLoading={deleteJobMutation.isPending}
      />

      {/* PRINTABLE REPAIR WARRANTY BILL MODAL */}
      <JobWarrantyBillModal
        isOpen={!!activeBillJob}
        onClose={() => setActiveBillJob(null)}
        job={activeBillJob}
        businessInfo={activeBusinessInfo}
      />
    </div>
  )
}
