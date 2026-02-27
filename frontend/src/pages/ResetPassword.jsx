import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper } from '@mui/material'
import { resetPassword } from '../services/auth'

const HERO_IMG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const qToken = searchParams.get('token')
    const qEmail = searchParams.get('email')
    if (qToken) setToken(qToken)
    if (qEmail) setEmail(decodeURIComponent(qEmail))
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!email || !token) {
      setError('Invalid reset link. Please request a new link from the forgot password page.')
      return
    }
    try {
      await resetPassword(email, token, password)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Reset failed')
    }
  }

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}>
        <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, maxWidth: 500 }}>
          <Box component="img" src={HERO_IMG} alt="Farm" sx={{ width: '100%', borderRadius: 2, boxShadow: 2 }} />
        </Box>
        <Paper sx={{ p: 4, maxWidth: 400, flexShrink: 0 }}>
          <Typography variant="h5" gutterBottom>Password reset</Typography>
          <Typography color="success.main" sx={{ mb: 2 }}>
            Your password has been reset. You can now log in with your new password.
          </Typography>
          <Button fullWidth variant="contained" component={Link} to="/login">
            Go to login
          </Button>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}>
      <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, maxWidth: 500 }}>
        <Box component="img" src={HERO_IMG} alt="Farm" sx={{ width: '100%', borderRadius: 2, boxShadow: 2 }} />
      </Box>
      <Paper sx={{ p: 4, maxWidth: 400, flexShrink: 0 }}>
        <Typography variant="h5" gutterBottom>Set new password</Typography>
        {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            margin="normal"
            placeholder="Paste token from email or forgot-password page"
            required
          />
          <TextField
            fullWidth
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            inputProps={{ minLength: 6 }}
          />
          <TextField
            fullWidth
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Reset password
          </Button>
        </form>
        <Button fullWidth component={Link} to="/forgot-password" sx={{ mt: 1 }}>
          Request new reset link
        </Button>
        <Button fullWidth component={Link} to="/login" sx={{ mt: 0.5 }}>
          Back to login
        </Button>
      </Paper>
    </Box>
  )
}
