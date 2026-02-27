import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { useAuth } from '../store/AuthContext'
import { login } from '../services/auth'

const HERO_IMG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('farmer')
  const [error, setError] = useState('')
  const { loginSuccess } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await login(email, password, userType)
      loginSuccess(data)
      const role = data.user?.role || 'farmer'
      if (role === 'vendor') navigate('/vendor/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(detail || err.message || 'Login failed')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}>
      <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, maxWidth: 500 }}>
        <Box component="img" src={HERO_IMG} alt="Farm" sx={{ width: '100%', borderRadius: 2, boxShadow: 2 }} />
      </Box>
      <Paper sx={{ p: 4, maxWidth: 400, flexShrink: 0 }}>
        <Typography variant="h5" gutterBottom>Login to Agromod</Typography>
        {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Login as</InputLabel>
            <Select
              label="Login as"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <MenuItem value="farmer">Farmer</MenuItem>
              <MenuItem value="vendor">Vendor</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
          <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Login</Button>
        </form>
        <Button fullWidth component={Link} to="/forgot-password" sx={{ mt: 1 }} size="small">
          Forgot password?
        </Button>
        <Button fullWidth component={Link} to="/register" sx={{ mt: 0.5 }}>Create account</Button>
      </Paper>
    </Box>
  )
}
