import React, { useState, useEffect } from 'react'
import { Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Button, Box, Chip, Divider } from '@mui/material'
import CloudIcon from '@mui/icons-material/Cloud'
import EventIcon from '@mui/icons-material/Event'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Notifications() {
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [plannerNotifs, setPlannerNotifs] = useState([])

  const loadAll = () => {
    api.get('/api/weather/alerts/')
      .then(({ data }) => setWeatherAlerts(data.alerts || []))
      .catch(() => {})
    api.get('/api/planner/notifications/')
      .then(({ data }) => setPlannerNotifs(data.notifications || []))
      .catch(() => {})
  }

  useEffect(() => { loadAll() }, [])

  const markWeatherRead = (ids) => {
    api.patch('/api/weather/alerts/', { mark_read: ids }).then(() => {
      setWeatherAlerts((a) => a.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))
    })
  }

  const markPlannerRead = (ids) => {
    api.patch('/api/planner/notifications/', { mark_read: ids }).then(() => {
      setPlannerNotifs((a) => a.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))
    })
  }

  const allNotifs = [
    ...weatherAlerts.map((n) => ({ ...n, source: 'weather' })),
    ...plannerNotifs.map((n) => ({ ...n, source: 'planner' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const unreadCount = allNotifs.filter((n) => !n.read).length

  const handleMarkRead = (n) => {
    if (n.source === 'weather') markWeatherRead([n.id])
    else markPlannerRead([n.id])
  }

  const handleMarkAllRead = () => {
    const weatherUnread = weatherAlerts.filter((n) => !n.read).map((n) => n.id)
    const plannerUnread = plannerNotifs.filter((n) => !n.read).map((n) => n.id)
    if (weatherUnread.length) markWeatherRead(weatherUnread)
    if (plannerUnread.length) markPlannerRead(plannerUnread)
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5">Notifications</Typography>
        {unreadCount > 0 && (
          <Chip label={`${unreadCount} unread`} color="primary" size="small" />
        )}
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Weather alerts, planner reminders, and order updates.</Typography>
      <Paper>
        <List>
          {allNotifs.length === 0 && (
            <ListItem><ListItemText primary="No notifications" /></ListItem>
          )}
          {allNotifs.map((n, i) => (
            <React.Fragment key={`${n.source}-${n.id}`}>
              {i > 0 && <Divider />}
              <ListItem sx={{ bgcolor: n.read ? 'transparent' : 'action.hover' }}>
                <ListItemIcon>
                  {n.source === 'weather' ? <CloudIcon color="info" /> : <EventIcon color="warning" />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {n.title}
                      <Chip
                        label={n.source === 'weather' ? 'Weather' : 'Planner'}
                        size="small"
                        variant="outlined"
                        color={n.source === 'weather' ? 'info' : 'warning'}
                      />
                    </Box>
                  }
                  secondary={n.body}
                />
                {!n.read && (
                  <Button size="small" onClick={() => handleMarkRead(n)}>Mark read</Button>
                )}
              </ListItem>
            </React.Fragment>
          ))}
        </List>
        {unreadCount > 0 && (
          <Box sx={{ p: 1 }}>
            <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
          </Box>
        )}
      </Paper>
    </Layout>
  )
}
