import api from './api'

export async function login(email, password, userType) {
  const { data } = await api.post('/api/auth/login/', { email, password, user_type: userType })
  return data
}

export async function register(payload) {
  const { data } = await api.post('/api/auth/register/', payload)
  return data
}

export async function getMe() {
  const { data } = await api.get('/api/auth/me/')
  return data
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem('accessToken', access)
  if (refresh) localStorage.setItem('refreshToken', refresh)
}

export function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export function getStoredTokens() {
  return {
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken'),
  }
}

export async function forgotPassword(email) {
  const { data } = await api.post('/api/auth/forgot-password/', { email })
  return data
}

export async function resetPassword(email, token, newPassword) {
  const { data } = await api.post('/api/auth/reset-password/', {
    email,
    token,
    new_password: newPassword,
  })
  return data
}
