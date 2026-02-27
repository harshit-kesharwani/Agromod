import React, { useState, useEffect } from 'react'
import { Typography, Paper, Button, TextField, Box, Switch, FormControlLabel, Grid, Alert, List, ListItem, ListItemButton } from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Weather() {
  const [current, setCurrent] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [alerts, setAlerts] = useState({ alerts: [], live: [] })
  const [prefs, setPrefs] = useState({ location_name: '', email_alerts: true, alert_frost: true, alert_heavy_rain: true, alert_heat: true })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [geoError, setGeoError] = useState('')

  const loadCurrent = () => {
    api.get('/api/weather/current/').then(({ data }) => {
      setCurrent(data.current)
      setLocationName(data.location_name || '')
    }).catch(() => setCurrent({}))
  }
  const loadAlerts = () => {
    api.get('/api/weather/alerts/').then(({ data }) => setAlerts(data)).catch(() => {})
  }
  const loadPrefs = () => {
    api.get('/api/weather/preferences/').then(({ data }) => setPrefs((p) => ({ ...p, ...data }))).catch(() => {})
  }

  useEffect(() => { loadCurrent(); loadAlerts(); loadPrefs() }, [])

  const searchLocation = () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    api.get('/api/weather/geocode/', { params: { q: searchQuery } })
      .then(({ data }) => setSearchResults(data.results || []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false))
  }

  const setLocationFromResult = (lat, lon, name) => {
    setLoading(true)
    setGeoError('')
    api.put('/api/weather/preferences/', {
      latitude: lat,
      longitude: lon,
      location_name: name || searchQuery,
      email_alerts: prefs.email_alerts,
      alert_frost: prefs.alert_frost,
      alert_heavy_rain: prefs.alert_heavy_rain,
      alert_heat: prefs.alert_heat,
    }).then(() => { loadCurrent(); loadPrefs(); setLocationName(name || searchQuery); setSearchResults([]); setSearchQuery('') }).catch(() => setGeoError('Failed to save location')).finally(() => setLoading(false))
  }

  const useCurrentLocation = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        api.put('/api/weather/preferences/', {
          latitude: lat,
          longitude: lon,
          location_name: 'Current location',
          email_alerts: prefs.email_alerts,
          alert_frost: prefs.alert_frost,
          alert_heavy_rain: prefs.alert_heavy_rain,
          alert_heat: prefs.alert_heat,
        }).then(() => { loadCurrent(); loadPrefs(); setLocationName('Current location') }).catch(() => setGeoError('Failed to save location')).finally(() => setLoading(false))
      },
      () => {
        setGeoError('Could not get your location. Check permissions or try search.')
        setLoading(false)
      }
    )
  }

  const saveAlertPrefs = () => {
    setLoading(true)
    api.put('/api/weather/preferences/', {
      latitude: prefs.latitude,
      longitude: prefs.longitude,
      location_name: prefs.location_name,
      email_alerts: prefs.email_alerts,
      alert_frost: prefs.alert_frost,
      alert_heavy_rain: prefs.alert_heavy_rain,
      alert_heat: prefs.alert_heat,
    }).then(() => loadPrefs()).finally(() => setLoading(false))
  }

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Weather Alerts</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Set location by search or use current location. Current weather and notification preferences.</Typography>
      {geoError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGeoError('')}>{geoError}</Alert>}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Current weather{locationName ? ` – ${locationName}` : ''}</Typography>
            {current && Object.keys(current).length > 0 ? (
              <Box>
                <Typography>Temperature: {current.temperature}°C</Typography>
                <Typography>Precipitation: {current.precipitation ?? '—'} mm</Typography>
                <Typography>Wind: {current.wind_speed ?? '—'} km/h</Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">Search for a location or use &quot;Use my location&quot; to see weather.</Typography>
            )}
            <Button size="small" onClick={loadCurrent} sx={{ mt: 1 }}>Refresh</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Location</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField size="small" label="Search location (city or place)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={searchLocation} disabled={searching || !searchQuery.trim()}>{searching ? 'Searching...' : 'Search'}</Button>
                <Button variant="contained" onClick={useCurrentLocation} disabled={loading}>Use my location</Button>
              </Box>
              {searchResults.length > 0 && (
                <List dense>
                  {searchResults.map((r, i) => (
                    <ListItem key={i} disablePadding>
                      <ListItemButton onClick={() => setLocationFromResult(r.lat, r.lon, `${r.name}${r.country ? `, ${r.country}` : ''}`)}>
                        {r.name}{r.country ? `, ${r.country}` : ''}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Alert preferences</Typography>
            <FormControlLabel control={<Switch checked={prefs.email_alerts} onChange={(e) => setPrefs((p) => ({ ...p, email_alerts: e.target.checked }))} />} label="Email alerts" />
            <FormControlLabel control={<Switch checked={prefs.alert_frost} onChange={(e) => setPrefs((p) => ({ ...p, alert_frost: e.target.checked }))} />} label="Frost" />
            <FormControlLabel control={<Switch checked={prefs.alert_heavy_rain} onChange={(e) => setPrefs((p) => ({ ...p, alert_heavy_rain: e.target.checked }))} />} label="Heavy rain" />
            <FormControlLabel control={<Switch checked={prefs.alert_heat} onChange={(e) => setPrefs((p) => ({ ...p, alert_heat: e.target.checked }))} />} label="Heat wave" />
            <Button variant="contained" onClick={saveAlertPrefs} disabled={loading} sx={{ mt: 1 }}>Save preferences</Button>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Notifications</Typography>
            {alerts.live?.length > 0 && alerts.live.map((a, i) => <Alert key={i} severity="warning" sx={{ mb: 1 }}>{a.message}</Alert>)}
            {alerts.alerts?.length === 0 && (!alerts.live || alerts.live.length === 0) && <Typography color="text.secondary">No alerts.</Typography>}
            {alerts.alerts?.map((n) => (
              <Alert key={n.id} severity="info" sx={{ mb: 1 }}>{n.title}: {n.body}</Alert>
            ))}
            <Button size="small" href="/notifications">View all notifications</Button>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  )
}
