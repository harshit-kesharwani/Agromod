import api from './api'

export async function login(phone, password, userType) {
  const { data } = await api.post('/api/auth/login/', {
    phone: phone.replace(/[\s-]/g, ''),
    password,
    user_type: userType,
  })
  return data
}

export async function register(payload) {
  const { data } = await api.post('/api/auth/register/', payload)
  return data
}

export async function verifyOtp(phone, otp) {
  const { data } = await api.post('/api/auth/verify-otp/', { phone, otp })
  return data
}

export async function resendOtp(phone) {
  const { data } = await api.post('/api/auth/resend-otp/', { phone })
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

export async function forgotPassword(phone) {
  const { data } = await api.post('/api/auth/forgot-password/', { phone })
  return data
}

export async function resetPassword(phone, otp, newPassword, confirmPassword) {
  const { data } = await api.post('/api/auth/reset-password/', {
    phone,
    otp,
    new_password: newPassword,
    confirm_password: confirmPassword,
  })
  return data
}
