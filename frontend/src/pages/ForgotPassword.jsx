import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper } from '@mui/material'
import { forgotPassword } from '../services/auth'

const HERO_IMG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [resetInfo, setResetInfo] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setResetInfo(null)
    try {
      const data = await forgotPassword(email)
      setSuccess(data.message || 'If an account exists with this email, you will receive reset instructions.')
      if (data.reset_token != null) {
        setResetInfo({
          token: data.reset_token,
          email,
          link: `/reset-password?token=${encodeURIComponent(data.reset_token)}&email=${encodeURIComponent(email)}`,
        })
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Request failed')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}>
      <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, maxWidth: 500 }}>
        <Box component="img" src={HERO_IMG} alt="Farm" sx={{ width: '100%', borderRadius: 2, boxShadow: 2 }} />
      </Box>
      <Paper sx={{ p: 4, maxWidth: 400, flexShrink: 0 }}>
        <Typography variant="h5" gutterBottom>Forgot password</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </Typography>
        {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
        {success && <Typography color="success.main" sx={{ mb: 1 }}>{success}</Typography>}
        {!success ? (
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
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
              Send reset link
            </Button>
          </form>
        ) : resetInfo ? (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              For testing, use the link below to reset your password:
            </Typography>
            <Button
              fullWidth
              variant="contained"
              component={Link}
              to={resetInfo.link}
              sx={{ mt: 1 }}
            >
              Go to reset password
            </Button>
          </Box>
        ) : null}
        <Button fullWidth component={Link} to="/login" sx={{ mt: 2 }}>
          Back to login
        </Button>
      </Paper>
    </Box>
  )
}
