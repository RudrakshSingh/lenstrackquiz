import { api } from '../lib/api-client';

export const storeService = {
  list: async (params) => {
    const response = await api.get('/admin/stores', params);
    return response.stores || response || [];
  },
  get: (id) => api.get(`/admin/stores/${id}`),
  create: (data) => api.post('/admin/stores', data),
  update: (id, data) => api.put(`/admin/stores/${id}`, data),
  delete: (id) => api.delete(`/admin/stores/${id}`),
  getStats: (id) => api.get(`/admin/stores/${id}/stats`),
};

