import React, { useState, useEffect, useRef } from 'react'
import {
  Typography, Paper, Button, TextField, Box, CircularProgress,
  Alert, Chip, Divider, Link, Dialog, DialogContent, IconButton,
} from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import StorefrontIcon from '@mui/icons-material/Storefront'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import CloseIcon from '@mui/icons-material/Close'
import Layout from '../components/Layout'
import api from '../services/api'

function FormattedText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <Box component="div" sx={{ '& p': { my: 0.5 }, '& ul': { pl: 2.5, my: 0.5 } }}>
      {lines.map((line, li) => {
        const trimmed = line.trim()
        const isBullet = /^[-•*]\s/.test(trimmed)
        const content = isBullet ? trimmed.replace(/^[-•*]\s+/, '') : trimmed
        const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
        const rendered = parts.map((seg, si) => {
          if (seg.startsWith('**') && seg.endsWith('**'))
            return <strong key={si}>{seg.slice(2, -2)}</strong>
          if (seg.startsWith('*') && seg.endsWith('*'))
            return <em key={si}>{seg.slice(1, -1)}</em>
          return seg
        })
        if (isBullet) {
          return (
            <Typography key={li} component="li" variant="body2" sx={{ lineHeight: 1.6, listStyleType: 'disc', display: 'list-item', ml: 2 }}>
              {rendered}
            </Typography>
          )
        }
        if (!trimmed) return <Box key={li} sx={{ height: 8 }} />
        return (
          <Typography key={li} variant="body2" sx={{ lineHeight: 1.6 }}>
            {rendered}
          </Typography>
        )
      })}
    </Box>
  )
}

const SEVERITY_COLOR = {
  healthy: 'success',
  mild: 'warning',
  moderate: 'warning',
  severe: 'error',
  none: 'success',
}

function mapsSearchUrl(query, lat, lng) {
  const q = encodeURIComponent(query)
  if (lat && lng) return `https://www.google.com/maps/search/${q}/@${lat},${lng},12z`
  return `https://www.google.com/maps/search/${q}`
}

