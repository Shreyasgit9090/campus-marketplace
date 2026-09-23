import api from './client';

export const createRating = (orderId, stars, comment) =>
  api.post('/ratings', { orderId, stars, comment }).then((r) => r.data);
export const listRatingsForUser = (userId) => api.get(`/ratings/user/${userId}`).then((r) => r.data);
