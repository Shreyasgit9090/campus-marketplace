import api from './client';

export const signup = (payload) => api.post('/auth/signup', payload).then((r) => r.data);
export const verifyOtp = (payload) => api.post('/auth/verify-otp', payload).then((r) => r.data);
export const resendOtp = (payload) => api.post('/auth/resend-otp', payload).then((r) => r.data);
export const login = (payload) => api.post('/auth/login', payload).then((r) => r.data);
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload).then((r) => r.data);
export const resetPassword = (payload) => api.post('/auth/reset-password', payload).then((r) => r.data);
export const getMe = () => api.get('/users/me').then((r) => r.data);
