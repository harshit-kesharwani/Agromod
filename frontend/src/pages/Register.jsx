import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, TextField, Button, Typography, Paper, FormControl,
  InputLabel, Select, MenuItem, Alert, CircularProgress
} from '@mui/material'
import { useAuth } from '../store/AuthContext'
import { register, verifyOtp, resendOtp } from '../services/auth'

const HERO_IMG = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80'
const OTP_LENGTH = 6

export default function Register() {
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({
    phone: '', email: '', password: '', confirm_password: '',
    first_name: '', last_name: '', role: 'farmer', business_name: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [resendTimer, setResendTimer] = useState(60)
  const otpRefs = useRef([])
  const { loginSuccess } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [step, resendTimer])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.phone.trim()) errs.phone = 'Mobile number is required.'
    else if (!/^\+?\d{10,15}$/.test(form.phone.replace(/[\s-]/g, '')))
      errs.phone = 'Enter a valid mobile number (10-15 digits).'
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.'
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    const payload = { ...form }
    if (form.role === 'farmer') payload.farmer_profile = {}
    else payload.vendor_profile = { business_name: form.business_name }
    try {
      const data = await register(payload)
      setPhone(data.phone || form.phone.replace(/[\s-]/g, ''))
      setStep('otp')
      setResendTimer(60)
    } catch (err) {
      const msg = err.response?.data
      if (typeof msg === 'object' && !msg.detail) {
        const errs = {}
        Object.entries(msg).forEach(([k, v]) => {
          errs[k] = Array.isArray(v) ? v.join(' ') : v
        })
        setFieldErrors(errs)
      } else {
        setError(msg?.detail || (typeof msg === 'string' ? msg : 'Registration failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[idx] = value
    setOtp(next)
    if (value && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!text) return
    e.preventDefault()
    const next = Array(OTP_LENGTH).fill('')
    text.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1)
    otpRefs.current[focusIdx]?.focus()
  }

  const handleVerify = async () => {
    setError('')
    const code = otp.join('')
    if (code.length !== OTP_LENGTH) { setError('Please enter the full 6-digit OTP.'); return }
    setLoading(true)
    try {
      const data = await verifyOtp(phone, code)
      loginSuccess(data)
      if (data.role === 'vendor') navigate('/vendor/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    try {
      await resendOtp(phone)
      setOtp(Array(OTP_LENGTH).fill(''))
      setResendTimer(60)
      otpRefs.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP.')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}>
      <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, maxWidth: 500 }}>
        <Box component="img" src={HERO_IMG} alt="Agriculture" sx={{ width: '100%', borderRadius: 2, boxShadow: 2 }} />
      </Box>

      <Paper sx={{ p: 4, maxWidth: 420, width: '100%', flexShrink: 0 }}>
        {step === 'form' ? (
          <>
            <Typography variant="h5" gutterBottom>Register - Agromod</Typography>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="normal">
                <InputLabel>I am a</InputLabel>
                <Select name="role" value={form.role} label="I am a" onChange={handleChange}>
                  <MenuItem value="farmer">Farmer</MenuItem>
                  <MenuItem value="vendor">Vendor</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth name="phone" label="Mobile Number" value={form.phone}
                onChange={handleChange} margin="normal" required
                placeholder="e.g. 9876543210"
                error={!!fieldErrors.phone} helperText={fieldErrors.phone}
              />
              <TextField
                fullWidth name="email" label="Email (optional)" type="email" value={form.email}
                onChange={handleChange} margin="normal"
                error={!!fieldErrors.email} helperText={fieldErrors.email}
              />
              <TextField
                fullWidth name="password" label="Password" type="password" value={form.password}
                onChange={handleChange} margin="normal" required
                error={!!fieldErrors.password} helperText={fieldErrors.password}
              />
              <TextField
                fullWidth name="confirm_password" label="Confirm Password" type="password"
                value={form.confirm_password} onChange={handleChange} margin="normal" required
                error={!!fieldErrors.confirm_password} helperText={fieldErrors.confirm_password}
              />
              <TextField fullWidth name="first_name" label="First name" value={form.first_name} onChange={handleChange} margin="normal" />
              <TextField fullWidth name="last_name" label="Last name" value={form.last_name} onChange={handleChange} margin="normal" />
              {form.role === 'vendor' && (
                <TextField fullWidth name="business_name" label="Business name" value={form.business_name} onChange={handleChange} margin="normal" />
              )}
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </form>
            <Button fullWidth component={Link} to="/login" sx={{ mt: 1 }}>Already have an account? Login</Button>
          </>
        ) : (
          <>
            <Typography variant="h5" gutterBottom>Verify Mobile Number</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We sent a 6-digit OTP to <strong>{phone}</strong>. Enter it below to activate your account.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <TextField
                  key={i}
                  inputRef={(el) => { otpRefs.current[i] = el }}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: '1.5rem', width: 36, padding: '10px 0' } }}
                  variant="outlined"
                />
              ))}
            </Box>

            <Button fullWidth variant="contained" onClick={handleVerify} disabled={loading} sx={{ mb: 1 }}>
              {loading ? <CircularProgress size={24} /> : 'Verify & Continue'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              {resendTimer > 0 ? (
                <Typography variant="body2" color="text.secondary">Resend OTP in {resendTimer}s</Typography>
              ) : (
                <Button size="small" onClick={handleResend}>Resend OTP</Button>
              )}
            </Box>

            <Button fullWidth size="small" sx={{ mt: 2 }} onClick={() => { setStep('form'); setError('') }}>
              Back to registration
            </Button>
          </>
        )}
      </Paper>
    </Box>
  )
}
