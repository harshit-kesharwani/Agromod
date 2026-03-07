import React, { useState, useEffect, useCallback } from 'react'
import {
  Typography, Paper, Button, TextField, Box, List, ListItem,
  ListItemText, ListItemIcon, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, IconButton, Checkbox, Chip, Snackbar, Alert,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import Layout from '../components/Layout'
import api from '../services/api'

const EMPTY_PLAN = { name: '', crop: '', start_date: '', end_date: '', notes: '' }
const EMPTY_ACTIVITY = { name: '', due_date: '', reminder_days_before: 1, notes: '' }

export default function Planner() {
  const [plans, setPlans] = useState([])
  const [activities, setActivities] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [planForm, setPlanForm] = useState(EMPTY_PLAN)
  const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY)
  const [planOpen, setPlanOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity })

  const loadPlans = useCallback(() => {
    api.get('/api/planner/plans/')
      .then(({ data }) => setPlans(data.results || data))
      .catch(() => showSnack('Failed to load plans', 'error'))
  }, [])

  const loadActivities = useCallback(() => {
    if (!selectedPlanId) {
      setActivities([])
      return
    }
    api.get(`/api/planner/activities/?plan=${selectedPlanId}`)
      .then(({ data }) => setActivities(data.results || data))
      .catch(() => showSnack('Failed to load activities', 'error'))
  }, [selectedPlanId])

  useEffect(() => { loadPlans() }, [loadPlans])
  useEffect(() => { loadActivities() }, [loadActivities])

  const handleAddPlan = (e) => {
    e.preventDefault()
    api.post('/api/planner/plans/', planForm)
      .then(() => {
        loadPlans()
        setPlanOpen(false)
        setPlanForm(EMPTY_PLAN)
        showSnack('Plan created successfully')
      })
      .catch(() => showSnack('Failed to create plan', 'error'))
  }

  const handleDeletePlan = (id) => {
    api.delete(`/api/planner/plans/${id}/`)
      .then(() => {
        if (selectedPlanId === id) {
          setSelectedPlanId(null)
          setActivities([])
        }
        loadPlans()
        showSnack('Plan deleted')
      })
      .catch(() => showSnack('Failed to delete plan', 'error'))
  }

  const handleAddActivity = (e) => {
    e.preventDefault()
    if (!selectedPlanId) return
    api.post('/api/planner/activities/', { ...activityForm, plan: selectedPlanId })
      .then(() => {
        loadActivities()
        setActivityOpen(false)
        setActivityForm(EMPTY_ACTIVITY)
        showSnack('Activity created')
      })
      .catch(() => showSnack('Failed to create activity', 'error'))
  }

  const handleToggleComplete = (activity) => {
    api.put(`/api/planner/activities/${activity.id}/`, { completed: !activity.completed })
      .then(() => loadActivities())
      .catch(() => showSnack('Failed to update activity', 'error'))
  }

  const handleDeleteActivity = (id) => {
    api.delete(`/api/planner/activities/${id}/`)
      .then(() => {
        loadActivities()
        showSnack('Activity deleted')
      })
      .catch(() => showSnack('Failed to delete activity', 'error'))
  }

  const plansList = Array.isArray(plans) ? plans : []
  const activitiesList = Array.isArray(activities) ? activities : []

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Crop Planner</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Create plans and activities with reminders. Notifications are generated based on due dates.
      </Typography>

      <Grid container spacing={3}>
        {/* Plans column */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Plans</Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setPlanOpen(true)}>
                Add plan
              </Button>
            </Box>
            <List>
              {plansList.map((p) => (
                <ListItem
                  key={p.id}
                  button
                  selected={selectedPlanId === p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={(e) => { e.stopPropagation(); handleDeletePlan(p.id) }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={p.name}
                    secondary={`${p.crop} | Start: ${p.start_date}${p.end_date ? ` – End: ${p.end_date}` : ''}`}
                  />
                </ListItem>
              ))}
              {plansList.length === 0 && (
                <ListItem>
                  <ListItemText primary="No plans yet." secondary="Click 'Add plan' to get started." />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Activities column */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Activities
                {selectedPlanId && plansList.find((p) => p.id === selectedPlanId) && (
                  <Chip
                    label={plansList.find((p) => p.id === selectedPlanId)?.name}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                disabled={!selectedPlanId}
                onClick={() => setActivityOpen(true)}
              >
                Add activity
              </Button>
            </Box>
            <List>
              {activitiesList.map((a) => (
                <ListItem
                  key={a.id}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => handleDeleteActivity(a.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={a.completed}
                      onChange={() => handleToggleComplete(a)}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ textDecoration: a.completed ? 'line-through' : 'none' }}>
                          {a.name}
                        </span>
                        {a.is_overdue && <Chip label="Overdue" color="error" size="small" />}
                        {a.completed && <Chip label="Done" color="success" size="small" />}
                      </Box>
                    }
                    secondary={`Due: ${a.due_date} | Remind ${a.reminder_days_before} day(s) before${a.notes ? ` | ${a.notes}` : ''}`}
                  />
                </ListItem>
              ))}
              {!selectedPlanId && (
                <ListItem>
                  <ListItemText primary="Select a plan to see its activities." />
                </ListItem>
              )}
              {selectedPlanId && activitiesList.length === 0 && (
                <ListItem>
                  <ListItemText primary="No activities yet." secondary="Click 'Add activity' to create one." />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Plan dialog */}
      <Dialog open={planOpen} onClose={() => setPlanOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Plan</DialogTitle>
        <form onSubmit={handleAddPlan}>
          <DialogContent>
            <TextField fullWidth label="Plan name" value={planForm.name} onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))} margin="dense" required />
            <TextField fullWidth label="Crop" value={planForm.crop} onChange={(e) => setPlanForm((f) => ({ ...f, crop: e.target.value }))} margin="dense" required />
            <TextField fullWidth type="date" label="Start date" InputLabelProps={{ shrink: true }} value={planForm.start_date} onChange={(e) => setPlanForm((f) => ({ ...f, start_date: e.target.value }))} margin="dense" required />
            <TextField fullWidth type="date" label="End date" InputLabelProps={{ shrink: true }} value={planForm.end_date} onChange={(e) => setPlanForm((f) => ({ ...f, end_date: e.target.value }))} margin="dense" />
            <TextField fullWidth label="Notes" multiline rows={2} value={planForm.notes} onChange={(e) => setPlanForm((f) => ({ ...f, notes: e.target.value }))} margin="dense" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlanOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Activity dialog */}
      <Dialog open={activityOpen} onClose={() => setActivityOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Activity</DialogTitle>
        <form onSubmit={handleAddActivity}>
          <DialogContent>
            <TextField fullWidth label="Activity name" value={activityForm.name} onChange={(e) => setActivityForm((f) => ({ ...f, name: e.target.value }))} margin="dense" required />
            <TextField fullWidth type="date" label="Due date" InputLabelProps={{ shrink: true }} value={activityForm.due_date} onChange={(e) => setActivityForm((f) => ({ ...f, due_date: e.target.value }))} margin="dense" required />
            <TextField fullWidth type="number" label="Remind (days before due date)" value={activityForm.reminder_days_before} onChange={(e) => setActivityForm((f) => ({ ...f, reminder_days_before: Number(e.target.value) || 1 }))} margin="dense" inputProps={{ min: 0 }} />
            <TextField fullWidth label="Notes" multiline rows={2} value={activityForm.notes} onChange={(e) => setActivityForm((f) => ({ ...f, notes: e.target.value }))} margin="dense" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActivityOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Layout>
  )
}
