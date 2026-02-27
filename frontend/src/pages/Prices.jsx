import React, { useState, useEffect } from 'react'
import { Typography, Paper, TextField, Button, Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Prices() {
  const [commodity, setCommodity] = useState('Wheat')
  const [prices, setPrices] = useState([])
  const [history, setHistory] = useState([])
  const [prediction, setPrediction] = useState('')

  const loadPrices = () => api.get('/api/prices/mandi/', { params: { commodity } }).then(({ data }) => setPrices(data.prices || []))
  const loadHistory = () => api.get('/api/prices/history/', { params: { commodity } }).then(({ data }) => setHistory(data.history || []))
  const loadPredict = () => api.get('/api/prices/predict/', { params: { commodity } }).then(({ data }) => setPrediction(data.prediction || data.message || ''))

  useEffect(() => { loadPrices(); loadHistory(); loadPredict() }, [commodity])

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Price Prediction</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Mandi prices, previous period chart and trend.</Typography>
      <Box sx={{ mb: 2 }}>
        <TextField size="small" label="Commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} placeholder="e.g. Wheat, Rice" />
        <Button sx={{ ml: 1 }} onClick={() => { loadPrices(); loadHistory(); loadPredict() }}>Refresh</Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Current / Latest prices</Typography>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>Commodity</TableCell><TableCell>Market</TableCell><TableCell>State</TableCell><TableCell>Price</TableCell><TableCell>Date</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {(prices || []).slice(0, 15).map((p, i) => (
              <TableRow key={i}><TableCell>{p.commodity}</TableCell><TableCell>{p.market}</TableCell><TableCell>{p.state}</TableCell><TableCell>₹{p.price}/{p.unit}</TableCell><TableCell>{p.date}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">History (avg by month)</Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 120, mt: 1 }}>
          {(history || []).slice(-12).map((h, i) => (
            <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ height: 80, alignSelf: 'stretch', bgcolor: 'primary.main', opacity: 0.7, minHeight: 4 }} title={`${h.month}: ₹${h.avg_price}`} />
              <Typography variant="caption">{h.month?.slice(0, 7)}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Trend / Forecast</Typography>
        <Typography>{prediction || 'Select commodity and refresh.'}</Typography>
      </Paper>
    </Layout>
  )
}
