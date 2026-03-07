import React from 'react'
import { Fab, Tooltip, Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

export default function KisanMitraFab() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (!user || user.role === 'vendor' || location.pathname === '/kisan-mitra') return null

  return (
    <Tooltip
      title={
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" fontWeight={700}>किसान मित्र</Typography>
          <Typography variant="caption">Talk to your farming expert</Typography>
        </Box>
      }
      arrow
      placement="left"
    >
      <Fab
        onClick={() => navigate('/kisan-mitra')}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: 1200,
          width: { xs: 60, sm: 64 },
          height: { xs: 60, sm: 64 },
          background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(27,94,32,0.4), 0 0 0 4px rgba(67,160,71,0.15)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
            boxShadow: '0 6px 28px rgba(27,94,32,0.5), 0 0 0 6px rgba(67,160,71,0.2)',
          },
          transition: 'all 0.3s ease',
          animation: 'fabBounce 3s ease-in-out infinite',
          '@keyframes fabBounce': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-6px)' },
          },
        }}
        aria-label="Kisan Mitra — Talk to farming expert"
      >
        <SupportAgentIcon sx={{ fontSize: { xs: 30, sm: 34 } }} />
      </Fab>
    </Tooltip>
  )
}
