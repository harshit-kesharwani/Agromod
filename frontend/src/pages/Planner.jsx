import React, { useState, useEffect } from 'react'
import { Typography, Paper, Button, TextField, Box, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Planner() {
  const [plans, setPlans] = useState([])
  const [activities, setActivities] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [planForm, setPlanForm] = useState({ name: '', crop: '', start_date: '', end_date: '', notes: '' })
  const [activityForm, setActivityForm] = useState({ name: '', due_date: '', reminder_days_before: 1, notes: '' })
  const [planOpen, setPlanOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  const loadPlans = () => api.get('/api/planner/plans/').then(({ data }) => setPlans(data.results || data))
  const loadActivities = () => {
    const url = selectedPlanId ? `/api/planner/activities/?plan=${selectedPlanId}` : '/api/planner/activities/'
    return api.get(url).then(({ data }) => setActivities(data.results || data))
  }

  useEffect(() => { loadPlans() }, [])
  useEffect(() => { loadActivities() }, [selectedPlanId])

  const handleAddPlan = (e) => {
    e.preventDefault()
    api.post('/api/planner/plans/', planForm).then(() => { loadPlans(); setPlanOpen(false); setPlanForm({ name: '', crop: '', start_date: '', end_date: '', notes: '' }) }).catch(() => {})
  }
  const handleAddActivity = (e) => {
    e.preventDefault()
    if (!selectedPlanId) return
    api.post('/api/planner/activities/', { ...activityForm, plan: selectedPlanId }).then(() => { loadActivities(); setActivityOpen(false); setActivityForm({ name: '', due_date: '', reminder_days_before: 1, notes: '' }) }).catch(() => {})
  }

  const plansList = Array.isArray(plans) ? plans : []
  const activitiesList = Array.isArray(activities) ? activities : []

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>Crop Planner</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Create plans and activities with reminders.</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Plans</Typography>
              <Button variant="outlined" size="small" onClick={() => setPlanOpen(true)}>Add plan</Button>
            </Box>
            <List>
              {plansList.map((p) => (
                <ListItem key={p.id} button selected={selectedPlanId === p.id} onClick={() => setSelectedPlanId(p.id)}>
                  <ListItemText primary={p.name} secondary={`${p.crop} | ${p.start_date}`} />
                </ListItem>
              ))}
              {plansList.length === 0 && <ListItem><ListItemText primary="No plans. Add one." /></ListItem>}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Activities {selectedPlanId ? `(Plan #${selectedPlanId})` : ''}</Typography>
              <Button variant="outlined" size="small" disabled={!selectedPlanId} onClick={() => setActivityOpen(true)}>Add activity</Button>
            </Box>
            <List>
              {activitiesList.map((a) => (
                <ListItem key={a.id}>
                  <ListItemText primary={a.name} secondary={`Due: ${a.due_date} | Remind ${a.reminder_days_before} day(s) before`} />
                </ListItem>
              ))}
              {activitiesList.length === 0 && <ListItem><ListItemText primary="Select a plan and add activities." /></ListItem>}
            </List>
          </Paper>
        </Grid>
      </Grid>
      <Dialog open={planOpen} onClose={() => setPlanOpen(false)}>
        <DialogTitle>Add plan</DialogTitle>
        <form onSubmit={handleAddPlan}>
          <DialogContent>
            <TextField fullWidth label="Plan name" value={planForm.name} onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))} margin="dense" required />
            <TextField fullWidth label="Crop" value={planForm.crop} onChange={(e) => setPlanForm((f) => ({ ...f, crop: e.target.value }))} margin="dense" required />
            <TextField fullWidth type="date" label="Start date" InputLabelProps={{ shrink: true }} value={planForm.start_date} onChange={(e) => setPlanForm((f) => ({ ...f, start_date: e.target.value }))} margin="dense" required />
            <TextField fullWidth type="date" label="End date" InputLabelProps={{ shrink: true }} value={planForm.end_date} onChange={(e) => setPlanForm((f) => ({ ...f, end_date: e.target.value }))} margin="dense" />
            <TextField fullWidth label="Notes" multiline value={planForm.notes} onChange={(e) => setPlanForm((f) => ({ ...f, notes: e.target.value }))} margin="dense" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlanOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog open={activityOpen} onClose={() => setActivityOpen(false)}>
        <DialogTitle>Add activity</DialogTitle>
        <form onSubmit={handleAddActivity}>
          <DialogContent>
            <TextField fullWidth label="Activity name" value={activityForm.name} onChange={(e) => setActivityForm((f) => ({ ...f, name: e.target.value }))} margin="dense" required />
            <TextField fullWidth type="date" label="Due date" InputLabelProps={{ shrink: true }} value={activityForm.due_date} onChange={(e) => setActivityForm((f) => ({ ...f, due_date: e.target.value }))} margin="dense" required />
            <TextField fullWidth type="number" label="Remind (days before)" value={activityForm.reminder_days_before} onChange={(e) => setActivityForm((f) => ({ ...f, reminder_days_before: Number(e.target.value) || 1 }))} margin="dense" />
            <TextField fullWidth label="Notes" multiline value={activityForm.notes} onChange={(e) => setActivityForm((f) => ({ ...f, notes: e.target.value }))} margin="dense" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActivityOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Layout>
  )
}
