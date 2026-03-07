import React, { useState, useEffect } from 'react'
import {
  Typography, Grid, Card, CardContent, CardActionArea, Box,
  Paper, Chip, Skeleton, IconButton, Divider, Button,
} from '@mui/material'
import CampaignIcon from '@mui/icons-material/Campaign'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import NewReleasesIcon from '@mui/icons-material/NewReleases'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PushPinIcon from '@mui/icons-material/PushPin'
import ArticleIcon from '@mui/icons-material/Article'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const tiles = [
  { title: 'Disease Detection', to: '/disease', desc: 'Upload crop image for diagnosis', img: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=400&q=80' },
  { title: 'Yield Prediction', to: '/yield', desc: 'Forecast & crop suggestions', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80' },
  { title: 'Weather Alerts', to: '/weather', desc: 'Real-time weather & alerts', img: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=400&q=80' },
  { title: 'Crop Planner', to: '/planner', desc: 'Plans & activity reminders', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80' },
  { title: 'Marketplace', to: '/marketplace', desc: 'Browse & buy from vendors', img: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80' },
  { title: 'Government Schemes', to: '/schemes', desc: 'Discover & check eligibility', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80' },
  { title: 'Price Prediction', to: '/prices', desc: 'Mandi prices & history', img: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&q=80' },
  { title: 'Kisan Mitra', to: '/kisan-mitra', desc: 'Talk to your AI farming expert', img: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&q=80', accent: true },
]

const typeIcon = {
  announcement: <CampaignIcon fontSize="small" />,
  video: <PlayCircleIcon fontSize="small" />,
  scheme_update: <NewReleasesIcon fontSize="small" />,
}

const typeColor = {
  announcement: 'info',
  video: 'error',
  scheme_update: 'success',
}

const typeLabel = {
  announcement: 'Announcement',
  video: 'Video',
  scheme_update: 'Scheme Update',
}

function NewsCard({ update }) {
  return (
    <Paper
      elevation={update.pinned ? 2 : 0}
      variant={update.pinned ? 'elevation' : 'outlined'}
      sx={{
        p: 2,
        mb: 1.5,
        borderLeft: update.pinned ? '4px solid' : undefined,
        borderLeftColor: update.pinned ? 'warning.main' : undefined,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
        {update.pinned && <PushPinIcon sx={{ fontSize: 14, color: 'warning.main' }} />}
        <Chip
          icon={typeIcon[update.update_type]}
          label={typeLabel[update.update_type] || update.update_type}
          size="small"
          color={typeColor[update.update_type] || 'default'}
          variant="outlined"
          sx={{ height: 22, fontSize: '0.7rem' }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {update.published_date}
        </Typography>
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5 }}>
        {update.title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.8rem' }}>
        {update.summary}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        {update.source && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {update.source}
          </Typography>
        )}
        {update.source_url && (
          <IconButton
            size="small"
            component="a"
            href={update.source_url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ ml: 'auto', p: 0.3 }}
          >
            <OpenInNewIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>
    </Paper>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/gov-updates/?limit=10')
      .then(({ data }) => setUpdates(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const videoUpdate = updates.find((u) => u.update_type === 'video' && u.video_url)
  const newsUpdates = updates.filter((u) => u !== videoUpdate)

  return (
    <>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Box
          component="img"
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"
          alt="Farm"
          sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 2 }}
        />
      </Box>
      <Typography variant="h4" gutterBottom>Farmer Dashboard</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Your one-stop platform for farming.
      </Typography>

      <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
        {/* Left: Feature tiles */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {tiles.map((t) => (
              <Grid item xs={12} sm={6} key={t.to}>
                <Card
                  sx={{
                    overflow: 'hidden',
                    ...(t.accent && {
                      border: '2px solid',
                      borderColor: 'primary.main',
                      boxShadow: '0 0 0 3px rgba(46,125,50,0.12)',
                    }),
                  }}
                >
                  <CardActionArea onClick={() => navigate(t.to)}>
                    {t.accent ? (
                      <Box
                        sx={{
                          height: 120,
                          background: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <SupportAgentIcon sx={{ fontSize: 56, color: '#fff', opacity: 0.9 }} />
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={t.img}
                        alt=""
                        sx={{ width: '100%', height: 120, objectFit: 'cover' }}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h6">{t.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{t.desc}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Right: Government Updates — scrollable, aligned to tiles top */}
        <Grid item xs={12} md={4} sx={{ position: { md: 'sticky' }, top: { md: 80 }, alignSelf: 'flex-start' }}>
          <Paper
            sx={{
              p: 2,
              mb: 1,
              background: 'linear-gradient(135deg, #1a5e1a 0%, #2e7d32 100%)',
              color: '#fff',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CampaignIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Latest Government Updates
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Schemes, announcements & official videos for farmers
            </Typography>
          </Paper>

          <Box
            sx={{
              maxHeight: 'calc(100vh - 260px)',
              overflowY: 'auto',
              pr: 0.5,
              pb: 1,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 },
            }}
          >
            {loading && (
              <>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1, mb: 1 }} />
                  <Skeleton variant="text" width="80%" />
                </Paper>
                {[1, 2].map((i) => (
                  <Paper key={i} sx={{ p: 2, mb: 1.5 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="80%" />
                  </Paper>
                ))}
              </>
            )}

            {!loading && (
              <>
                {videoUpdate && (
                  <Paper elevation={2} sx={{ p: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <PlayCircleIcon color="error" sx={{ fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Featured Video
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '56.25%',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        mb: 1.5,
                      }}
                    >
                      <iframe
                        src={videoUpdate.video_url}
                        title={videoUpdate.title}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none',
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                      {videoUpdate.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                      {videoUpdate.summary}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {videoUpdate.source} &bull; {videoUpdate.published_date}
                      </Typography>
                    </Box>
                  </Paper>
                )}

                {videoUpdate && newsUpdates.length > 0 && (
                  <Box sx={{ my: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Divider sx={{ flex: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ArticleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, fontWeight: 700 }}>
                        News & Updates
                      </Typography>
                    </Box>
                    <Divider sx={{ flex: 1 }} />
                  </Box>
                )}

                {newsUpdates.map((u) => (
                  <NewsCard key={u.id} update={u} />
                ))}

                {updates.length === 0 && (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">No updates available right now.</Typography>
                  </Paper>
                )}

                {updates.length > 0 && (
                  <Box sx={{ textAlign: 'center', mt: 1, pb: 1 }}>
                    <Button
                      size="small"
                      onClick={() => navigate('/schemes')}
                      sx={{ textTransform: 'none' }}
                    >
                      View all government schemes
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </>
  )
}
