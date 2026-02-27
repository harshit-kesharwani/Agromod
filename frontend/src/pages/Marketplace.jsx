import React, { useState, useEffect } from 'react'
import { Typography, Paper, Grid, Card, CardContent, CardActionArea, Button, TextField, Box, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Marketplace() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('agromod_cart') || '[]'))
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/api/products/').then(({ data }) => setProducts(data.results || data))
    api.get('/api/categories/').then(({ data }) => setCategories(data.results || data))
  }, [])
  useEffect(() => {
    api.get('/api/orders/').then(({ data }) => setOrders(data.results || data))
  }, [checkoutOpen])
  useEffect(() => { localStorage.setItem('agromod_cart', JSON.stringify(cart)) }, [cart])

  const addToCart = (product, qty = 1) => {
    setCart((c) => {
      const existing = c.find((x) => x.product_id === product.id)
      if (existing) return c.map((x) => x.product_id === product.id ? { ...x, quantity: Math.min(x.quantity + qty, product.stock) } : x)
      return [...c, { product_id: product.id, product_name: product.name, price: product.price, quantity: Math.min(qty, product.stock) }]
    })
  }

  const removeFromCart = (productId) => setCart((c) => c.filter((x) => x.product_id !== productId))
  const setQuantity = (productId, qty) => setCart((c) => c.map((x) => x.product_id === productId ? { ...x, quantity: Math.max(0, Number(qty)) } : x).filter((x) => x.quantity > 0))

  const handleCheckout = () => {
    if (!shippingAddress.trim() || cart.length === 0) return
    api.post('/api/orders/', {
      shipping_address: shippingAddress,
      items: cart.map((x) => ({ product_id: x.product_id, quantity: x.quantity })),
    }).then(() => { setCart([]); setCheckoutOpen(false); setShippingAddress('') }).catch((e) => alert(e.response?.data?.detail || e.message))
  }

  const total = cart.reduce((s, x) => s + Number(x.price) * x.quantity, 0)
  const productList = Array.isArray(products) ? products : []

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Marketplace</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Browse and buy from vendors.</Typography>
      <Grid container spacing={2}>
        {productList.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card>
              <CardActionArea onClick={() => addToCart(p)}>
                <CardContent>
                  <Typography variant="h6">{p.name}</Typography>
                  <Typography color="text.secondary">{p.category_name} • ₹{p.price}/{p.unit}</Typography>
                  <Typography variant="body2">Stock: {p.stock}</Typography>
                </CardContent>
              </CardActionArea>
              <Box sx={{ p: 1 }}>
                <Button size="small" onClick={() => addToCart(p)}>Add to cart</Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Paper sx={{ position: 'fixed', bottom: 80, right: 24, p: 2, minWidth: 200 }}>
        <Typography variant="subtitle2">Cart ({cart.length})</Typography>
        <Typography>Total: ₹{total.toFixed(2)}</Typography>
        <Button size="small" variant="contained" onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0}>Checkout</Button>
      </Paper>
      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
        <DialogTitle>Checkout</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Shipping address" multiline value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} margin="dense" required />
          {cart.map((x) => (
            <Box key={x.product_id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography>{x.product_name} x {x.quantity}</Typography>
              <Box>
                <Button size="small" onClick={() => setQuantity(x.product_id, x.quantity - 1)}>-</Button>
                <Typography component="span" sx={{ mx: 1 }}>{x.quantity}</Typography>
                <Button size="small" onClick={() => setQuantity(x.product_id, x.quantity + 1)}>+</Button>
                <Button size="small" onClick={() => removeFromCart(x.product_id)}>Remove</Button>
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCheckout} disabled={!shippingAddress.trim() || cart.length === 0}>Place order</Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">My orders</Typography>
        {orders.length === 0 && <Typography color="text.secondary">No orders yet.</Typography>}
        {(orders || []).map((o) => (
          <Paper key={o.id} sx={{ p: 2, mt: 1 }}>
            <Typography>Order #{o.id} – {o.status} – ₹{o.total}</Typography>
          </Paper>
        ))}
      </Box>
    </Layout>
  )
}
