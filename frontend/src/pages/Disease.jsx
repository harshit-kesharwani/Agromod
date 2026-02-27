import React, { useState } from 'react'
import { Typography, Paper, Button, TextField, Box, CircularProgress, Alert } from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Disease() {
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select an image.')
      return
    }
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      if (description) form.append('description', description)
      const { data } = await api.post('/api/disease/analyze/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Disease Detection</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Upload a crop or leaf image for AI-based diagnosis and treatment recommendation.</Typography>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
            <Button variant="outlined" component="label">Choose image (JPEG/PNG, max 5MB)<input type="file" accept="image/jpeg,image/png" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} /></Button>
            {file && <Typography variant="body2">Selected: {file.name}</Typography>}
            <TextField label="Optional context (e.g. crop name, symptoms)" multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Analyze'}</Button>
          </Box>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {result && (
          <Box sx={{ mt: 3 }}>
            {result.labels?.length > 0 && (
              <Typography variant="subtitle2" gutterBottom>Detected: {result.labels.map((l) => `${l.name} (${l.confidence}%)`).join(', ')}</Typography>
            )}
            <Typography variant="subtitle2" color="primary">Diagnosis</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{result.diagnosis}</Typography>
            <Typography variant="subtitle2" color="primary">Treatment</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{result.treatment}</Typography>
          </Box>
        )}
      </Paper>
    </Layout>
  )
}
