import React, { useEffect } from 'react'
import { Box } from '@mui/material'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import KisanMitraFab from './components/KisanMitraFab'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Disease from './pages/Disease'
import Yield from './pages/Yield'
import Weather from './pages/Weather'
import Planner from './pages/Planner'
import Marketplace from './pages/Marketplace'
import Schemes from './pages/Schemes'
import Prices from './pages/Prices'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import KisanMitra from './pages/KisanMitra'
import VendorDashboard from './pages/vendor/VendorDashboard'
import VendorProducts from './pages/vendor/VendorProducts'
import VendorOrders from './pages/vendor/VendorOrders'

function ProtectedRoute({ children, requireVendor }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (requireVendor && user.role !== 'vendor') return <Navigate to="/dashboard" replace />
  if (!requireVendor && user.role === 'vendor') return <Navigate to="/vendor/dashboard" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    return <Navigate to={user.role === 'vendor' ? '/vendor/dashboard' : '/dashboard'} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/disease" element={<ProtectedRoute><Disease /></ProtectedRoute>} />
      <Route path="/yield" element={<ProtectedRoute><Yield /></ProtectedRoute>} />
      <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
      <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
      <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
      <Route path="/prices" element={<ProtectedRoute><Prices /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/kisan-mitra" element={<ProtectedRoute><KisanMitra /></ProtectedRoute>} />
      <Route path="/vendor/dashboard" element={<ProtectedRoute requireVendor><VendorDashboard /></ProtectedRoute>} />
      <Route path="/vendor/products" element={<ProtectedRoute requireVendor><VendorProducts /></ProtectedRoute>} />
      <Route path="/vendor/orders" element={<ProtectedRoute requireVendor><VendorOrders /></ProtectedRoute>} />
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const APP_BG =
  'linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.88)), url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80) center/cover'

function useProtectFromTranslate() {
  useEffect(() => {
    const PROTECT_SELECTORS = [
      '.MuiPopover-root',
      '.MuiDialog-root',
      '.MuiMenu-root',
      '.MuiModal-root',
      '.MuiDrawer-root',
      '.MuiAutocomplete-popper',
      '.MuiTooltip-popper',
    ]

    function markNotranslate(root) {
      PROTECT_SELECTORS.forEach((sel) => {
        root.querySelectorAll(sel).forEach((el) => {
          if (!el.classList.contains('notranslate')) {
            el.classList.add('notranslate')
            el.setAttribute('translate', 'no')
          }
        })
      })
    }

    markNotranslate(document.body)

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            const el = node
            const isTarget = PROTECT_SELECTORS.some(
              (sel) => el.matches?.(sel) || el.querySelector?.(sel)
            )
            if (isTarget) {
              if (!el.classList.contains('notranslate')) {
                el.classList.add('notranslate')
                el.setAttribute('translate', 'no')
              }
              markNotranslate(el)
            }
          }
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
}

export default function App() {
  useProtectFromTranslate()

  return (
    <AuthProvider>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: APP_BG,
          backgroundAttachment: 'fixed',
          position: 'relative',
        }}
      >
        <NavBar />
        <Box component="main" sx={{ position: 'relative', flex: 1, pt: '104px' }}>
          <AppRoutes />
        </Box>
        <KisanMitraFab />
        <Footer />
      </Box>
    </AuthProvider>
  )
}
