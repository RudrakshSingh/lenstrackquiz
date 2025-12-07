// services/benefits.js
// Service for Benefits API endpoints

import { api } from '../lib/api-client';

export const benefitService = {
  list: async (params) => {
    const response = await api.get('/admin/benefits', params);
    return response.data?.benefits || [];
  },
  get: (id) => api.get(`/admin/benefits/${id}`),
  create: (data) => api.post('/admin/benefits', data),
  update: (id, data) => api.put(`/admin/benefits/${id}`, data),
  delete: (id) => api.delete(`/admin/benefits/${id}`),
};

