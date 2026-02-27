import React from 'react'
import { Typography, Grid, Card, CardContent, CardActionArea, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const tiles = [
  { title: 'Disease Detection', to: '/disease', desc: 'Upload crop image for diagnosis', img: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=400&q=80' },
  { title: 'Yield Prediction', to: '/yield', desc: 'Forecast & crop suggestions', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80' },
  { title: 'Weather Alerts', to: '/weather', desc: 'Real-time weather & alerts', img: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=400&q=80' },
  { title: 'Crop Planner', to: '/planner', desc: 'Plans & activity reminders', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80' },
  { title: 'Marketplace', to: '/marketplace', desc: 'Browse & buy from vendors', img: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80' },
  { title: 'Government Schemes', to: '/schemes', desc: 'Discover & check eligibility', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80' },
  { title: 'Price Prediction', to: '/prices', desc: 'Mandi prices & history', img: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&q=80' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Box component="img" src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80" alt="Farm" sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 2 }} />
      </Box>
      <Typography variant="h4" gutterBottom>Farmer Dashboard</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Your one-stop platform for farming.</Typography>
      <Grid container spacing={2}>
        {tiles.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.to}>
            <Card sx={{ overflow: 'hidden' }}>
              <CardActionArea onClick={() => navigate(t.to)}>
                <Box component="img" src={t.img} alt="" sx={{ width: '100%', height: 120, objectFit: 'cover' }} />
                <CardContent>
                  <Typography variant="h6">{t.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{t.desc}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  )
}
