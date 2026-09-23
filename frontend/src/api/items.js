import api from './client';

export const previewPrice = (originalPrice, condition) =>
  api
    .get('/items/preview-price', { params: { originalPrice, condition } })
    .then((r) => r.data.finalPrice);

export const listItems = (params) => api.get('/items', { params }).then((r) => r.data);
export const listMyItems = () => api.get('/items/mine').then((r) => r.data.items);
export const getItem = (id) => api.get(`/items/${id}`).then((r) => r.data);

export const createItem = (formData) =>
  api.post('/items', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const updateItem = (id, formData) =>
  api.patch(`/items/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const deleteItem = (id) => api.delete(`/items/${id}`);
