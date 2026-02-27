import React, { useState, useEffect } from 'react'
import {
  Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Box, Card, CardContent, CardActionArea, Collapse, IconButton
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import Layout from '../components/Layout'
import api from '../services/api'

const SCHEME_IMAGES = {
  default: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80',
  subsidy: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80',
  insurance: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80',
  loan: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
}

export default function Schemes() {
  const [schemes, setSchemes] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [eligibilityScheme, setEligibilityScheme] = useState(null)
  const [eligibilityForm, setEligibilityForm] = useState({ land_holding: '', crop: '', state: '', income: '' })
  const [eligibilityResult, setEligibilityResult] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    api.get('/api/schemes/').then(({ data }) => setSchemes(data.results || data))
  }, [])

  const openEligibility = (scheme) => {
    setEligibilityScheme(scheme)
    setEligibilityResult('')
    setEligibilityForm({ land_holding: '', crop: '', state: '', income: '' })
  }

  const checkEligibility = () => {
    if (!eligibilityScheme?.slug) return
    setChecking(true)
    api.post(`/api/schemes/${eligibilityScheme.slug}/check_eligibility/`, eligibilityForm)
      .then(({ data }) => setEligibilityResult(data.result || ''))
      .catch(() => setEligibilityResult('Could not check eligibility.'))
      .finally(() => setChecking(false))
  }

  const list = Array.isArray(schemes) ? schemes : []

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Government Schemes</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Discover schemes and check eligibility.</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {list.map((s) => {
          const isExpanded = expandedId === s.id
          const img = SCHEME_IMAGES[s.category?.toLowerCase()] || SCHEME_IMAGES.default
          return (
            <Card key={s.id} variant="outlined">
              <CardActionArea onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
                  <Box component="img" src={img} alt="" sx={{ width: { xs: '100%', md: 200 }, height: 140, objectFit: 'cover' }} />
                  <CardContent sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="h6">{s.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.short_description}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      {s.category && <Typography variant="caption" color="primary">{s.category}</Typography>}
                      <IconButton size="small" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </CardContent>
                </Box>
              </CardActionArea>
              <Collapse in={isExpanded}>
                <CardContent sx={{ pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                  {s.description && <Typography variant="body2" sx={{ mb: 1 }}>{s.description}</Typography>}
                  {s.eligibility_criteria && (
                    <Typography variant="body2" sx={{ mb: 1 }}><strong>Eligibility:</strong> {s.eligibility_criteria}</Typography>
                  )}
                  {s.documents_required && (
                    <Typography variant="body2" sx={{ mb: 1 }}><strong>Documents:</strong> {s.documents_required}</Typography>
                  )}
                  {s.application_process && (
                    <Typography variant="body2" sx={{ mb: 1 }}><strong>How to apply:</strong> {s.application_process}</Typography>
                  )}
                  {s.official_link && (
                    <Button size="small" href={s.official_link} target="_blank" rel="noopener noreferrer" sx={{ mr: 1 }}>Official link</Button>
                  )}
                  <Button variant="contained" color="primary" onClick={(e) => { e.stopPropagation(); openEligibility(s) }}>Check eligibility</Button>
                </CardContent>
              </Collapse>
            </Card>
          )
        })}
        {list.length === 0 && (
          <Paper sx={{ p: 3 }}><Typography color="text.secondary">No schemes. Run seed_schemes management command.</Typography></Paper>
        )}
      </Box>
      <Dialog open={!!eligibilityScheme} onClose={() => setEligibilityScheme(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Check eligibility – {eligibilityScheme?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField fullWidth size="small" label="Land holding" value={eligibilityForm.land_holding} onChange={(e) => setEligibilityForm((f) => ({ ...f, land_holding: e.target.value }))} margin="dense" />
            <TextField fullWidth size="small" label="Crop" value={eligibilityForm.crop} onChange={(e) => setEligibilityForm((f) => ({ ...f, crop: e.target.value }))} margin="dense" />
            <TextField fullWidth size="small" label="State" value={eligibilityForm.state} onChange={(e) => setEligibilityForm((f) => ({ ...f, state: e.target.value }))} margin="dense" />
            <TextField fullWidth size="small" label="Income (optional)" value={eligibilityForm.income} onChange={(e) => setEligibilityForm((f) => ({ ...f, income: e.target.value }))} margin="dense" />
          </Box>
          {eligibilityResult && <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{eligibilityResult}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEligibilityScheme(null)}>Close</Button>
          <Button variant="contained" onClick={checkEligibility} disabled={checking}>{checking ? 'Checking...' : 'Check eligibility'}</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}