export default function Disease() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [coords, setCoords] = useState(null)
  const [locStatus, setLocStatus] = useState('fetching')
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocStatus('unavailable')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocStatus('ok')
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    setPreview(selected ? URL.createObjectURL(selected) : null)
  }

  const openCamera = () => {
    setCameraOpen(true)
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch {
        setCameraOpen(false)
      }
    }, 100)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        const captured = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
        setFile(captured)
        setPreview(URL.createObjectURL(blob))
        closeCamera()
      },
      'image/jpeg',
      0.85,
    )
  }

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please select an image.'); return }
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      if (description) form.append('description', description)
      const { data } = await api.post('/api/disease/analyze/', form, {
        headers: { 'Content-Type': undefined },
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const severityKey = (result?.severity || '').toLowerCase()
  const isHealthy = severityKey === 'healthy' || severityKey === 'none'
  const lat = coords?.lat
  const lng = coords?.lng
  const products = result?.recommended_products || []

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Disease Detection</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Upload a crop or leaf image for AI-based diagnosis and treatment recommendation.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* Left panel — upload form */}
        <Paper sx={{ p: 3, flex: { xs: '1 1 100%', md: '0 0 420px' } }}>
          {/* Location status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MyLocationIcon sx={{ fontSize: 18, color: locStatus === 'ok' ? 'success.main' : 'text.disabled' }} />
            <Typography variant="caption" color={locStatus === 'ok' ? 'success.main' : 'text.secondary'}>
              {locStatus === 'ok' && 'Location detected'}
              {locStatus === 'fetching' && 'Detecting location…'}
              {locStatus === 'denied' && 'Location access denied — enable for nearest KVK/vendor'}
              {locStatus === 'unavailable' && 'Location not supported'}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" component="label" sx={{ flex: 1 }}>
                  Choose image
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} />
                </Button>
                <Button
                  variant="outlined"
                  onClick={openCamera}
                  startIcon={<CameraAltIcon />}
                  sx={{ flex: 1 }}
                >
                  Camera
                </Button>
              </Box>
              {preview && (
                <Box
                  component="img"
                  src={preview}
                  alt="Selected"
                  sx={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                />
              )}
              {file && <Typography variant="body2">Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)</Typography>}
              <TextField
                label="Optional context (e.g. crop name, symptoms)"
                multiline
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Analyze'}
              </Button>
            </Box>
          </form>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>

        {/* Right panel — results + where to buy */}
        {(result || loading) && (
          <Paper
            sx={{
              p: 3,
              flex: '1 1 0',
              minWidth: 0,
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
              position: { md: 'sticky' },
              top: { md: 90 },
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 },
            }}
          >
            {loading && !result && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
              </Box>
            )}

            {result && (
              <>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Analysis Results</Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
                  {result.plant && result.plant !== 'unknown' && (
                    <Chip label={`Plant: ${result.plant}`} color="primary" variant="outlined" />
                  )}
                  {result.disease && result.disease !== 'unknown' && (
                    <Chip label={`Disease: ${result.disease}`} color={SEVERITY_COLOR[severityKey] || 'default'} />
                  )}
                  {result.severity && result.severity !== 'unknown' && (
                    <Chip label={`Severity: ${result.severity}`} color={SEVERITY_COLOR[severityKey] || 'default'} variant="outlined" />
                  )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>Diagnosis</Typography>
                <Box sx={{ mb: 2 }}><FormattedText text={result.diagnosis} /></Box>

                <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>Treatment</Typography>
                <Box sx={{ mb: 2 }}><FormattedText text={result.treatment} /></Box>

                {result.prevention && (
                  <>
                    <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>Prevention</Typography>
                    <Box sx={{ mb: 2 }}><FormattedText text={result.prevention} /></Box>
                  </>
                )}

                {/* Recommended products */}
                {products.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>
                      <LocalPharmacyIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
                      Recommended Products
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {products.map((p, i) => (
                        <Chip key={i} label={p} variant="outlined" color="primary" size="small" />
                      ))}
                    </Box>
                  </>
                )}

                {/* Where to Buy section */}
                {!isHealthy && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StorefrontIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                      Where to Buy
                    </Typography>

                    {/* Marketplace CTA */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
                        color: '#fff',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ShoppingCartIcon sx={{ fontSize: 20 }} />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Buy from Agromod Marketplace
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1.5, fontSize: '0.8rem' }}>
                        100% genuine products from verified vendors. Delivered to your doorstep.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        href="/marketplace"
                        sx={{
                          bgcolor: '#fff',
                          color: '#1b5e20',
                          fontWeight: 700,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        }}
                      >
                        Browse Marketplace
                      </Button>
                    </Paper>

                    {/* Nearest KVK */}
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, mb: 1.5, borderRadius: 2, '&:hover': { boxShadow: 2 }, transition: 'box-shadow 0.2s' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <AgricultureIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight={700}>Nearest KVK (Krishi Vigyan Kendra)</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                        Get expert advice and soil testing from your nearest agricultural research centre.
                      </Typography>
                      <Link
                        href={mapsSearchUrl('Krishi Vigyan Kendra KVK near me', lat, lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <LocationOnIcon sx={{ fontSize: 16 }} />
                        Find nearest KVK on Google Maps
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </Link>
                    </Paper>

                    {/* Nearest IFFCO */}
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, mb: 1.5, borderRadius: 2, '&:hover': { boxShadow: 2 }, transition: 'box-shadow 0.2s' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <StorefrontIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                        <Typography variant="subtitle2" fontWeight={700}>Nearest IFFCO Dealer</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                        Buy fertilisers, pesticides, and seeds from authorised IFFCO dealers.
                      </Typography>
                      <Link
                        href={mapsSearchUrl('IFFCO dealer fertilizer shop near me', lat, lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <LocationOnIcon sx={{ fontSize: 16 }} />
                        Find nearest IFFCO dealer on Google Maps
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </Link>
                    </Paper>

                    {/* Nearest agri store */}
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2, '&:hover': { boxShadow: 2 }, transition: 'box-shadow 0.2s' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <LocalPharmacyIcon sx={{ fontSize: 20, color: 'info.main' }} />
                        <Typography variant="subtitle2" fontWeight={700}>Nearest Pesticide / Agri Store</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                        Find local agricultural supply stores for the recommended products.
                      </Typography>
                      <Link
                        href={mapsSearchUrl('pesticide fertilizer agriculture shop near me', lat, lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <LocationOnIcon sx={{ fontSize: 16 }} />
                        Find nearest agri store on Google Maps
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </Link>
                    </Paper>
                  </>
                )}
              </>
            )}
          </Paper>
        )}
      </Box>

      {/* Camera dialog */}
      <Dialog open={cameraOpen} onClose={closeCamera} fullWidth maxWidth="sm">
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#000' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              p: 2,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            }}
          >
            <IconButton
              onClick={capturePhoto}
              sx={{
                bgcolor: '#fff',
                width: 64,
                height: 64,
                border: '4px solid rgba(255,255,255,0.5)',
                '&:hover': { bgcolor: '#eee' },
              }}
            >
              <CameraAltIcon sx={{ fontSize: 32, color: '#333' }} />
            </IconButton>
            <IconButton
              onClick={closeCamera}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', width: 48, height: 48 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
