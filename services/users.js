import { api } from '../lib/api-client';

export const userService = {
  list: async (params) => {
    const response = await api.get('/admin/users', params);
    return response.users || response || [];
  },
  get: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

