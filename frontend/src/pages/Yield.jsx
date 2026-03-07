import React, { useState, useCallback } from 'react'
import {
  Typography, Paper, Button, TextField, Box, Grid, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, Collapse, IconButton, Tooltip,
  List, ListItem, ListItemButton, Chip,
} from '@mui/material'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ClearIcon from '@mui/icons-material/Clear'
import Layout from '../components/Layout'
import api from '../services/api'

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Whole year']
const CROPS = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Mustard', 'Maize', 'Pulses', 'Vegetables', 'Other']

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse'

async function reverseGeocode(lat, lon) {
  const resp = await fetch(
    `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lon}&format=json&accept-language=en&addressdetails=1&zoom=10`,
  )
  const data = await resp.json()
  const addr = data?.address || {}
  const state = addr.state || ''
  const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || ''
  const name = [city, state].filter(Boolean).join(', ')
  return { state, city, name: name || data?.display_name || '' }
}

function LocationInput({ label, location, onLocationSet, onClear, disabled }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState('')

  const search = useCallback(() => {
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    setError('')
    api.get('/api/weather/geocode/', { params: { q: query } })
      .then(({ data }) => setResults(data.results || []))
      .catch(() => setError('Search failed. Try again.'))
      .finally(() => setSearching(false))
  }, [query])

  const pickResult = (r) => {
    const name = `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}${r.country ? `, ${r.country}` : ''}`
    onLocationSet({
      lat: r.lat,
      lon: r.lon,
      name,
      state: r.admin1 || r.name,
    })
    setResults([])
    setQuery('')
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setDetecting(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const geo = await reverseGeocode(latitude, longitude)
          onLocationSet({
            lat: latitude,
            lon: longitude,
            name: geo.name || 'Current location',
            state: geo.state || '',
          })
        } catch {
          setError('Could not resolve your location. Try searching instead.')
        } finally {
          setDetecting(false)
        }
      },
      (err) => {
        setError(err.code === 1
          ? 'Location access denied. Please allow location or search for a city.'
          : 'Could not detect location. Try searching instead.')
        setDetecting(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const isLoading = searching || detecting || disabled

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>{error}</Alert>}

      {location ? (
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            p: 1.5, border: 1, borderColor: 'success.light', borderRadius: 1,
            bgcolor: 'success.50',
          }}
        >
          <LocationOnIcon color="success" fontSize="small" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>{label}</Typography>
            <Typography variant="body2" color="text.secondary">{location.name}</Typography>
          </Box>
          <Tooltip title="Change location">
            <IconButton size="small" onClick={onClear}><ClearIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              label={`Search city or place for ${label.toLowerCase()}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
              disabled={isLoading}
            />
            <Tooltip title="Search">
              <span>
                <IconButton onClick={search} disabled={isLoading || !query.trim()} color="primary">
                  {searching ? <CircularProgress size={22} /> : <SearchIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Use current location">
              <span>
                <IconButton onClick={useCurrentLocation} disabled={isLoading} color="success">
                  {detecting ? <CircularProgress size={22} /> : <MyLocationIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {results.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 0.5, maxHeight: 180, overflowY: 'auto' }}>
              <List dense disablePadding>
                {results.map((r, i) => (
                  <ListItem key={i} disablePadding>
                    <ListItemButton onClick={() => pickResult(r)}>
                      <LocationOnIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {r.name}{r.admin1 ? `, ${r.admin1}` : ''}{r.country ? `, ${r.country}` : ''}
                      </Typography>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </>
      )}
    </Box>
  )
}

export default function Yield() {
  const [predictForm, setPredictForm] = useState({ crop: '', season: '', area: '' })
  const [customCrop, setCustomCrop] = useState('')
  const [predictLocation, setPredictLocation] = useState(null)
  const [suggestLocation, setSuggestLocation] = useState(null)
  const [suggestForm, setSuggestForm] = useState({ season: '', current_crop: '' })
  const [prediction, setPrediction] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [predictLoading, setPredictLoading] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [predictError, setPredictError] = useState('')
  const [suggestError, setSuggestError] = useState('')

  const effectiveCrop = predictForm.crop === 'Other' ? customCrop : predictForm.crop

  const handleCropChange = (e) => {
    const val = e.target.value
    setPredictForm((f) => ({ ...f, crop: val }))
    if (val !== 'Other') setCustomCrop('')
  }

  const handlePredict = async (e) => {
    e.preventDefault()
    if (!effectiveCrop.trim()) { setPredictError('Please enter a crop name.'); return }
    if (!predictLocation) { setPredictError('Please set a location — search for a city or use current location.'); return }
    setPredictError('')
    setPrediction('')
    setPredictLoading(true)
    try {
      const payload = {
        crop: effectiveCrop.trim(),
        region: predictLocation.state || predictLocation.name,
        season: predictForm.season,
        area: predictForm.area,
        latitude: predictLocation.lat,
        longitude: predictLocation.lon,
        location_name: predictLocation.name,
      }
      const { data } = await api.post('/api/yield/predict/', payload)
      setPrediction(data.prediction || '')
    } catch (err) {
      setPredictError(err.response?.data?.error || err.message || 'Failed')
    } finally {
      setPredictLoading(false)
    }
  }

  const handleSuggest = async (e) => {
    e.preventDefault()
    if (!suggestLocation) { setSuggestError('Please set a location — search for a city or use current location.'); return }
    setSuggestError('')
    setSuggestions('')
    setSuggestLoading(true)
    try {
      const params = {
        region: suggestLocation.state || suggestLocation.name,
        season: suggestForm.season,
        current_crop: suggestForm.current_crop,
        latitude: suggestLocation.lat,
        longitude: suggestLocation.lon,
        location_name: suggestLocation.name,
      }
      const { data } = await api.get('/api/yield/suggestions/', { params })
      setSuggestions(data.suggestions || '')
    } catch (err) {
      setSuggestError(err.response?.data?.error || err.message || 'Failed')
    } finally {
      setSuggestLoading(false)
    }
  }

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Yield Prediction & Crop Suggestion</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>AI-powered yield forecast and crop suggestions for best profit. Search for your city or use your current location.</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Yield forecast</Typography>
            {predictError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPredictError('')}>{predictError}</Alert>}
            <form onSubmit={handlePredict}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Crop</InputLabel>
                  <Select label="Crop" value={predictForm.crop} onChange={handleCropChange} required>
                    {CROPS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
                <Collapse in={predictForm.crop === 'Other'}>
                  <TextField
                    fullWidth
                    label="Enter crop name"
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    required={predictForm.crop === 'Other'}
                    placeholder="e.g. Soybean, Groundnut, Bajra"
                  />
                </Collapse>
                <LocationInput
                  label="Location"
                  location={predictLocation}
                  onLocationSet={setPredictLocation}
                  onClear={() => setPredictLocation(null)}
                  disabled={predictLoading}
                />
                <FormControl fullWidth>
                  <InputLabel>Season</InputLabel>
                  <Select label="Season" value={predictForm.season} onChange={(e) => setPredictForm((f) => ({ ...f, season: e.target.value }))} required>
                    {SEASONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Area (optional)" value={predictForm.area} onChange={(e) => setPredictForm((f) => ({ ...f, area: e.target.value }))} placeholder="e.g. 2 acres" />
                <Button type="submit" variant="contained" disabled={predictLoading}>{predictLoading ? <CircularProgress size={24} /> : 'Get forecast'}</Button>
              </Box>
            </form>
            {prediction && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{prediction}</Typography>
              </Paper>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Crop suggestions for profit</Typography>
            {suggestError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSuggestError('')}>{suggestError}</Alert>}
            <form onSubmit={handleSuggest}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <LocationInput
                  label="Location"
                  location={suggestLocation}
                  onLocationSet={setSuggestLocation}
                  onClear={() => setSuggestLocation(null)}
                  disabled={suggestLoading}
                />
                <FormControl fullWidth>
                  <InputLabel>Season</InputLabel>
                  <Select label="Season" value={suggestForm.season} onChange={(e) => setSuggestForm((f) => ({ ...f, season: e.target.value }))} required>
                    {SEASONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Current/previous crop (optional)" value={suggestForm.current_crop} onChange={(e) => setSuggestForm((f) => ({ ...f, current_crop: e.target.value }))} />
                <Button type="submit" variant="contained" disabled={suggestLoading}>{suggestLoading ? <CircularProgress size={24} /> : 'Get suggestions'}</Button>
              </Box>
            </form>
            {suggestions && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{suggestions}</Typography>
              </Paper>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  )
}
