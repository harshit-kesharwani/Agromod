import React, { useEffect } from 'react'
import { Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
]

export default function TranslateBar() {
  const [lang, setLang] = React.useState(() => localStorage.getItem('agromod_lang') || 'en')

  useEffect(() => {
    localStorage.setItem('agromod_lang', lang)
    if (window.google && window.google.translate) {
      const frame = document.getElementById('google_translate_element')
      if (frame) {
        const select = frame.querySelector('.goog-te-combo')
        if (select) select.value = lang
      }
    }
  }, [lang])

  return (
    <Box sx={{ minWidth: 140 }}>
      <FormControl size="small" fullWidth>
        <InputLabel id="lang-label">Language</InputLabel>
        <Select
          labelId="lang-label"
          value={lang}
          label="Language"
          onChange={(e) => setLang(e.target.value)}
        >
          {languages.map((l) => (
            <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <div id="google_translate_element" style={{ display: 'none' }} />
    </Box>
  )
}
