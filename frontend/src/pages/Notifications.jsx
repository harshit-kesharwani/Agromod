import React, { useState, useEffect } from 'react'
import { Typography, Paper, List, ListItem, ListItemText, Button, Box } from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Notifications() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    api.get('/api/weather/alerts/').then(({ data }) => setAlerts(data.alerts || [])).catch(() => {})
  }, [])

  const markRead = (ids) => {
    api.patch('/api/weather/alerts/', { mark_read: ids }).then(() => {
      setAlerts((a) => a.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))
    })
  }

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Notifications</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Weather, planner reminders, and order updates.</Typography>
      <Paper>
        <List>
          {alerts.length === 0 && <ListItem><ListItemText primary="No notifications" /></ListItem>}
          {alerts.map((n) => (
            <ListItem key={n.id} sx={{ bgcolor: n.read ? 'transparent' : 'grey.100' }}>
              <ListItemText primary={n.title} secondary={n.body} />
              {!n.read && <Button size="small" onClick={() => markRead([n.id])}>Mark read</Button>}
            </ListItem>
          ))}
        </List>
        {alerts.some((n) => !n.read) && (
          <Box sx={{ p: 1 }}>
            <Button size="small" onClick={() => markRead(alerts.filter((n) => !n.read).map((n) => n.id))}>Mark all read</Button>
          </Box>
        )}
      </Paper>
    </Layout>
  )
}
