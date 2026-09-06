import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/LoadingSpinner'

// Pages
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CategoryAndAttributes } from './pages/CategoryAndAttributes'
import { PhoneModels } from './pages/PhoneModels'
import { PurchasesPage } from './pages/PurchasesPage'
import { InventoryPage } from './pages/InventoryPage'
import { SuppliersPage } from './pages/SuppliersPage'
import { SalesPage } from './pages/SalesPage'
import { JobsPage } from './pages/JobsPage'
import { CustomersPage } from './pages/CustomersPage'
import { LedgerPage } from './pages/LedgerPage'
import { BusinessInfoPage } from './pages/BusinessInfoPage'

const App: React.FC = () => {
  const { isAuthenticated, isLoading, initAuth } = useAuthStore()

  
  useEffect(() => {
    initAuth()
  }, [initAuth])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }
 
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="categories" element={<CategoryAndAttributes />} />
        <Route path="phone-models" element={<PhoneModels />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="ledger" element={<LedgerPage />} />
        <Route path="settings" element={<BusinessInfoPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
