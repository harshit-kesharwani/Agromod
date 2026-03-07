import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material'
import { forgotPassword, resetPassword } from '../services/auth'

const HERO_IMG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80'
const OTP_LENGTH = 6

export default function ForgotPassword() {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef([])
  const navigate = useNavigate()

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [resendTimer])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    const cleaned = phone.replace(/[\s-]/g, '')
    if (!/^\d{10,15}$/.test(cleaned)) {
      setError('Enter a valid mobile number.')
      return
    }
    setLoading(true)
    try {
      await forgotPassword(cleaned)
      setStep('otp')
      setResendTimer(60)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP.')
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
    otpRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus()
  }

  const handleOtpSubmit = () => {
    setError('')
    const code = otp.join('')
    if (code.length !== OTP_LENGTH) { setError('Please enter the full 6-digit OTP.'); return }
    setStep('reset')
  }

  const handleResend = async () => {
    setError('')
    try {
      await forgotPassword(phone.replace(/[\s-]/g, ''))
      setOtp(Array(OTP_LENGTH).fill(''))
      setResendTimer(60)
      otpRefs.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP.')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await resetPassword(phone.replace(/[\s-]/g, ''), otp.join(''), newPassword, confirmPassword)
      navigate('/login', { state: { message: 'Password reset successful. Please login with your new password.' } })
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail && detail.toLowerCase().includes('otp')) {
        setStep('otp')
        setOtp(Array(OTP_LENGTH).fill(''))
      }
      setError(detail || 'Password reset failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}>
      <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, maxWidth: 500 }}>
        <Box component="img" src={HERO_IMG} alt="Farm" sx={{ width: '100%', borderRadius: 2, boxShadow: 2 }} />
      </Box>

      <Paper sx={{ p: 4, maxWidth: 420, width: '100%', flexShrink: 0 }}>
        {step === 'phone' && (
          <>
            <Typography variant="h5" gutterBottom>Forgot Password</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Enter your registered mobile number. We'll send an OTP to reset your password.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            <form onSubmit={handleSendOtp}>
              <TextField
                fullWidth label="Mobile Number" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal" required placeholder="e.g. 9876543210"
              />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Send OTP'}
              </Button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <Typography variant="h5" gutterBottom>Enter OTP</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We sent a 6-digit OTP to <strong>{phone}</strong>.
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

            <Button fullWidth variant="contained" onClick={handleOtpSubmit} sx={{ mb: 1 }}>
              Verify OTP
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              {resendTimer > 0 ? (
                <Typography variant="body2" color="text.secondary">Resend OTP in {resendTimer}s</Typography>
              ) : (
                <Button size="small" onClick={handleResend}>Resend OTP</Button>
              )}
            </Box>

            <Button fullWidth size="small" sx={{ mt: 2 }} onClick={() => { setStep('phone'); setError('') }}>
              Change phone number
            </Button>
          </>
        )}

        {step === 'reset' && (
          <>
            <Typography variant="h5" gutterBottom>Set New Password</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              OTP verified. Enter your new password below.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            <form onSubmit={handleResetPassword}>
              <TextField
                fullWidth label="New Password" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} margin="normal" required
                inputProps={{ minLength: 6 }}
              />
              <TextField
                fullWidth label="Confirm New Password" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} margin="normal" required
              />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>
            </form>
          </>
        )}

        <Button fullWidth component={Link} to="/login" sx={{ mt: 2 }}>
          Back to login
        </Button>
      </Paper>
    </Box>
  )
}
