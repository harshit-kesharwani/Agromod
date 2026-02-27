import React, { useState, useEffect } from 'react'
import {
  Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Box, Card, CardContent, CardActions, Grid, Chip, Divider,
  CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ShieldIcon from '@mui/icons-material/Shield'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import Layout from '../components/Layout'
import api from '../services/api'

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

const SCHEME_CONFIG = {
  'pm-kisan': {
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80',
    icon: <AccountBalanceIcon />,
    color: '#2e7d32',
    gradient: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
  },
  'pmfby': {
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80',
    icon: <ShieldIcon />,
    color: '#1565c0',
    gradient: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
  },
  'kcc': {
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80',
    icon: <CreditCardIcon />,
    color: '#e65100',
    gradient: 'linear-gradient(135deg, #e65100 0%, #ff9800 100%)',
  },
}

const DEFAULT_CONFIG = {
  image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80',
  icon: <AccountBalanceIcon />,
  color: '#37474f',
  gradient: 'linear-gradient(135deg, #37474f 0%, #78909c 100%)',
}

const CATEGORY_LABELS = {
  subsidy: { label: 'Direct Benefit', color: 'success' },
  insurance: { label: 'Crop Insurance', color: 'info' },
  loan: { label: 'Credit / Loan', color: 'warning' },
}

export default function Schemes() {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailScheme, setDetailScheme] = useState(null)
  const [eligibilityScheme, setEligibilityScheme] = useState(null)
  const [eligibilityForm, setEligibilityForm] = useState({
    land_holding: '', crop: '', state: '', income: '',
    age: '', land_ownership: '', has_bank_account: '', pending_loan: '', has_id_proof: '',
    has_aadhaar: '', is_govt_employee: '', pays_income_tax: '', family_members: '',
    crop_season: '', has_land_records: '',
  })
  const [eligibilityResult, setEligibilityResult] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    api.get('/api/schemes/')
      .then(({ data }) => setSchemes(data.results || data))
      .finally(() => setLoading(false))
  }, [])

  const openDetail = (scheme) => setDetailScheme(scheme)
  const closeDetail = () => setDetailScheme(null)

  const openEligibility = (scheme, e) => {
    if (e) e.stopPropagation()
    setDetailScheme(null)
    setEligibilityScheme(scheme)
    setEligibilityResult('')
    setEligibilityForm({
      land_holding: '', crop: '', state: '', income: '',
      age: '', land_ownership: '', has_bank_account: '', pending_loan: '', has_id_proof: '',
      has_aadhaar: '', is_govt_employee: '', pays_income_tax: '', family_members: '',
      crop_season: '', has_land_records: '',
    })
  }

  const checkEligibility = () => {
    if (!eligibilityScheme?.slug) return
    setChecking(true)
    api.post(`/api/schemes/${eligibilityScheme.slug}/check_eligibility/`, eligibilityForm)
      .then(({ data }) => setEligibilityResult(data.result || ''))
      .catch(() => setEligibilityResult('Could not check eligibility. Please try again.'))
      .finally(() => setChecking(false))
  }

  const list = Array.isArray(schemes) ? schemes : []

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Government Schemes
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 600 }}>
          Explore schemes designed to support Indian farmers. Check your eligibility and learn how to apply.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : list.length === 0 ? (
        <Alert severity="info">No schemes available at the moment.</Alert>
      ) : (
        <Grid container spacing={3}>
          {list.map((s) => {
            const cfg = SCHEME_CONFIG[s.slug] || DEFAULT_CONFIG
            const catInfo = CATEGORY_LABELS[s.category?.toLowerCase()] || { label: s.category, color: 'default' }
            return (
              <Grid item xs={12} sm={6} md={4} key={s.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: 180,
                      background: cfg.gradient,
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    onClick={() => openDetail(s)}
                  >
                    <Box
                      component="img"
                      src={cfg.image}
                      alt={s.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.3,
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: 2,
                        color: 'white',
                      }}
                    >
                      <Box sx={{ fontSize: 40, mb: 1 }}>{cfg.icon}</Box>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        align="center"
                        sx={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)', lineHeight: 1.3 }}
                      >
                        {s.name}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ flex: 1, pt: 2, pb: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={catInfo.label}
                        color={catInfo.color}
                        size="small"
                        variant="outlined"
                      />
                      {s.state && s.state !== 'All India' && (
                        <Chip label={s.state} size="small" variant="outlined" />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {s.short_description}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      onClick={() => openDetail(s)}
                    >
                      Learn more
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={(e) => openEligibility(s, e)}
                      sx={{
                        bgcolor: cfg.color,
                        '&:hover': { bgcolor: cfg.color, filter: 'brightness(1.15)' },
                        borderRadius: 2,
                        textTransform: 'none',
                      }}
                    >
                      Check Eligibility
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Detail popup */}
      <Dialog
        open={!!detailScheme}
        onClose={closeDetail}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {detailScheme && (() => {
          const cfg = SCHEME_CONFIG[detailScheme.slug] || DEFAULT_CONFIG
          const catInfo = CATEGORY_LABELS[detailScheme.category?.toLowerCase()] || { label: detailScheme.category, color: 'default' }
          return (
            <>
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 160, md: 220 },
                  background: cfg.gradient,
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="img"
                  src={cfg.image}
                  alt={detailScheme.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}
                />
                <Box
                  sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    alignItems: 'center', p: 3, color: 'white',
                  }}
                >
                  <Box sx={{ fontSize: 48, mb: 1 }}>{cfg.icon}</Box>
                  <Typography variant="h4" fontWeight={700} align="center" sx={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {detailScheme.name}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip label={catInfo.label} color={catInfo.color} size="small" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.7)' }} variant="outlined" />
                  </Box>
                </Box>
              </Box>
              <DialogContent sx={{ pt: 3 }}>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
                  {detailScheme.description}
                </Typography>

                {detailScheme.eligibility_criteria && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} color={cfg.color} gutterBottom>
                      Eligibility Criteria
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                      {detailScheme.eligibility_criteria}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />

                {detailScheme.documents_required && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} color={cfg.color} gutterBottom>
                      Documents Required
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                      {detailScheme.documents_required}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />

                {detailScheme.application_process && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} color={cfg.color} gutterBottom>
                      How to Apply
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                      {detailScheme.application_process}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                {detailScheme.official_link && (
                  <Button
                    href={detailScheme.official_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<OpenInNewIcon />}
                  >
                    Official Website
                  </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={closeDetail}>Close</Button>
                <Button
                  variant="contained"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={(e) => openEligibility(detailScheme, e)}
                  sx={{
                    bgcolor: cfg.color,
                    '&:hover': { bgcolor: cfg.color, filter: 'brightness(1.15)' },
                    borderRadius: 2,
                    textTransform: 'none',
                  }}
                >
                  Check Eligibility
                </Button>
              </DialogActions>
            </>
          )
        })()}
      </Dialog>

      {/* Eligibility dialog */}
      <Dialog
        open={!!eligibilityScheme}
        onClose={() => setEligibilityScheme(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {eligibilityScheme && (() => {
          const cfg = SCHEME_CONFIG[eligibilityScheme.slug] || DEFAULT_CONFIG
          return (
            <>
              <DialogTitle sx={{ bgcolor: cfg.color, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlineIcon />
                {eligibilityScheme.name}
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Answer a few simple questions and we will tell you if you can get this benefit.
                </Typography>

                {eligibilityScheme.slug === 'kcc' ? (
                  <>
                    <TextField
                      fullWidth size="small" label="Your age" type="number"
                      value={eligibilityForm.age}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, age: e.target.value }))}
                      margin="dense" placeholder="e.g. 35"
                    />
                    <TextField
                      fullWidth size="small" label="How much land do you farm on? (in acres)"
                      value={eligibilityForm.land_holding}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, land_holding: e.target.value }))}
                      margin="dense" placeholder="e.g. 2 acres"
                    />
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Is this your own land?</InputLabel>
                      <Select
                        label="Is this your own land?"
                        value={eligibilityForm.land_ownership}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, land_ownership: e.target.value }))}
                      >
                        <MenuItem value="own_land">Yes, it is my own land</MenuItem>
                        <MenuItem value="others_land">No, I farm on someone else's land</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth size="small" label="What crop do you grow?"
                      value={eligibilityForm.crop}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, crop: e.target.value }))}
                      margin="dense" placeholder="e.g. Wheat, Rice, Sugarcane"
                    />
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Your state</InputLabel>
                      <Select
                        label="Your state"
                        value={eligibilityForm.state}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, state: e.target.value }))}
                      >
                        {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Do you have a bank account?</InputLabel>
                      <Select
                        label="Do you have a bank account?"
                        value={eligibilityForm.has_bank_account}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, has_bank_account: e.target.value }))}
                      >
                        <MenuItem value="yes">Yes, I have a bank account</MenuItem>
                        <MenuItem value="no">No, I don't have one</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Do you have any unpaid bank loan?</InputLabel>
                      <Select
                        label="Do you have any unpaid bank loan?"
                        value={eligibilityForm.pending_loan}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, pending_loan: e.target.value }))}
                      >
                        <MenuItem value="no">No, all my loans are paid</MenuItem>
                        <MenuItem value="yes">Yes, I have an unpaid loan</MenuItem>
                        <MenuItem value="never">I have never taken a loan</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Do you have Aadhaar card or any ID proof?</InputLabel>
                      <Select
                        label="Do you have Aadhaar card or any ID proof?"
                        value={eligibilityForm.has_id_proof}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, has_id_proof: e.target.value }))}
                      >
                        <MenuItem value="yes">Yes, I have Aadhaar / Voter ID / other ID</MenuItem>
                        <MenuItem value="no">No, I don't have any ID proof</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                ) : eligibilityScheme.slug === 'pm-kisan' ? (
                  <>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Do you own farming land?</InputLabel>
                      <Select
                        label="Do you own farming land?"
                        value={eligibilityForm.land_ownership}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, land_ownership: e.target.value }))}
                      >
                        <MenuItem value="own_land">Yes, I own farming land</MenuItem>
                        <MenuItem value="no_land">No, I don't own any land</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth size="small" label="How much land do you own? (in acres)"
                      value={eligibilityForm.land_holding}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, land_holding: e.target.value }))}
                      margin="dense" placeholder="e.g. 2 acres"
                    />
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Your state</InputLabel>
                      <Select
                        label="Your state"
                        value={eligibilityForm.state}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, state: e.target.value }))}
                      >
                        {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth size="small" label="How many people in your family?"
                      type="number" value={eligibilityForm.family_members}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, family_members: e.target.value }))}
                      margin="dense" placeholder="e.g. 5"
                    />
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Do you have a bank account?</InputLabel>
                      <Select
                        label="Do you have a bank account?"
                        value={eligibilityForm.has_bank_account}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, has_bank_account: e.target.value }))}
                      >
                        <MenuItem value="yes">Yes, I have a bank account</MenuItem>
                        <MenuItem value="no">No, I don't have one</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Do you have an Aadhaar card?</InputLabel>
                      <Select
                        label="Do you have an Aadhaar card?"
                        value={eligibilityForm.has_aadhaar}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, has_aadhaar: e.target.value }))}
                      >
                        <MenuItem value="yes">Yes, I have Aadhaar card</MenuItem>
                        <MenuItem value="no">No, I don't have one</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Does anyone in your family work in government?</InputLabel>
                      <Select
                        label="Does anyone in your family work in government?"
                        value={eligibilityForm.is_govt_employee}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, is_govt_employee: e.target.value }))}
                      >
                        <MenuItem value="no">No, nobody in my family works in government</MenuItem>
                        <MenuItem value="yes">Yes, someone works in government</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Does anyone in your family pay income tax?</InputLabel>
                      <Select
                        label="Does anyone in your family pay income tax?"
                        value={eligibilityForm.pays_income_tax}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, pays_income_tax: e.target.value }))}
                      >
                        <MenuItem value="no">No, nobody pays income tax</MenuItem>
                        <MenuItem value="yes">Yes, someone pays income tax</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                ) : eligibilityScheme.slug === 'pmfby' ? (
                  <>
                    <TextField
                      fullWidth size="small" label="How much land do you farm on? (in acres)"
                      value={eligibilityForm.land_holding}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, land_holding: e.target.value }))}
                      margin="dense" placeholder="e.g. 2 acres"
                    />
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Is this your own land?</InputLabel>
                      <Select
                        label="Is this your own land?"
                        value={eligibilityForm.land_ownership}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, land_ownership: e.target.value }))}
                      >
                        <MenuItem value="own_land">Yes, it is my own land</MenuItem>
                        <MenuItem value="others_land">No, I farm on someone else's land</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth size="small" label="What crop do you grow?"
                      value={eligibilityForm.crop}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, crop: e.target.value }))}
                      margin="dense" placeholder="e.g. Wheat, Rice, Sugarcane"
                    />
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Which season do you grow your crop?</InputLabel>
                      <Select
                        label="Which season do you grow your crop?"
                        value={eligibilityForm.crop_season}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, crop_season: e.target.value }))}
                      >
                        <MenuItem value="kharif">Kharif (monsoon - June to October)</MenuItem>
                        <MenuItem value="rabi">Rabi (winter - November to March)</MenuItem>
                        <MenuItem value="zaid">Zaid (summer - March to June)</MenuItem>
                        <MenuItem value="commercial">Commercial / Cash crop</MenuItem>
                        <MenuItem value="horticultural">Fruits / Vegetables</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Your state</InputLabel>
                      <Select
                        label="Your state"
                        value={eligibilityForm.state}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, state: e.target.value }))}
                      >
                        {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Do you have a bank account?</InputLabel>
                      <Select
                        label="Do you have a bank account?"
                        value={eligibilityForm.has_bank_account}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, has_bank_account: e.target.value }))}
                      >
                        <MenuItem value="yes">Yes, I have a bank account</MenuItem>
                        <MenuItem value="no">No, I don't have one</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Do you have an Aadhaar card?</InputLabel>
                      <Select
                        label="Do you have an Aadhaar card?"
                        value={eligibilityForm.has_aadhaar}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, has_aadhaar: e.target.value }))}
                      >
                        <MenuItem value="yes">Yes, I have Aadhaar card</MenuItem>
                        <MenuItem value="no">No, I don't have one</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Do you have land papers or lease agreement?</InputLabel>
                      <Select
                        label="Do you have land papers or lease agreement?"
                        value={eligibilityForm.has_land_records}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, has_land_records: e.target.value }))}
                      >
                        <MenuItem value="yes">Yes, I have land papers / lease agreement</MenuItem>
                        <MenuItem value="no">No, I don't have any land papers</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                ) : (
                  <>
                    <TextField
                      fullWidth size="small" label="How much land do you farm on? (in acres)"
                      value={eligibilityForm.land_holding}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, land_holding: e.target.value }))}
                      margin="dense"
                    />
                    <TextField
                      fullWidth size="small" label="What crop do you grow?"
                      value={eligibilityForm.crop}
                      onChange={(e) => setEligibilityForm((f) => ({ ...f, crop: e.target.value }))}
                      margin="dense"
                    />
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>Your state</InputLabel>
                      <Select
                        label="Your state"
                        value={eligibilityForm.state}
                        onChange={(e) => setEligibilityForm((f) => ({ ...f, state: e.target.value }))}
                      >
                        {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </>
                )}

                {eligibilityResult && (
                  <Alert
                    severity={
                      eligibilityResult.includes('NOT ELIGIBLE') ? 'error'
                        : eligibilityResult.includes('ELIGIBLE') ? 'success'
                        : eligibilityResult.includes('fill in') ? 'warning'
                        : 'info'
                    }
                    sx={{ mt: 2, whiteSpace: 'pre-wrap' }}
                  >
                    {eligibilityResult}
                  </Alert>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setEligibilityScheme(null)}>Close</Button>
                <Button
                  variant="contained"
                  onClick={checkEligibility}
                  disabled={checking}
                  sx={{
                    bgcolor: cfg.color,
                    '&:hover': { bgcolor: cfg.color, filter: 'brightness(1.15)' },
                    borderRadius: 2,
                    textTransform: 'none',
                  }}
                >
                  {checking ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Check Eligibility'}
                </Button>
              </DialogActions>
            </>
          )
        })()}
      </Dialog>
    </Layout>
  )
}
