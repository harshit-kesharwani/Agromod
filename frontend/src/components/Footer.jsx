import React from 'react'
import { Box, Typography } from '@mui/material'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        textAlign: 'center',
        backgroundColor: 'rgba(46, 125, 50, 0.12)',
        borderTop: '1px solid rgba(46, 125, 50, 0.2)',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {year} Gen-Innovators. All rights reserved.
      </Typography>
    </Box>
  )
}
