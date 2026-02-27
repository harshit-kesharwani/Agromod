import React, { useState, useEffect } from 'react'
import { Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Layout from '../../components/Layout'
import api from '../../services/api'

export default function VendorOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/api/vendor/orders/').then(({ data }) => setOrders(data.results || data))
  }, [])

  const updateStatus = (id, status) => {
    api.patch(`/api/vendor/orders/${id}/`, { status }).then(() => {
      setOrders((o) => (Array.isArray(o) ? o : []).map((x) => x.id === id ? { ...x, status } : x))
    })
  }

  const list = Array.isArray(orders) ? orders : []

  return (
    <Layout showVendorNav>
      <Typography variant="h5" gutterBottom>Orders</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow><TableCell>Order ID</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell>Update</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {list.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.id}</TableCell>
                <TableCell>₹{o.total}</TableCell>
                <TableCell>{o.status}</TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={o.status} label="Status" onChange={(e) => updateStatus(o.id, e.target.value)}>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="shipped">Shipped</MenuItem>
                      <MenuItem value="delivered">Delivered</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {list.length === 0 && <Typography sx={{ p: 2 }} color="text.secondary">No orders.</Typography>}
      </Paper>
    </Layout>
  )
}
