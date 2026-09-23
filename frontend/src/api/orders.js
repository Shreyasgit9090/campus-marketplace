import api from './client';

export const placeOrder = (itemId) => api.post('/orders', { itemId }).then((r) => r.data);
export const cancelOrder = (id) => api.post(`/orders/${id}/cancel`).then((r) => r.data);
export const completeOrder = (id) => api.post(`/orders/${id}/complete`).then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const listMyOrders = () => api.get('/orders/mine').then((r) => r.data.orders);
export const listSellingOrders = () => api.get('/orders/selling').then((r) => r.data.orders);
