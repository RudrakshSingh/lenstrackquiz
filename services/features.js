import { api } from '../lib/api-client';

export const featureService = {
  list: async (params) => {
    const response = await api.get('/admin/features', params);
    return Array.isArray(response) ? response : response?.features || [];
  },
  get: (id) => api.get(`/admin/features/${id}`),
  create: (data) => api.post('/admin/features', data),
  update: (id, data) => api.put(`/admin/features/${id}`, data),
  delete: (id) => api.delete(`/admin/features/${id}`),
};

