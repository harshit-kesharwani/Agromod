import React from 'react'
import { Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'

const tiles = [
  { title: 'My Products', to: '/vendor/products', desc: 'Add, edit, manage products' },
  { title: 'Orders', to: '/vendor/orders', desc: 'View and update order status' },
  { title: 'Inventory', to: '/vendor/products', desc: 'Update stock and costs' },
]

export default function VendorDashboard() {
  const navigate = useNavigate()
  return (
    <Layout showVendorNav>
      <Typography variant="h4" gutterBottom>Vendor Dashboard</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Manage your products and orders.</Typography>
      <Grid container spacing={2}>
        {tiles.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.to}>
            <Card>
              <CardActionArea onClick={() => navigate(t.to)}>
                <CardContent>
                  <Typography variant="h6">{t.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.desc}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  )
}
