import React, { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastStatus = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  status: ToastStatus
  message: string
  duration?: number       // ms before auto-dismiss, default 4000. Pass 0 to disable.
  onClose: () => void
}

const STATUS_CONFIG: Record<
  ToastStatus,
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  success: {
    icon: CheckCircle2,
    color: 'var(--color-success)',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.3)',
  },
  error: {
    icon: XCircle,
    color: 'var(--color-error)',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    icon: AlertTriangle,
    color: 'var(--color-warning)',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    icon: Info,
    color: 'var(--color-info)',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
  },
}

export const Toast: React.FC<ToastProps> = ({ status, message, duration = 4000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false)
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.info
  const Icon = config.icon

  const handleClose = () => {
    setIsExiting(true)
    // wait for the exit animation to finish before unmounting via parent
    setTimeout(onClose, 200)
  }

  useEffect(() => {
    if (duration <= 0) return
    const timer = setTimeout(handleClose, duration)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast-item ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon size={18} style={{ color: config.color }} className="shrink-0" />
      <p className="text-sm text-[var(--color-text-primary)] flex-1">{message}</p>
      <button
        type="button"
        onClick={handleClose}
        className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>

      <style>{`
        .toast-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.75rem 0.875rem;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(10px);
          min-width: 280px;
          max-width: 420px;
        }
        .toast-enter {
          animation: toastSlideIn 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .toast-exit {
          animation: toastSlideOut 200ms ease-in forwards;
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(24px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(24px) scale(0.96); }
        }
        @media (prefers-reduced-motion: reduce) {
          .toast-enter, .toast-exit { animation: none; }
        }
      `}</style>
    </div>
  )
}