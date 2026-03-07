import React, { useState, useEffect } from 'react'
import { Snackbar, Button } from '@mui/material'

let deferredPrompt = null

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      deferredPrompt = e
      if (!window.matchMedia('(display-mode: standalone)').matches && !localStorage.getItem('agromod_pwa_dismissed')) {
        setShow(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    deferredPrompt = null
  }

  const handleClose = () => {
    setShow(false)
    localStorage.setItem('agromod_pwa_dismissed', '1')
  }

  return (
    <Snackbar
      open={show}
      autoHideDuration={null}
      onClose={handleClose}
      message="Install Agromod for a better experience"
      action={
        <>
          <Button color="primary" size="small" onClick={handleInstall}>Install</Button>
          <Button color="inherit" size="small" onClick={handleClose}>Not now</Button>
        </>
      }
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    />
  )
}
