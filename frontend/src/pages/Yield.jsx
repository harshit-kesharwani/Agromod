import React, { useState } from 'react'
import {
  Typography, Paper, Button, TextField, Box, Grid, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Whole year']
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]
const CROPS = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Mustard', 'Maize', 'Pulses', 'Vegetables', 'Other']

export default function Yield() {
  const [predictForm, setPredictForm] = useState({ crop: '', region: '', season: '', area: '' })
  const [suggestForm, setSuggestForm] = useState({ region: '', season: '', current_crop: '' })
  const [prediction, setPrediction] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePredict = async (e) => {
    e.preventDefault()
    setError('')
    setPrediction('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/yield/predict/', predictForm)
      setPrediction(data.prediction || '')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggest = async (e) => {
    e.preventDefault()
    setError('')
    setSuggestions('')
    setLoading(true)
    try {
      const { data } = await api.get('/api/yield/suggestions/', { params: suggestForm })
      setSuggestions(data.suggestions || '')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Yield Prediction & Crop Suggestion</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>AI-powered yield forecast and crop suggestions for best profit.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Yield forecast</Typography>
            <form onSubmit={handlePredict}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Crop" value={predictForm.crop} onChange={(e) => setPredictForm((f) => ({ ...f, crop: e.target.value }))} select SelectProps={{ native: true }}><option value="" />{CROPS.map((c) => <option key={c} value={c}>{c}</option>)}</TextField>
                <FormControl fullWidth>
                  <InputLabel>State</InputLabel>
                  <Select label="State" value={predictForm.region} onChange={(e) => setPredictForm((f) => ({ ...f, region: e.target.value }))} required>
                    {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Season" value={predictForm.season} onChange={(e) => setPredictForm((f) => ({ ...f, season: e.target.value }))} select SelectProps={{ native: true }}><option value="" />{SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}</TextField>
                <TextField label="Area (optional)" value={predictForm.area} onChange={(e) => setPredictForm((f) => ({ ...f, area: e.target.value }))} placeholder="e.g. 2 acres" />
                <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Get forecast'}</Button>
              </Box>
            </form>
            {prediction && <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{prediction}</Typography>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Crop suggestions for profit</Typography>
            <form onSubmit={handleSuggest}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>State</InputLabel>
                  <Select label="State" value={suggestForm.region} onChange={(e) => setSuggestForm((f) => ({ ...f, region: e.target.value }))} required>
                    {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Season" value={suggestForm.season} onChange={(e) => setSuggestForm((f) => ({ ...f, season: e.target.value }))} select SelectProps={{ native: true }}><option value="" />{SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}</TextField>
                <TextField label="Current/previous crop (optional)" value={suggestForm.current_crop} onChange={(e) => setSuggestForm((f) => ({ ...f, current_crop: e.target.value }))} />
                <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Get suggestions'}</Button>
              </Box>
            </form>
            {suggestions && <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{suggestions}</Typography>}
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  )
}
