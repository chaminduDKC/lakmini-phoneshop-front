import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ShieldAlert, Calendar, ArrowRight, X } from 'lucide-react'
import { accountApi } from '../api/account'

export const SubscriptionBanner: React.FC = () => {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const { data } = useQuery({
    queryKey: ['account-status'],
    queryFn: accountApi.get,
    refetchInterval: 60000, // Re-check every 60 seconds
  })

  const account = data?.data
  if (!account) return null

  const { status, dueDate, remainingDays, suspendReason } = account

  // Format dueDate for display
  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  // 1. Critical Account Suspended Banner (Cannot be dismissed)
  if (status === 'SUSPENDED') {
    return (
      <div className="w-full bg-red-600/15 border-b border-red-500/30 text-red-300 px-6 py-3 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-md bg-red-500/20 text-red-400 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div className="min-w-0 text-sm">
            <span className="font-semibold text-white tracking-wide uppercase mr-2 text-xs px-2 py-0.5 rounded bg-red-500/30 border border-red-500/40">
              Account Suspended
            </span>
            <span className="font-medium">
              Monthly subscription payment is overdue.
            </span>
            {suspendReason && (
              <span className="text-red-400/90 ml-1">({suspendReason})</span>
            )}
            {formattedDueDate && (
              <span className="text-red-400/80 ml-1.5 text-xs">
                • Due date was {formattedDueDate}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="ml-4 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium text-xs transition-colors shadow-sm"
        >
          <span>Manage Account</span>
          <ArrowRight size={14} />
        </button>
      </div>
    )
  }

  // 2. Warning Banner when remaining days < 5
  const showWarning = status === 'ACTIVE' && remainingDays !== null && remainingDays < 5
  if (!showWarning || dismissed) return null

  // Determine message based on remainingDays
  let message = ''
  if (remainingDays <= 0) {
    message = `Monthly payment was due today (${formattedDueDate}). Please renew immediately to avoid account suspension.`
  } else if (remainingDays === 1) {
    message = `Monthly subscription payment is due tomorrow (${formattedDueDate}). Please renew to keep your account active.`
  } else {
    message = `Monthly subscription payment is due in ${remainingDays} days (${formattedDueDate}). Please renew to prevent service disruption.`
  }

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-6 py-2.5 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0 text-sm flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-amber-100 tracking-wide uppercase text-xs px-2 py-0.5 rounded bg-amber-500/25 border border-amber-500/40">
            Payment Due Soon
          </span>
          <span className="font-medium text-amber-100/90">{message}</span>
          {formattedDueDate && (
            <span className="flex items-center gap-1 text-xs text-amber-300/80">
              <Calendar size={13} />
              {formattedDueDate}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 font-medium text-xs transition-colors border border-amber-500/40"
        >
          <span>Renew / View Details</span>
          <ArrowRight size={13} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          title="Dismiss for this session"
          className="p-1 rounded text-amber-300/70 hover:text-amber-100 hover:bg-amber-500/20 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
