import React from 'react'
import { Box, Typography, Button, Container, Grid, Card, CardContent } from '@mui/material'
import { Link } from 'react-router-dom'
import PlantGrowthHero from '../components/PlantGrowthHero'

const features = [
  { title: 'Disease Detection', desc: 'Upload crop images for AI diagnosis and treatment', to: '/disease' },
  { title: 'Yield & Weather', desc: 'Forecasts, crop suggestions, and real-time alerts', to: '/yield' },
  { title: 'Marketplace', desc: 'Browse and buy from vendors', to: '/marketplace' },
  { title: 'Government Schemes', desc: 'Discover schemes and check eligibility', to: '/schemes' },
]

export default function Home() {
  return (
    <Box>
      <PlantGrowthHero />
      {/* Features */}
      <Box sx={{ bgcolor: '#e5e1dc', py: 6, pb: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h5" align="center" gutterBottom sx={{ color: 'text.primary' }}>Features</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {features.map((f) => (
              <Grid item xs={12} sm={6} md={3} key={f.to}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                    <Button component={Link} to={f.to} size="small" sx={{ mt: 1 }}>Learn more</Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}
