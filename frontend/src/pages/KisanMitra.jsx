import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box, Typography, IconButton, Paper, Avatar, Chip,
  CircularProgress, Fade, useMediaQuery, useTheme,
  TextField, Tooltip, Dialog, DialogContent,
  Menu, MenuItem, ListItemText,
} from '@mui/material'
import MicIcon from '@mui/icons-material/Mic'
import StopIcon from '@mui/icons-material/Stop'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import ImageIcon from '@mui/icons-material/Image'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import SendIcon from '@mui/icons-material/Send'
import TranslateIcon from '@mui/icons-material/Translate'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import api from '../services/api'

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', bcp47: 'en-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', bcp47: 'hi-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', bcp47: 'ta-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', bcp47: 'te-IN' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', bcp47: 'bn-IN' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', bcp47: 'mr-IN' },
]

const STATUS_LABELS = {
  en: {
    idle: 'Type a message or press mic to talk',
    recording: '🎤 Recording… tap stop when done',
    thinking: '🤔 Thinking…',
    error: 'Something went wrong, try again',
  },
  hi: {
    idle: 'संदेश लिखें या माइक दबाएं',
    recording: '🎤 रिकॉर्ड हो रहा है… रुकने के लिए दबाएं',
    thinking: '🤔 सोच रहा हूँ…',
    error: 'कुछ गड़बड़ हुई, फिर कोशिश करें',
  },
  ta: {
    idle: 'செய்தி தட்டச்சு செய்யுங்கள் அல்லது மைக் அழுத்தவும்',
    recording: '🎤 பதிவு செய்கிறது… நிறுத்த அழுத்தவும்',
    thinking: '🤔 யோசிக்கிறேன்…',
    error: 'ஏதோ தவறு, மீண்டும் முயற்சிக்கவும்',
  },
  te: {
    idle: 'సందేశం టైప్ చేయండి లేదా మైక్ నొక్కండి',
    recording: '🎤 రికార్డ్ అవుతోంది… ఆపడానికి నొక్కండి',
    thinking: '🤔 ఆలోచిస్తున్నాను…',
    error: 'ఏదో తప్పు జరిగింది, మళ్ళీ ప్రయత్నించండి',
  },
  kn: {
    idle: 'ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ',
    recording: '🎤 ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ… ನಿಲ್ಲಿಸಲು ಒತ್ತಿ',
    thinking: '🤔 ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ…',
    error: 'ಏನೋ ತಪ್ಪಾಯಿತು, ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
  },
  bn: {
    idle: 'বার্তা লিখুন বা মাইক চাপুন',
    recording: '🎤 রেকর্ড হচ্ছে… থামাতে চাপুন',
    thinking: '🤔 ভাবছি…',
    error: 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন',
  },
  mr: {
    idle: 'संदेश टाइप करा किंवा माइक दाबा',
    recording: '🎤 रेकॉर्ड होत आहे… थांबवण्यासाठी दाबा',
    thinking: '🤔 विचार करत आहे…',
    error: 'काहीतरी चूक झाली, पुन्हा प्रयत्न करा',
  },
}

