import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Wrench,
  Package,
  Truck,
  ShoppingCart,
  DollarSign,
  UserCircle,
  BarChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layers,
  BookOpen,
  Settings2
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { SubscriptionBanner } from './SubscriptionBanner'

export const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navGroups = [
    {
      title: 'OPERATIONS',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/jobs', label: 'Repair Jobs', icon: Wrench },
        { path: '/phone-models', label: 'Phone Models', icon: Smartphone },
        { path: '/categories', label: 'Categories', icon: Layers },
        { path: '/ledger', label: 'Ledger', icon: BookOpen }
      ]
    },
    {
      title: 'INVENTORY & SALES',
      items: [
        { path: '/sales', label: 'Sales (POS)', icon: DollarSign },
        { path: '/purchases', label: 'Purchases', icon: ShoppingCart },
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/suppliers', label: 'Suppliers', icon: Truck }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { path: '/customers', label: 'Customers', icon: Users },
        // { path: '/workers', label: 'Staff / Workers', icon: UserCircle },
        // { path: '/reports', label: 'Reports', icon: BarChart },
        { path: '/settings', label: 'Business Info', icon: Settings2 },
      ]
    }
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <aside
        style={{
          width: isCollapsed ? 72 : 225,
          transitionProperty: 'width',
          transitionDuration: '260ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'width'
        }}
        className="flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--color-border)] no-drag shrink-0">
          <div className="flex items-center gap-2 font-bold text-lg text-white overflow-hidden relative w-full">
            <Smartphone size={22} className={`text-[var(--color-accent)] shrink-0 `} style={{ opacity: isCollapsed ? 0 : 1,}} />
            <span
              className="whitespace-nowrap transition-[opacity,transform] duration-200 ease-out"
              style={{
                opacity: isCollapsed ? 0 : 1,
                transform: isCollapsed ? 'translateX(-6px)' : 'translateX(0)',
                transitionDelay: isCollapsed ? '0ms' : '60ms'
              }}
            >
              Lakmini Mobile
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] no-drag transition-colors duration-150 shrink-0"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 no-drag custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              <div
                className="px-4 mb-2 text-xs font-semibold text-[var(--color-text-muted)] tracking-wider uppercase overflow-hidden transition-[opacity,max-height] duration-200 ease-out"
                style={{
                  opacity: isCollapsed ? 0 : 1,
                  maxHeight: isCollapsed ? 0 : 20
                }}
              >
                <span className="whitespace-nowrap">{group.title}</span>
              </div>
              <nav className="space-y-1 px-2">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm
                      ${
                        isActive
                          ? 'bg-[var(--color-bg-primary)] text-[var(--color-accent)] font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] hover:text-white'
                      }
                    `}
                    style={{
                      transitionProperty: 'background-color, color',
                      transitionDuration: '200ms',
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <item.icon
                      size={19}
                      className="shrink-0 transition-transform duration-200 ease-out"
                      style={{ transform: isCollapsed ? 'translateX(6px)' : 'translateX(0)' }}
                    />
                    <span
                      className="whitespace-nowrap transition-[opacity,transform] duration-200 ease-out"
                      style={{
                        opacity: isCollapsed ? 0 : 1,
                        transform: isCollapsed ? 'translateX(-6px)' : 'translateX(0)',
                        width: isCollapsed ? 0 : 'auto'
                      }}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[var(--color-border)] no-drag shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div
              className="flex flex-col overflow-hidden transition-[opacity,transform] duration-200 ease-out"
              style={{
                opacity: isCollapsed ? 0 : 1,
                transform: isCollapsed ? 'translateX(-6px)' : 'translateX(0)',
                width: isCollapsed ? 0 : 'auto'
              }}
            >
              <span className="text-sm font-medium text-white truncate">{user?.username}</span>
              <span className="text-xs text-[var(--color-text-muted)] capitalize">{user?.role?.toLowerCase()}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-md text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500 transition-colors duration-150 shrink-0"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] -webkit-app-region drag">
          <div className="no-drag font-medium text-lg text-white">
            {/* Header Content */}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <SubscriptionBanner />

        <div className="flex-1 overflow-auto bg-[var(--color-bg-primary)] p-6 no-drag custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  )
}