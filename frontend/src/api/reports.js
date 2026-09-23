import api from './client';

export const createReport = (reportedUserId, reason) =>
  api.post('/reports', { reportedUserId, reason }).then((r) => r.data);
