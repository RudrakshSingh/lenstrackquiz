import { api } from '../lib/api-client';

export const reportService = {
  getReport: (type, params) => api.get('/admin/reports', { type, ...params }),
};

