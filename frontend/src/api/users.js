import api from './client';

export const getMe = () => api.get('/users/me').then((r) => r.data);
export const getMyTransactions = () => api.get('/users/me/transactions').then((r) => r.data);
export const getPublicProfile = (id) => api.get(`/users/${id}/public`).then((r) => r.data);
