import api from './client';

export const listReports = (status) => api.get('/admin/reports', { params: { status } }).then((r) => r.data.reports);
export const reviewReport = (id, status) => api.patch(`/admin/reports/${id}`, { status }).then((r) => r.data);
export const suspendUser = (id) => api.patch(`/admin/users/${id}/suspend`).then((r) => r.data);
export const unsuspendUser = (id) => api.patch(`/admin/users/${id}/unsuspend`).then((r) => r.data);
