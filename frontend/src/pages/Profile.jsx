import React from 'react'
import { Typography, Paper } from '@mui/material'
import Layout from '../components/Layout'
import { useAuth } from '../store/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Profile</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Email: {user?.email}</Typography>
        <Typography>Role: {user?.role}</Typography>
        <Typography>Name: {user?.first_name} {user?.last_name}</Typography>
        <Typography>Phone: {user?.phone || '-'}</Typography>
        {user?.farmer_profile && (
          <>
            <Typography>Region: {user.farmer_profile.region || '-'}</Typography>
            <Typography>State: {user.farmer_profile.state || '-'}</Typography>
          </>
        )}
        {user?.vendor_profile && (
          <Typography>Business: {user.vendor_profile.business_name || '-'}</Typography>
        )}
      </Paper>
    </Layout>
  )
}
