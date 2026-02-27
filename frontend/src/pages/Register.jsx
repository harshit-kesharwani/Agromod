import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { useAuth } from '../store/AuthContext'
import { register } from '../services/auth'

const HERO_IMG = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '', role: 'farmer', business_name: '' })
  const [error, setError] = useState('')
  const { loginSuccess } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = { ...form }
    if (form.role === 'farmer') payload.farmer_profile = {}
    else payload.vendor_profile = { business_name: form.business_name }
    try {
      const data = await register(payload)
      loginSuccess(data)
      if (data.role === 'vendor') navigate('/vendor/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data
      setError(typeof msg === 'object' ? JSON.stringify(msg) : (err.message || 'Registration failed'))
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}>
      <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, maxWidth: 500 }}>
        <Box component="img" src={HERO_IMG} alt="Agriculture" sx={{ width: '100%', borderRadius: 2, boxShadow: 2 }} />
      </Box>
      <Paper sx={{ p: 4, maxWidth: 400, flexShrink: 0 }}>
        <Typography variant="h5" gutterBottom>Register - Agromod</Typography>
        {error && <Typography color="error" sx={{ mb: 1, fontSize: '0.875rem' }}>{error}</Typography>}
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <InputLabel>I am a</InputLabel>
            <Select name="role" value={form.role} label="I am a" onChange={handleChange}>
              <MenuItem value="farmer">Farmer</MenuItem>
              <MenuItem value="vendor">Vendor</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth name="email" label="Email" type="email" value={form.email} onChange={handleChange} margin="normal" required />
          <TextField fullWidth name="password" label="Password" type="password" value={form.password} onChange={handleChange} margin="normal" required />
          <TextField fullWidth name="first_name" label="First name" value={form.first_name} onChange={handleChange} margin="normal" />
          <TextField fullWidth name="last_name" label="Last name" value={form.last_name} onChange={handleChange} margin="normal" />
          <TextField fullWidth name="phone" label="Phone" value={form.phone} onChange={handleChange} margin="normal" />
          {form.role === 'vendor' && <TextField fullWidth name="business_name" label="Business name" value={form.business_name} onChange={handleChange} margin="normal" />}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Register</Button>
        </form>
        <Button fullWidth component={Link} to="/login" sx={{ mt: 1 }}>Already have an account? Login</Button>
      </Paper>
    </Box>
  )
}
