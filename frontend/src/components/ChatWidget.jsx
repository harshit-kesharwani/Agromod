import React, { useState, useRef, useEffect } from 'react'
import { Box, IconButton, TextField, Paper, Typography } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import SendIcon from '@mui/icons-material/Send'
import CloseIcon from '@mui/icons-material/Close'
import api from '../services/api'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const { data } = await api.post('/api/chatbot/message/', { message: text })
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || data.response || JSON.stringify(data) }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: err.response?.data?.error || 'Unable to get response. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <IconButton
        onClick={() => setOpen(!open)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': { bgcolor: 'primary.dark' },
          zIndex: 1300,
        }}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </IconButton>
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            width: 360,
            maxWidth: 'calc(100vw - 48px)',
            height: 420,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">Agromod Assistant</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary">Ask about disease, yield, weather, schemes, prices, or marketplace.</Typography>
            )}
            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.200',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
              </Box>
            ))}
            {loading && (
              <Typography variant="body2" color="text.secondary">Thinking...</Typography>
            )}
            <div ref={bottomRef} />
          </Box>
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 0.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <IconButton color="primary" onClick={sendMessage} disabled={loading || !input.trim()}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  )
}
