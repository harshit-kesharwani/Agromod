import React, { useState, useEffect, useCallback } from 'react'
import {
  Typography, Paper, Button, Box, Grid, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, Chip, Divider, IconButton, Tooltip,
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
import Layout from '../components/Layout'
import api from '../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip as ChartTooltip, Legend, Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, ChartTooltip, Legend, Filler,
)

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const COLORS = [
  '#2e7d32', '#1565c0', '#e65100', '#6a1b9a', '#c62828',
  '#00838f', '#ef6c00', '#4527a0', '#2e7d32', '#ad1457',
  '#1b5e20', '#0d47a1', '#bf360c', '#4a148c', '#b71c1c',
]

export default function Prices() {
  const [crops, setCrops] = useState([])
  const [states, setStates] = useState([])
  const [centres, setCentres] = useState([])
  const [years, setYears] = useState([])

  const [selectedCrop, setSelectedCrop] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCentre, setSelectedCentre] = useState('')
  const [selectedYears, setSelectedYears] = useState([])

  const [priceData, setPriceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/prices/crops/'),
      api.get('/api/prices/states/'),
      api.get('/api/prices/years/'),
    ]).then(([c, s, y]) => {
      setCrops(c.data)
      setStates(s.data)
      setYears(y.data)
    })
  }, [])

  useEffect(() => {
    if (selectedState) {
      api.get('/api/prices/centres/', { params: { state: selectedState } })
        .then(({ data }) => setCentres(data))
    } else {
      setCentres([])
      setSelectedCentre('')
    }
  }, [selectedState])

  const fetchPrices = useCallback(() => {
    setLoading(true)
    setError('')
    setHasSearched(true)
    const params = { monthly: '1' }
    if (selectedCrop) params.commodity = selectedCrop
    if (selectedState) params.state = selectedState
    if (selectedCentre) params.centre = selectedCentre
    if (selectedYears.length > 0) {
      selectedYears.forEach(y => { params.year = params.year ? [].concat(params.year, y) : y })
    }

    const queryStr = new URLSearchParams()
    if (selectedCrop) queryStr.append('commodity', selectedCrop)
    if (selectedState) queryStr.append('state', selectedState)
    if (selectedCentre) queryStr.append('centre', selectedCentre)
    selectedYears.forEach(y => queryStr.append('year', y))
    queryStr.append('monthly', '1')

    api.get('/api/prices/data/?' + queryStr.toString())
      .then(({ data }) => setPriceData(data))
      .catch(err => setError(err.response?.data?.detail || err.message || 'Failed to fetch prices'))
      .finally(() => setLoading(false))
  }, [selectedCrop, selectedState, selectedCentre, selectedYears])

  const clearFilters = () => {
    setSelectedCrop('')
    setSelectedState('')
    setSelectedCentre('')
    setSelectedYears([])
    setPriceData([])
    setHasSearched(false)
  }

  const buildChartData = () => {
    if (!priceData.length) return null

    const hasCentre = priceData.some(d => d.centre && d.centre !== '')
    const grouped = {}

    priceData.forEach(d => {
      let key
      if (selectedCrop && hasCentre) {
        key = d.centre ? `${d.state} - ${d.centre} (${d.year})` : `${d.state} (${d.year})`
      } else if (selectedCrop) {
        key = `${d.state} (${d.year})`
      } else {
        key = `${d.commodity} (${d.year})`
      }
      if (!grouped[key]) grouped[key] = {}
      if (d.month > 0) grouped[key][d.month] = d.price
    })

    const labels = MONTH_NAMES
    const datasets = Object.entries(grouped).map(([label, monthData], idx) => ({
      label,
      data: labels.map((_, i) => monthData[i + 1] ?? null),
      borderColor: COLORS[idx % COLORS.length],
      backgroundColor: COLORS[idx % COLORS.length] + '22',
      tension: 0.3,
      spanGaps: true,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
    }))

    return { labels, datasets }
  }

  const buildYearlyBarData = () => {
    if (!priceData.length) return null
    const yearlyAvg = {}
    priceData.forEach(d => {
      const key = selectedCrop ? `${d.commodity}` : d.commodity
      if (!yearlyAvg[key]) yearlyAvg[key] = {}
      if (!yearlyAvg[key][d.year]) yearlyAvg[key][d.year] = { sum: 0, count: 0 }
      yearlyAvg[key][d.year].sum += d.price
      yearlyAvg[key][d.year].count += 1
    })

    const allYears = [...new Set(priceData.map(d => d.year))].sort()
    const datasets = Object.entries(yearlyAvg).map(([crop, yData], idx) => ({
      label: crop,
      data: allYears.map(y => yData[y] ? Math.round(yData[y].sum / yData[y].count) : null),
      backgroundColor: COLORS[idx % COLORS.length] + 'AA',
      borderColor: COLORS[idx % COLORS.length],
      borderWidth: 1,
    }))

    return { labels: allYears.map(String), datasets }
  }

  const chartData = buildChartData()
  const barData = buildYearlyBarData()
  const activeFilters = [selectedCrop, selectedState, selectedCentre, ...selectedYears.map(String)].filter(Boolean)

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <TrendingUpIcon sx={{ color: '#2e7d32', fontSize: 32 }} />
        <Typography variant="h5" fontWeight={700}>Agricultural Price Trends</Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Historical wholesale prices from Government of India (2019-2024). Use any combination of filters below.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon color="action" />
          <Typography variant="h6" fontWeight={600}>Filters</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            (select any combination - all are optional)
          </Typography>
          {activeFilters.length > 0 && (
            <Tooltip title="Clear all filters">
              <IconButton size="small" onClick={clearFilters} sx={{ ml: 'auto' }}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Crop</InputLabel>
              <Select label="Crop" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
                <MenuItem value="">All Crops</MenuItem>
                {crops.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>State</InputLabel>
              <Select label="State" value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCentre('') }}>
                <MenuItem value="">All States</MenuItem>
                {states.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!selectedState || centres.length === 0}>
              <InputLabel>City / Centre</InputLabel>
              <Select label="City / Centre" value={selectedCentre} onChange={(e) => setSelectedCentre(e.target.value)}>
                <MenuItem value="">All Centres</MenuItem>
                {centres.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Year(s)</InputLabel>
              <Select
                label="Year(s)" multiple value={selectedYears}
                onChange={(e) => setSelectedYears(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {activeFilters.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedCrop && <Chip label={`Crop: ${selectedCrop}`} size="small" color="success" onDelete={() => setSelectedCrop('')} />}
            {selectedState && <Chip label={`State: ${selectedState}`} size="small" color="primary" onDelete={() => { setSelectedState(''); setSelectedCentre('') }} />}
            {selectedCentre && <Chip label={`City: ${selectedCentre}`} size="small" color="secondary" onDelete={() => setSelectedCentre('')} />}
            {selectedYears.map(y => <Chip key={y} label={`Year: ${y}`} size="small" color="warning" onDelete={() => setSelectedYears(prev => prev.filter(v => v !== y))} />)}
          </Box>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained" onClick={fetchPrices} disabled={loading}
            sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, borderRadius: 2, textTransform: 'none', px: 4 }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Show Prices'}
          </Button>
        </Box>
      </Paper>

      {hasSearched && !loading && priceData.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>No price data found for the selected filters. Try changing your selection.</Alert>
      )}

      {chartData && chartData.datasets.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Monthly Price Trend (Rs/Quintal)
          </Typography>
          <Box sx={{ height: { xs: 300, md: 400 } }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `${ctx.dataset.label}: Rs ${ctx.parsed.y?.toLocaleString('en-IN')}/Qtl`,
                    },
                  },
                },
                scales: {
                  y: {
                    title: { display: true, text: 'Price (Rs/Quintal)' },
                    ticks: { callback: (v) => `Rs ${v.toLocaleString('en-IN')}` },
                  },
                  x: { title: { display: true, text: 'Month' } },
                },
                interaction: { intersect: false, mode: 'index' },
              }}
            />
          </Box>
        </Paper>
      )}

      {barData && barData.datasets.length > 0 && barData.labels.length > 1 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Yearly Average Price Comparison
          </Typography>
          <Box sx={{ height: { xs: 250, md: 350 } }}>
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `${ctx.dataset.label}: Rs ${ctx.parsed.y?.toLocaleString('en-IN')}/Qtl`,
                    },
                  },
                },
                scales: {
                  y: {
                    title: { display: true, text: 'Avg Price (Rs/Quintal)' },
                    ticks: { callback: (v) => `Rs ${v.toLocaleString('en-IN')}` },
                  },
                  x: { title: { display: true, text: 'Year' } },
                },
              }}
            />
          </Box>
        </Paper>
      )}

      {priceData.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Price Data Table
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={thStyle}>Crop</th>
                  <th style={thStyle}>State</th>
                  <th style={thStyle}>City</th>
                  <th style={thStyle}>Year</th>
                  <th style={thStyle}>Month</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Price (Rs/Qtl)</th>
                </tr>
              </thead>
              <tbody>
                {priceData.slice(0, 200).map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={tdStyle}>{d.commodity}</td>
                    <td style={tdStyle}>{d.state}</td>
                    <td style={tdStyle}>{d.centre || '-'}</td>
                    <td style={tdStyle}>{d.year}</td>
                    <td style={tdStyle}>{d.month > 0 ? MONTH_NAMES[d.month - 1] : 'Yearly'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>Rs {d.price.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {priceData.length > 200 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Showing 200 of {priceData.length} records. Refine filters to see more.
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Layout>
  )
}

const thStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }
const tdStyle = { padding: '8px 12px' }
