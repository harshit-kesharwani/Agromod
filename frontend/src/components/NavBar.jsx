import React, { useState } from 'react'
import { Typography, Button, Box, IconButton, Drawer, List, ListItemButton, ListItemText } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

const farmerLinks = [
  { to: '/dashboard', label: 'Farmer Dashboard' },
  { to: '/disease', label: 'Disease' },
  { to: '/yield', label: 'Yield' },
  { to: '/weather', label: 'Weather' },
  { to: '/planner', label: 'Planner' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/schemes', label: 'Schemes' },
  { to: '/prices', label: 'Prices' },
  { to: '/profile', label: 'Profile' },
  { to: '/notifications', label: 'Notifications' },
]

const vendorLinks = [
  { to: '/vendor/dashboard', label: 'Vendor Dashboard' },
  { to: '/vendor/products', label: 'Products' },
  { to: '/vendor/orders', label: 'Orders' },
]

const navButtonSx = {
  color: '#f5f5f5',
  fontFamily: '"Nunito", sans-serif',
  fontWeight: 600,
  borderRadius: '80px',
  '&:hover': { backgroundColor: 'rgba(232, 95, 67, 0.9)' },
}

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setDrawerOpen(false)
  }

  const homeTo = user ? (user.role === 'vendor' ? '/vendor/dashboard' : '/dashboard') : '/'

  const guestNavItems = [
    { to: '/', label: 'Home' },
    { to: '/login', label: 'Login' },
    { to: '/register', label: 'Register' },
  ]
  const farmerNavItems = [...farmerLinks]
  const vendorNavItems = [...vendorLinks]
  const navItems = !user ? guestNavItems : user.role === 'vendor' ? vendorNavItems : farmerNavItems

  const drawerContent = (
    <List sx={{ width: 280, pt: 2 }}>
      {navItems.map((item) => (
        <ListItemButton key={item.to} component={Link} to={item.to} onClick={() => setDrawerOpen(false)}>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
      {user && (
        <ListItemButton onClick={handleLogout}>
          <ListItemText primary="Logout" />
        </ListItemButton>
      )}
    </List>
  )

  return (
    <>
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: '3%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '92vw', sm: '90vw' },
          maxWidth: 1200,
          minHeight: 56,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '20px',
          backgroundColor: 'rgba(26, 46, 26, 0.88)',
          backdropFilter: 'blur(14px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 8px',
          overflow: 'hidden',
        }}
      >
        <Typography component={Link} to={homeTo} variant="h6" sx={{ textDecoration: 'none', color: '#f5f5f5', fontFamily: '"Nunito", sans-serif', fontWeight: 700 }}>
          Agromod
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          {!user ? (
            <>
              <Button component={Link} to="/" sx={navButtonSx}>Home</Button>
              <Button component={Link} to="/login" sx={navButtonSx}>Login</Button>
              <Button component={Link} to="/register" sx={navButtonSx}>Register</Button>
            </>
          ) : user.role === 'vendor' ? (
            <>
              {vendorLinks.map((l) => (
                <Button key={l.to} component={Link} to={l.to} sx={navButtonSx}>{l.label}</Button>
              ))}
              <Button onClick={handleLogout} sx={navButtonSx}>Logout</Button>
            </>
          ) : (
            <>
              {farmerLinks.map((l) => (
                <Button key={l.to} component={Link} to={l.to} sx={navButtonSx}>{l.label}</Button>
              ))}
              <Button onClick={handleLogout} sx={navButtonSx}>Logout</Button>
            </>
          )}
        </Box>
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ display: { xs: 'block', md: 'none' }, color: '#f5f5f5' }} aria-label="Open menu">
          <MenuIcon />
        </IconButton>
        <Box sx={{ minWidth: { xs: 140, sm: 200 }, flexShrink: 0 }} />
      </Box>
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawerContent}
      </Drawer>
    </>
  )
}
