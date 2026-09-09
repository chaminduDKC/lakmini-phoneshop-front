import React, { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Building2,
  Phone,
  MapPin,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Info,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Clock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { businessInfoApi, UpdateBusinessInfoPayload } from "@renderer/api/businessInfo"
import { accountApi, AccountStatus, UpdateAccountPayload } from "@renderer/api/account"

const FIELD_CLASS =
  "w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"

const LABEL_CLASS = "block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1.5"

export const BusinessInfoPage: React.FC = () => {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'business' | 'account'>('business')

  // --- Business Info Query & Mutations ---
  const { data: businessData, isLoading: isBusinessLoading } = useQuery({
    queryKey: ["business-info"],
    queryFn: businessInfoApi.get,
  })
  const info = businessData?.data

  const [form, setForm] = useState<UpdateBusinessInfoPayload>({
    businessName: "",
    subTitle: "",
    tagline: "",
    phone1: "",
    phone2: "",
    address: "",
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (info) {
      setForm({
        businessName: info.businessName ?? "",
        subTitle: info.subTitle ?? "",
        tagline: info.tagline ?? "",
        phone1: info.phone1 ?? "",
        phone2: info.phone2 ?? "",
        address: info.address ?? "",
      })
    }
  }, [info])

  const businessMutation = useMutation({
    mutationFn: (payload: UpdateBusinessInfoPayload) => businessInfoApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-info"] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  // --- Account & Subscription Query & Mutations ---
  const { data: accountData, isLoading: isAccountLoading } = useQuery({
    queryKey: ["account-status"],
    queryFn: accountApi.get,
  })
  const account = accountData?.data

  const [accountForm, setAccountForm] = useState<{
    name: string
    status: AccountStatus
    dueDate: string
    suspendReason: string
  }>({
    name: "",
    status: "ACTIVE",
    dueDate: "",
    suspendReason: "",
  })
  const [accountSaved, setAccountSaved] = useState(false)

  useEffect(() => {
    if (account) {
      setAccountForm({
        name: account.name ?? "",
        status: account.status ?? "ACTIVE",
        dueDate: account.dueDate ? account.dueDate.slice(0, 10) : "",
        suspendReason: account.suspendReason ?? "",
      })
    }
  }, [account])

  const accountMutation = useMutation({
    mutationFn: (payload: UpdateAccountPayload) => accountApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account-status"] })
      setAccountSaved(true)
      setTimeout(() => setAccountSaved(false), 3000)
    },
  })

  const checkSuspensionMutation = useMutation({
    mutationFn: () => accountApi.checkSuspension(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account-status"] })
    },
  })

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    businessMutation.mutate(form)
  }

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    accountMutation.mutate({
      name: accountForm.name,
      status: accountForm.status,
      dueDate: accountForm.dueDate ? accountForm.dueDate : null,
      suspendReason: accountForm.suspendReason || null,
    })
  }

  const handleAddDays = (days: number) => {
    const base = accountForm.dueDate ? new Date(accountForm.dueDate) : new Date()
    base.setDate(base.getDate() + days)
    setAccountForm((prev) => ({ ...prev, dueDate: base.toISOString().slice(0, 10) }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          {activeTab === 'business' ? (
            <Building2 size={26} className="text-[var(--color-accent)]" />
          ) : (
            <CreditCard size={26} className="text-[var(--color-accent)]" />
          )}
          Settings & Configuration
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Manage business bill details, account status, and subscription payment due dates.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 pb-3 px-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'business'
              ? 'border-[var(--color-accent)] text-white'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-white'
          }`}
        >
          <Building2 size={17} />
          Business Information
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 pb-3 px-3 font-semibold text-sm transition-colors border-b-2 relative ${
            activeTab === 'account'
              ? 'border-[var(--color-accent)] text-white'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-white'
          }`}
        >
          <CreditCard size={17} />
          Account & Subscription
          {account?.status === 'SUSPENDED' && (
            <span className="w-2 h-2 rounded-full bg-red-500" title="Account Suspended" />
          )}
          {account?.status === 'ACTIVE' && account?.remainingDays !== null && account.remainingDays < 5 && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Payment Due Soon" />
          )}
        </button>
      </div>

      {/* ================= TAB 1: BUSINESS INFO ================= */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>
              Changes here will reflect on the next printed bill. Previously printed bills are unaffected.
            </span>
          </div>

          <form
            onSubmit={handleBusinessSubmit}
            className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 space-y-5"
          >
            {isBusinessLoading ? (
              <div className="flex items-center justify-center py-12 text-[var(--color-text-muted)]">
                <Loader2 size={22} className="animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <>
                <div>
                  <label className={LABEL_CLASS} htmlFor="businessName">
                    <Building2 size={12} className="inline mr-1.5" />
                    Business Name *
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    placeholder="e.g. LAKMINI MOBILE"
                    value={form.businessName}
                    onChange={handleBusinessChange}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS} htmlFor="subTitle">
                    <Tag size={12} className="inline mr-1.5" />
                    Sub Title
                  </label>
                  <input
                    id="subTitle"
                    name="subTitle"
                    type="text"
                    placeholder="e.g. Mobile Phones & Accessories"
                    value={form.subTitle}
                    onChange={handleBusinessChange}
                    className={FIELD_CLASS}
                  />
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Shown just below the business name on invoices
                  </p>
                </div>

                <div>
                  <label className={LABEL_CLASS} htmlFor="tagline">
                    <Tag size={12} className="inline mr-1.5" />
                    Tagline / Description
                  </label>
                  <input
                    id="tagline"
                    name="tagline"
                    type="text"
                    placeholder="e.g. Mobile Phones, Accessories & Professional Repair Center"
                    value={form.tagline}
                    onChange={handleBusinessChange}
                    className={FIELD_CLASS}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS} htmlFor="phone1">
                      <Phone size={12} className="inline mr-1.5" />
                      Phone Number 1 *
                    </label>
                    <input
                      id="phone1"
                      name="phone1"
                      type="tel"
                      required
                      placeholder="077 123 4567"
                      value={form.phone1}
                      onChange={handleBusinessChange}
                      className={FIELD_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS} htmlFor="phone2">
                      <Phone size={12} className="inline mr-1.5" />
                      Phone Number 2
                    </label>
                    <input
                      id="phone2"
                      name="phone2"
                      type="tel"
                      placeholder="071 987 6543"
                      value={form.phone2}
                      onChange={handleBusinessChange}
                      className={FIELD_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS} htmlFor="address">
                    <MapPin size={12} className="inline mr-1.5" />
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    required
                    rows={3}
                    placeholder="e.g. 45/B Main Street, Horana, Sri Lanka"
                    value={form.address}
                    onChange={handleBusinessChange}
                    className={FIELD_CLASS + " resize-none"}
                  />
                </div>

                {businessMutation.isError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-4 py-3">
                    <AlertCircle size={16} />
                    {(businessMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                      "Failed to save. Please try again."}
                  </div>
                )}

                {saved && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800/30 rounded-lg px-4 py-3">
                    <CheckCircle2 size={16} />
                    Business information saved successfully!
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
                  <button
                    type="submit"
                    disabled={businessMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-accent)] hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-lg text-sm transition-colors"
                  >
                    {businessMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {businessMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </form>

          {!isBusinessLoading && (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Invoice Header Preview
              </h2>
              <div className="bg-white text-black rounded-lg p-5 text-center font-sans shadow-inner">
                <h3 className="text-xl font-black tracking-wider uppercase text-neutral-900">
                  {form.businessName || "BUSINESS NAME"}
                </h3>
                {form.subTitle && (
                  <p className="text-xs text-neutral-600 font-semibold mt-0.5">{form.subTitle}</p>
                )}
                {form.tagline && (
                  <p className="text-xs text-neutral-500 mt-0.5">{form.tagline}</p>
                )}
                <div className="text-xs text-neutral-700 mt-1.5 flex flex-wrap justify-center gap-x-4">
                  {form.address && <span>{form.address}</span>}
                  {(form.phone1 || form.phone2) && (
                    <span>
                      Tel: {form.phone1}
                      {form.phone2 ? ` / ${form.phone2}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ACCOUNT & SUBSCRIPTION ================= */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Status Overview Card */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={20} className="text-[var(--color-accent)]" />
                Subscription & Account Status
              </h2>

              <button
                type="button"
                onClick={() => checkSuspensionMutation.mutate()}
                disabled={checkSuspensionMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-primary)] hover:bg-neutral-800 text-[var(--color-text-secondary)] hover:text-white border border-[var(--color-border)] text-xs font-medium transition-colors"
                title="Evaluate due date and update suspension if payment is overdue"
              >
                <RefreshCw size={13} className={checkSuspensionMutation.isPending ? "animate-spin" : ""} />
                Check Overdue Now
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Account Status */}
              <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Account Status</span>
                <div className="mt-2 flex items-center gap-2">
                  {account?.status === 'ACTIVE' ? (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-emerald-400">ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={18} className="text-red-400" />
                      <span className="font-bold text-red-400">SUSPENDED</span>
                    </>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Payment Due Date</span>
                <div className="mt-2 flex items-center gap-2 text-white font-medium">
                  <Calendar size={16} className="text-[var(--color-accent)]" />
                  <span>
                    {account?.dueDate
                      ? new Date(account.dueDate).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'No due date set'}
                  </span>
                </div>
              </div>

              {/* Remaining Days */}
              <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Days Remaining</span>
                <div className="mt-2 flex items-center gap-2">
                  <Clock size={16} className="text-[var(--color-text-secondary)]" />
                  {account?.remainingDays === null || account?.remainingDays === undefined ? (
                    <span className="text-neutral-400 text-sm">N/A</span>
                  ) : account.remainingDays <= 0 ? (
                    <span className="font-bold text-red-400 text-sm">Overdue (0 days)</span>
                  ) : account.remainingDays < 5 ? (
                    <span className="font-bold text-amber-400 text-sm flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {account.remainingDays} day{account.remainingDays === 1 ? '' : 's'} (Warning active)
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-400 text-sm">
                      {account.remainingDays} days
                    </span>
                  )}
                </div>
              </div>
            </div>

            {account?.status === 'SUSPENDED' && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300 flex items-start gap-2.5">
                <ShieldAlert size={18} className="shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="font-semibold text-red-200">Account is Suspended</p>
                  <p className="text-xs mt-0.5 text-red-300/90">
                    Reason: {account.suspendReason || 'Monthly payment not paid'}
                  </p>
                  {account.suspendedAt && (
                    <p className="text-xs text-red-400/80 mt-0.5">
                      Suspended on: {new Date(account.suspendedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account Edit Form */}
          {/*  */}
          {/*  */}
          {/*  */}
        </div>
      )}
    </div>
  )
}