export default function KisanMitra() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [status, setStatus] = useState('idle')
  const [messages, setMessages] = useState([])
  const [textInput, setTextInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [muted, setMuted] = useState(false)
  const [language, setLanguage] = useState('en')
  const [langAnchor, setLangAnchor] = useState(null)

  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)
  const mutedRef = useRef(false)
  const audioRef = useRef(null)

  const selectedLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]
  const labels = STATUS_LABELS[language] || STATUS_LABELS.en

  useEffect(() => {
    mutedRef.current = muted
    if (muted) stopAudio()
  }, [muted])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  }

  function playTTS(text) {
    if (mutedRef.current || !text) return
    api.post('/api/kisan-mitra/tts/', { text })
      .then(({ data }) => {
        if (mutedRef.current || !data.audio) return
        const audio = new Audio('data:audio/wav;base64,' + data.audio)
        audioRef.current = audio
        audio.play().catch(() => {})
      })
      .catch(() => {})
  }

  const buildLangHint = useCallback(() => {
    if (language === 'en') return ''
    return ` Reply in ${selectedLang.label} (${selectedLang.native}).`
  }, [language, selectedLang])

  const stopRecorderStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    recorderRef.current = null
  }, [])

  const sendTextMessage = useCallback(async () => {
    const text = textInput.trim()
    if (!text && !imageFile) return
    if (status !== 'idle') return

    setMessages((prev) => [...prev, { role: 'user', content: text || '📸 (photo sent)' }])
    setTextInput('')
    setStatus('thinking')

    try {
      const fd = new FormData()
      fd.append('message', text + buildLangHint())
      if (imageFile) fd.append('image', imageFile)

      const { data } = await api.post('/api/kisan-mitra/text/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      playTTS(data.reply)
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    }
    setImageFile(null)
    setImagePreview(null)
    setStatus('idle')
  }, [textInput, imageFile, status, buildLangHint, selectedLang])

  const startRecording = useCallback(async () => {
    if (status !== 'idle') return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      const chunks = []
      recorder.ondataavailable = (e) => chunks.push(e.data)

      recorder.onstop = async () => {
        stopRecorderStream()
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        setMessages((prev) => [...prev, { role: 'user', content: '🎤 (voice message)' }])
        setStatus('thinking')

        const fd = new FormData()
        fd.append('audio', audioBlob, 'recording.webm')
        if (imageFile) fd.append('image', imageFile)
        fd.append('language', selectedLang.label)

        try {
          const { data } = await api.post('/api/kisan-mitra/voice/', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
          playTTS(data.reply)
        } catch {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Sorry, could not process your voice. Please try again.' },
          ])
        }
        setImageFile(null)
        setImagePreview(null)
        setStatus('idle')
      }

      recorderRef.current = recorder
      recorder.start()
      setStatus('recording')
    } catch (err) {
      console.error('Microphone error:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [status, imageFile, selectedLang, stopRecorderStream])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop()
    }
  }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleCameraCapture = () => {
    setCameraOpen(true)
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch (err) {
        console.error('Camera error:', err)
        setCameraOpen(false)
      }
    }, 100)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
        setImageFile(file)
        setImagePreview(URL.createObjectURL(blob))
        closeCam()
      },
      'image/jpeg',
      0.85,
    )
  }

  const closeCam = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraOpen(false)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendTextMessage()
    }
  }

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev)
  }, [])

  const isRecording = status === 'recording'
  const isBusy = status === 'thinking'

  return (
    <Box
      sx={{
        maxWidth: 560,
        mx: 'auto',
        px: 2,
        pb: 2,
        pt: 2,
        height: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 1.5,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)',
          color: '#fff',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 48,
              height: 48,
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <SupportAgentIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="h6" fontWeight={800} sx={{ fontFamily: '"Nunito", sans-serif', lineHeight: 1.2 }}>
              किसान मित्र
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Kisan Mitra — Your Farming Expert
            </Typography>
          </Box>
        </Box>

        {/* Language selector */}
        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Chip
            icon={<TranslateIcon sx={{ fontSize: 16, color: '#fff !important' }} />}
            label={selectedLang.native}
            deleteIcon={<KeyboardArrowDownIcon sx={{ color: '#fff !important' }} />}
            onDelete={(e) => setLangAnchor(e.currentTarget.parentElement)}
            onClick={(e) => setLangAnchor(e.currentTarget)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.22)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              height: 32,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
              '& .MuiChip-deleteIcon': { color: '#fff' },
            }}
          />
        </Box>

        <Menu
          anchorEl={langAnchor}
          open={Boolean(langAnchor)}
          onClose={() => setLangAnchor(null)}
          PaperProps={{
            sx: { borderRadius: 3, minWidth: 180, mt: 1 },
          }}
        >
          {LANGUAGES.map((l) => (
            <MenuItem
              key={l.code}
              selected={l.code === language}
              onClick={() => {
                setLanguage(l.code)
                setLangAnchor(null)
              }}
              sx={{ py: 1 }}
            >
              <ListItemText
                primary={l.native}
                secondary={l.label}
                primaryTypographyProps={{ fontWeight: l.code === language ? 700 : 400 }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Paper>

      {/* Image preview */}
      {imagePreview && (
        <Fade in>
          <Paper
            sx={{
              mb: 1.5,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              border: '2px solid',
              borderColor: 'primary.light',
              flexShrink: 0,
            }}
          >
            <Box component="img" src={imagePreview} alt="Uploaded" sx={{ width: '100%', maxHeight: 160, objectFit: 'cover' }} />
            <IconButton
              onClick={removeImage}
              size="small"
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="caption"
              sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', px: 1.5, py: 0.5 }}
            >
              Photo attached — Kisan Mitra will analyze it
            </Typography>
          </Paper>
        </Fade>
      )}

      {/* Chat messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          mb: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          minHeight: 0,
        }}
      >
        {messages.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'rgba(46,125,50,0.06)',
              border: '1px dashed rgba(46,125,50,0.3)',
              textAlign: 'center',
              mt: 2,
            }}
          >
            <Typography variant="body1" fontWeight={600} color="primary" gutterBottom>
              🙏 Welcome!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Ask anything about crops, soil, weather, pests, government schemes, or market prices.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📸 Attach a crop photo &nbsp;|&nbsp; 🎤 Use voice &nbsp;|&nbsp; ⌨️ Type below
            </Typography>
          </Paper>
        )}

        {messages.map((msg, i) => (
          <Fade in key={i}>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: msg.role === 'user' ? 'secondary.main' : 'primary.main',
                  fontSize: '0.8rem',
                  flexShrink: 0,
                }}
              >
                {msg.role === 'user' ? '👨‍🌾' : '🌾'}
              </Avatar>
              <Paper
                elevation={0}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 3,
                  maxWidth: '85%',
                  bgcolor: msg.role === 'user' ? 'secondary.light' : '#f1f8e9',
                  borderTopRightRadius: msg.role === 'user' ? 4 : undefined,
                  borderTopLeftRadius: msg.role === 'assistant' ? 4 : undefined,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          </Fade>
        ))}

        {isBusy && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.8rem' }}>🌾</Avatar>
            <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 3, bgcolor: '#f1f8e9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="primary" />
                <Typography variant="body2" color="text.secondary">
                  {labels.thinking}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Status bar for recording */}
      {isRecording && (
        <Fade in>
          <Paper
            elevation={0}
            sx={{
              px: 2,
              py: 1,
              mb: 1,
              borderRadius: 3,
              bgcolor: 'rgba(244,67,54,0.08)',
              border: '1px solid rgba(244,67,54,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: 'error.main',
                animation: 'blink 1s infinite',
                '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } },
              }}
            />
            <Typography variant="body2" color="error.main" fontWeight={600}>
              {labels.recording}
            </Typography>
          </Paper>
        </Fade>
      )}

      {/* Input bar */}
      <Paper
        elevation={3}
        sx={{
          borderRadius: 4,
          p: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 0.5,
          bgcolor: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(10px)',
          flexShrink: 0,
        }}
      >
        {/* Attachment buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, pb: 0.5 }}>
          <Tooltip title="Camera" arrow>
            <IconButton
              onClick={handleCameraCapture}
              disabled={isBusy || isRecording}
              size="small"
              sx={{ width: 36, height: 36 }}
            >
              <CameraAltIcon fontSize="small" color={isBusy || isRecording ? 'disabled' : 'primary'} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gallery" arrow>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy || isRecording}
              size="small"
              sx={{ width: 36, height: 36 }}
            >
              <ImageIcon fontSize="small" color={isBusy || isRecording ? 'disabled' : 'primary'} />
            </IconButton>
          </Tooltip>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />

        {/* Text input */}
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder={labels.idle}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isBusy || isRecording}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: '#f5f5f5',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: 'primary.light' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            },
          }}
        />

        {/* Action buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, pb: 0.5 }}>
          {/* Mic / Stop */}
          {isRecording ? (
            <Tooltip title="Stop recording" arrow>
              <IconButton
                onClick={stopRecording}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'error.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'error.dark' },
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(244,67,54,0.4)' },
                    '70%': { boxShadow: '0 0 0 8px rgba(244,67,54,0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(244,67,54,0)' },
                  },
                }}
              >
                <StopIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Record voice" arrow>
              <IconButton
                onClick={startRecording}
                disabled={isBusy}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
                }}
              >
                <MicIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Send */}
          <Tooltip title="Send message" arrow>
            <IconButton
              onClick={sendTextMessage}
              disabled={isBusy || isRecording || (!textInput.trim() && !imageFile)}
              sx={{
                width: 40,
                height: 40,
                bgcolor: textInput.trim() || imageFile ? 'primary.main' : 'action.disabledBackground',
                color: textInput.trim() || imageFile ? '#fff' : 'action.disabled',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Mute toggle */}
        <Tooltip title={muted ? 'Unmute' : 'Mute audio'} arrow>
          <IconButton
            onClick={toggleMute}
            size="small"
            sx={{
              width: 36,
              height: 36,
              mb: 0.5,
              bgcolor: muted ? 'rgba(244,67,54,0.1)' : 'rgba(46,125,50,0.08)',
              '&:hover': { bgcolor: muted ? 'rgba(244,67,54,0.2)' : 'rgba(46,125,50,0.18)' },
            }}
          >
            {muted ? <VolumeOffIcon fontSize="small" color="error" /> : <VolumeUpIcon fontSize="small" color="primary" />}
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Camera dialog */}
      <Dialog open={cameraOpen} onClose={closeCam} fullWidth maxWidth="sm">
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#000' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              p: 2,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            }}
          >
            <IconButton
              onClick={capturePhoto}
              sx={{
                bgcolor: '#fff',
                width: 64,
                height: 64,
                border: '4px solid rgba(255,255,255,0.5)',
                '&:hover': { bgcolor: '#eee' },
              }}
            >
              <CameraAltIcon sx={{ fontSize: 32, color: '#333' }} />
            </IconButton>
            <IconButton
              onClick={closeCam}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', width: 48, height: 48 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
