import React from 'react'
import { Box, Container } from '@mui/material'
import ChatWidget from './ChatWidget'

export default function Layout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="xl" sx={{ pt: 'calc(3% + 72px)', pb: 3, flex: 1 }}>
        {children}
      </Container>
      <ChatWidget />
    </Box>
  )
}
