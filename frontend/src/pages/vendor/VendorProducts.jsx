import React, { useState, useEffect } from 'react'
import { Typography, Paper, Button, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert, Box } from '@mui/material'
import Layout from '../../components/Layout'
import api from '../../services/api'

const emptyForm = { name: '', description: '', price: '', unit: 'kg', stock: 0, category: '', is_active: true, image: null }

export default function VendorProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    api.get('/api/vendor/products/').then(({ data }) => setProducts(Array.isArray(data) ? data : (data.results || [])))
    api.get('/api/categories/').then(({ data }) => setCategories(Array.isArray(data) ? data : (data.results || [])))
  }
  useEffect(load, [])

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('description', form.description || '')
    fd.append('price', parseFloat(form.price) || 0)
    fd.append('unit', form.unit || 'kg')
    fd.append('stock', String(parseInt(form.stock, 10) || 0))
    fd.append('is_active', form.is_active === true || form.is_active === 'true' ? 'true' : 'false')
    if (form.category) fd.append('category', form.category)
    if (form.image && form.image instanceof File) fd.append('image', form.image)
    return fd
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const hasFile = form.image && form.image instanceof File
    const useFormData = hasFile

    const doSave = () => {
      if (form.id) {
        if (useFormData) return api.patch(`/api/vendor/products/${form.id}/`, buildFormData(), { headers: { 'Content-Type': undefined } })
        return api.patch(`/api/vendor/products/${form.id}/`, { name: form.name, description: form.description, price: parseFloat(form.price), unit: form.unit, stock: parseInt(form.stock, 10) || 0, category: form.category || null, is_active: form.is_active === true || form.is_active === 'true' })
      }
      if (useFormData) return api.post('/api/vendor/products/', buildFormData(), { headers: { 'Content-Type': undefined } })
      return api.post('/api/vendor/products/', { name: form.name, description: form.description, price: parseFloat(form.price), unit: form.unit, stock: parseInt(form.stock, 10) || 0, category: form.category || null, is_active: form.is_active === true || form.is_active === 'true' })
    }

    doSave()
      .then(() => { load(); setOpen(false); setForm(emptyForm); setError('') })
      .catch((err) => setError(err.response?.data ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)) : err.message || 'Save failed'))
      .finally(() => setSaving(false))
  }

  const edit = (p) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      unit: p.unit || 'kg',
      stock: p.stock,
      category: p.category || '',
      is_active: p.is_active,
      image: null,
    })
    setOpen(true)
  }
  const updateStock = (id, stock) => api.patch(`/api/vendor/products/${id}/`, { stock }).then(load).catch(() => {})

  const list = Array.isArray(products) ? products : []
  const catList = Array.isArray(categories) ? categories : []

  return (
    <Layout showVendorNav>
      <Typography variant="h5" gutterBottom>My Products</Typography>
      <Button variant="contained" onClick={() => { setForm({ name: '', description: '', price: '', unit: 'kg', stock: 0, category: '', is_active: true }); setOpen(true) }} sx={{ mb: 2 }}>Add product</Button>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {(p.image_url || p.image) ? (
                    <Box
                      component="img"
                      src={p.image_url || (p.image.startsWith('http') ? p.image : `/media/${p.image}`)}
                      alt=""
                      sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
                    />
                  ) : (
                    <Box sx={{ width: 48, height: 48, bgcolor: 'grey.200', borderRadius: 1 }} />
                  )}
                </TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.category_name || p.category}</TableCell>
                <TableCell>₹{p.price}/{p.unit}</TableCell>
                <TableCell>
                  <TextField type="number" size="small" value={p.stock} onChange={(e) => updateStock(p.id, parseInt(e.target.value, 10) || 0)} sx={{ width: 70 }} />
                </TableCell>
                <TableCell><Button size="small" onClick={() => edit(p)}>Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? 'Edit product' : 'Add product'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>{error}</Alert>}
            <TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} margin="dense" required />
            <TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} margin="dense" />
            <Box sx={{ mt: 1, mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Product picture</Typography>
              <Button variant="outlined" component="label" size="small">Choose image
                <input type="file" accept="image/*" hidden onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] || null }))} />
              </Button>
              {form.image && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  {form.image instanceof File ? form.image.name : 'Current image set'}
                </Typography>
              )}
            </Box>
            <TextField fullWidth type="number" label="Price" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} margin="dense" required />
            <TextField fullWidth label="Unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} margin="dense" />
            <TextField fullWidth type="number" label="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} margin="dense" />
            <FormControl fullWidth margin="dense">
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <MenuItem value="">—</MenuItem>
                {catList.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Active</InputLabel>
              <Select value={form.is_active} label="Active" onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))}>
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Layout>
  )
}
