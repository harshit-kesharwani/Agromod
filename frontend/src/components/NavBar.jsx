import React, { useState } from 'react'
import {
  Button, Box, IconButton, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, Tooltip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import LogoutIcon from '@mui/icons-material/Logout'
import HomeIcon from '@mui/icons-material/Home'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BugReportIcon from '@mui/icons-material/BugReport'
import BarChartIcon from '@mui/icons-material/BarChart'
import CloudIcon from '@mui/icons-material/Cloud'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import StorefrontIcon from '@mui/icons-material/Storefront'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import PersonIcon from '@mui/icons-material/Person'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import InventoryIcon from '@mui/icons-material/Inventory'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

const UTILITY_HEIGHT = 32
const NAV_HEIGHT = 52

const farmerLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { to: '/disease', label: 'Disease', icon: <BugReportIcon fontSize="small" /> },
  { to: '/yield', label: 'Yield', icon: <BarChartIcon fontSize="small" /> },
  { to: '/weather', label: 'Weather', icon: <CloudIcon fontSize="small" /> },
  { to: '/planner', label: 'Planner', icon: <CalendarMonthIcon fontSize="small" /> },
  { to: '/marketplace', label: 'Market', icon: <StorefrontIcon fontSize="small" /> },
  { to: '/schemes', label: 'Schemes', icon: <AccountBalanceIcon fontSize="small" /> },
  { to: '/prices', label: 'Prices', icon: <TrendingUpIcon fontSize="small" /> },
  { to: '/kisan-mitra', label: 'Kisan Mitra', icon: <SupportAgentIcon fontSize="small" /> },
  { to: '/profile', label: 'Profile', icon: <PersonIcon fontSize="small" /> },
]

const vendorLinks = [
  { to: '/vendor/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { to: '/vendor/products', label: 'Products', icon: <InventoryIcon fontSize="small" /> },
  { to: '/vendor/orders', label: 'Orders', icon: <ReceiptLongIcon fontSize="small" /> },
]

const guestLinks = [
  { to: '/', label: 'Home', icon: <HomeIcon fontSize="small" /> },
  { to: '/login', label: 'Login', icon: <LoginIcon fontSize="small" /> },
  { to: '/register', label: 'Register', icon: <PersonAddIcon fontSize="small" /> },
]

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setDrawerOpen(false)
  }

  const homeTo = user ? (user.role === 'vendor' ? '/vendor/dashboard' : '/dashboard') : '/'
  const links = !user ? guestLinks : user.role === 'vendor' ? vendorLinks : farmerLinks
  const isActive = (path) => location.pathname === path

  const navBtnSx = (path) => ({
    color: isActive(path) ? '#fff' : 'rgba(255,255,255,0.78)',
    fontFamily: '"Nunito", sans-serif',
    fontWeight: isActive(path) ? 700 : 600,
    fontSize: '0.8rem',
    px: 1.5,
    py: 0.5,
    minWidth: 0,
    borderRadius: '20px',
    whiteSpace: 'nowrap',
    textTransform: 'none',
    backgroundColor: isActive(path) ? 'rgba(255,255,255,0.12)' : 'transparent',
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' },
    transition: 'all 0.2s ease',
  })

  const drawerContent = (
    <Box sx={{ width: 290, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8faf8' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 2, pb: 1.5 }}>
        <Box component="img" src="/assets/logo.png" alt="AgroMod" sx={{ height: 36, width: 'auto' }} />
        <IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon /></IconButton>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1, pt: 1 }}>
        {links.map((item) => (
          <ListItemButton
            key={item.to} component={Link} to={item.to}
            onClick={() => setDrawerOpen(false)}
            selected={isActive(item.to)}
            sx={{ borderRadius: 2, mb: 0.3 }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: isActive(item.to) ? 'primary.main' : 'text.secondary' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive(item.to) ? 700 : 500, fontSize: '0.9rem' }} />
          </ListItemButton>
        ))}
        {user && user.role !== 'vendor' && (
          <ListItemButton
            component={Link} to="/notifications" onClick={() => setDrawerOpen(false)}
            selected={isActive('/notifications')} sx={{ borderRadius: 2, mb: 0.3 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}><NotificationsNoneIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Notifications" />
          </ListItemButton>
        )}
      </List>
      {user && (
        <>
          <Divider />
          <List sx={{ px: 1, pb: 2 }}>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main' }}>
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </List>
        </>
      )}
    </Box>
  )

  return (
    <>
      {/* ═══════ TIER 1: Utility Bar background ═══════
          The Google Translate widget is positioned here via CSS in index.html.
          This Box just renders the dark background strip. */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: UTILITY_HEIGHT,
          zIndex: 1301,
          backgroundColor: '#0d2e0d',
          pointerEvents: 'none',
        }}
      />

      {/* ═══════ TIER 2: Main Floating Curved Nav Bar ═══════ */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: `${UTILITY_HEIGHT + 8}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '96vw', sm: '94vw', md: '92vw' },
          maxWidth: 1280,
          height: NAV_HEIGHT,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          borderRadius: '26px',
          backgroundColor: 'rgba(22, 48, 22, 0.88)',
          backdropFilter: 'blur(18px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          px: { xs: 1.5, sm: 2, md: 2.5 },
        }}
      >
        {/* Left: Logo */}
        <Box
          component={Link}
          to={homeTo}
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            flexShrink: 0,
            mr: { xs: 1, md: 2 },
          }}
        >
          <Box
            component="img"
            src="/assets/logo.png"
            alt="AgroMod"
            sx={{ height: { xs: 32, sm: 38 }, width: 'auto' }}
          />
        </Box>

        {/* Center: Nav links — desktop */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            gap: 0.3,
          }}
        >
          {links.map((l) => (
            <Button key={l.to} component={Link} to={l.to} size="small" sx={navBtnSx(l.to)}>
              {l.label}
            </Button>
          ))}
        </Box>

        {/* Right: Notifications + Logout — desktop */}
        {user && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            {user.role !== 'vendor' && (
              <Tooltip title="Notifications" arrow>
                <IconButton
                  component={Link}
                  to="/notifications"
                  size="small"
                  sx={{
                    color: isActive('/notifications') ? '#fff' : 'rgba(255,255,255,0.7)',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <NotificationsNoneIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}
            <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255,255,255,0.15)' }} />
            <Tooltip title="Logout" arrow>
              <IconButton
                onClick={handleLogout}
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': { color: '#ef5350', bgcolor: 'rgba(239,83,80,0.1)' },
                }}
              >
                <LogoutIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Mobile: hamburger */}
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{ display: { xs: 'flex', md: 'none' }, color: '#f5f5f5', ml: 'auto' }}
          aria-label="Open menu"
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px 0 0 16px' } }}
      >
        {drawerContent}
      </Drawer>
    </>
  )
}
