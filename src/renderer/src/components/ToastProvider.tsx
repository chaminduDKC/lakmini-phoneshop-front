import React, { createContext, useCallback, useContext, useState } from 'react'
import { Toast, ToastStatus } from './Toast'

interface ToastItem {
  id: string
  status: ToastStatus
  message: string
}

interface ToastContextValue {
  showToast: (arg1: string, arg2?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const VALID_STATUSES: ToastStatus[] = ['success', 'error', 'warning', 'info']

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((arg1: string, arg2?: string) => {
    const id = crypto.randomUUID()
    let status: ToastStatus = 'info'
    let message = ''

    if (VALID_STATUSES.includes(arg1 as ToastStatus)) {
      status = arg1 as ToastStatus
      message = arg2 || ''
    } else if (arg2 && VALID_STATUSES.includes(arg2 as ToastStatus)) {
      status = arg2 as ToastStatus
      message = arg1
    } else {
      message = arg1
      status = 'info'
    }

    setToasts(prev => [...prev, { id, status, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <Toast
            key={t.id}
            status={t.status}
            message={t.message}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Usage: const { showToast } = useToast(); showToast('success', 'Category saved')
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}