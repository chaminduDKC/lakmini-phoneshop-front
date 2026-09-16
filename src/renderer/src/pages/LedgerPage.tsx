import React, { useState, useMemo } from "react"
import {
  BookOpen,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingCart,
  ShieldCheck,
  Wrench,
  DollarSign,
  Trash2,
  Filter,
  ChevronDown,
  RotateCcw,
  Cpu
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@renderer/components/PageHeader"
import { DataTable, Column } from "@renderer/components/DataTable"
import { Modal } from "@renderer/components/Modal"
import { useToast } from "@renderer/components/ToastProvider"
import { ledgerApi, LedgerEntry, LedgerEntryType } from "@renderer/api/ledger"

const TYPE_META: Record<
  LedgerEntryType,
  { label: string; icon: React.ReactNode; colorClass: string; bg: string }
> = {
  OPENING_BALANCE: {
    label: "Opening Balance",
    icon: <Wallet size={13} />,
    colorClass: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20"
  },
  PURCHASE: {
    label: "Purchase",
    icon: <ShoppingCart size={13} />,
    colorClass: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20"
  },
  PURCHASE_REVERSAL: {
    label: "Purchase Reversal",
    icon: <RotateCcw size={13} />,
    colorClass: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20"
  },
  SALE: {
    label: "Sale",
    icon: <TrendingUp size={13} />,
    colorClass: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20"
  },
  SALE_REVERSAL: {
    label: "Sale Reversal",
    icon: <RotateCcw size={13} />,
    colorClass: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20"
  },
  REPAIR: {
    label: "Repair",
    icon: <Wrench size={13} />,
    colorClass: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20"
  },
  REPAIR_REVERSAL: {
    label: "Repair Reversal",
    icon: <RotateCcw size={13} />,
    colorClass: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20"
  },
  EXTERNAL_PART: {
    label: "External Part Cost",
    icon: <Cpu size={13} />,
    colorClass: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20"
  },
  EXTERNAL_PART_REVERSAL: {
    label: "External Part Reversal",
    icon: <RotateCcw size={13} />,
    colorClass: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20"
  },
  CAPITAL: {
    label: "Capital",
    icon: <ArrowUpCircle size={13} />,
    colorClass: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20"
  },
  WITHDRAWAL: {
    label: "Withdrawal",
    icon: <ArrowDownCircle size={13} />,
    colorClass: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20"
  }
}

const MANUAL_TYPES = [
  { value: "OPENING_BALANCE", label: "Opening Balance — set starting funds" },
  { value: "CAPITAL", label: "Capital — add money to shop" },
  { value: "WITHDRAWAL", label: "Withdrawal — take money from shop" }
]

export const LedgerPage: React.FC = () => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Filters
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LedgerEntry | null>(null)

  // Form state
  const [formType, setFormType] = useState<"OPENING_BALANCE" | "CAPITAL" | "WITHDRAWAL">("CAPITAL")
  const [formAmount, setFormAmount] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formDate, setFormDate] = useState("")

  // Queries
  const {
    data: responseData,
    isLoading
  } = useQuery({
    queryKey: ["ledger", search, typeFilter, page, limit],
    queryFn: () =>
      ledgerApi.listLedger({
        search: search || undefined,
        type: typeFilter || undefined,
        page,
        limit
      }),
  })

  const entries = responseData?.data ?? []
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

  const {
    data: summary = { currentBalance: 0, totalCredits: 0, totalDebits: 0 }
  } = useQuery({
    queryKey: ["ledger-summary"],
    queryFn: () => ledgerApi.getLedgerSummary(),
  })

  const createMutation = useMutation({
    mutationFn: ledgerApi.createManualEntry,
    onSuccess: () => {
      showToast("success", "Ledger entry created successfully")
      queryClient.invalidateQueries({ queryKey: ["ledger"] })
      queryClient.invalidateQueries({ queryKey: ["ledger-summary"] })
      setShowAddModal(false)
      resetForm()
    },
    onError: (err: any) => {
      showToast("error", err?.response?.data?.message || err?.message || "Failed to create entry")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ledgerApi.deleteEntry(id),
    onSuccess: () => {
      showToast("success", "Ledger entry deleted")
      queryClient.invalidateQueries({ queryKey: ["ledger"] })
      queryClient.invalidateQueries({ queryKey: ["ledger-summary"] })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      showToast("error", err?.response?.data?.message || err?.message || "Cannot delete this entry")
      setDeleteTarget(null)
    }
  })

  function resetForm() {
    setFormType("CAPITAL")
    setFormAmount("")
    setFormDescription("")
    setFormDate("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(formAmount)
    if (!formAmount || isNaN(amt) || amt <= 0) {
      showToast("error", "Please enter a valid positive amount")
      return
    }
    createMutation.mutate({
      type: formType,
      amount: amt,
      description: formDescription.trim() || undefined,
      createdAt: formDate ? new Date(formDate).toISOString() : undefined
    })
  }

  const columns: Column<LedgerEntry>[] = [
    {
      header: "Date & Time",
      accessorKey: "createdAt",
      cell: ({ value }) => {
        const d = new Date(value as string)
        return (
          <div className="flex flex-col">
            <span className="text-white text-xs font-medium">
              {d.toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="text-[var(--color-text-muted)] text-[11px]">
              {d.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )
      }
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ value }) => {
        const meta = TYPE_META[value as LedgerEntryType]
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${meta.bg} ${meta.colorClass}`}
          >
            {meta.icon}
            {meta.label}
          </span>
        )
      }
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: ({ value, row }) => (
        <span className={`text-xs ${row.direction === "CREDIT" ? "text-white" : "text-[var(--color-text-secondary)]"}`}>
          {value as string}
        </span>
      )
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ value, row }) => {
        const dir = row.direction as string
        const amt = Number(value)
        return (
          <div className={`text-sm font-bold flex items-center gap-1 ${dir === "CREDIT" ? "text-emerald-400" : "text-red-400"}`}>
            <span>{dir === "CREDIT" ? "+" : "−"}</span>
            <span>Rs. {amt.toLocaleString()}</span>
          </div>
        )
      }
    },
    {
      header: "Balance After",
      accessorKey: "runningBalance",
      cell: ({ value }) => {
        const bal = Number(value)
        return (
          <span className={`text-xs font-semibold ${bal >= 0 ? "text-white" : "text-red-400"}`}>
            Rs. {bal.toLocaleString()}
          </span>
        )
      }
    },
    {
      header: "",
      accessorKey: "id",
      cell: ({ row }) => {
        const autoTypes = ["PURCHASE", "PURCHASE_REVERSAL", "SALE", "SALE_REVERSAL", "REPAIR", "REPAIR_REVERSAL", "EXTERNAL_PART", "EXTERNAL_PART_REVERSAL"]
        if (autoTypes.includes(row.type)) return null
        return (
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
            title="Delete entry"
          >
            <Trash2 size={14} />
          </button>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Ledger"
        subtitle="Bank-account-style record of all shop finances — purchases, sales, repairs, and manual entries"
        action={
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} />
            <span>Add Entry</span>
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Balance */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Current Balance</p>
            <p className={`text-2xl font-bold ${summary.currentBalance >= 0 ? "text-white" : "text-red-400"}`}>
              Rs. {summary.currentBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Credits */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Total Cash In</p>
            <p className="text-2xl font-bold text-emerald-400">
              Rs. {summary.totalCredits.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Debits */}
        <div className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
            <TrendingDown size={22} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Total Cash Out</p>
            <p className="text-2xl font-bold text-red-400">
              Rs. {summary.totalDebits.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter size={16} className="text-[var(--color-text-muted)]" />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">All Types</option>
            <option value="OPENING_BALANCE">Opening Balance</option>
            <option value="PURCHASE">Purchase</option>
            <option value="PURCHASE_REVERSAL">Purchase Reversal</option>
            <option value="SALE">Sale</option>
            <option value="SALE_REVERSAL">Sale Reversal</option>
            <option value="REPAIR">Repair</option>
            <option value="REPAIR_REVERSAL">Repair Reversal</option>
            <option value="EXTERNAL_PART">External Part Cost (Debit)</option>
            <option value="EXTERNAL_PART_REVERSAL">External Part Reversal (Credit)</option>
            <option value="CAPITAL">Capital</option>
            <option value="WITHDRAWAL">Withdrawal</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <DataTable
        columns={columns}
        data={entries}
        isLoading={isLoading}
        pagination={pagination}
        emptyMessage="No ledger entries yet. Start by adding an Opening Balance entry."
      />

      {/* ADD ENTRY MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Ledger Entry"
        size="sm"
        marginTop="0"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-4">
            {/* Entry Type */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] border-b border-[var(--color-border)] pb-2 mb-3">
                <DollarSign size={13} />
                Entry Details
              </label>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Entry Type *
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none transition-colors"
              >
                {MANUAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Amount (Rs.) *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                autoFocus
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={
                  formType === "OPENING_BALANCE"
                    ? "Opening balance — initial shop capital"
                    : formType === "CAPITAL"
                    ? "e.g. Monthly capital top-up"
                    : "e.g. Owner withdrawal for expenses"
                }
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            {/* Date override */}
            <div>
              <label className="block mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
                Date (Optional — defaults to now)
              </label>
              <input
                type="datetime-local"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-md px-3 py-2 text-sm text-white focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Info banner */}
            <div
              className={`text-xs flex items-start gap-2 p-3 rounded-lg border ${
                formType === "WITHDRAWAL"
                  ? "bg-red-500/8 border-red-500/20 text-red-300"
                  : "bg-emerald-500/8 border-emerald-500/20 text-emerald-300"
              }`}
            >
              {formType === "WITHDRAWAL" ? <TrendingDown size={13} className="mt-0.5 shrink-0" /> : <TrendingUp size={13} className="mt-0.5 shrink-0" />}
              <span>
                {formType === "OPENING_BALANCE" && "This sets the initial balance of the shop. Can only be set once."}
                {formType === "CAPITAL" && "Capital increases the shop balance (money coming in)."}
                {formType === "WITHDRAWAL" && "Withdrawal decreases the shop balance (money going out)."}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
               className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
             className="px-5 py-2 rounded bg-[var(--color-accent)] hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              {createMutation.isPending ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Ledger Entry"
        size="sm"
        marginTop="0"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-2">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Are you sure you want to delete this ledger entry? This action cannot be undone.
            </p>
            {deleteTarget && (
              <div className="mt-3 p-3 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Type:</span>
                  <span className={TYPE_META[deleteTarget.type].colorClass + " font-semibold"}>
                    {TYPE_META[deleteTarget.type].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Amount:</span>
                  <span className="text-white font-semibold">Rs. {Number(deleteTarget.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Description:</span>
                  <span className="text-white max-w-[180px] text-right">{deleteTarget.description}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
            <button
              onClick={() => setDeleteTarget(null)}
               className="px-4 py-2 rounded bg-[var(--color-bg-primary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Entry"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
